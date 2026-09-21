// 教科モンスターバトル：カード定義
// monsterId = 同じナビアン本体。
// subject = このカードの「得意な教科」。モンスター側の弱点(subject)とは別管理。
// 同じナビアンでも、得意な教科が違うカードを持てる設計。

window.BATTLE_CARDS = [
  {id:'purun-slime',name:'ぷるんスライム',monsterId:'purun-slime',rarity:'normal',subject:'算数'},
  {id:'purun-slime-kokugo',name:'ぷるんスライム',monsterId:'purun-slime',rarity:'normal',subject:'国語'},
  {id:'purun-slime-rika',name:'ぷるんスライム',monsterId:'purun-slime',rarity:'normal',subject:'理科'},

  {id:'komorin-bat',name:'こもりんバット',monsterId:'komorin-bat',rarity:'normal',subject:'国語'},
  {id:'komorin-bat-sansu',name:'こもりんバット',monsterId:'komorin-bat',rarity:'normal',subject:'算数'},
  {id:'komorin-bat-shakai',name:'こもりんバット',monsterId:'komorin-bat',rarity:'normal',subject:'社会'},

  {id:'kinoko',name:'きのこっこ',monsterId:'kinoko',rarity:'normal',subject:'生活'},
  {id:'kinoko-rika',name:'きのこっこ',monsterId:'kinoko',rarity:'normal',subject:'理科'},
  {id:'kinoko-kokugo',name:'きのこっこ',monsterId:'kinoko',rarity:'normal',subject:'国語'},

  {id:'cave-wolf',name:'ケイブウルフ',monsterId:'cave-wolf',rarity:'rare',subject:'理科'},
  {id:'cave-wolf-eigo',name:'ケイブウルフ',monsterId:'cave-wolf',rarity:'rare',subject:'英語'},
  {id:'cave-wolf-sansu',name:'ケイブウルフ',monsterId:'cave-wolf',rarity:'rare',subject:'算数'},

  {id:'forest-goblin',name:'フォレストゴブリン',monsterId:'forest-goblin',rarity:'rare',subject:'社会'},
  {id:'forest-goblin-kokugo',name:'フォレストゴブリン',monsterId:'forest-goblin',rarity:'rare',subject:'国語'},
  {id:'forest-goblin-rika',name:'フォレストゴブリン',monsterId:'forest-goblin',rarity:'rare',subject:'理科'},

  {id:'candy-slug',name:'キャンディスラッグ',monsterId:'candy-slug',rarity:'normal',subject:'英語'},
  {id:'candy-slug-sansu',name:'キャンディスラッグ',monsterId:'candy-slug',rarity:'normal',subject:'算数'},
  {id:'candy-slug-kokugo',name:'キャンディスラッグ',monsterId:'candy-slug',rarity:'normal',subject:'国語'},

  {id:'cogwheel',name:'コグホイール',monsterId:'cogwheel',rarity:'rare',subject:'算数'},
  {id:'cogwheel-rika',name:'コグホイール',monsterId:'cogwheel',rarity:'rare',subject:'理科'},
  {id:'cogwheel-shakai',name:'コグホイール',monsterId:'cogwheel',rarity:'rare',subject:'社会'},

  {id:'slime-king',name:'スライムキング',monsterId:'slime-king',rarity:'boss',subject:'国語'},
  {id:'slime-king-shakai',name:'スライムキング',monsterId:'slime-king',rarity:'boss',subject:'社会'},
  {id:'slime-king-sansu',name:'スライムキング',monsterId:'slime-king',rarity:'boss',subject:'算数'},

  {id:'flame-dragon',name:'フレイムドラゴン',monsterId:'flame-dragon',rarity:'boss',subject:'理科'},
  {id:'flame-dragon-sansu',name:'フレイムドラゴン',monsterId:'flame-dragon',rarity:'boss',subject:'算数'},
  {id:'flame-dragon-shakai',name:'フレイムドラゴン',monsterId:'flame-dragon',rarity:'boss',subject:'社会'}
];

window.getBattleCard=function(id){
  return (window.BATTLE_CARDS||[]).find(card=>card.id===id)||null;
};
