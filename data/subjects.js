// 教科モンスターバトル：教科定義
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
(function(){
  function addScript(src){
    return new Promise(function(resolve,reject){
      if(document.querySelector('script[src="'+src+'"]')){resolve();return;}
      const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=reject;document.head.appendChild(s);
    });
  }
  function load(){
    if(window.__BATTLE_MODULE_LOADING__)return;
    window.__BATTLE_MODULE_LOADING__=true;
    const link=document.createElement('link');link.rel='stylesheet';link.href='css/battle.css';document.head.appendChild(link);
    addScript('data/monsters.js').then(function(){return addScript('data/cards.js');}).then(function(){return addScript('js/battle-ui.js');}).then(function(){return addScript('js/battle.js');}).catch(function(err){console.error('Battle modules failed to load',err);});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});else load();
})();