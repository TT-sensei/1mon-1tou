// 教科モンスターバトル：カードカタログ
// catalog.json の180体を元に、モンスター×得意教科×エフェクト×背景を組み合わせて生成。
// 180体 × 3教科 × 3エフェクト × 8背景 = 12,960種類。
// 既存localStorageの27IDは互換カードとして残す。
const SUBJECTS=['国語','算数','理科','社会','英語','生活'];
const BACKGROUNDS=['sunset','starry-sky','waterfall','grassland','hill','volcano','forest','palace'];
const EFFECTS=['normal','holo','rainbow'];
const LEGACY=[
['purun-slime','purun-little-magic-slime','算数'],['purun-slime-kokugo','purun-little-magic-slime','国語'],['purun-slime-rika','purun-little-magic-slime','理科'],
['komorin-bat','komorin-little-night-bat','国語'],['komorin-bat-sansu','komorin-little-night-bat','算数'],['komorin-bat-shakai','komorin-little-night-bat','社会'],
['kinoko','kinoko-apple-mushroom','生活'],['kinoko-rika','kinoko-apple-mushroom','理科'],['kinoko-kokugo','kinoko-apple-mushroom','国語'],
['cave-wolf','mofu-wolf-frost-pup','理科'],['cave-wolf-eigo','mofu-wolf-frost-pup','英語'],['cave-wolf-sansu','mofu-wolf-frost-pup','算数'],
['forest-goblin','root-tangle-goblin','社会'],['forest-goblin-kokugo','root-tangle-goblin','国語'],['forest-goblin-rika','root-tangle-goblin','理科'],
['candy-slug','candy-coral-slug','英語'],['candy-slug-sansu','candy-coral-slug','算数'],['candy-slug-kokugo','candy-coral-slug','国語'],
['cogwheel','cogwheel-beetle','算数'],['cogwheel-rika','cogwheel-beetle','理科'],['cogwheel-shakai','cogwheel-beetle','社会'],
['slime-king','aqua-slime-king','国語'],['slime-king-shakai','aqua-slime-king','社会'],['slime-king-sansu','aqua-slime-king','算数'],
['flame-dragon','crimson-inferno-dragon','理科'],['flame-dragon-sansu','crimson-inferno-dragon','算数'],['flame-dragon-shakai','crimson-inferno-dragon','社会']
];
function makeCard(m,subject,effect,background,id){return {id:id||m.id+'__'+subject+'__'+effect+'__'+background,name:m.name,monsterId:m.id,rarity:m.rank==='boss'?'boss':m.rank==='evolved'?'rare':'normal',rank:m.rank,subject,effect,background}}
const cards=[];
(window.BATTLE_MONSTERS||[]).forEach(m=>{
  const start=SUBJECTS.indexOf(m.subject);
  const subjects=[0,2,4].map(n=>SUBJECTS[(start+n)%SUBJECTS.length]);
  subjects.forEach(subject=>EFFECTS.forEach(effect=>BACKGROUNDS.forEach(background=>cards.push(makeCard(m,subject,effect,background)))));
});
const legacyCards=LEGACY.map(([id,monsterId,subject])=>makeCard((window.BATTLE_MONSTERS||[]).find(m=>m.id===monsterId)||{id:monsterId,name:monsterId,rank:'zako'},subject,'normal',(monsterId==='aqua-slime-king'||monsterId==='crimson-inferno-dragon')?'palace':'forest',id));
window.BATTLE_CARDS=[...legacyCards,...cards];
window.getBattleCard=function(id){return (window.BATTLE_CARDS||[]).find(card=>card.id===id)||null};
