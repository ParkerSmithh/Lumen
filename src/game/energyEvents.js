// Accepted game decisions only. Transient collision geometry never reaches storage.
export function createEnergyEvents(session){
 let seen=new Set(),orbMarks=0,bonusMarks=0,epoch=session?.store.epoch;
 return {reset(){seen.clear();orbMarks=bonusMarks=0;epoch=session?.store.epoch;session?.beyond.chaos.setEnergyRush(true);},
  accept(event,color){
   if(!session||session.gate.suspended||seen.has(event.id)||!Number.isFinite(event.x)||!Number.isFinite(event.y))return false;
   seen.add(event.id);if(seen.size>512)seen.delete(seen.values().next().value);
   const record={id:event.id,mode:'GLOW',kind:event.kind,color,points:[{x:Math.round(event.x*16)/16,y:Math.round(event.y*16)/16}],intensity:Math.min(1,.4+(event.combo??0)/20),duration:1.2};
   if(['energy-orb','energy-challenge','energy-milestone'].includes(event.kind)){
    // Meter/effect acceptance is independent of the optional gallery sampling cap.
    session.beyond.chaos.accept(record,{combo:event.combo});
    const orb=event.kind==='energy-orb';
    if(orb?orbMarks<16:bonusMarks<8){const saved=session.emit(record,epoch);if(saved){if(orb)orbMarks++;else bonusMarks++;}}
   }else session.beyond.chaos.activity('GLOW',{id:event.id,type:event.kind,point:record.points[0],color:event.kind==='energy-damage'?'#ff354e':color,intensity:.9});
   return true;
  }
 };
}
