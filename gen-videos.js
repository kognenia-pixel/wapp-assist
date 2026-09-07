const puppeteer = require('puppeteer');
const { PuppeteerScreenRecorder } = require('puppeteer-screen-recorder');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  
  // Vidéo 1 – Page de vente
  console.log('Recording video-vente.mp4...');
  const page1 = await browser.newPage();
  const recorder1 = new PuppeteerScreenRecorder(page1);
  await page1.goto('https://wapp-assist-vente.pages.dev', { waitUntil: 'networkidle2' });
  await recorder1.start('video-vente.mp4', { fps: 30 });
  await page1.waitForTimeout(30000);
  await recorder1.stop();
  await page1.close();
  console.log('video-vente.mp4 done');

  // Vidéo 2 – Installateur
  console.log('Recording video-installateur.mp4...');
  const page2 = await browser.newPage();
  const recorder2 = new PuppeteerScreenRecorder(page2);
  await page2.goto('https://wapp-installer-frontend.pages.dev', { waitUntil: 'networkidle2' });
  await recorder2.start('video-installateur.mp4', { fps: 30 });
  await page2.waitForTimeout(40000);
  await recorder2.stop();
  await page2.close();
  console.log('video-installateur.mp4 done');

  await browser.close();
  console.log('All videos recorded!');
})();