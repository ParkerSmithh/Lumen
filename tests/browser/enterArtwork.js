// Existing gameplay tests explicitly choose their starting artwork through the
// public launcher. First-visit and consent behavior is covered separately.
export async function enterArtwork(page) {
 const choose=page.getByRole('button',{name:'Choose GLOW',exact:true});
 await choose.waitFor({state:'visible'});
 await choose.click();
 await page.getByRole('button',{name:'CONNECTING CAMERA…',exact:true}).waitFor({state:'hidden'});
 const connected=page.getByRole('button',{name:'CONTINUE',exact:true});
 if(await connected.count())await connected.click();
 else await page.getByRole('button',{name:'Explore without camera',exact:true}).click();
}
