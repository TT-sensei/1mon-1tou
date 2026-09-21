// 教科モンスターバトル：ナビアン（ナビキャラ）
const NAVI_BASE='https://tt-sensei.github.io/navi-character-/assets/web/characters';
window.BATTLE_CARDS=[
{id:'riku',name:'りく',subject:'国語',rarity:'normal',naviSrc:NAVI_BASE+'/riku/expressions/01-normal-smile.webp'},
{id:'sora',name:'そら',subject:'算数',rarity:'normal',naviSrc:NAVI_BASE+'/sora/expressions/01-normal-smile.webp'},
{id:'kai',name:'かい',subject:'理科',rarity:'rare',naviSrc:NAVI_BASE+'/kai/expressions/01-normal-smile.webp'},
{id:'saku',name:'さく',subject:'社会',rarity:'normal',naviSrc:NAVI_BASE+'/saku/expressions/01-normal-smile.webp'},
{id:'tsuki',name:'つき',subject:'英語',rarity:'rare',naviSrc:NAVI_BASE+'/tsuki/expressions/01-normal-smile.webp'},
{id:'nami',name:'なみ',subject:'生活',rarity:'normal',naviSrc:NAVI_BASE+'/nami/expressions/01-normal-smile.webp'}
];
window.getBattleCard=function(id){return (window.BATTLE_CARDS||[]).find(card=>card.id===id)||null};