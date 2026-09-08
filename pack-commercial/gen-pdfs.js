const puppeteer = require('puppeteer');
const path = require('path');
const jobs = [
  ['etude.html', 'Wapp_Assist_Etude_Marche_2026.pdf'],
  ['guide.html', 'Wapp_Assist_Guide_Prospection.pdf'],
];
(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  for (const [html, pdf] of jobs) {
    const page = await browser.newPage();
    await page.goto('file:///' + path.resolve(__dirname, html).replace(/\\/g, '/'), { waitUntil: 'networkidle0', timeout: 60000 });
    await page.pdf({ path: path.resolve(__dirname, pdf), format: 'A4', printBackground: true, margin: { top: '16mm', bottom: '16mm', left: '14mm', right: '14mm' } });
    await page.close();
    console.log('PDF OK:', pdf);
  }
  await browser.close();
})();
