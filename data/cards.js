// 教科モンスターバトル：カード定義
// カードはモンスター定義を直接変更せず、カード側の表示・成長データを追加できる構成にする。
window.BATTLE_CARDS = [
  {id:'purun-slime',name:'ぷるんスライム',monsterId:'purun-slime',rarity:'normal'},
  {id:'komorin-bat',name:'こもりんバット',monsterId:'komorin-bat',rarity:'normal'},
  {id:'kinoko',name:'きのこっこ',monsterId:'kinoko',rarity:'normal'},
  {id:'cave-wolf',name:'ケイブウルフ',monsterId:'cave-wolf',rarity:'rare'},
  {id:'forest-goblin',name:'フォレストゴブリン',monsterId:'forest-goblin',rarity:'rare'},
  {id:'candy-slug',name:'キャンディスラッグ',monsterId:'candy-slug',rarity:'normal'},
  {id:'cogwheel',name:'コグホイール',monsterId:'cogwheel',rarity:'rare'},
  {id:'slime-king',name:'スライムキング',monsterId:'slime-king',rarity:'boss'},
  {id:'flame-dragon',name:'フレイムドラゴン',monsterId:'flame-dragon',rarity:'boss'}
];
window.getBattleCard=function(id){return (window.BATTLE_CARDS||[]).find(card=>card.id===id)||null};
