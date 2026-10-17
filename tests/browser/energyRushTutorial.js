import {expect} from '@playwright/test';

// The first-play dialog opens after the launch click; the background has an
// identically named input control. Wait for and select within the actual dialog.
export async function chooseEnergyRushAssist(page) {
  const dialog = page.getByRole('dialog', {name:'ENERGY RUSH', exact:true});
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', {name:'Keyboard / touch', exact:true}).click();
}
