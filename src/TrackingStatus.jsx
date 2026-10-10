import {useEffect,useRef,useState} from 'react';
import {trackingNotice} from './tracking/trackingNotice';

export function TrackingStatus({camera,tracking,assisted,body,error}){
 const seen=useRef(false),[searching,setSearching]=useState(false);
 const detected=['tracking','drawing'].includes(tracking);
 useEffect(()=>{if(camera!=='ready'||assisted){seen.current=false;setSearching(false);return;}if(detected){seen.current=true;setSearching(false);return;}if(tracking!=='searching'){setSearching(false);return;}const timer=setTimeout(()=>setSearching(true),700);return()=>clearTimeout(timer);},[camera,tracking,assisted,detected]);
 const stableTracking=tracking==='searching'&&!searching&&seen.current?'tracking':tracking;
 const message=trackingNotice({camera,tracking:stableTracking,assisted,body,error,seen:seen.current});
 return <div className="tracking-status" role="status" aria-label="Input status" aria-live="polite" aria-atomic="true"><span className={detected||assisted?'signal detected':'signal'} aria-hidden="true"/>{message}</div>;
}
