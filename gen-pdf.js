const puppeteer = require('puppeteer');
const path = require('path');
(async () => {
  const htmlPath = path.resolve(__dirname, 'overview.html');
  const pdfPath = path.resolve(__dirname, 'Wapp-Assist-Overview.pdf');
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.goto('file:///' + htmlPath.replace(/\\/g, '/'), { waitUntil: 'networkidle0', timeout: 60000 });
  await page.pdf({ path: pdfPath, format: 'A4', printBackground: true, margin: { top: '16mm', bottom: '16mm', left: '14mm', right: '14mm' } });
  await browser.close();
  console.log('PDF OK: ' + pdfPath);
})();
