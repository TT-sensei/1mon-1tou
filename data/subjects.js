// 教科モンスターバトル：教科定義
// 教科追加・変更はここだけを編集する設計。
window.GAME_SUBJECTS = {
  国語: { id: 'japanese', grades: [1,2,3,4,5,6], icon: '📖' },
  算数: { id: 'math', grades: [1,2,3,4,5,6], icon: '🔢' },
  生活: { id: 'life', grades: [1,2], icon: '🌱' },
  理科: { id: 'science', grades: [3,4,5,6], icon: '🔬' },
  社会: { id: 'social', grades: [3,4,5,6], icon: '🗺️' },
  英語: { id: 'english', grades: [3,4,5,6], icon: '🔤' }
};
window.getSubjectsForGrade = function(grade) {
  return Object.keys(window.GAME_SUBJECTS).filter(name => window.GAME_SUBJECTS[name].grades.includes(grade));
};
window.getRandomSubjectLabel = function(grade) {
  const list = window.getSubjectsForGrade(grade);
  return list[Math.floor(Math.random() * list.length)];
};

/*
 * バトル表示補強
 * index.html の既存ゲームロジックを壊さず、ここから見た目だけを拡張する。
 * 「自分のカード VS あいてのモンスター」が常に画面に見えることを最優先。
 */
(function () {
  const MONSTERS = [
    { key: 'ぷるんスライム', src: 'assets/monsters/purun-slime.svg' },
    { key: 'こもりん', src: 'assets/monsters/komorin-bat.svg' },
    { key: 'こもりんバット', src: 'assets/monsters/komorin-bat.svg' },
    { key: 'きのこっこ', src: 'assets/monsters/kinoko.svg' },
    { key: 'もふウルフ', src: 'assets/monsters/cave-wolf.svg' },
    { key: 'ケイブウルフ', src: 'assets/monsters/cave-wolf.svg' },
    { key: '森ゴブリン', src: 'assets/monsters/forest-goblin.svg' },
    { key: 'フォレストゴブリン', src: 'assets/monsters/forest-goblin.svg' },
    { key: 'キャンディスラッグ', src: 'assets/monsters/candy-slug.svg' },
    { key: 'キャンディスラッグ', src: 'assets/monsters/candy-slug.svg' },
    { key: 'コグホイール', src: 'assets/monsters/cogwheel.svg' },
    { key: 'スライムキング', src: 'assets/monsters/slime-king.svg' },
    { key: 'フレイムドラゴン', src: 'assets/monsters/flame-dragon.svg' }
  ];

  function injectStyle() {
    if (document.getElementById('card-vs-monster-style')) return;
    const style = document.createElement('style');
    style.id = 'card-vs-monster-style';
    style.textContent = `
      .arena.card-vs-monster { min-height: 590px; }
      .battle-stage { flex:1; display:grid; grid-template-columns:minmax(115px, .7fr) minmax(190px, 1.3fr); gap:12px; align-items:center; min-height:390px; }
      .player-side { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; min-width:0; }
      .player-label { padding:6px 12px; border:2px solid #7fd6ff; border-radius:99px; background:#174764cc; font-size:12px; font-weight:1000; white-space:nowrap; }
      .player-card-battle { position:relative; width:min(145px, 92%); aspect-ratio:3/4; border-radius:16px; overflow:hidden; background:linear-gradient(145deg,#263957,#111a2a); border:3px solid #7fd6ff; box-shadow:0 12px 30px #0009,0 0 24px #3bb8ff33; transform-origin:center right; }
      .player-card-battle img { width:100%; height:100%; object-fit:contain; padding:8%; filter:drop-shadow(0 8px 7px #0009); }
      .player-card-battle .pcopy { position:absolute; left:7px; right:7px; bottom:7px; padding:5px 6px; border-radius:9px; background:#07101dcc; text-align:center; font-size:11px; font-weight:1000; text-shadow:0 2px 3px #000; }
      .player-card-battle.attacking { animation:cardAttack .42s ease-in-out; }
      .player-card-battle.hurt { animation:cardHurt .32s ease-in-out; }
      .monster-wrap.card-enemy-side { min-width:0; min-height:300px; }
      .monster-wrap.card-enemy-side .monster { width:min(100%,330px); max-height:330px; }
      .enemy-side-caption { position:absolute; left:50%; bottom:6px; transform:translateX(-50%); padding:5px 9px; border-radius:99px; background:#050a1299; color:#fff; font-size:10px; font-weight:900; white-space:nowrap; }
      @keyframes cardAttack { 35%{ transform:translateX(28px) rotate(5deg) scale(1.05); filter:brightness(1.3); } 70%{ transform:translateX(-3px) rotate(-1deg); } }
      @keyframes cardHurt { 25%{ transform:translateX(-8px) rotate(-4deg); } 50%{ transform:translateX(7px) rotate(4deg); } 75%{ transform:translateX(-4px); } }
      @media(max-width:560px){
        .arena.card-vs-monster{min-height:430px}
        .battle-stage{grid-template-columns:105px minmax(150px,1fr);gap:7px;min-height:270px}
        .player-card-battle{width:92px}
        .player-label{font-size:10px;padding:5px 8px}
        .monster-wrap.card-enemy-side .monster{max-height:245px}
      }
    `;
    document.head.appendChild(style);
  }

  function findMonsterSrc(name) {
    const text = String(name || '');
    const hit = MONSTERS.find(m => text.includes(m.key));
    if (hit) return hit.src;
    return null;
  }

  function ensureEnemyImage() {
    const img = document.getElementById('monsterImg');
    const nameEl = document.getElementById('monsterName');
    if (!img) return;
    const mapped = findMonsterSrc(nameEl && nameEl.textContent);
    if (mapped && (!img.getAttribute('src') || img.getAttribute('src') !== mapped)) {
      img.src = mapped;
    }
    if (!img.getAttribute('src')) {
      img.src = MONSTERS[Math.floor(Math.random() * MONSTERS.length)].src;
    }
    img.onerror = function () {
      const fallback = MONSTERS.find(m => m.src !== img.getAttribute('src')) || MONSTERS[0];
      if (img.getAttribute('src') !== fallback.src) img.src = fallback.src;
    };
    img.setAttribute('data-battle-image-ready', '1');
  }

  function getActiveMini() {
    const minis = [...document.querySelectorAll('#miniTeam .mini')];
    return minis.find(el => el.classList.contains('active')) || minis[0] || null;
  }

  function renderPlayerCard() {
    const arena = document.querySelector('#battleScreen .arena');
    const mini = getActiveMini();
    if (!arena || !mini) return;
    const source = mini.querySelector('img');
    if (!source || !source.src) return;

    let stage = arena.querySelector('.battle-stage');
    let playerSide = arena.querySelector('.player-side');
    const monsterWrap = arena.querySelector('.monster-wrap');
    if (!monsterWrap) return;

    if (!stage) {
      stage = document.createElement('div');
      stage.className = 'battle-stage';
      monsterWrap.parentNode.insertBefore(stage, monsterWrap);
      stage.appendChild(monsterWrap);
    }
    if (!playerSide) {
      playerSide = document.createElement('div');
      playerSide.className = 'player-side';
      playerSide.innerHTML = '<div class="player-label">じぶんのカード</div><div class="player-card-battle"><img alt="じぶんのカード"><div class="pcopy">カード</div></div>';
      stage.insertBefore(playerSide, monsterWrap);
    }

    const card = playerSide.querySelector('.player-card-battle');
    const img = card && card.querySelector('img');
    const copy = card && card.querySelector('.pcopy');
    if (img && img.src !== source.src) img.src = source.src;
    if (copy) copy.textContent = (mini.querySelector('b') && mini.querySelector('b').textContent) || 'カード';
    arena.classList.add('card-vs-monster');
    monsterWrap.classList.add('card-enemy-side');
    if (!monsterWrap.querySelector('.enemy-side-caption')) {
      const cap = document.createElement('div');
      cap.className = 'enemy-side-caption';
      cap.textContent = 'モンスター';
      monsterWrap.appendChild(cap);
    }
    ensureEnemyImage();
  }

  function animatePlayer(type) {
    const card = document.querySelector('.player-card-battle');
    const monster = document.getElementById('monsterImg');
    if (!card) return;
    card.classList.remove('attacking','hurt');
    void card.offsetWidth;
    card.classList.add(type === 'hurt' ? 'hurt' : 'attacking');
    if (type !== 'hurt' && monster) {
      setTimeout(() => { monster.classList.remove('hit'); void monster.offsetWidth; monster.classList.add('hit'); }, 180);
    }
  }

  function init() {
    injectStyle();
    const battle = document.getElementById('battleScreen');
    if (!battle) return;

    const refresh = () => {
      if (battle.classList.contains('active')) {
        renderPlayerCard();
        ensureEnemyImage();
      }
    };

    refresh();
    new MutationObserver(refresh).observe(battle, { childList:true, subtree:true, attributes:true, attributeFilter:['class','src'] });

    const feedback = document.getElementById('feedback');
    if (feedback) {
      new MutationObserver(() => {
        const text = feedback.textContent || '';
        if (!text) return;
        if (feedback.classList.contains('good') || feedback.classList.contains('great') || /せいかい|正解|こうげき|攻撃/.test(text)) animatePlayer('attack');
        if (feedback.classList.contains('bad') || /ざんねん|残念|ちがう|もう一度/.test(text)) animatePlayer('hurt');
      }).observe(feedback, { childList:true, characterData:true, subtree:true, attributes:true, attributeFilter:['class'] });
    }

    document.addEventListener('click', (event) => {
      const answer = event.target.closest && event.target.closest('.answer-choice');
      if (answer) setTimeout(refresh, 80);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();
})();
