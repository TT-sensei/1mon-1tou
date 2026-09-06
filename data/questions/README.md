# 問題データ

問題は「学年 × 教科」で分離します。

例：
- `grade1/japanese.js`
- `grade1/math.js`
- `grade1/life.js`
- `grade2/life.js`
- `grade3/science.js`
- `grade6/social.js`

各問題は次の形を基本にします。

```js
{
  id: 'g1-life-001',
  grade: 1,
  subject: '生活',
  type: 'choice',
  question: '学校で そだてるものとして ただしいものは？',
  choices: ['あさがお', 'さかなのえさだけ', 'くるま'],
  answer: 'あさがお',
  hint: 'はなを さかせる しょくぶつだよ。'
}
```

算数の数値問題などは `type` を `numeric` にして `answer` を数値にできます。
