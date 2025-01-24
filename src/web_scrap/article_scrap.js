import puppeteer from "puppeteer";
async function extractTextFromMedium(page) {
  console.log("aa");
}
async function extractTextFromDev(page) {
  console.log("aa");

  const text = await page.evaluate(() => {
    let arr = [];

    const article = document.getElementById("article-body");

    article.querySelectorAll("*").forEach((element) => {
      const images = document.querySelectorAll("img");
      images.forEach((img) => arr.push(img.src));
    });
    return arr;
  });
  console.log(text);
}

const obj = {
  "medium.com": extractTextFromMedium,
  "dev.to": extractTextFromDev,
};
async function extractLinkеToArticle(page) {
  const linkArticle = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll("a"));
    const fullLink = links.find((link) =>
      link.href.includes("https://api.daily.dev/r"),
    );
    return fullLink ? fullLink.href : null;
  });
  return linkArticle;
}
export async function extractPage(url) {
  if (!url) {
    throw new Error("URL is required.");
  }
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto(url, { waitUntil: "networkidle2" });
    console.log(page);
    const url_article = await extractLinkеToArticle(page);
    await extractArticleText(url_article);
  } catch (error) {
    console.error("Error while scraping post details:", error);
    throw new Error("Failed to scrape the post details.");
  }
}
async function extractArticleText(url) {
  if (!url) {
    throw new Error("URL is required.");
  }
  try {
    console.log(url);
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto(url, { waitUntil: "networkidle2" });
    console.log(page);
    const currentUrl = await page.url();
    console.log("Current URL:", currentUrl);
    const url_article = new URL(currentUrl);
    const hostname = url_article.hostname;
    console.log(hostname);
    obj[hostname](page);
    /*  const text = await page.evaluate(() => {
      const hElement = document.querySelector(
        ".mt-2.mb-8.font-mono.text-2xl.font-medium",
      );
      if (!hElement) return null;

      return hElement.innerText.trim();
    });
    console.log(text);*/
  } catch (error) {
    console.error("Error while scraping post details:", error);
    throw new Error("Failed to scrape the post details.");
  }
}
