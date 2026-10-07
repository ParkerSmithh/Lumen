import { test, expect } from '@playwright/test';

test('compact webcam follows active hand modes and stops with the camera', async ({ page }) => {
  await page.addInitScript(() => {
    window.cameraCalls = 0;
    navigator.mediaDevices.getUserMedia = async () => {
      window.cameraCalls++;
      const canvas = document.createElement('canvas');
      canvas.width = 640; canvas.height = 480;
      const context = canvas.getContext('2d');
      context.fillStyle = '#8060a0'; context.fillRect(0, 0, 640, 480);
      const stream = canvas.captureStream(20);
      window.cameraTrack = stream.getVideoTracks()[0];
      return stream;
    };
  });
  await page.goto('/');
  const video = page.locator('video');
  await expect(video).toBeHidden();
  await page.getByRole('button', { name: 'FLOW', exact: true }).click();
  await expect(video).toBeHidden();
  await page.getByRole('button', { name: 'Enter with camera', exact: true }).click();
  for (const mode of ['FLOW', 'SLASH', 'LAUNCH']) {
    await page.getByRole('button', { name: mode, exact: true }).click();
    await expect(video).toBeVisible();
    await expect.poll(() => video.evaluate(element => element.readyState)).toBeGreaterThanOrEqual(2);
    for (const viewport of [{ width: 1366, height: 768 }, { width: 390, height: 844 }, { width: 667, height: 375 }]) {
      await page.setViewportSize(viewport);
      const bounds = await video.boundingBox();
      const header = await page.locator('header').boundingBox();
      const nav = await page.locator('nav').boundingBox();
      expect(bounds.width).toBeLessThanOrEqual(200);
      expect(bounds.x).toBeLessThan(50);
      expect(bounds.y).toBeGreaterThanOrEqual(header.y + header.height);
      expect(bounds.y).toBeGreaterThanOrEqual(nav.y + nav.height);
      expect(bounds.y + bounds.height).toBeLessThan(viewport.height - 100);
      expect(await video.evaluate(element => getComputedStyle(element).objectFit)).toBe('contain');
      expect(await video.evaluate(element => getComputedStyle(element).transform)).toBe('matrix(-1, 0, 0, 1, 0, 0)');
    }
  }
  await page.getByRole('button', { name: 'GLOW', exact: true }).click();
  await expect(video).toBeHidden();
  await page.getByRole('button', { name: 'FLOW', exact: true }).click();
  await expect(video).toBeVisible();
  expect(await page.evaluate(() => window.cameraCalls)).toBe(1);
  await page.getByRole('button', { name: 'Stop camera', exact: true }).click();
  await expect(video).toBeHidden();
  expect(await page.evaluate(() => window.cameraTrack.readyState)).toBe('ended');
});
