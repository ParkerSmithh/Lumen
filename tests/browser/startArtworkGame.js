import {expect} from '@playwright/test';
export async function startArtworkGame(page){const start=page.getByRole('button',{name:'START',exact:true});await expect(start).toBeVisible();await expect(start).toBeEnabled();await start.click();await expect(page.getByLabel('Time remaining')).toBeVisible({timeout:15000});}
