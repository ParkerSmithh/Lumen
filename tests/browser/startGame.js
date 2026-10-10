import {expect} from '@playwright/test';
export async function startGame(page) {
 const dialog=page.getByRole('dialog');
 if(!await dialog.isVisible())await page.getByRole('button',{name:/^(PLAY|START)$/}).click();
 if(await dialog.isVisible()){
  const start=dialog.getByRole('button',{name:'START GAME',exact:true});
  await expect(start).toBeEnabled();await start.click();
  // START delegates only after the exit transition releases the instruction gate.
  await expect(dialog).toHaveCount(0);
 }
}
