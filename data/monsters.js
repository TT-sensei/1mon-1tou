// 教科モンスターバトル：敵モンスター定義
window.BATTLE_MONSTERS = [
  { id:'purun-slime', name:'ぷるんスライム', rank:'zako', hp:1, src:'assets/monsters/purun-slime.svg', subject:'算数' },
  { id:'komorin-bat', name:'こもりんバット', rank:'zako', hp:1, src:'assets/monsters/komorin-bat.svg', subject:'国語' },
  { id:'kinoko', name:'きのこっこ', rank:'zako', hp:1, src:'assets/monsters/kinoko.svg', subject:'生活' },
  { id:'cave-wolf', name:'ケイブウルフ', rank:'evolved', hp:2, src:'assets/monsters/cave-wolf.svg', subject:'理科' },
  { id:'forest-goblin', name:'フォレストゴブリン', rank:'evolved', hp:2, src:'assets/monsters/forest-goblin.svg', subject:'社会' },
  { id:'candy-slug', name:'キャンディスラッグ', rank:'zako', hp:1, src:'assets/monsters/candy-slug.svg', subject:'英語' },
  { id:'cogwheel', name:'コグホイール', rank:'evolved', hp:2, src:'assets/monsters/cogwheel.svg', subject:'算数' },
  { id:'slime-king', name:'スライムキング', rank:'boss', hp:3, src:'assets/monsters/slime-king.svg', subject:'国語' },
  { id:'flame-dragon', name:'フレイムドラゴン', rank:'boss', hp:3, src:'assets/monsters/flame-dragon.svg', subject:'理科' }
];
window.getBattleMonster = function(index){
  const list = window.BATTLE_MONSTERS || [];
  return list[index % list.length] || null;
};