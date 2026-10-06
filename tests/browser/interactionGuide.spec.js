import { test, expect } from '@playwright/test';

test('each mode keeps its own concise gesture reminder', async ({ page }) => {
  await page.goto('/');
  const guide = page.getByRole('region', { name: 'Interaction guide' });
  await expect(guide).toContainText('SHOW YOURSELF');
  await expect(guide).toContainText('Step into view');
  for (const [mode, text] of [['FLOW', 'POINT + MOVE'], ['SLASH', 'SWIPE TO SLASH'], ['LAUNCH', 'POINT + RAPID PUSH']]) {
    await page.getByRole('button', { name: mode, exact: true }).click();
    await expect(guide).toContainText(text);
  }
  await expect(guide).toContainText('CLOSE HAND');
  await expect(guide).toContainText('MOVE + RELEASE');
  await page.getByRole('button', { name: 'Mouse / touch fallback' }).click();
  await expect(guide).toContainText('CLICK / TAP');
  await expect(guide).toContainText('Move to nudge balls');
  await expect(guide).not.toContainText('CLOSE HAND');
  await expect(page.locator('.launch-artwork canvas')).toBeVisible();
  await page.waitForTimeout(150);
  await page.mouse.click(680, 350);
  await expect(guide).toHaveClass(/quiet/);
  const opacity = await guide.evaluate(el => Number(getComputedStyle(el).opacity));
  expect(opacity).toBeGreaterThan(0.4);
});

for (const viewport of [{ width: 1366, height: 768 }, { width: 480, height: 640 }, { width: 800, height: 500 }]) {
  test(`guide stays above footer at ${viewport.width}×${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    for (const mode of ['GLOW', 'LAUNCH']) {
      if (mode !== 'GLOW') await page.getByRole('button', { name: mode, exact: true }).click();
      const guide = await page.getByRole('region', { name: 'Interaction guide' }).boundingBox();
      const footer = await page.locator('footer').boundingBox();
      expect(guide.x).toBeGreaterThanOrEqual(0);
      expect(guide.x + guide.width).toBeLessThanOrEqual(viewport.width);
      expect(guide.y + guide.height).toBeLessThan(footer.y);
      if (mode === 'GLOW') {
        const frame = await page.locator('.glow-field').boundingBox();
        expect(guide.y).toBeGreaterThanOrEqual(frame.y + frame.height);
      }
    }
  });
}
