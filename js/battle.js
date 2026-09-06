// 教科モンスターバトル：独立バトルエンジン
(function(){
  'use strict';
  const state={grade:1,subject:'国語',questionIndex:0,question:null,monsterIndex:0,monster:null,monsterHp:0,totalAnswered:0,correct:0,team:[],activeCard:0,running:false,locked:false};
  const DATA=window.GAME_SUBJECTS||{};
  const fallbackCards=window.BATTLE_CARD_FALLBACKS||[
    {id:'starter-slime',name:'ぷるんスライム',src:'assets/monsters/purun-slime.svg'},
    {id:'starter-bat',name:'こもりんバット',src:'assets/monsters/komorin-bat.svg'},
    {id:'starter-kinoko',name:'きのこっこ',src:'assets/monsters/kinoko.svg'}
  ];

  function showScreen(id){
    document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
    document.getElementById(id)?.classList.add('active');
    window.scrollTo(0,0);
  }
  function questionKey(){return `${state.grade}-${DATA[state.subject]?.id||state.subject}`;}
  function getQuestions(){
    const q=window.QUESTION_BANK?.[questionKey()];
    return Array.isArray(q)?q:[];
  }
  function selectedChoice(container,id){
    return container?.querySelector(`.choice[data-grade="${id}"]`);
  }
  function renderSetup(){
    const grades=document.getElementById('grades'), subjects=document.getElementById('subjects');
    if(!grades||!subjects)return;
    const availableGrades=[1,2,3,4,5,6].filter(g=>Object.values(DATA).some(s=>s.grades?.includes(g)));
    grades.innerHTML=availableGrades.map(g=>`<button class="choice ${g===state.grade?'selected':''}" data-grade="${g}"><span class="icon">${g===1?'🌱':g===2?'🌿':g===3?'🧪':g===4?'🧭':g===5?'⚙️':'🚀'}</span>${g}年生</button>`).join('');
    const names=(Object.keys(DATA).filter(name=>DATA[name].grades?.includes(state.grade)));
    subjects.innerHTML=names.map(name=>{const s=DATA[name];return `<button class="choice ${name===state.subject?'selected':''}" data-subject="${name}"><span class="icon">${s.icon||'📚'}</span>${name}<small>${window.QUESTION_BANK?.[`${state.grade}-${s.id}`]?'問題あり':'準備中'}</small></button>`;}).join('');
    const note=document.getElementById('setupNote');
    if(note)note.textContent=`${state.grade}年生・${state.subject}。${getQuestions().length?'この教科でバトルできます。':'この学年・教科の問題データはまだありません。別の教科を選んでね。'}`;
  }
  window.openSetup=function(){renderSetup();showScreen('setup');};

  function setupClicks(e){
    const g=e.target.closest?.('[data-grade]');
    const s=e.target.closest?.('[data-subject]');
    if(g){state.grade=Number(g.dataset.grade);const names=Object.keys(DATA).filter(n=>DATA[n].grades?.includes(state.grade));if(!names.includes(state.subject))state.subject=names[0]||'国語';renderSetup();}
    if(s){state.subject=s.dataset.subject;renderSetup();}
  }

  async function ensureQuestionData(){
    const key=questionKey(); if(getQuestions().length)return true;
    const subj=DATA[state.subject]; if(!subj)return false;
    const src=`data/questions/grade${state.grade}/${subj.id}.js`;
    try{
      await new Promise((resolve,reject)=>{const sc=document.createElement('script');sc.src=src;sc.onload=resolve;sc.onerror=reject;document.head.appendChild(sc);});
    }catch(_e){return false;}
    return Array.isArray(window.QUESTION_BANK?.[key])&&window.QUESTION_BANK[key].length>0;
  }

  function readExistingTeam(){
    const result=[];
    const minis=[...document.querySelectorAll('#miniTeam .mini')];
    minis.forEach((el,i)=>{const img=el.querySelector('img');const b=el.querySelector('b');if(img?.src)result.push({id:`existing-${i}`,name:b?.textContent||`カード${i+1}`,src:img.src});});
    if(result.length)return result.slice(0,3);
    const cards=[...document.querySelectorAll('#cardsGrid .card')];
    cards.forEach((el,i)=>{const img=el.querySelector('img.card-monster,img');const n=el.querySelector('.card-name');if(img?.src)result.push({id:`dom-${i}`,name:n?.textContent||`カード${i+1}`,src:img.src});});
    if(result.length)return result.slice(0,3);
    return fallbackCards.slice(0,3);
  }
  function prepareTeam(){
    try{if(typeof window.renderCards==='function')window.renderCards();}catch(_e){}
    state.team=readExistingTeam();state.activeCard=0;
  }

  function chooseMonster(){
    const list=window.BATTLE_MONSTERS||[];
    if(!list.length)return null;
    if(state.monsterIndex===0){return list[Math.floor(Math.random()*Math.min(6,list.length))];}
    if(state.monsterIndex===1){const ev=list.filter(m=>m.rank==='evolved');return ev[Math.floor(Math.random()*Math.max(1,ev.length))]||list[0];}
    const bosses=list.filter(m=>m.rank==='boss');return bosses[Math.floor(Math.random()*Math.max(1,bosses.length))]||list[0];
  }

  function nextQuestion(){
    const qs=getQuestions();
    if(!qs.length){endBattle(false,'この教科の問題データがまだありません。');return;}
    state.question=qs[Math.floor(Math.random()*qs.length)];
    BattleUI.renderQuestion(state.question,state.totalAnswered+1,state.totalAnswered+1,state.grade,state.subject);
  }
  function beginMonster(){
    state.monster=chooseMonster();
    if(!state.monster){endBattle(false,'モンスターの準備ができません。');return;}
    state.monsterHp=state.monster.hp;
    BattleUI.renderTeam(state.team,state.activeCard);BattleUI.renderPlayer(state.team[state.activeCard]);BattleUI.renderEnemy(state.monster);
    nextQuestion();
  }

  async function beginBattle(){
    state.running=false;state.locked=false;state.questionIndex=0;state.totalAnswered=0;state.correct=0;state.monsterIndex=0;
    const ok=await ensureQuestionData();
    if(!ok){alert(`${state.grade}年・${state.subject}の問題データがありません。別の教科を選んでください。`);return;}
    prepareTeam();
    BattleUI.renderShell();
    showScreen('battleScreen');
    state.running=true;
    beginMonster();
    document.getElementById('battleQuitBtn').onclick=()=>quitBattle();
  }
  window.startBattle=function(){beginBattle();};

  function recordWrong(q){
    try{
      const key='one-mon-one-question-review';const raw=localStorage.getItem(key);const data=raw?JSON.parse(raw):{};
      const old=data[q.id]||{id:q.id,question:q.question,grade:q.grade,subject:q.subject,wrongCount:0,lastWrongAt:0};old.wrongCount++;old.lastWrongAt=Date.now();data[q.id]=old;localStorage.setItem(key,JSON.stringify(data));
    }catch(_e){}
  }
  function addPoints(n){
    const el=document.getElementById('points'); if(el){const cur=Number(el.textContent)||0;el.textContent=String(cur+n);} 
    try{const keys=['cardPoints','cardP','one-mon-one-question-points'];for(const k of keys){const raw=localStorage.getItem(k);if(raw!==null){localStorage.setItem(k,String((Number(raw)||0)+n));break;}}}catch(_e){}
  }
  function setLocks(locked){state.locked=locked;BattleUI.lockChoices();}

  function answer(index){
    if(!state.running||state.locked||!state.question)return;
    const choice=state.question.choices?.[index];if(choice===undefined)return;
    setLocks(true);state.totalAnswered++;
    const correct=String(choice)===String(state.question.answer);
    if(correct){
      state.correct++;addPoints(10);BattleUI.feedback('せいかい！','good');BattleUI.attackAnimation();state.monsterHp=Math.max(0,state.monsterHp-1);BattleUI.setEnemyHp(state.monsterHp,state.monster.hp);
      if(state.monsterHp<=0){BattleUI.defeatAnimation();window.setTimeout(()=>{state.monsterIndex++;if(state.monsterIndex>=3)endBattle(true);else beginMonster();},650);}
      else window.setTimeout(()=>nextQuestion(),520);
    }else{
      recordWrong(state.question);BattleUI.feedback('もう一度！','bad');BattleUI.hurtAnimation();BattleUI.showHint();window.setTimeout(()=>{state.locked=false;document.querySelectorAll('#battleChoices .battle-choice').forEach(b=>b.classList.remove('lock'));},650);
    }
  }

  function onAnswer(e){
    const btn=e.target.closest?.('.battle-choice');if(!btn)return;
    e.preventDefault();e.stopImmediatePropagation();
    answer(Number(btn.dataset.choiceIndex));
  }

  function endBattle(win,text){
    state.running=false;state.locked=true;
    if(win)addPoints(20);
    BattleUI.result(win?'バトルクリア！':'バトル終了',text||`3体のモンスターをたおしたよ！ 正解 ${state.correct}問`,()=>showScreen('home'));
  }
  function quitBattle(){state.running=false;state.locked=true;showScreen('home');}
  window.quitBattle=quitBattle;

  function init(){
    const setup=document.getElementById('setup');
    if(setup&&!setup.dataset.battleBound){setup.addEventListener('click',setupClicks);setup.dataset.battleBound='1';}
    document.addEventListener('click',onAnswer,true);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  window.BattleSystem={state};
})();