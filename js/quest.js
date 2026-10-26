import { StorageManager, AnswerChecker } from 'https://tt-sensei.github.io/edu-components/index.js';
import { renderCard } from './card-render.js';
import '../data/questions/all-grades.js';

const $ = (selector) => document.querySelector(selector);
const store = new StorageManager('1mon-1tou-quest');
const checker = new AnswerChecker({ eventTarget: window });
const QUESTION_CATALOG = {
  1: ['国語', '算数', '生活'],
  2: ['国語', '算数', '生活'],
  3: ['国語', '算数', '理科', '社会', '英語'],
  4: ['国語', '算数', '理科', '社会', '英語'],
  5: ['国語', '算数', '理科', '社会', '英語'],
  6: ['国語', '算数', '理科', '社会', '英語']
};
const STARTER_CARDS = ['purun-little-magic-slime', 'komorin-little-night-bat', 'kinoko-apple-mushroom'];
const SUBJECT_ICON = { '国語': '📖', '算数': '＋', '理科': '✦', '社会': '⌖', '英語': 'A', '生活': '❀' };
const RANK_NAME = { zako: 'ナビアン', evolved: 'エボナビ', boss: 'ボスナビ' };
const RECRUIT_COST = { zako: 60, evolved: 120, boss: 240 };
const monsterCatalog = Array.isArray(window.BATTLE_MONSTERS) ? window.BATTLE_MONSTERS : [];
const monsterById = new Map(monsterCatalog.map((monster) => [monster.id, monster]));
const defaults = {
  points: 0,
  owned: STARTER_CARDS.slice(),
  team: STARTER_CARDS.slice(),
  xp: {},
  review: {},
  dailyRewards: {},
  stats: { totalCorrect: 0, firstTryCorrect: 0, questsCleared: 0, masteredReview: 0, sessions: 0, wrongAttempts: 0 }
};
let state = readState();
let selectedGrade = 1;
let selectedSubject = '国語';
let runMode = 'quest';
let active = null;
let lastConfig = null;
let collectionFilter = 'all';
let collectionLimit = 24;
let collectionSearch = '';
let toastTimer = null;
let setupCounts = {};
let setupRenderId = 0;

function readState() {
  const saved = store.load('progress', null) || {};
  const validIds = new Set(monsterCatalog.map((monster) => monster.id));
  const ownedSaved = Array.isArray(saved.owned) ? saved.owned.filter((id) => validIds.has(id)) : [];
  const owned = Array.from(new Set(ownedSaved.length ? ownedSaved : STARTER_CARDS)).filter((id) => validIds.has(id)).slice(0, 180);
  const teamSaved = Array.isArray(saved.team) ? saved.team.filter((id) => owned.includes(id)) : [];
  const team = Array.from(new Set(teamSaved)).slice(0, 3);
  return {
    ...defaults,
    ...saved,
    points: Math.max(0, Number(saved.points) || 0),
    owned: owned.length ? owned : STARTER_CARDS.filter((id) => validIds.has(id)),
    team: team.length ? team : owned.slice(0, 3),
    xp: saved.xp && typeof saved.xp === 'object' ? saved.xp : {},
    review: saved.review && typeof saved.review === 'object' ? saved.review : {},
    dailyRewards: saved.dailyRewards && typeof saved.dailyRewards === 'object' ? saved.dailyRewards : {},
    stats: { ...defaults.stats, ...(saved.stats || {}) }
  };
}

function saveState() {
  store.save('progress', state);
  updateHeader();
}

function levelFor(xp) {
  return Math.min(5, 1 + Math.floor(Math.max(0, Number(xp) || 0) / 5));
}

function cardFor(id) {
  const monster = monsterById.get(id);
  if (!monster) return null;
  return {
    ...monster,
    id: monster.id,
    monsterId: monster.id,
    rarity: monster.rank === 'boss' ? 'boss' : monster.rank === 'evolved' ? 'rare' : 'normal',
    effect: 'normal',
    background: monster.rank === 'boss' ? 'palace' : monster.rank === 'evolved' ? 'hill' : 'forest'
  };
}

function teamIds() {
  const valid = state.team.filter((id) => state.owned.includes(id) && monsterById.has(id)).slice(0, 3);
  return valid.length ? valid : state.owned.filter((id) => monsterById.has(id)).slice(0, 3);
}

function updateHeader() {
  const points = String(state.points);
  const ownedCount = state.owned.length;
  if ($('#topPoints')) $('#topPoints').textContent = points;
  if ($('#topOwned')) $('#topOwned').innerHTML = ownedCount + '<small> / ' + monsterCatalog.length + '</small>';
  if ($('#statCorrect')) $('#statCorrect').textContent = String(state.stats.totalCorrect || 0);
  if ($('#statClears')) $('#statClears').textContent = String(state.stats.questsCleared || 0);
  if ($('#statCollection')) $('#statCollection').textContent = ownedCount + ' / ' + monsterCatalog.length;
  if ($('#statMistakes')) $('#statMistakes').textContent = String(Object.keys(state.review).length);
  if ($('#collectionPoints')) $('#collectionPoints').textContent = points;
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach((screen) => {
    screen.classList.toggle('active', screen.id === id);
    screen.hidden = screen.id !== id;
  });
  window.scrollTo({ top: 0, behavior: 'auto' });
  if (id === 'screen-home') renderHome();
  if (id === 'screen-training') renderTraining();
  if (id === 'screen-team') renderTeam();
  if (id === 'screen-collection') renderCollection();
  updateHeader();
}

function notify(message) {
  const el = $('#toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('show');
  if (toastTimer) window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => el.classList.remove('show'), 2200);
}

function renderHome() {
  updateHeader();
  const ids = teamIds();
  $('#heroCardStack').innerHTML = ids.map((id) => {
    const card = cardFor(id);
    return '<div class="hero-card">' + renderCard(card, { showInfo: false }) + '<span class="hero-card-name">' + card.name + '</span></div>';
  }).join('');
}

function openSetup(mode) {
  runMode = mode || 'quest';
  if (!QUESTION_CATALOG[selectedGrade]) selectedGrade = Number(Object.keys(QUESTION_CATALOG)[0]) || 1;
  showScreen('screen-setup');
  renderSetup();
}

async function loadQuestions(grade, subjectName) {
  const subject = window.GAME_SUBJECTS && window.GAME_SUBJECTS[subjectName];
  if (!subject) return [];
  const key = String(grade) + '-' + subject.id;
  if (window.QUESTION_BANK && Array.isArray(window.QUESTION_BANK[key])) {
    return window.QUESTION_BANK[key].map((q) => ({ ...q, grade: q.grade || grade, subject: q.subject || subjectName }));
  }
  try {
    await import('../data/questions/grade' + grade + '/' + subject.id + '.js');
  } catch (_) {
    return [];
  }
  const bank = window.QUESTION_BANK && window.QUESTION_BANK[key];
  return Array.isArray(bank) ? bank.map((q) => ({ ...q, grade: q.grade || grade, subject: q.subject || subjectName })) : [];
}

function createButton(label, className, attrs) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.textContent = label;
  Object.keys(attrs || {}).forEach((key) => button.setAttribute(key, attrs[key]));
  return button;
}

async function renderSetup() {
  const thisRender = ++setupRenderId;
  const gradeForRender = selectedGrade;
  const availableGrades = Object.keys(QUESTION_CATALOG).map(Number);
  $('#gradeChoices').innerHTML = '';
  availableGrades.forEach((grade) => {
    const button = createButton(grade + '年生', 'grade-choice' + (grade === gradeForRender ? ' selected' : ''), { 'data-grade': grade, 'aria-pressed': String(grade === gradeForRender) });
    const note = document.createElement('small');
    note.textContent = (QUESTION_CATALOG[grade] || []).length + '教科から選べます';
    button.appendChild(note);
    $('#gradeChoices').appendChild(button);
  });
  const names = QUESTION_CATALOG[gradeForRender] || [];
  const results = await Promise.all(names.map(async (name) => ({ name, questions: await loadQuestions(gradeForRender, name) })));
  if (thisRender !== setupRenderId || gradeForRender !== selectedGrade) return;
  setupCounts = {};
  results.forEach((result) => { setupCounts[result.name] = result.questions.length; });
  const usable = results.filter((result) => result.questions.length > 0);
  if (!usable.some((result) => result.name === selectedSubject) && selectedSubject !== '__mix') {
    selectedSubject = usable.length ? usable[0].name : '__mix';
  }
  $('#subjectChoices').innerHTML = '';
  usable.forEach((result) => {
    const button = createButton('', 'subject-choice' + (selectedSubject === result.name ? ' selected' : ''), { 'data-subject': result.name, 'aria-pressed': String(selectedSubject === result.name) });
    button.innerHTML = '<span class="subject-symbol">' + (SUBJECT_ICON[result.name] || '✦') + '</span><span>' + result.name + '</span><small>' + result.questions.length + '問</small>';
    $('#subjectChoices').appendChild(button);
  });
  const mixedCount = results.reduce((sum, result) => sum + result.questions.length, 0);
  const mixed = createButton('', 'subject-choice mix' + (selectedSubject === '__mix' ? ' selected' : ''), { 'data-subject': '__mix', 'aria-pressed': String(selectedSubject === '__mix') });
  mixed.innerHTML = '<span class="subject-symbol">✧</span><span>ミックス</span><small>全教科から出題</small>';
  $('#subjectChoices').appendChild(mixed);
  const count = selectedSubject === '__mix' ? mixedCount : (setupCounts[selectedSubject] || 0);
  const questionCount = Math.min(runMode === 'quest' ? 5 : 8, count);
  $('#setupQuestionCount').textContent = questionCount + '問';
  $('#setupModeText').textContent = runMode === 'quest' ? '・クエストバトル' : '・特訓モード';
  $('#startSetupButton').innerHTML = (runMode === 'quest' ? 'クエスト開始' : '特訓をはじめる') + ' <span class="button-arrow">→</span>';
  $('#setupMessage').textContent = count ? (gradeForRender + '年生・' + (selectedSubject === '__mix' ? 'ミックス' : selectedSubject) + 'から、' + questionCount + '問出題します。') : 'この学年には、まだ選べる問題がありません。';
  $('#startSetupButton').disabled = count < 1;
}

function shuffle(items) {
  const list = items.slice();
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

async function questionsForSetup() {
  const grade = selectedGrade;
  const selectedNames = selectedSubject === '__mix' ? (QUESTION_CATALOG[grade] || []) : [selectedSubject];
  const groups = await Promise.all(selectedNames.map(async (name) => ({ name, questions: await loadQuestions(grade, name) })));
  if (grade !== selectedGrade) return [];
  return groups.flatMap((group) => group.questions.map((q) => ({ ...q, grade: q.grade || grade, subject: q.subject || group.name })));
}

async function beginSetupRun() {
  const button = $('#startSetupButton');
  if (button.disabled) return;
  button.disabled = true;
  const startGrade = selectedGrade;
  const startSubject = selectedSubject;
  const pool = await questionsForSetup();
  if (startGrade !== selectedGrade || startSubject !== selectedSubject) {
    button.disabled = false;
    return;
  }
  if (!pool.length) {
    $('#setupMessage').textContent = '問題を読み込めませんでした。ホームにもどって、もう一度ためしてください。';
    button.disabled = false;
    return;
  }
  const limit = runMode === 'quest' ? 5 : 8;
  const questions = shuffle(pool).slice(0, Math.min(limit, pool.length));
  lastConfig = { mode: runMode, grade: selectedGrade, subject: selectedSubject };
  startRun(runMode, questions, selectedGrade, selectedSubject);
  button.disabled = false;
}

function pickEnemy(grade, subject) {
  const rank = grade <= 2 ? 'zako' : grade <= 4 ? 'evolved' : 'boss';
  let pool = monsterCatalog.filter((monster) => monster.rank === rank);
  if (subject && subject !== '__mix' && subject !== 'まちがい特訓') {
    const matching = pool.filter((monster) => monster.subject === subject);
    if (matching.length) pool = matching;
  }
  if (!pool.length) pool = monsterCatalog;
  return pool[Math.floor(Math.random() * pool.length)] || monsterCatalog[0] || null;
}

function startRun(mode, questions, grade, subject) {
  const cleanQuestions = Array.isArray(questions) ? questions.filter((q) => q && q.question && q.answer !== undefined) : [];
  if (!cleanQuestions.length) {
    notify('出題できる問題がありません。');
    return;
  }
  const selectedTeam = teamIds();
  const enemy = mode === 'quest' ? pickEnemy(grade, subject) : null;
  active = {
    mode,
    grade,
    subject,
    questions: cleanQuestions,
    index: 0,
    question: cleanQuestions[0],
    displayChoices: [],
    attempts: 0,
    locked: false,
    correctCount: 0,
    firstTryCount: 0,
    combo: 0,
    comboBonusUsed: false,
    skillUsed: [],
    team: selectedTeam,
    cardIndex: 0,
    enemy,
    enemyMaxHp: Math.max(2, cleanQuestions.length * 2),
    enemyHp: Math.max(2, cleanQuestions.length * 2),
    pointsEarned: 0,
    rewardKey: ['quest', 'practice'].includes(mode) ? (new Date().toLocaleDateString('sv-SE') + '-grade-' + grade) : null,
    rewardEligible: ['quest', 'practice'].includes(mode) && !state.dailyRewards[new Date().toLocaleDateString('sv-SE') + '-grade-' + grade],
    rewardMultiplier: Math.max(1, Math.min(3, Number(grade) || 1)),
    levelUps: [],
    masteredThisRun: 0
  };
  if (mode === 'review') {
    lastConfig = { mode: 'review' };
  } else {
    lastConfig = { mode, grade, subject };
  }
  showScreen('screen-battle');
  renderBattle();
}

function renderBattle() {
  if (!active) return;
  const isQuest = active.mode === 'quest';
  $('#battleLayout').classList.toggle('practice-layout', !isQuest);
  $('#enemyPanel').hidden = !isQuest;
  $('#practiceBuddy').hidden = isQuest;
  $('#battleModeEyebrow').textContent = isQuest ? 'NAVIAN QUEST' : 'PRACTICE STUDIO';
  $('#battleTitle').textContent = isQuest ? 'クエストバトル' : '特訓モード';
  if (isQuest && active.enemy) drawEnemy();
  drawParty();
  drawQuestion();
}

function drawEnemy() {
  if (!active || !active.enemy) return;
  const enemy = active.enemy;
  const card = cardFor(enemy.id);
  $('#enemyName').textContent = enemy.name;
  $('#enemyRank').textContent = RANK_NAME[enemy.rank] || 'ナビアン';
  $('#enemyCard').innerHTML = renderCard(card, { showInfo: true, className: active.enemyHp <= 0 ? 'enemy-defeated' : '' });
  $('#enemySubject').textContent = enemy.subject || 'とくになし';
  $('#enemyHp').textContent = String(active.enemyHp);
  $('#enemyMaxHp').textContent = String(active.enemyMaxHp);
  $('#enemyHpBar').style.width = (active.enemyHp / active.enemyMaxHp * 100) + '%';
  $('#enemyStatus').textContent = active.enemyHp <= 0 ? '撃破！残りの問題にも挑戦しよう。' : '正解して、カードの力を見せよう。';
  $('#enemyCard').classList.toggle('is-defeated', active.enemyHp <= 0);
}

function drawParty() {
  if (!active) return;
  $('#teamRail').innerHTML = active.team.map((id, index) => {
    const card = cardFor(id);
    if (!card) return '';
    const level = levelFor(state.xp[id] || 0);
    return '<div class="battle-team-card' + (index === active.cardIndex ? ' active' : '') + '">' +
      '<div class="battle-team-art">' + renderCard(card, { showInfo: false, mini: true }) + '</div>' +
      '<div class="battle-team-info"><strong>' + card.name + '</strong><small>得意：' + card.subject + '</small><span class="level-pill">Lv.' + level + '</span></div></div>';
  }).join('');
}

function drawQuestion() {
  if (!active || !active.question) return;
  const q = active.question;
  active.displayChoices = Array.isArray(q.choices) ? shuffle(q.choices) : [];
  active.locked = false;
  $('#battleQuestionCount').textContent = (active.index + 1) + ' / ' + active.questions.length;
  $('#battleSubjectLabel').textContent = (q.grade || active.grade) + '年・' + (q.subject || active.subject);
  $('#questionNumber').textContent = String(active.index + 1).padStart(2, '0');
  $('#questionBadge').textContent = (q.grade || active.grade) + '年・' + (q.subject || active.subject);
  $('#questionText').textContent = q.question;
  $('#comboBadge').textContent = '連続正解 ' + active.combo;
  $('#runProgress').innerHTML = active.questions.map((_, index) => '<span class="progress-step' + (index < active.index ? ' done' : index === active.index ? ' current' : '') + '"></span>').join('');
  $('#feedbackPanel').hidden = true;
  $('#feedbackPanel').classList.remove('miss');
  const choices = $('#answerChoices');
  choices.innerHTML = '';
  if (active.displayChoices.length) {
    active.displayChoices.forEach((choice, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'answer-choice';
      button.dataset.answerIndex = String(index);
      const letter = document.createElement('span');
      letter.className = 'answer-letter';
      letter.textContent = String.fromCharCode(65 + index);
      const label = document.createElement('span');
      label.textContent = String(choice);
      button.append(letter, label);
      choices.appendChild(button);
    });
  } else {
    const row = document.createElement('div');
    row.className = 'typed-answer-row';
    const input = document.createElement('input');
    input.id = 'typedAnswer';
    input.type = 'text';
    input.autocomplete = 'off';
    input.setAttribute('aria-label', '答えを入力');
    input.placeholder = '答えを入力しよう';
    const submit = createButton('答える →', 'button primary', { 'data-action': 'submit-typed' });
    row.append(input, submit);
    choices.appendChild(row);
  }
  drawParty();
}

function feedback(title, body, actions, isMiss) {
  const panel = $('#feedbackPanel');
  panel.hidden = false;
  panel.classList.toggle('miss', Boolean(isMiss));
  $('#feedbackSymbol').textContent = isMiss ? '？' : '✓';
  $('#feedbackTitle').textContent = title;
  $('#feedbackBody').textContent = body || '';
  $('#feedbackActions').innerHTML = actions.map((action) => '<button type="button" class="button ' + action.className + '" data-action="' + action.name + '">' + action.label + '</button>').join('');
}

function hintText(q) {
  if (q.hint) return 'ヒント：' + q.hint;
  return '問題をもう一度ゆっくり読んで、分かっていることに注目してみよう。';
}

function explanationText(q) {
  if (q.explanation) return '考え方：' + q.explanation;
  if (q.hint) return '考え方のヒント：' + q.hint;
  return '正解を確認して、次の問題に進もう。';
}

const REVIEW_INTERVALS = [1, 3, 7, 14, 30];

function reviewDueAt(entry) {
  return Number(entry.nextReviewAt) || 0;
}

function scheduleReview(entry, days) {
  entry.intervalDays = days;
  entry.nextReviewAt = Date.now() + days * 24 * 60 * 60 * 1000;
}

function recordMistake(q) {
  const id = q.id || ('q-' + (q.grade || active.grade) + '-' + (q.subject || active.subject) + '-' + String(q.question).slice(0, 20));
  if (!q.id) q.id = id;
  const old = state.review[id] || {};
  state.review[id] = {
    ...old,
    ...q,
    id,
    wrongCount: (Number(old.wrongCount) || 0) + 1,
    correctStreak: 0,
    reviewLevel: 0,
    lastWrongAt: Date.now(),
    nextReviewAt: Date.now(),
    intervalDays: 0
  };
  state.stats.wrongAttempts = (Number(state.stats.wrongAttempts) || 0) + 1;
}

function applyReviewCorrect(q, firstTry) {
  if (!q.id || !state.review[q.id]) return;
  const entry = state.review[q.id];
  entry.lastReviewedAt = Date.now();
  if (!firstTry) {
    entry.correctStreak = 0;
    entry.reviewLevel = 0;
    scheduleReview(entry, 0);
    entry.nextReviewAt = Date.now() + 10 * 60 * 1000;
    return;
  }
  entry.correctStreak = (Number(entry.correctStreak) || 0) + 1;
  entry.reviewLevel = Math.min(REVIEW_INTERVALS.length, (Number(entry.reviewLevel) || 0) + 1);
  if (entry.reviewLevel >= REVIEW_INTERVALS.length) {
    state.stats.masteredReview = (Number(state.stats.masteredReview) || 0) + 1;
    state.points += 10;
    active.pointsEarned += 10;
    active.masteredThisRun += 1;
  }
  scheduleReview(entry, REVIEW_INTERVALS[Math.min(entry.reviewLevel - 1, REVIEW_INTERVALS.length - 1)]);
}

function checkLevelUp(cardId) {
  const oldXp = Number(state.xp[cardId]) || 0;
  const oldLevel = levelFor(oldXp);
  state.xp[cardId] = oldXp + 1;
  const newLevel = levelFor(state.xp[cardId]);
  if (newLevel > oldLevel) {
    state.points += 10;
    active.pointsEarned += 10;
    active.levelUps.push({ id: cardId, name: (cardFor(cardId) || {}).name || 'ナビアン', from: oldLevel, to: newLevel });
  }
}

function castAnswer(value, expected) {
  if (typeof expected === 'number') {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : value;
  }
  if (typeof expected === 'boolean') {
    if (String(value).toLowerCase() === 'true') return true;
    if (String(value).toLowerCase() === 'false') return false;
  }
  return String(value).trim();
}

function handleAnswer(selected) {
  if (!active || active.locked) return;
  if (selected === undefined || selected === null || String(selected).trim() === '') {
    notify('答えを選ぶか、入力してね。');
    return;
  }
  const q = active.question;
  const expected = q.answer;
  const picked = castAnswer(selected, expected);
  const correct = checker.check(picked, expected, { detail: { questionId: q.id, grade: q.grade || active.grade, subject: q.subject || active.subject } });
  active.locked = true;
  document.querySelectorAll('.answer-choice').forEach((button) => { button.disabled = true; });
  if ($('#typedAnswer')) $('#typedAnswer').disabled = true;
  if (correct) {
    handleCorrect(q, active.attempts === 0);
  } else {
    handleWrong(q);
  }
}

function handleCorrect(q, firstTry) {
  active.correctCount += 1;
  if (firstTry) active.firstTryCount += 1;
  state.stats.totalCorrect = (Number(state.stats.totalCorrect) || 0) + 1;
  if (firstTry) state.stats.firstTryCorrect = (Number(state.stats.firstTryCorrect) || 0) + 1;

  const cardId = active.team[active.cardIndex];
  checkLevelUp(cardId);
  const isQuest = active.mode === 'quest';
  const basePoints = isQuest ? (firstTry ? 10 : 5) : (firstTry ? 5 : 3);
  // The first completed run per grade each day earns full rewards. Repeating easier grades is practice, not a point-farming shortcut.
  const points = active.rewardEligible ? basePoints * active.rewardMultiplier : Math.max(1, Math.floor(basePoints / 5));
  state.points += points;
  active.pointsEarned += points;

  const notes = ['カードP +' + points + '。'];
  if (isQuest && active.enemyHp > 0) {
    let damage = firstTry ? 2 : 1;
    const currentCard = cardFor(cardId);
    const qSubject = q.subject || active.subject;
    if (firstTry && currentCard && currentCard.subject === qSubject && !active.skillUsed.includes(cardId)) {
      damage += 1;
      active.skillUsed.push(cardId);
      notes.push(currentCard.name + 'の得意教科スキル！');
    }
    if (firstTry) {
      active.combo += 1;
      if (active.combo === 3 && !active.comboBonusUsed) {
        damage += 1;
        active.comboBonusUsed = true;
        notes.push('3連続正解ボーナス！');
      }
    } else {
      active.combo = 0;
    }
    active.enemyHp = Math.max(0, active.enemyHp - damage);
    notes.push('カードの攻撃：' + damage + 'ダメージ。');
    drawEnemy();
  } else {
    active.combo = firstTry ? active.combo + 1 : 0;
  }
  applyReviewCorrect(q, firstTry);
  saveState();
  drawParty();
  $('#comboBadge').textContent = '連続正解 ' + active.combo;
  feedback(firstTry ? '正解！' : 'よく考えたね！', notes.join('\n') + '\n' + explanationText(q), [
    { name: 'next-question', label: '次の問題へ →', className: 'primary' }
  ], false);
}

function handleWrong(q) {
  recordMistake(q);
  saveState();
  if (active.attempts === 0) {
    active.attempts = 1;
    active.combo = 0;
    $('#comboBadge').textContent = '連続正解 0';
    feedback('おしい！ ヒントを見よう', hintText(q), [
      { name: 'retry-question', label: 'もう一度こたえる', className: 'primary' },
      { name: 'show-answer', label: '答えを見て次へ', className: 'secondary' }
    ], true);
  } else {
    active.combo = 0;
    $('#comboBadge').textContent = '連続正解 0';
    feedback('答えを確認しよう', '正解：' + String(q.answer) + '\n' + explanationText(q), [
      { name: 'next-question', label: '次の問題へ →', className: 'primary' }
    ], true);
  }
}

function revealAnswer() {
  if (!active) return;
  const q = active.question;
  feedback('答えを確認しよう', '正解：' + String(q.answer) + '\n' + explanationText(q), [
    { name: 'next-question', label: '次の問題へ →', className: 'primary' }
  ], true);
}

function advanceQuestion() {
  if (!active) return;
  active.index += 1;
  if (active.index >= active.questions.length) {
    finishRun();
    return;
  }
  active.cardIndex = (active.cardIndex + 1) % Math.max(1, active.team.length);
  active.question = active.questions[active.index];
  active.attempts = 0;
  active.locked = false;
  renderBattle();
}

function finishRun() {
  if (!active) return;
  const isQuest = active.mode === 'quest';
  const cleared = isQuest && active.enemyHp <= 0;
  const finishReward = isQuest ? (cleared ? (active.rewardEligible ? 25 * active.rewardMultiplier : 3) : (active.rewardEligible ? 5 * active.rewardMultiplier : 1)) : 0;
  if (finishReward) {
    state.points += finishReward;
    active.pointsEarned += finishReward;
  }
  state.stats.sessions = (Number(state.stats.sessions) || 0) + 1;
  if (active.rewardEligible && active.rewardKey) state.dailyRewards[active.rewardKey] = true;
  if (cleared) state.stats.questsCleared = (Number(state.stats.questsCleared) || 0) + 1;
  saveState();
  renderResult(cleared);
  showScreen('screen-result');
}

function renderResult(cleared) {
  const isQuest = active.mode === 'quest';
  $('#resultMark').textContent = isQuest ? (cleared ? '✦' : '↗') : '◎';
  $('#resultMark').style.background = isQuest && !cleared ? 'var(--amber-soft)' : 'var(--green-soft)';
  $('#resultMark').style.color = isQuest && !cleared ? 'var(--amber)' : 'var(--green)';
  $('#resultEyebrow').textContent = isQuest ? 'QUEST REPORT' : 'PRACTICE REPORT';
  $('#resultTitle').textContent = isQuest ? (cleared ? 'クエストクリア！' : 'あと少し！') : '特訓完了！';
  if (isQuest && cleared) {
    $('#resultLead').textContent = 'ナビアンを撃破！問題に向き合ったことが、次の力になる。';
  } else if (isQuest) {
    $('#resultLead').textContent = 'あと少しでクリア。今回のポイントは受け取り、特訓してから再挑戦しよう。';
  } else {
    $('#resultLead').textContent = '落ち着いて考えられたね。正解した問題は、カードの経験値にもなったよ。';
  }
  const stats = [
    { value: active.correctCount + ' / ' + active.questions.length, label: '正解した問題' },
    { value: active.firstTryCount, label: 'ヒントなしで正解' },
    { value: '+' + active.pointsEarned, label: 'カードP' }
  ];
  $('#resultStats').innerHTML = stats.map((item) => '<div class="result-stat"><strong>' + item.value + '</strong><span>' + item.label + '</span></div>').join('');
  $('#resultLevelUps').innerHTML = active.levelUps.map((item) => '<div class="levelup-note">' + item.name + 'が Lv.' + item.to + ' にレベルアップ！ +10P</div>').join('');
  let note = isQuest ? (cleared ? '得意教科のカードと、連続正解が勝利を助けたよ。次は別の教科にも挑戦してみよう。' : 'まちがえた問題は特訓帳に保存されています。ヒントを使って練習すると、次の挑戦につながります。') : '特訓帳の問題は、2回続けてヒントなしで正解すると克服になります。';
  if (active.masteredThisRun > 0) note += '\n' + active.masteredThisRun + '問が特訓帳を卒業しました。';
  $('#resultLearningNote').textContent = note;
}

function beginReviewRun() {
  const now = Date.now();
  const due = Object.values(state.review)
    .filter((q) => reviewDueAt(q) <= now)
    .sort((a, b) => (a.nextReviewAt || 0) - (b.nextReviewAt || 0));
  if (!due.length) {
    notify('いま復習する問題はないよ。次の復習時間を待つか、教科別の特訓に進もう。');
    renderTraining();
    return;
  }
  const questions = shuffle(due).slice(0, 8).map((q) => ({ ...q }));
  lastConfig = { mode: 'review' };
  startRun('review', questions, questions[0].grade || selectedGrade, 'まちがい特訓');
}

function renderTraining() {
  updateHeader();
  const all = Object.values(state.review);
  const now = Date.now();
  const due = all.filter((q) => reviewDueAt(q) <= now)
    .sort((a, b) => (a.nextReviewAt || 0) - (b.nextReviewAt || 0));
  const later = all.filter((q) => reviewDueAt(q) > now)
    .sort((a, b) => (a.nextReviewAt || 0) - (b.nextReviewAt || 0));
  $('#trainingDueCount').textContent = due.length + '問';
  $('#startMistakesButton').disabled = due.length === 0;
  $('#startMistakesButton').textContent = due.length ? 'いま復習する（' + due.length + '問） →' : '復習する問題はありません';
  const list = $('#mistakeList');
  list.innerHTML = '';
  if (!all.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = 'まだ特訓する問題はありません。クエストでまちがえた問題は、ここに保存されるよ。';
    list.appendChild(empty);
    return;
  }
  const visible = due.concat(later).slice(0, 5);
  visible.forEach((q) => {
    const item = document.createElement('article');
    item.className = 'mistake-item';
    const title = document.createElement('strong');
    title.textContent = q.question || '問題';
    const detail = document.createElement('small');
    const isDue = reviewDueAt(q) <= now;
    const status = isDue ? '復習どき' : '次の復習：' + new Date(q.nextReviewAt).toLocaleDateString('ja-JP');
    detail.textContent = (q.grade || '?') + '年・' + (q.subject || '教科') + '　まちがい ' + (q.wrongCount || 1) + '回　・　' + status;
    item.append(title, detail);
    list.appendChild(item);
  });
  if (all.length > 5) {
    const more = document.createElement('p');
    more.className = 'muted';
    more.textContent = 'ほか ' + (all.length - 5) + '問';
    list.appendChild(more);
  }
}

function renderTeam() {
  const ids = state.owned.slice();
  $('#teamSelectedCount').textContent = teamIds().length + ' / 3枚 選択中';
  const grid = $('#teamGrid');
  grid.innerHTML = '';
  ids.forEach((id) => {
    const card = cardFor(id);
    if (!card) return;
    const selected = state.team.includes(id);
    const item = document.createElement('article');
    item.className = 'owned-card-item' + (selected ? ' is-selected' : '');
    const art = document.createElement('div');
    art.className = 'owned-card-art';
    art.innerHTML = renderCard(card, { showInfo: false });
    const info = document.createElement('div');
    info.className = 'owned-card-info';
    const name = document.createElement('strong');
    name.textContent = card.name;
    const meta = document.createElement('small');
    meta.textContent = card.subject + '　・　Lv.' + levelFor(state.xp[id] || 0);
    info.append(name, meta);
    const button = createButton(selected ? 'チームからはずす' : 'チームに入れる', selected ? 'button secondary' : 'button', { 'data-action': 'toggle-team', 'data-id': id });
    button.setAttribute('aria-pressed', String(selected));
    item.append(art, info, button);
    grid.appendChild(item);
  });
}

function costFor(monster) {
  return RECRUIT_COST[monster.rank] || 60;
}

function renderCollection() {
  updateHeader();
  const search = collectionSearch.trim().toLocaleLowerCase('ja');
  let list = monsterCatalog.filter((monster) => {
    const owned = state.owned.includes(monster.id);
    if (collectionFilter === 'owned' && !owned) return false;
    if (collectionFilter === 'unowned' && owned) return false;
    if (!search) return true;
    return (monster.name + ' ' + (monster.subject || '') + ' ' + (RANK_NAME[monster.rank] || '')).toLocaleLowerCase('ja').includes(search);
  });
  list = list.slice().sort((a, b) => {
    const ownedDiff = Number(state.owned.includes(b.id)) - Number(state.owned.includes(a.id));
    if (ownedDiff) return ownedDiff;
    const rankOrder = { zako: 1, evolved: 2, boss: 3 };
    return (rankOrder[a.rank] || 9) - (rankOrder[b.rank] || 9) || a.name.localeCompare(b.name, 'ja');
  });
  $('#collectionCount').textContent = list.length + '体を表示　・　仲間 ' + state.owned.length + '体';
  const displayList = list.slice(0, collectionLimit);
  $('#collectionGrid').innerHTML = displayList.map((monster) => {
    const owned = state.owned.includes(monster.id);
    const selected = state.team.includes(monster.id);
    const card = cardFor(monster.id);
    const level = levelFor(state.xp[monster.id] || 0);
    const action = owned
      ? '<button class="button ' + (selected ? 'secondary' : '') + '" data-action="toggle-team" data-id="' + monster.id + '">' + (selected ? 'チームからはずす' : 'チームに入れる') + '</button>'
      : '<button class="button primary" data-action="recruit" data-id="' + monster.id + '"' + (state.points < costFor(monster) ? ' disabled' : '') + '>' + costFor(monster) + 'Pで仲間に</button>';
    return '<article class="collection-item' + (owned ? ' owned' : '') + '">' +
      '<div class="collection-art">' + renderCard(card, { showInfo: true }) + '</div>' +
      '<div class="collection-meta"><strong>' + monster.name + '</strong><small>' + (monster.subject || 'とくになし') + '・' + (RANK_NAME[monster.rank] || 'ナビアン') + (owned ? '・Lv.' + level : '') + '</small></div>' +
      '<div class="collection-actions">' + action + '</div></article>';
  }).join('');
  if (!displayList.length) {
    $('#collectionGrid').innerHTML = '<div class="empty-state">見つかりませんでした。検索する言葉を変えてみよう。</div>';
  }
  $('#moreCardsButton').hidden = list.length <= collectionLimit;
  document.querySelectorAll('[data-filter]').forEach((button) => button.classList.toggle('active', button.dataset.filter === collectionFilter));
}

function toggleTeam(id) {
  if (!state.owned.includes(id)) return;
  const team = state.team.slice();
  if (team.includes(id)) {
    if (team.length <= 1) {
      notify('チームには、少なくとも1枚のカードが必要です。');
      return;
    }
    state.team = team.filter((item) => item !== id);
  } else {
    if (team.length >= 3) {
      notify('チームは3枚まで。先にはずすカードを選んでね。');
      return;
    }
    state.team = team.concat(id);
  }
  saveState();
  renderTeam();
  renderCollection();
  renderHome();
}

function recruit(id) {
  const monster = monsterById.get(id);
  if (!monster || state.owned.includes(id)) return;
  const cost = costFor(monster);
  if (state.points < cost) {
    notify('あと' + (cost - state.points) + 'Pためると仲間にできるよ。');
    return;
  }
  state.points -= cost;
  state.owned.push(id);
  saveState();
  renderCollection();
  notify(monster.name + 'が仲間になった！');
}

function startTrainingFromSetup() {
  runMode = 'practice';
  openSetup('practice');
}

function handleAction(action, button) {
  if (action === 'home') { showScreen('screen-home'); return; }
  if (action === 'setup') { openSetup('quest'); return; }
  if (action === 'choose-practice') { startTrainingFromSetup(); return; }
  if (action === 'training' || action === 'review') { showScreen('screen-training'); return; }
  if (action === 'team') { showScreen('screen-team'); return; }
  if (action === 'collection') { showScreen('screen-collection'); return; }
  if (action === 'leave-run') { showScreen('screen-home'); return; }
  if (action === 'practice-mistakes') { beginReviewRun(); return; }
  if (action === 'retry-question') {
    if (!active) return;
    active.locked = false;
    $('#feedbackPanel').hidden = true;
    document.querySelectorAll('.answer-choice').forEach((choice) => { choice.disabled = false; });
    if ($('#typedAnswer')) { $('#typedAnswer').disabled = false; $('#typedAnswer').focus(); }
    return;
  }
  if (action === 'show-answer') { revealAnswer(); return; }
  if (action === 'next-question') { advanceQuestion(); return; }
  if (action === 'submit-typed') {
    if ($('#typedAnswer')) handleAnswer($('#typedAnswer').value);
    return;
  }
  if (action === 'replay') {
    if (!lastConfig) { openSetup('quest'); return; }
    if (lastConfig.mode === 'review') { beginReviewRun(); return; }
    selectedGrade = lastConfig.grade;
    selectedSubject = lastConfig.subject;
    openSetup(lastConfig.mode);
    return;
  }
  if (action === 'toggle-team') { toggleTeam(button.dataset.id); return; }
  if (action === 'recruit') { recruit(button.dataset.id); return; }
  if (action === 'more-cards') { collectionLimit += 24; renderCollection(); return; }
}

document.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button || button.disabled) return;
  if (button.dataset.action) { handleAction(button.dataset.action, button); return; }
  if (button.dataset.grade) {
    selectedGrade = Number(button.dataset.grade);
    renderSetup();
    return;
  }
  if (button.dataset.subject) {
    selectedSubject = button.dataset.subject;
    renderSetup();
    return;
  }
  if (button.dataset.filter) {
    collectionFilter = button.dataset.filter;
    collectionLimit = 24;
    renderCollection();
    return;
  }
  if (button.dataset.answerIndex !== undefined && active) {
    const index = Number(button.dataset.answerIndex);
    handleAnswer(active.displayChoices[index]);
  }
});

$('#startSetupButton').addEventListener('click', beginSetupRun);
$('#collectionSearch').addEventListener('input', (event) => {
  collectionSearch = event.target.value || '';
  collectionLimit = 24;
  renderCollection();
});
$('#collectionSearch').addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    renderCollection();
  }
});

renderHome();
updateHeader();
