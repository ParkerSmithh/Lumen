export const GRID_WIDTH=64, GRID_HEIGHT=48, MASK_MAX_AGE=250;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function arenaPoint(x,y,rect){return {x:rect.x+(1-x)*rect.width,y:rect.y+y*rect.height};}

// FREE GLOW's existing decorative sampling remains deliberately separate from
// the stricter gameplay grid, but shares this camera-to-display transform.
export function sampleCoarseSilhouette(mask,width=32,height=24){
 if(!mask?.values||!mask.width||!mask.height)return null;
 const cells=new Uint8Array(width*height);let sx=0,sy=0,total=0;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const mx=Math.min(mask.width-1,Math.floor((x+.5)*mask.width/width)),my=Math.min(mask.height-1,Math.floor((y+.5)*mask.height/height));
  const value=mask.values[my*mask.width+mx]>.35?255:0,dx=width-1-x;
  cells[y*width+dx]=value;if(value){sx+=(dx+.5)/width;sy+=(y+.5)/height;total++;}
 }
 return {cells,occupancy:total/(width*height),center:total?{x:sx/total,y:sy/total}:null};
}

// Borrowed buffers: transient geometry only, never persisted or passed to ECHOES.
export function createSilhouetteGrid(){
  let cells=new Uint8Array(GRID_WIDTH*GRID_HEIGHT),previous=new Uint8Array(cells.length);
  const entered=new Uint8Array(cells.length);
  let last=-Infinity,valid=false,center=null,bounds=null,occupancy=0,aspect=4/3,continuous=false;
  const api={
    get snapshot(){return {valid,timestamp:last,cells,entered,center,bounds,occupancy,aspect,continuous};},
    fresh(now){return valid&&Number.isFinite(now)&&now>=last&&now-last<=MASK_MAX_AGE;},
    invalidate(){valid=false;continuous=false;entered.fill(0);},
    reset(){api.invalidate();last=-Infinity;cells.fill(0);previous.fill(0);},
    update(mask,now){
      const t=mask?.timestamp;
      if(!Number.isFinite(t)||t>now||now-t>MASK_MAX_AGE||t<last||!Number.isInteger(mask?.width)||!Number.isInteger(mask?.height)||mask.width<1||mask.height<1||mask.width>4096||mask.height>4096||mask.values?.length!==mask.width*mask.height){api.invalidate();return false;}
      if(t===last){entered.fill(0);return false;}
      continuous=valid&&t-last<=MASK_MAX_AGE;
      [previous,cells]=[cells,previous];cells.fill(0);entered.fill(0);
      let total=0,sx=0,sy=0,minX=1,minY=1,maxX=0,maxY=0;
      for(let y=0;y<GRID_HEIGHT;y++)for(let x=0;x<GRID_WIDTH;x++){
        let foreground=0;
        for(const offset of [.25,.75])for(const oy of [.25,.75]){
          const mx=Math.min(mask.width-1,Math.floor((x+offset)*mask.width/GRID_WIDTH));
          const my=Math.min(mask.height-1,Math.floor((y+oy)*mask.height/GRID_HEIGHT));
          const confidence=mask.values[my*mask.width+mx];
          if(!Number.isFinite(confidence)||confidence<0||confidence>1){api.invalidate();return false;}
          if(confidence>=.6)foreground++;
        }
        const dx=GRID_WIDTH-1-x,i=y*GRID_WIDTH+dx;
        if(foreground>=2){cells[i]=1;entered[i]=continuous&&!previous[i]?1:0;total++;sx+=(dx+.5)/GRID_WIDTH;sy+=(y+.5)/GRID_HEIGHT;minX=Math.min(minX,dx/GRID_WIDTH);maxX=Math.max(maxX,(dx+1)/GRID_WIDTH);minY=Math.min(minY,y/GRID_HEIGHT);maxY=Math.max(maxY,(y+1)/GRID_HEIGHT);}
      }
      last=t;valid=total>=4;occupancy=total/cells.length;
      center=valid?{x:sx/total,y:sy/total}:null;bounds=valid?{minX,minY,maxX,maxY}:null;
      aspect=Number.isFinite(mask.sourceWidth/mask.sourceHeight)?clamp(mask.sourceWidth/mask.sourceHeight,.25,4):4/3;
      return valid;
    },
    contact(x,y,r,entry=false){return api.sweep({x,y},{x,y},r,entry);},
    sweep(a,b,r,entry=false){
      if(!valid||![a?.x,a?.y,b?.x,b?.y,r].every(Number.isFinite)||r<0)return false;
      const data=entry?entered:cells,ry=r*aspect;
      const minX=clamp(Math.floor((Math.min(a.x,b.x)-r)*GRID_WIDTH),0,GRID_WIDTH-1),maxX=clamp(Math.floor((Math.max(a.x,b.x)+r)*GRID_WIDTH),0,GRID_WIDTH-1);
      const minY=clamp(Math.floor((Math.min(a.y,b.y)-ry)*GRID_HEIGHT),0,GRID_HEIGHT-1),maxY=clamp(Math.floor((Math.max(a.y,b.y)+ry)*GRID_HEIGHT),0,GRID_HEIGHT-1);
      const vx=b.x-a.x,vy=(b.y-a.y)/aspect,len=vx*vx+vy*vy;
      // Half-cell tolerance is shared by collision fixtures and visible target cores.
      const tolerance=r+Math.min(1/GRID_WIDTH,1/(GRID_HEIGHT*aspect))*.5;
      for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++)if(data[y*GRID_WIDTH+x]){
        const dx=(x+.5)/GRID_WIDTH-a.x,dy=((y+.5)/GRID_HEIGHT-a.y)/aspect;
        const u=len?clamp((dx*vx+dy*vy)/len,0,1):0;
        if((dx-u*vx)**2+(dy-u*vy)**2<=tolerance*tolerance)return true;
      }
      return false;
    }
  };return api;
}
