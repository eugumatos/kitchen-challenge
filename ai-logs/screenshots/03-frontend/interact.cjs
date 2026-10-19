const { chromium } = require('/Users/gustavomatos/Projects/kitchen-challenge/node_modules/playwright-core');
const { execSync } = require('child_process');
const out = process.argv[2];
const row = (page, name) => page.locator('[role=listitem]', { hasText: name });
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const logs = [];
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('console', (m) => ['error', 'warning'].includes(m.type()) && logs.push(`${m.type()}: ${m.text()}`));
  page.on('pageerror', (e) => logs.push(`pageerror: ${e.message}`));
  await page.goto('http://localhost:5173/');
  await page.waitForSelector('[role=listitem]');
  await page.waitForTimeout(2500);

  // 1. Start Ana -> status flash + reorder
  await row(page, 'Ana').getByRole('button', { name: 'Start' }).click();
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${out}/i1-start-flash.png` });
  await page.waitForTimeout(1500);

  // 2. Mark Fabio ready -> ball into the pass while row collapses
  await row(page, 'Fabio').getByRole('button', { name: 'Mark ready' }).click();
  await page.waitForTimeout(280);
  await page.screenshot({ path: `${out}/i2-ready-exit.png` });
  await page.waitForTimeout(1500);

  // 3. Cancel Bruno: first click asks for confirmation, second click cancels (ball fades)
  await row(page, 'Bruno').getByRole('button', { name: 'Cancel' }).click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${out}/i3-cancel-confirm.png` });
  await row(page, 'Bruno').getByRole('button', { name: /Confirm cancelling/ }).click();
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${out}/i4-cancel-fade.png` });
  await page.waitForTimeout(1500);
  logs.push('rows after actions: ' + (await page.locator('[role=listitem]').allInnerTexts()).map((t) => t.split('\n')[0]).join(', '));

  // 4. Stale UI: another client cancels Gabi; our Start click now gets 409 from the API
  execSync('curl -s -X POST localhost:4000/orders/7/cancel >/dev/null');
  await row(page, 'Gabi').getByRole('button', { name: 'Start' }).click();
  await page.waitForSelector('[role=alert]');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${out}/i5-error-409.png` });
  logs.push('alert: ' + (await page.locator('[role=alert]').innerText()).replace(/\n/g, ' | '));

  // 5. Filters with real data
  await page.getByRole('button', { name: 'Preparing' }).click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${out}/i6-filter-preparing.png` });

  // 6. Empty states (queue response stubbed in the browser only)
  await page.route('**/api/orders/queue*', (r) =>
    r.fulfill({ json: { generated_at: new Date().toISOString(), orders: [] } }),
  );
  for (const label of ['All active', 'Received', 'Preparing']) {
    await page.getByRole('button', { name: label, exact: true }).click();
    await page.getByRole('button', { name: 'Refresh now' }).click();
    await page.waitForTimeout(400);
    logs.push(`empty[${label}]: ` + (await page.locator('.empty').innerText()).replace(/\n/g, ' | '));
  }
  await page.screenshot({ path: `${out}/i7-empty-preparing.png` });
  await page.close();

  // 7. Reduced motion: balls and scores should be in final position immediately
  const rm = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  await rm.goto('http://localhost:5173/');
  await rm.waitForSelector('[role=listitem]');
  await rm.waitForTimeout(80);
  await rm.screenshot({ path: `${out}/i8-reduced-motion-80ms.png` });
  logs.push('reduced-motion first score at 80ms: ' + (await rm.locator('.card__score-value').first().innerText()));
  await browser.close();
  console.log(logs.join('\n'));
})().catch((e) => { console.error(e); process.exit(1); });
