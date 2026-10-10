// Coordinates/radii are CSS pixels; optional baseRadius projects the effective world grab radius.
// radius remains the rendered sphere silhouette; depth is positive camera distance.
export function selectGrabCandidate(projected,pointer,{previousIndex,previousToken,assistScale=1.75,minRadius=24,maxRadius=64,exitScale=1.2,swapMargin=.2}={}){
 if(!pointer||!Number.isFinite(pointer.x+pointer.y))return null;
 const visible=projected.filter(p=>p.visible&&Number.isInteger(p.index)&&p.index>0&&Number.isFinite(p.x+p.y+p.radius+p.depth)&&p.radius>0&&p.depth>0);
 const eligible=visible.filter(p=>!visible.some(front=>front.index!==p.index&&front.depth<p.depth&&Math.hypot(front.x-p.x,front.y-p.y)<front.radius));
 const candidates=eligible.map(p=>({p,d:Math.hypot(p.x-pointer.x,p.y-pointer.y),reach:Math.min(maxRadius,Math.max(minRadius,(Number.isFinite(p.baseRadius)&&p.baseRadius>0?p.baseRadius:p.radius)*assistScale))}));
 const previous=candidates.find(c=>c.p.index===previousIndex&&(previousToken===undefined||c.p.token===previousToken));
 const closest=candidates.filter(c=>c.d<=c.reach).sort((a,b)=>a.d-b.d||a.p.depth-b.p.depth||a.p.index-b.p.index)[0];
 if(previous&&previous.d<=previous.reach*exitScale&&(!closest||closest.d>=previous.d*(1-swapMargin)))return previous.p;
 return closest?.p||null;
}
