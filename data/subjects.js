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
