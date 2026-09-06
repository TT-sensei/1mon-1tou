import { StorageManager } from 'https://tt-sensei.github.io/edu-components/index.js';
import { startBattle, stopBattle, getBattleState } from './battle.js';

const store = new StorageManager('1mon-1tou');
const KEYS = { points:'points', team:'team', owned:'owned', review:'review' };
const $ = (s) => document.querySelector(s);

const fallbackTeam = [
  {id:'starter-slime',name:'ぷるんスライム',src:'assets/monsters/purun-slime.svg'},
  {id:'starter-bat',name:'こもりんバット',src:'assets/monsters/komorin-bat.svg'},
  {id:'starter-kinoko',name:'きのこっこ',src:'assets/monsters/kinoko.svg'}
];

function load(key, fallback){ return store.load(KEYS[key] || key, fallback); }
function save(key, value){ store.save(KEYS[key] || key, value); }
function points(){ return Number(load('points',0)) || 0; }
function setPoints(value){ save('points',Math.max(0,Number(value)||0)); updatePoints(); }
function addPoints(value){ setPoints(points() + (Number(value)||0)); }
function updatePoints(){ $('#points').textContent=String(points()); $('#settingsPoints').textContent=String(points()); }

function show(id){
  stopBattle();
  document.querySelectorAll('.screen').forEach((el)=>el.classList.remove('active'));
  document.getElementById(id)?.classList.add('active');
  window.scrollTo(0,0);
  if(id==='cards') renderCards();
  if(id==='packs') renderPack();
  if(id==='review') renderReview();
  if(id==='settings') updatePoints();
}

function ensureOwned(){
  let owned=load('owned',null);
  if(!Array.isArray(owned)||!owned.length){ owned=fallbackTeam.map(c=>c.id); save('owned',owned); }
  return owned;
}
function cardMeta(id){
  const m=(window.BATTLE_MONSTERS||[]).find(x=>x.id===id);
  if(m)return m;
  return fallbackTeam.find(x=>x.id===id)||null;
}
function getTeam(){
  const owned=ensureOwned();
  let team=load('team',null);
  if(!Array.isArray(team)||!team.length)team=owned.slice(0,3);
  team=team.map(id=>typeof id==='string'?id:id?.id).filter(id=>owned.includes(id));
  if(!team.length)team=owned.slice(0,3);
  return team.slice(0,3);
}
function saveTeam(team){save('team',team);}

function renderCards(){
  const grid=$('#cardsGrid'); if(!grid)return;
  const owned=ensureOwned(); const team=getTeam();
  grid.innerHTML=owned.map(id=>{
    const c=cardMeta(id); if(!c)return '';
    const selected=team.includes(id);
    return `<button class="card ${selected?'selected':''}" data-card-id="${c.id}" aria-pressed="${selected}"><img src="${c.src}" alt="${c.name}"><div class="copy"><small>${c.rank==='boss'?'ボス':c.rank==='evolved'?'進化':'ザコ'}</small>${c.name}</div></button>`;
  }).join('');
}
function toggleCard(id){
  let team=getTeam();
  if(team.includes(id)){
    if(team.length===1)return;
    team=team.filter(x=>x!==id);
  }else if(team.length<3){team=[...team,id];}
  else { team=[...team.slice(0,2),id]; }
  saveTeam(team); renderCards();
}

async function loadQuestions(grade,subjectName){
  const subject=window.GAME_SUBJECTS?.[subjectName];
  if(!subject)return [];
  const key=`${grade}-${subject.id}`;
  if(Array.isArray(window.QUESTION_BANK?.[key])&&window.QUESTION_BANK[key].length)return window.QUESTION_BANK[key];
  try{
    await import(`../data/questions/grade${grade}/${subject.id}.js`);
  }catch(e){
    try{await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=`data/questions/grade${grade}/${subject.id}.js`;s.onload=resolve;s.onerror=reject;document.head.appendChild(s);});}catch(_){return []}
  }
  return Array.isArray(window.QUESTION_BANK?.[key])?window.QUESTION_BANK[key]:[];
}

async function renderSetup(){
  const grades=$('#grades'), subjects=$('#subjects');
  const allGrades=[1,2,3,4,5,6];
  const current=window.__battleSetup||{grade:1,subject:'国語'};
  grades.innerHTML=allGrades.map(g=>`<button class="choice ${g===current.grade?'selected':''}" data-grade="${g}"><span class="icon">${['🌱','🌿','🧪','🧭','⚙️','🚀'][g-1]}</span>${g}年生</button>`).join('');
  const names=Object.keys(window.GAME_SUBJECTS||{}).filter(n=>window.GAME_SUBJECTS[n].grades.includes(current.grade));
  if(!names.includes(current.subject))current.subject=names[0]||'国語';
  const checks=await Promise.all(names.map(async n=>[n,(await loadQuestions(current.grade,n)).length>0]));
  subjects.innerHTML=checks.map(([n,has])=>{const s=window.GAME_SUBJECTS[n];return `<button class="choice ${n===current.subject?'selected':''} ${has?'':'disabled'}" data-subject="${n}"><span class="icon">${s.icon}</span>${n}<small>${has?'問題あり':'準備中'}</small></button>`}).join('');
  const count=(await loadQuestions(current.grade,current.subject)).length;
  $('#setupNote').textContent=count?`${current.grade}年生・${current.subject}：${count}問から出題します。`:`${current.grade}年生・${current.subject}の問題データはまだありません。`;
  window.__battleSetup=current;
}

function openSetup(){show('setup');renderSetup();}

function reviewData(){return load('review',{} )||{};}
function renderReview(){
  const list=$('#reviewList'); if(!list)return;
  const data=Object.values(reviewData());
  if(!data.length){list.innerHTML='<p class="muted">まだまちがえた問題はありません。いい調子！</p>';return;}
  list.innerHTML=data.sort((a,b)=>(b.lastWrongAt||0)-(a.lastWrongAt||0)).map(q=>`<article class="review-item"><b>${q.question}</b><div class="muted">${q.grade}年・${q.subject}　まちがい ${q.wrongCount||1}回</div></article>`).join('');
}

function renderPack(){
  const visual=$('#packVisual'); const button=$('#packButton');
  visual.innerHTML='<div class="panel" style="margin:18px auto;width:min(230px,70vw);text-align:center;font-size:70px">🎁</div>';
  button.disabled=points()<100;
  button.textContent=points()>=100?'100Pでひく':'100Pためよう';
  $('#packMessage').textContent=points()>=100?'カードを1枚ゲット！':'バトルでカードPをためよう。';
}
function openPack(){
  if(points()<100)return;
  const monsters=(window.BATTLE_MONSTERS||[]); if(!monsters.length)return;
  const card=monsters[Math.floor(Math.random()*monsters.length)];
  setPoints(points()-100);
  const owned=ensureOwned();
  if(owned.includes(card.id))setPoints(points()+50); else {owned.push(card.id);save('owned',owned);}
  $('#packMessage').textContent=owned.includes(card.id)?`「${card.name}」！ ダブりなので50Pもどったよ。`:`「${card.name}」をゲット！`;
  renderPack();
}

function resetData(){if(!confirm('カード・ポイント・まちがえた問題をリセットしますか？'))return;store.clear();ensureOwned();updatePoints();renderCards();alert('リセットしました。');}

$('#startBattleButton').addEventListener('click',async()=>{
  const s=window.__battleSetup||{grade:1,subject:'国語'};
  const qs=await loadQuestions(s.grade,s.subject);
  if(!qs.length){$('#setupNote').textContent='この教科にはまだ問題がありません。';return;}
  document.querySelectorAll('.screen').forEach(x=>x.classList.remove('active'));
  $('#battleScreen').classList.add('active');
  startBattle({grade:s.grade,subject:s.subject,questions:qs,team:getTeam(),onPoints:addPoints,onWrong:(q)=>{
    const data=reviewData(); const old=data[q.id]||{id:q.id,question:q.question,grade:q.grade,subject:q.subject,wrongCount:0}; old.wrongCount++;old.lastWrongAt=Date.now();data[q.id]=old;save('review',data);
  },onHome:()=>show('home')});
});

document.addEventListener('click',async(e)=>{
  const action=e.target.closest('[data-action]')?.dataset.action;
  if(action){ if(action==='setup')openSetup(); else show(action); return; }
  const g=e.target.closest('[data-grade]')?.dataset.grade;
  if(g){window.__battleSetup={...(window.__battleSetup||{}),grade:Number(g)};await renderSetup();return;}
  const s=e.target.closest('[data-subject]')?.dataset.subject;
  if(s&&!e.target.closest('.disabled')){window.__battleSetup={...(window.__battleSetup||{}),subject:s};await renderSetup();return;}
  const c=e.target.closest('[data-card-id]')?.dataset.cardId;
  if(c){toggleCard(c);return;}
});
$('#resetButton').addEventListener('click',resetData);

window.addEventListener('edu:correct',()=>{});
window.addEventListener('edu:wrong',()=>{});
updatePoints();ensureOwned();
