const express = require("express");
const puppeteer = require("puppeteer");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.get("/api/snowbreak/events", async (req, res) => {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    await page.goto("https://snowbreak.amazingseasun.com/#/en?id=2", {
      waitUntil: "networkidle2",
    });

    // Click the "EVENT" tab
    await page.waitForSelector(".news_title span");
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll(".news_title span"));
      const eventTab = tabs.find(tab => tab.innerText.trim().toUpperCase() === "EVENT");
      if (eventTab) eventTab.click();
    });

    // Wait until items appear
    await page.waitForSelector(".item_inner", { timeout: 10000 });

    // Scrape the actual event entries
    const data = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll(".item_inner"));
      return items.map(item => {
        const date = item.querySelector(".date")?.innerText?.trim() || "";
        const title = item.querySelector(".desc")?.innerText?.trim() || "";
        return { date, title };
      }).filter(item => item.date && item.title);
    });

    res.json(data);
  } catch (err) {
    console.error("❌ Scrape failed:", err.message);
    res.status(500).json({ error: "Scraping failed" });
  } finally {
    if (browser) await browser.close();
  }
});

app.listen(PORT, () => {
  console.log(`✅ Snowbreak Event API is running at http://localhost:${PORT}/api/snowbreak/events`);
});
