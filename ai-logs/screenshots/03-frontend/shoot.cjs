const { chromium } = require('/Users/gustavomatos/Projects/kitchen-challenge/node_modules/playwright-core');
const out = process.argv[2];
const tag = process.argv[3] || 'v1';
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const logs = [];
  for (const [name, viewport, extra] of [
    ['desktop', { width: 1440, height: 900 }, {}],
    ['mobile', { width: 390, height: 844 }, { isMobile: true, deviceScaleFactor: 2 }],
  ]) {
    const page = await browser.newPage({ viewport, ...extra });
    page.on('console', (m) => (m.type() === 'error' || m.type() === 'warning') && logs.push(`[${name}] ${m.type()}: ${m.text()}`));
    page.on('pageerror', (e) => logs.push(`[${name}] pageerror: ${e.message}`));
    await page.goto('http://localhost:5173/');
    await page.waitForSelector('[role=listitem]');
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${out}/${tag}-${name}-midflight.png`, fullPage: name === 'desktop' });
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `${out}/${tag}-${name}.png`, fullPage: true });
    await page.close();
  }
  console.log(logs.join('\n') || 'no console errors/warnings');
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
