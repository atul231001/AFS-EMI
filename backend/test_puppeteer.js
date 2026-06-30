import puppeteer from 'puppeteer';

(async () => {
  try {
    console.log("Launching puppeteer...");
    const browser = await puppeteer.launch({
      headless: true, channel: 'chrome',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    console.log("Launched!");
    await browser.close();
    console.log("Closed!");
  } catch (error) {
    console.error("Puppeteer launch failed:", error);
  }
})();
