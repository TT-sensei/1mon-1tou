// 教科モンスターバトル：バトルUI
(function(){
  const U = {};
  U.getBattleScreen = () => document.getElementById('battleScreen');
  U.renderShell = () => {
    const screen = U.getBattleScreen();
    if(!screen) return null;
    screen.innerHTML = `
      <div class="battle-shell">
        <aside class="battle-panel">
          <div class="panel">
            <div class="muted" style="font-weight:1000;font-size:13px;margin-bottom:8px">ぼくのチーム</div>
            <div id="battleMiniTeam" class="battle-team"></div>
          </div>
          <div class="panel" style="margin-top:12px">
            <button class="btn small" id="battleQuitBtn" style="width:100%">やめる</button>
          </div>
        </aside>
        <main class="battle-arena battle-panel">
          <div class="battle-progress"><span id="battleInfo">1体目</span><span id="subjectInfo">国語</span></div>
          <div class="battle-field">
            <div class="fighter">
              <div class="fighter-label">じぶんのカード</div>
              <div id="battlePlayerCard" class="battle-card"><img id="battlePlayerImg" alt="じぶんのカード"><div id="battlePlayerName" class="battle-card-name">カード</div></div>
            </div>
            <div class="vs-mark">VS</div>
            <div class="fighter">
              <div class="fighter-label enemy-label2">あいてのモンスター</div>
              <img id="battleEnemyImg" class="battle-enemy" alt="あいてのモンスター">
            </div>
          </div>
          <div class="battle-hp">
            <div class="battle-hp-line"><span id="battleEnemyName">モンスター</span><span><b id="battleEnemyHp">1</b> / <b id="battleEnemyMax">1</b></span></div>
            <div class="battle-bar"><i id="battleEnemyBar"></i></div>
          </div>
          <div id="battleFeedback" class="battle-feedback" aria-live="polite"></div>
          <div id="battleResult" class="battle-result"><div class="battle-result-box"><h2 id="battleResultTitle"></h2><p id="battleResultText"></p><button class="btn primary" id="battleResultButton">もどる</button></div></div>
        </main>
        <section class="panel battle-question battle-panel">
          <span id="battleBadge" class="battle-badge">1年・国語</span>
          <div id="battleQuestionText" class="battle-qtext">問題</div>
          <div id="battleHint" class="battle-hint"></div>
          <div id="battleChoices" class="battle-choices"></div>
          <div class="battle-note">1問正解すると、じぶんのカードが攻撃！<br>まちがえてもゲームオーバーにはならないよ。</div>
        </section>
      </div>`;
    return screen;
  };
  U.renderTeam = (team, activeIndex) => {
    const el = document.getElementById('battleMiniTeam');
    if(!el) return;
    el.innerHTML = team.map((c,i)=>`<div class="battle-mini ${i===activeIndex?'active':''}">
      <img src="${c.src}" alt=""><div><b>${c.name}</b><span>${i===activeIndex?'いま戦っているカード':'じゅんび中'}</span></div>
    </div>`).join('');
  };
  U.renderPlayer = card => {
    const img=document.getElementById('battlePlayerImg'); const name=document.getElementById('battlePlayerName');
    if(img) img.src=card.src; if(name) name.textContent=card.name;
  };
  U.renderEnemy = monster => {
    const img=document.getElementById('battleEnemyImg'); const name=document.getElementById('battleEnemyName');
    const hp=document.getElementById('battleEnemyHp'); const max=document.getElementById('battleEnemyMax'); const bar=document.getElementById('battleEnemyBar');
    if(img){img.classList.remove('defeat','hit'); img.src=monster.src; img.alt=monster.name;}
    if(name) name.textContent=monster.name;
    if(max) max.textContent=monster.hp;
    U.setEnemyHp(monster.hp,monster.hp);
  };
  U.setEnemyHp=(hp,max)=>{const e=document.getElementById('battleEnemyHp'),m=document.getElementById('battleEnemyMax'),b=document.getElementById('battleEnemyBar');if(e)e.textContent=Math.max(0,hp);if(m)m.textContent=max;if(b)b.style.width=(Math.max(0,hp)/Math.max(1,max)*100)+'%';};
  U.renderQuestion=(q,number,total,grade,subject)=>{
    const badge=document.getElementById('battleBadge'),text=document.getElementById('battleQuestionText'),choices=document.getElementById('battleChoices'),hint=document.getElementById('battleHint'),info=document.getElementById('battleInfo'),sub=document.getElementById('subjectInfo');
    if(badge)badge.textContent=`${grade}年・${subject}`;
    if(text)text.textContent=q.question;
    if(hint){hint.textContent=q.hint||'';hint.classList.remove('show');}
    if(info)info.textContent=`${number}問目`;
    if(sub)sub.textContent=subject;
    if(choices)choices.innerHTML=q.choices.map((c,i)=>`<button class="battle-choice" data-choice-index="${i}">${c}</button>`).join('');
  };
  U.lockChoices=()=>document.querySelectorAll('#battleChoices .battle-choice').forEach(b=>b.classList.add('lock'));
  U.showHint=()=>document.getElementById('battleHint')?.classList.add('show');
  U.feedback=(text,type)=>{const f=document.getElementById('battleFeedback');if(!f)return;f.className='battle-feedback '+(type||'')+' show';f.textContent=text;window.setTimeout(()=>{f.classList.remove('show');},720);};
  U.attackAnimation=()=>{const c=document.getElementById('battlePlayerCard'),e=document.getElementById('battleEnemyImg');if(c){c.classList.remove('attacking');void c.offsetWidth;c.classList.add('attacking');}window.setTimeout(()=>{if(e){e.classList.remove('hit');void e.offsetWidth;e.classList.add('hit');}},170);};
  U.hurtAnimation=()=>{const c=document.getElementById('battlePlayerCard');if(c){c.classList.remove('hurt');void c.offsetWidth;c.classList.add('hurt');}};
  U.defeatAnimation=()=>document.getElementById('battleEnemyImg')?.classList.add('defeat');
  U.result=(title,text,onClick)=>{const r=document.getElementById('battleResult'),t=document.getElementById('battleResultTitle'),p=document.getElementById('battleResultText'),b=document.getElementById('battleResultButton');if(!r)return;if(t)t.textContent=title;if(p)p.textContent=text;if(b){b.onclick=onClick;}r.classList.add('show');};
  window.BattleUI=U;
})();