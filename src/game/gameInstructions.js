export const GAME_INSTRUCTIONS = Object.freeze({
 ENERGY_RUSH: {note:"90 seconds, or until all three shields are lost. We'll calibrate your movement first. ENERGY FEVER intensifies the arena; optional pose tracking adds reach challenges.",title:'ENERGY RUSH', subtitle:'YOUR BODY IS THE CONTROLLER', steps:[['COLLECT THE LIGHT','Move your body into glowing orbs to earn points. Shift or widen within your calibrated range; small movements count.'],['AVOID THE DANGER','Move away from red hazards. A hit costs a shield and breaks your combo.'],['BUILD YOUR COMBO','Collect consecutive orbs to raise your multiplier and activate ENERGY FEVER.']], assisted:[['Move your field','Arrow keys / WASD move your energy field, or drag the touch pad.'],['Collect and protect','Collect glowing orbs for points. Avoid red hazards: a hit costs a shield and breaks your combo.'],['Build your combo','Consecutive orbs raise your multiplier and trigger ENERGY FEVER. Hold EXPAND / REACH when prompted.']]},
 FLOW: {note:'Eight paths appear in order, then repeat until the 90-second round ends. CLEAN: 85% accuracy. PERFECT: 95%. SKIP resets your chain.',title:'LIGHT TRACE',subtitle:'DRAW WITH LIGHT',assistedLabel:'Mouse / touch',steps:[['FOLLOW THE PATH','Point your fingertip at the glowing line and trace along it, in either direction.'],['STAY ACCURATE','Keep close to the line. Accurate tracing earns CLEAN or PERFECT bonus points.'],['COMPLETE THE CHALLENGE','Finish the eight paths in sequence and build your chain for higher scores. SKIP is always available.']],assisted:[['Follow the path','Move your mouse along the line, or drag your finger on the screen.'],['Stay accurate','Trace smoothly in either direction. Accuracy earns CLEAN or PERFECT bonus points.'],['Build your chain','Complete the paths in sequence for more points. Use SKIP to move on; no keyboard movement is supported.']]},
 SLASH: {note:'Two minutes of crystal formations. A 10-hit combo triggers FRACTURE STORM. OVERLOAD intensifies the final 20 seconds.',title:'DESTRUCTION',subtitle:'SLASH THE CRYSTALS',assistedLabel:'Mouse / touch',steps:[['SWIPE YOUR HAND','Swipe quickly through glowing crystals to slice them apart. Fast, deliberate movement beats slow hovering.'],['BUILD COMBOS','Slice crystals in succession to increase your score and multiplier.'],['WATCH THE SPECIALS','Bonus crystals score more. Splitting crystals break into smaller targets for extra cuts.']],assisted:[['Swipe through','Hold and drag quickly through crystals with your mouse, or swipe with your finger.'],['Build combos','Consecutive cuts increase your score and multiplier. No keyboard movement is supported.'],['Watch the specials','Bonus crystals score more; splitting crystals create smaller targets. Cut through the formations.']]},
 LAUNCH: {note:'Bank shots and bonus targets earn extra points. Open-hand movement pushes balls; direction and momentum shape every throw.',title:'KINETIC',subtitle:'REACH → CLOSE FIST → HOLD → OPEN HAND TO THROW',steps:[['FIND A BALL','Point and push forward to create a ball, then move near it. An open-palm push also moves nearby balls.'],['CLOSE YOUR FIST','Move near a ball, then close your fist. The glowing indicator marks your single grab candidate.'],['THROW AT TARGETS','Move while holding to aim, then open your hand to throw. Hit targets to earn points.']],assisted:[['Create a ball','Tap / click empty space to create. Press C when not holding a ball to create at the keyboard cursor.'],['Grab one ball','Press near a highlighted ball and hold. Arrow keys / WASD move; hold Space to grab.'],['Aim and release','Move, then release your pointer or Space to throw at targets for points. Direction and speed set the shot.']]}
});
export const INSTRUCTION_DEMOS=Object.freeze({
 ENERGY_RUSH:{scene:'energy',captions:['COLLECT THE LIGHT','DODGE THE DANGER']},
 FLOW:{scene:'flow',path:'M100 130C120 20 220 30 230 105S335 190 370 65',captions:['TRACE THE LINE','LEAVE A LIGHT TRAIL']},
 SLASH:{scene:'slash',captions:['SWIPE FAST','CUT THROUGH','BUILD A COMBO']},
 LAUNCH:{scene:'launch',captions:['REACH','CLOSE FIST','HOLD','OPEN TO THROW']},
});
export function getGameInstructions(gameId, assisted=false) {
 const config=GAME_INSTRUCTIONS[gameId];
 if(!config)throw new Error(`Unknown instruction game: ${gameId}`);
 const note=assisted&&gameId==='ENERGY_RUSH'?'90 seconds, or until all three shields are lost. Keyboard / touch skips body calibration. ENERGY FEVER intensifies the arena; assisted bests stay separate.':config.note;
 return {...config,note,steps:assisted?config.assisted:config.steps};
}

// Camera availability and tracker detection are deliberately separate claims.
export function instructionReadiness(gameId,assisted,ready,camera={}) {
 if(assisted)return `${GAME_INSTRUCTIONS[gameId].assistedLabel||'Keyboard / touch'} ready. Camera optional.`;
 if(camera.error)return `${camera.error} Choose ${GAME_INSTRUCTIONS[gameId].assistedLabel||'keyboard / touch'} to play without a camera.`;
 if(camera.status==='loading')return 'Waiting for camera permission. You can choose another input method.';
 if(camera.trackingError)return `${camera.trackingError} Choose another input method to play.`;
 if(camera.status==='ready'){
  if(camera.trackingStatus==='loading')return 'Camera connected. Preparing tracking…';
  if(ready&&['tracking','drawing'].includes(camera.trackingStatus))return gameId==='ENERGY_RUSH'?'Body detected. START GAME calibrates your comfortable range.':'Hand detected. Ready to start.';
  return gameId==='ENERGY_RUSH'?'Camera connected. Waiting for fresh body tracking.':'Camera connected. Raise your hand into view.';
 }
 return `Enable camera or choose ${GAME_INSTRUCTIONS[gameId].assistedLabel||'keyboard / touch'} to begin.`;
}
