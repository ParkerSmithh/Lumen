import {enterArtwork} from './enterArtwork.js';
import {test, expect} from '@playwright/test';
import {chooseEnergyRushAssist} from './energyRushTutorial.js';
import {installArcadeClock} from './arcadeClock.js';

async function advanceEnergyFrames(page, seconds) {
  // ENERGY RUSH intentionally pauses for gaps >250ms. Exercise real renderer
  // frames with a held clock, including under a slow host, rather than jumping.
  await page.evaluate(async seconds => {
    for (let remaining = seconds; remaining > 0; remaining -= .1) {
      window.arcadeClock.advance(Math.min(.1, remaining));
      await new Promise(requestAnimationFrame);
    }
  }, seconds);
}

test('benchmark input selection belongs to the tutorial when the background has the same control', async ({page}) => {
  // Recreate the short portal-commit → background-inert interval deterministically.
  // Both labels are accessible here; the visible overlay still owns pointer input.
  await page.setContent(`<main><button onclick="this.dataset.chosen='yes'">Keyboard / touch</button></main>
    <section role="dialog" aria-modal="true" aria-labelledby="title" style="position:fixed;inset:0;background:#111;color:white">
      <h2 id="title">ENERGY RUSH</h2><button onclick="this.dataset.chosen='yes'">Keyboard / touch</button>
    </section>`);
  await chooseEnergyRushAssist(page);
  await expect(page.getByRole('dialog', {name:'ENERGY RUSH'}).getByRole('button', {name:'Keyboard / touch', exact:true})).toHaveAttribute('data-chosen', 'yes');
  await expect(page.locator('main button')).not.toHaveAttribute('data-chosen', 'yes');
});

for (const reducedMotion of ['no-preference', 'reduce']) test(`ENERGY RUSH first tutorial, keyboard dismissal, review and replay (${reducedMotion})`, async ({page}) => {
  await installArcadeClock(page);
  await page.emulateMedia({reducedMotion});
  await page.goto('/?debugEnergy');await enterArtwork(page);
  await page.evaluate(() => window.arcadeClock.hold());
  const entry = page.getByRole('button', {name:'PLAY ENERGY RUSH', exact:true});
  const dialog = page.getByRole('dialog', {name:'ENERGY RUSH', exact:true});
  await entry.click();
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute('aria-modal', 'true');
  await expect(dialog.getByRole('heading', {name:'ENERGY RUSH', exact:true})).toBeFocused();
  await expect(page.locator('#root main')).toHaveAttribute('inert', '');
  await expect(dialog.getByRole('button', {name:'START GAME', exact:true})).toBeDisabled();
  await page.evaluate(() => window.advance(20));
  expect(await page.evaluate(() => window.__lumenEnergy.snapshot().phase)).toBe('READY');
  await page.keyboard.press('Tab');
  expect(await dialog.evaluate(node => node.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Shift+Tab');
  expect(await dialog.evaluate(node => node.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(entry).toBeFocused();
  await expect(page.locator('#root main')).not.toHaveAttribute('inert', '');

  // BACK/Escape did not accept first-play guidance: it must appear again.
  await entry.click();
  await chooseEnergyRushAssist(page);
  const start = dialog.getByRole('button', {name:'START GAME', exact:true});
  await expect(start).toBeEnabled();
  await start.focus();
  await page.keyboard.press('Enter');
  await expect(dialog).toHaveCount(0);
  await advanceEnergyFrames(page, 3.1);
  await expect(page.getByRole('button', {name:'PAUSE', exact:true})).toBeVisible();

  // Reviewing is read-only and closing it must leave the round explicitly paused.
  await page.getByRole('button', {name:'HOW TO PLAY', exact:true}).click();
  await expect(dialog).toBeVisible();
  const before = await page.evaluate(() => window.__lumenEnergy.snapshot());
  await expect(dialog.getByRole('group', {name:'Interaction method'})).toHaveCount(0);
  await page.evaluate(() => window.advance(20));
  await dialog.getByRole('button', {name:'BACK TO GAME', exact:true}).click();
  await expect(dialog).toHaveCount(0);
  const after = await page.evaluate(() => window.__lumenEnergy.snapshot());
  expect(after.phase).toBe('PAUSED');
  expect(after.elapsed).toBe(before.elapsed);
  expect(after.score).toBe(before.score);
  expect(after.session).toBe(before.session);
  await page.getByRole('button', {name:'RESUME', exact:true}).click();
  await advanceEnergyFrames(page, 100);
  await page.getByRole('button', {name:'REPLAY', exact:true}).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByLabel('Starting in')).toBeVisible();
  await page.getByRole('button', {name:'EXIT', exact:true}).click();
  await entry.click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('button', {name:'START', exact:true})).toBeVisible();
});
