import puppeteer from 'puppeteer';

const testPdf = async () => {
  try {
    const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setContent('<h1>Test</h1>');
    await page.pdf({ format: 'A4' });
    await browser.close();
    console.log("PDF generated successfully");
  } catch (error) {
    console.error("PDF generation failed:", error);
  }
};

testPdf();
