import { test, expect } from '@playwright/test';
test('GLOW shell, colors and responsive preview', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'LUMEN' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'FLOW', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Preview light' }).click();
  await expect(page.getByText('Illustrated preview · camera off')).toBeVisible();
  for (const color of ['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Purple']) {
    await page.getByRole('button', { name: color, exact: true }).click();
    await expect(page.getByRole('button', { name: color, exact: true })).toHaveAttribute('aria-pressed', 'true');
  }
  await page.screenshot({ path: '.test-artifacts/glow-desktop.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('button', { name: 'Enter with camera' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: '.test-artifacts/glow-mobile.png' });
  expect(errors).toEqual([]);
});
test('camera permission errors remain understandable', async ({ page }) => {
  await page.addInitScript(() => { navigator.mediaDevices.getUserMedia = async () => { throw new DOMException('Denied', 'NotAllowedError'); }; });
  await page.goto('/'); await page.getByRole('button', { name: 'Enter with camera' }).click();
  await expect(page.getByRole('status')).toContainText('permission');
  await expect(page.getByRole('button', { name: 'Try camera again' })).toBeVisible();
});
test('late permission after Stop releases stream', async ({ page }) => {
  await page.addInitScript(() => {
    window.stopped = false;
    navigator.mediaDevices.getUserMedia = () => new Promise(resolve => { window.finishCamera = () => resolve({ getTracks: () => [{ stop: () => { window.stopped = true; } }] }); });
  });
  await page.goto('/'); await page.getByRole('button', { name: 'Enter with camera' }).click();
  await page.getByRole('button', { name: 'Stop camera' }).click();
  await page.evaluate(() => window.finishCamera());
  await expect.poll(() => page.evaluate(() => window.stopped)).toBe(true);
});
test('Canvas fallback can render without WebGL', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, ...args) { return type.includes('webgl') ? null : original.call(this, type, ...args); };
  });
  await page.goto('/'); await page.getByRole('button', { name: 'Preview light' }).click();
  await expect(page.getByText('Illustrated preview · camera off')).toBeVisible();
  await page.screenshot({ path: '.test-artifacts/glow-fallback.png' });
});
