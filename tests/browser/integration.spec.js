import { test, expect } from '@playwright/test';

// Replace inference and capture only: the real hooks, renderers and UI still run.
async function controlledTracking(page, body = 'tracking') {
  await page.addInitScript(({ body }) => {
    window.testWorkers = [];
    window.cameraCalls = 0;
    window.cameraTracks = [];
    navigator.mediaDevices.getUserMedia = async () => {
      window.cameraCalls++;
      const canvas = document.createElement('canvas'); canvas.width = 320; canvas.height = 240;
      canvas.getContext('2d').fillRect(0, 0, 320, 240);
      const stream = canvas.captureStream(20);
      setInterval(() => canvas.getContext('2d').fillRect(0, 0, 320, 240), 50);
      window.cameraTracks.push(stream.getVideoTracks()[0]);
      return stream;
    };
    window.Worker = class {
      constructor(url) {
        this.body = url.includes('segmentation'); this.closed = false;
        if (this.body && body === 'construction') throw new Error('unavailable');
        window.testWorkers.push(this);
      }
      postMessage(data) {
        if (data.type === 'init') queueMicrotask(() => this.onmessage?.({ data: { type: 'ready' } }));
        if (data.type === 'frame') {
          data.frame.close();
          if (this.body && body === 'stall') return;
          if (this.body) queueMicrotask(() => this.onmessage?.({ data: {
            type: 'mask', values: new Float32Array(64).fill(1), width: 8, height: 8,
            sourceWidth: 320, sourceHeight: 240, timestamp: data.timestamp,
          } }));
        }
      }
      terminate() { this.closed = true; }
    };
    window.handSample = (present = true, x = .4) => {
      const landmarks = present ? Array.from({ length: 21 }, (_, i) => ({ x: x + i * .005, y: .4 + i * .005, z: 0 })) : null;
      window.testWorkers.filter(worker => !worker.closed && !worker.body).forEach(worker => worker.onmessage?.({ data: {
        type: 'hand', landmarks, timestamp: performance.now(), sourceWidth: 320, sourceHeight: 240,
      } }));
    };
  }, { body });
}

test('GLOW guidance fades after presence, while failures and retries stay visible', async ({ page }) => {
  await controlledTracking(page);
  await page.goto('/'); await page.getByRole('button', { name: 'Enter with camera', exact: true }).click();
  await expect(page.getByRole('status')).toHaveClass(/quiet/, { timeout: 6000 });
  await page.evaluate(() => window.testWorkers.find(worker => !worker.closed && worker.body).onerror());
  await expect(page.getByRole('status')).not.toHaveClass(/quiet/);
  await expect(page.getByRole('button', { name: 'Retry body tracking' })).toBeVisible();
  await expect(page.getByRole('status')).not.toContainText(/npm|worker|WASM|model|asset/i);
});

test('changing input source cancels a pending fade and camera errors override quiet guidance', async ({ page }) => {
  await controlledTracking(page);
  await page.goto('/'); await page.getByRole('button', { name: 'FLOW', exact: true }).click();
  await page.getByRole('button', { name: 'Enter with camera', exact: true }).click();
  await page.waitForFunction(() => window.testWorkers.some(worker => !worker.body && !worker.closed));
  await page.evaluate(() => window.handSample()); await page.waitForTimeout(60);
  await page.evaluate(() => window.handSample(true, .43));
  await page.getByRole('button', { name: 'Mouse / touch fallback' }).click();
  await page.waitForTimeout(2400);
  await expect(page.getByRole('status')).not.toHaveClass(/quiet/);
  await page.mouse.move(300, 300); await page.mouse.move(400, 350);
  await expect(page.getByRole('status')).toHaveClass(/quiet/, { timeout: 6000 });
  await page.evaluate(() => window.cameraTracks.at(-1).onended());
  await expect(page.getByRole('status')).not.toHaveClass(/quiet/);
  await expect(page.getByRole('button', { name: 'Try camera again' })).toBeVisible();
});

test('LAUNCH loads on demand and a failed import leaves other modes available', async ({ page }) => {
  const requests = []; page.on('request', request => requests.push(request.url()));
  await page.goto('/');
  expect(requests.some(url => url.includes('/modes/LaunchMode') || url.includes('/effects/Ballpit'))).toBe(false);
  await page.route('**/src/modes/LaunchMode*', route => route.abort());
  await page.getByRole('button', { name: 'LAUNCH', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Reload artwork' })).toBeVisible();
  await expect(page.getByRole('status')).not.toHaveClass(/quiet/);
  await page.unroute('**/src/modes/LaunchMode*');
  await page.getByRole('button', { name: 'Reload artwork' }).click();
  await expect(page.getByRole('heading', { name: 'LUMEN' })).toBeVisible();
  await page.getByRole('button', { name: 'LAUNCH', exact: true }).click();
  await expect(page.locator('.launch-artwork canvas')).toBeVisible();
  await page.getByRole('button', { name: 'SLASH', exact: true }).click();
  await expect(page.locator('.slash-artwork')).toBeVisible();
  await page.getByRole('button', { name: 'GLOW', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Enter with camera', exact: true })).toBeVisible();
});

test('keyboard navigation and reduced motion preserve immediate mode changes', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.keyboard.press('Tab'); await expect(page.getByRole('button', { name: 'GLOW', exact: true })).toBeFocused();
  await page.keyboard.press('Tab'); await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'FLOW', exact: true })).toHaveAttribute('aria-current', 'page');
  expect(await page.locator('.mode-stage').evaluate(element => getComputedStyle(element).animationName)).toBe('none');
  await expect(page.locator('#fluid')).toBeVisible();
});

test('a previous mode or input source cannot fade the current instruction', async ({ page }) => {
  await controlledTracking(page);
  await page.goto('/'); await page.getByRole('button', { name: 'FLOW', exact: true }).click();
  await page.getByRole('button', { name: 'Enter with camera', exact: true }).click();
  await page.waitForFunction(() => window.testWorkers.some(worker => !worker.body && !worker.closed));
  // Supply actual movement so FLOW starts its guidance fade.
  await page.evaluate(() => window.handSample(true, .42));
  await page.waitForTimeout(60);
  await page.evaluate(() => window.handSample());
  await page.evaluate(() => { window.handFeed = setInterval(() => window.handSample(), 100); });
  await page.getByRole('button', { name: 'SLASH', exact: true }).click();
  await page.waitForTimeout(2400);
  await expect(page.getByRole('status')).not.toHaveClass(/quiet/);
  await expect(page.getByRole('status')).toContainText(/Raise your hand|Slash through/);
});

for (const failure of ['construction', 'stall']) test(`body tracking ${failure} is recoverable without losing navigation`, async ({ page }) => {
  await controlledTracking(page, failure);
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/'); await page.getByRole('button', { name: 'Enter with camera', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Retry body tracking' })).toBeVisible({ timeout: 12000 });
  await expect(page.getByRole('status')).not.toContainText(/npm|worker|WASM|model|asset/i);
  await page.getByRole('button', { name: 'FLOW', exact: true }).click();
  await expect(page.locator('#fluid')).toBeVisible();
  await page.getByRole('button', { name: 'Stop camera' }).click();
  await page.getByRole('button', { name: 'Enter with camera', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.cameraCalls)).toBe(2);
  expect(await page.evaluate(() => window.cameraTracks[0].readyState)).toBe('ended');
  expect(errors).toEqual([]);
});

test('short and narrow viewports keep controls in the immersive viewport', async ({ page }) => {
  await page.goto('/');
  for (const size of [{ width: 1366, height: 768 }, { width: 390, height: 480 }, { width: 800, height: 400 }]) {
    await page.setViewportSize(size);
    expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight && document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    for (const name of ['GLOW', 'FLOW', 'SLASH', 'LAUNCH']) {
      const bounds = await page.getByRole('button', { name, exact: true }).boundingBox();
      expect(bounds.x).toBeGreaterThanOrEqual(0); expect(bounds.x + bounds.width).toBeLessThanOrEqual(size.width);
    }
    const preview = page.getByRole('button', { name: 'Preview light' });
    expect(await preview.evaluate(element => {
      const r = element.getBoundingClientRect();
      return element.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
    })).toBe(true);
  }
});
