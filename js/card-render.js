const BASE='https://tt-sensei.github.io/1mon-1tou/assets/cards';
const NAVI='https://tt-sensei.github.io/navi-character-/assets/web/fantasy/monsters';
const REMOTE_MONSTERS={
  'purun-slime':`${NAVI}/zako/purun-little-magic-slime.webp`,
  'komorin-bat':`${NAVI}/zako/komorin-little-night-bat.webp`,
  'kinoko':`${NAVI}/zako/kinoko-apple-mushroom.webp`,
  'cave-wolf':`${NAVI}/zako/mofu-wolf-frost-pup.webp`,
  'forest-goblin':`${NAVI}/zako/root-tangle-goblin.webp`,
  'candy-slug':`${NAVI}/zako/candy-coral-slug.webp`,
  'cogwheel':`${NAVI}/zako/cogwheel-beetle.webp`
};
const BG={zako:['forest.jpeg','grassland.jpeg','hill.jpeg','stars.jpeg','sunset.jpeg','waterfall.jpeg'],boss:['palace.jpeg','sacred-place.jpeg','volcano.jpeg']};
const escapeHtml=(value='')=>String(value).replace(/[&<>\"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
function rankKey(card){return card?.rank==='boss'||card?.rarity==='boss'?'boss':'zako'}
function backgroundFor(card){const list=BG[rankKey(card)];const index=Math.abs(String(card?.id||'').split('').reduce((n,c)=>n+c.charCodeAt(0),0))%list.length;return `${BASE}/backgrounds/${rankKey(card)}/${list[index]}`}
function frameFor(card){return `${BASE}/frames/${rankKey(card)==='boss'?'boss':card?.rank==='evolved'?'zako-evolved':'zako'}.png`}
export function cardImage(card){return REMOTE_MONSTERS[card?.monsterId||card?.id]||card?.src||''}
export function renderCard(card,{className='',showInfo=true,selected=false,mini=false}={}){
  const name=escapeHtml(card?.name||'モンスター');
  const rarity=card?.rarity==='boss'?'BOSS':card?.rarity==='rare'?'RARE':card?.rank==='evolved'?'EVOLVED':'NORMAL';
  const image=escapeHtml(cardImage(card));
  const bg=escapeHtml(backgroundFor(card));
  const frame=escapeHtml(frameFor(card));
  return `<div class="battle-card ${className} ${selected?'is-selected':''} ${mini?'is-mini':''}"><div class="card-art"><img class="card-bg" src="${bg}" alt=""><div class="card-glow"></div><img class="card-monster" src="${image}" alt="${name}" loading="lazy"><img class="card-frame" src="${frame}" alt=""></div>${showInfo?`<div class="card-info"><span class="card-rarity">${rarity}</span><b>${name}</b></div>`:''}</div>`;
}
