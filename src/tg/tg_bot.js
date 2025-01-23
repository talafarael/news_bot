import TelegramBot from "node-telegram-bot-api";
import { scrape } from "../web_scrap/scrap_index.js";
import { scrapePostDetails } from "../web_scrap/prepare_one_post.js";
import { config } from "../config.js";
import { Client, GatewayIntentBits } from "discord.js";

const token = process.env.TOKEN;
const bot = new TelegramBot(token, { polling: true });

let scrapedArticles = [];

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});
client.on("ready", () => {
  console.log("Bot is ready!");
});
async function sendMessage() {}

client.login(config.DISCORD_TOKEN);
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "Welcome! How can I assist you?");
});

bot.onText(/\/getlist/, async (msg) => {
  const chatId = msg.chat.id;

  await bot.sendMessage(
    chatId,
    "Starting to scrape articles, this may take a few minutes...",
  );

  try {
    // Remove `const` to update the global `scrapedArticles` variable
    scrapedArticles = await scrape();
    if (scrapedArticles.length > 0) {
      const formattedArticles = scrapedArticles.map(
        (article, index) =>
          `*${index + 1}.* [${article.title}](${article.link})`,
      );

      const chunkSize = 30;
      const messageChunks = [];

      for (let i = 0; i < formattedArticles.length; i += chunkSize) {
        const chunk = formattedArticles.slice(i, i + chunkSize).join("\n");
        messageChunks.push(chunk);
      }

      for (const chunk of messageChunks) {
        await bot.sendMessage(chatId, `Here are the articles:\n${chunk}`, {
          parse_mode: "Markdown",
        });
      }

      await bot.sendMessage(
        chatId,
        "Reply with the numbers of the articles you want to see, separated by commas (e.g., 1,3,5).",
      );
    } else {
      await bot.sendMessage(chatId, "No articles were found.");
    }
  } catch (error) {
    console.error("Error while scraping:", error);
    await bot.sendMessage(
      chatId,
      "An error occurred while retrieving the list of articles.",
    );
  }
});

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  if (/^\d+(\s*,\s*\d+)*$/.test(msg.text)) {
    if (!scrapedArticles || scrapedArticles.length === 0) {
      await bot.sendMessage(
        chatId,
        "No articles available. Please use /getlist first.",
      );
      return;
    }

    const selectedNumbers = msg.text
      .split(",")
      .map((num) => parseInt(num.trim(), 10) - 1)
      .filter((num) => num >= 0 && num < scrapedArticles.length);

    if (selectedNumbers.length > 0) {
      const selectedArticles = selectedNumbers.map(
        (num) => scrapedArticles[num],
      );

      for (const article of selectedArticles) {
        try {
          const link = article.link;
          const res = await scrapePostDetails(link);

          const message =
            `[${res.translatedTitle ?? link}](${link})\n\n${res.translatedFullText ?? " "}\n\n` +
            `${res.image !== "No Image" ? "" : ""}` +
            `\n👍 ${res.likes}\n💬 ${res.comments}`;

          if (res.image !== "No Image") {
            await bot.sendPhoto(chatId, res.image, {
              caption: message,
              parse_mode: "Markdown",
            });
          } else {
            await bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
          }
        } catch (error) {
          console.error(
            `Error scraping article details: ${article.link}`,
            error,
          );
          await bot.sendMessage(
            chatId,
            `Could not retrieve details for: ${article.title}`,
          );
        }
      }
    } else {
      await bot.sendMessage(
        chatId,
        "Invalid article numbers. Please try again.",
      );
    }
  }
});
