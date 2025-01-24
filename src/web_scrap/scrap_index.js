import puppeteer from "puppeteer";
import { login } from "./login.js";
import { loadArticles } from "./load_articles.js";
import dotenv from "dotenv";
dotenv.config();

const email = process.env.EMAIL;
const password = process.env.PASSWORD;

export async function scrape() {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      defaultViewport: { width: 1920, height: 1080, zoom: 0.1 },
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.goto(process.env.loginUrl, { waitUntil: "networkidle2" });

    await login(email, password, page);

    await page.waitForSelector("article");

    const articles = await loadArticles(page, 50);

    return articles;
  } catch (error) {
    console.error("Error of parsing page:", error);
    return [];
  }
}
