import {startGame} from './startGame.js';
import { expect } from '@playwright/test';
export async function startSlashSession(page) {
  await startGame(page);
  await expect(page.getByLabel('Time remaining')).toBeVisible({ timeout: 30000 });
}
