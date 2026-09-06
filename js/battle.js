import { QuestionPool, AnswerChecker, ScoreManager } from 'https://tt-sensei.github.io/edu-components/index.js';

let active = null;
const pick = (list) => list[Math.floor(Math.random() * list.length)];

function cardFromId(id) {
  const card = (window.BATTLE_CARDS || []).find((item) => item.id === id || item.monsterId === id);
  const monsterId = card?.monsterId || id;
  const monster = (window.BATTLE_MONSTERS || []).find((item) => item.id === monsterId);
  if (!monster) return null;
  return { ...monster, ...(card || {}), id: card?.id || monster.id, monsterId: monster.id, src: monster.src, name: card?.name || monster.name };
}

function normalizeTeam(team) {
  const ids = Array.isArray(team) ? team : [];
  const normalized = ids.map((item) => typeof item === 'string' ? cardFromId(item) : cardFromId(item?.id || item?.monsterId)).filter(Boolean);
  return normalized.length ? normalized.slice(0, 3) : ['purun-slime', 'komorin-bat', 'kinoko'].map(cardFromId).filter(Boolean);
}

function subjectMonster(subject, index) {
  const all = window.BATTLE_MONSTERS || [];
  const rank = index === 0 ? 'zako' : index === 1 ? 'evolved' : 'boss';
  const same = all.filter((m) => m.rank === rank && m.subject === subject);
  const rankOnly = all.filter((m) => m.rank === rank);
  return pick(same.length ? same : rankOnly.length ? rankOnly : all);
}

function render() {
  document.getElementById('battleScreen').innerHTML = `<div class="battle-shell">
    <aside class="battle-side"><div class="panel"><div class="battle-side-title">🃏 じぶんのチーム</div><div id="battleTeam" class="battle-team"></div></div>
    <button id="battleQuit" class="btn small" style="width:100%;margin-top:12px">← やめる</button></aside>
    <section class="battle-arena"><div class="battle-top"><span id="battleProgress">1 / 3</span><span id="battleSubject"></span></div>
    <div class="battle-fighters"><div class="fighter player-fighter"><div class="fighter-label">じぶんのカード</div><div id="playerCard" class="fighter-card"><img id="playerImg" alt=""><b id="playerName"></b></div></div><div class="vs">VS</div>
    <div class="fighter"><div class="fighter-label enemy-label">モンスター</div><img id="enemyImg" class="enemy-img" alt=""><b id="enemyName" class="enemy-name"></b></div></div>
    <div class="enemy-hp"><div><b id="enemyHpName">モンスター</b><span><b id="enemyHp">1</b> / <b id="enemyMax">1</b></span></div><div class="hp-track"><i id="enemyBar"></i></div></div>
    <div id="battleFeedback" class="battle-feedback" aria-live="polite"></div></section>
    <section class="panel battle-question"><span id="questionBadge" class="battle-badge"></span><div id="questionText" class="battle-qtext"></div><div id="questionHint" class="battle-hint"></div><div id="questionChoices" class="battle-choices"></div><p class="battle-help">正解するとカードが攻撃！ まちがえてもヒントを見て再挑戦できます。</p></section>
    <div id="battleResult" class="battle-result" hidden><div class="battle-result-box"><div id="resultEmoji" style="font-size:58px"></div><h2 id="resultTitle"></h2><p id="resultText"></p><button id="resultHome" class="btn primary">ホームへ</button></div></div>
  </div>`;
}

function drawTeam() {
  const el = document.getElementById('battleTeam');
  el.innerHTML = active.team.map((c, i) => `<div class="battle-mini ${i === active.cardIndex ? 'active' : ''}"><img src="${c.src}" alt="${c.name}"><div><b>${c.name}</b><small>${i === active.cardIndex ? '出撃中' : '待機'}</small></div></div>`).join('');
  const c = active.team[active.cardIndex];
  document.getElementById('playerImg').src = c.src;
  document.getElementById('playerImg').alt = c.name;
  document.getElementById('playerName').textContent = c.name;
}

function drawMonster() {
  const m = active.monster;
  document.getElementById('battleProgress').textContent = `${active.monsterIndex + 1} / 3`;
  document.getElementById('battleSubject').textContent = active.subject;
  document.getElementById('enemyImg').src = m.src;
  document.getElementById('enemyImg').alt = m.name;
  document.getElementById('enemyName').textContent = m.name;
  document.getElementById('enemyHpName').textContent = m.name;
  document.getElementById('enemyHp').textContent = m.hp;
  document.getElementById('enemyMax').textContent = m.hp;
  document.getElementById('enemyBar').style.width = '100%';
}

function feedback(text, type) {
  const el = document.getElementById('battleFeedback');
  el.className = `battle-feedback ${type} show`;
  el.textContent = text;
  setTimeout(() => el.classList.remove('show'), 650);
}

function nextQuestion() {
  if (!active?.running) return;
  let q = active.pool.next();
  if (!q) {
    active.pool.reset();
    q = active.pool.next();
  }
  if (!q) return finish(false);
  active.question = q;
  document.getElementById('questionBadge').textContent = `${active.grade}年・${active.subject}`;
  document.getElementById('questionText').textContent = q.question || '';
  document.getElementById('questionHint').textContent = q.hint || 'ヒント：問題をもう一度ゆっくり読もう。';
  document.getElementById('questionHint').classList.remove('show');
  const choices = Array.isArray(q.choices) ? q.choices : [];
  document.getElementById('questionChoices').innerHTML = choices.map((c, i) => `<button class="battle-choice" data-index="${i}">${c}</button>`).join('');
  active.locked = false;
}

function animate(cls, target) {
  if (!target) return;
  target.classList.remove(cls);
  void target.offsetWidth;
  target.classList.add(cls);
}

function answer(index) {
  if (!active || active.locked || !active.running) return;
  const q = active.question;
  const selected = q.choices?.[index];
  if (selected === undefined) return;
  active.locked = true;
  document.querySelectorAll('.battle-choice').forEach((b) => { b.disabled = true; });
  const correct = active.checker.check(selected, q.answer, { detail: { questionId: q.id, grade: active.grade, subject: active.subject } });

  if (correct) {
    active.score.correct(10);
    active.onPoints(10);
    feedback('せいかい！', 'good');
    animate('attack', document.getElementById('playerCard'));
    setTimeout(() => animate('hit', document.getElementById('enemyImg')), 170);
    const damage = active.monster.subject === active.subject ? 2 : 1;
    active.hp = Math.max(0, active.hp - damage);
    document.getElementById('enemyHp').textContent = active.hp;
    document.getElementById('enemyBar').style.width = `${(active.hp / active.monster.hp) * 100}%`;
    if (damage === 2) feedback('こうかばつぐん！ 2ダメージ！', 'great');
    if (active.hp <= 0) {
      document.getElementById('enemyImg').classList.add('defeat');
      setTimeout(() => {
        if (!active?.running) return;
        active.monsterIndex += 1;
        if (active.monsterIndex >= 3) finish(true);
        else {
          active.monster = subjectMonster(active.subject, active.monsterIndex);
          if (!active.monster) return finish(false);
          active.hp = active.monster.hp;
          active.cardIndex = active.monsterIndex % active.team.length;
          drawTeam();
          drawMonster();
          nextQuestion();
        }
      }, 650);
    } else {
      setTimeout(nextQuestion, 520);
    }
  } else {
    active.score.wrong(0);
    active.onWrong(q);
    feedback('もう一度！', 'bad');
    animate('hurt', document.getElementById('playerCard'));
    document.getElementById('questionHint').classList.add('show');
    setTimeout(() => {
      if (!active?.running) return;
      active.locked = false;
      document.querySelectorAll('.battle-choice').forEach((b) => { b.disabled = false; });
    }, 550);
  }
}

function finish(win) {
  if (!active) return;
  active.running = false;
  active.locked = true;
  if (win) active.onPoints(20);
  const r = document.getElementById('battleResult');
  r.hidden = false;
  document.getElementById('resultEmoji').textContent = win ? '🏆' : '📖';
  document.getElementById('resultTitle').textContent = win ? 'バトルクリア！' : 'バトル終了';
  document.getElementById('resultText').textContent = win ? `3体撃破！ 正解 ${active.score.correctCount}問　+20P` : '問題データを確認して、もう一度挑戦しよう。';
  document.getElementById('resultHome').onclick = () => active?.onHome();
}

export function startBattle({ grade, subject, questions, team, onPoints, onWrong, onHome }) {
  stopBattle();
  const normalizedTeam = normalizeTeam(team);
  const usableQuestions = Array.isArray(questions) ? questions.filter((q) => Array.isArray(q.choices) && q.choices.length > 0) : [];
  if (!usableQuestions.length) {
    onHome?.();
    return;
  }
  render();
  active = {
    grade, subject, team: normalizedTeam, onPoints, onWrong, onHome,
    monsterIndex: 0, monster: subjectMonster(subject, 0), hp: 0, question: null,
    locked: false, running: true, cardIndex: 0,
    pool: new QuestionPool(usableQuestions, { mode: 'random' }),
    checker: new AnswerChecker({ eventTarget: window }),
    score: new ScoreManager({ eventTarget: window })
  };
  if (!active.monster) return finish(false);
  active.hp = active.monster.hp;
  drawTeam();
  drawMonster();
  nextQuestion();
  document.getElementById('battleQuit').onclick = onHome;
  document.getElementById('questionChoices').addEventListener('click', (e) => {
    const button = e.target.closest('.battle-choice');
    if (button) answer(Number(button.dataset.index));
  });
}

export function stopBattle() { active = null; }
export function getBattleState() { return active; }
