export function trackingNotice({camera='idle',tracking='idle',assisted=false,error='',seen=false,body=false}={}){
 if(assisted)return body?'Keyboard / touch ready':'Mouse / touch ready';
 if(camera==='loading')return 'Camera connecting';
 if(camera==='error')return /disconnect/i.test(error)?'Camera disconnected · retry camera':/denied|blocked/i.test(error)?'Camera permission needed · retry or use alternate controls':'Camera unavailable · retry or use alternate controls';
 if(camera!=='ready')return 'Camera off';
 if(tracking==='loading')return 'Camera ready · preparing tracking';
 if(tracking==='error')return 'Tracking unavailable · retry or use alternate controls';
 if(['tracking','drawing'].includes(tracking))return body?'Body tracking active':'Hand tracking active';
 return seen?'Tracking lost · return to view':body?'Camera ready · move into view':'Camera ready · raise your hand';
}
