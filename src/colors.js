export const colors = [['Red','#ff354e'],['Orange','#ff873b'],['Yellow','#ffd84a'],['Green','#5fffa4'],['Blue','#4d9fff'],['Purple','#b06aff']];
export function shade(hex,amount){const rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));return '#'+rgb.map(v=>Math.round(amount>=0?v+(255-v)*amount:v*(1+amount)).toString(16).padStart(2,'0')).join('');}
export function matterPalette(color){return {color,faces:[.12,-.58,-.18,-.72,-.4,.42].map(n=>shade(color,n)),dark:shade(color,-.85),bright:shade(color,.65)};}
