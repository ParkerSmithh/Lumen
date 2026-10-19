import {enterArtwork} from './enterArtwork.js';
import {test, expect} from '@playwright/test';

for (const size of [{width:667,height:375},{width:844,height:390}]) {
  test(`submission entry controls do not overlap at ${size.width}x${size.height}`, async ({page}) => {
    await page.setViewportSize(size);
    await page.goto('/');await enterArtwork(page);
    const controls = page.locator('nav button,.invitation .enter,.chaos-control button,.pulse-control button,.camera-controls button,.color-picker button');
    const failures = await controls.evaluateAll(nodes => nodes.flatMap(el => {
      const r=el.getBoundingClientRect(), visible=r.width>0&&r.height>0;
      if (!visible) return [];
      const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
      return r.x<0||r.y<0||r.right>innerWidth||r.bottom>innerHeight||!el.contains(hit)
        ? [el.getAttribute('aria-label')||el.textContent] : [];
    }));
    expect(failures).toEqual([]);
  });
}

test('gallery Escape returns to its opener', async ({page}) => {
  await page.goto('/');await enterArtwork(page);
  const opener=page.getByRole('button',{name:'ECHOES',exact:true});
  await opener.click();
  await expect(page.getByRole('button',{name:'BACK TO LUMEN'})).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(opener).toBeFocused();
  await expect(page.locator('.echo-gallery')).toHaveCount(0);
});

test('failed gallery chunk keeps a keyboard-accessible return to LUMEN', async ({page}) => {
  await page.route('**/src/echoes/EchoGallery*', route=>route.abort());
  await page.goto('/');await enterArtwork(page);
  await page.getByRole('button',{name:'ECHOES',exact:true}).click();
  const back=page.getByRole('button',{name:'BACK TO LUMEN',exact:true});
  await expect(back).toBeVisible();
  await back.click();
  await expect(page.getByRole('button',{name:'ECHOES',exact:true})).toBeFocused();
});
