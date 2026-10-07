import { expect } from '@playwright/test';
export async function startSlashSession(page) {
  await page.getByRole('button', { name: 'START', exact: true }).click();
  await expect(page.getByLabel('Time remaining')).toBeVisible({ timeout: 30000 });
}
