# 教科モンスターバトル｜1問1とう

小学生向けの「1問とく → カードが攻撃！」型の一問一答バトル教材です。GitHub Pagesで動作し、ビルド工程や独自サーバーは不要です。

## 設計方針

この教材は `edu-kit` の役割分担を基準に、教材固有の処理と共通基盤を分離しています。

- `edu-components`：問題プール、正誤判定、得点、保存
- `edu-effects`：基本UI、学習UI、正誤表示、動き
- `1mon-1tou`：教科、問題、モンスター、カード、バトルルール

`index.html` は画面の骨格だけを持ち、ゲームロジックを持たせません。

## 構成

```text
index.html                 画面の骨格・読み込み
css/app.css                教材全体の最小CSS
css/battle.css             バトル固有CSS
js/app.js                  画面遷移・カード・保存・問題読み込み
js/battle.js               バトルエンジン

data/subjects.js           教科と対象学年
data/monsters.js            モンスター定義
data/cards.js               初期カード定義
data/questions/             学年・教科ごとの問題
assets/monsters/             モンスター画像
assets/cards/                カード素材
```

## バトル

学年と教科を選んでスタートします。1回のバトルでは、ザコ → 進化系 → ボスの3体と戦います。

問題に正解すると `edu-components` の `AnswerChecker` で判定し、カードが攻撃します。通常は1ダメージ、モンスターの得意教科と選択教科が一致すると2ダメージです。不正解はゲームオーバーにせず、ヒントを表示して同じ問題に再挑戦できます。

正解で10カードP、3体撃破で追加20カードP。間違えた問題は教材固有の保存領域へ記録します。

## 問題データ

問題は `data/questions/gradeX/subject.js` に置き、次の形式を基本とします。

```js
window.QUESTION_BANK = window.QUESTION_BANK || {};
window.QUESTION_BANK['1-japanese'] = [
  {
    id: 'g1-jp-001',
    grade: 1,
    subject: '国語',
    type: 'choice',
    question: '問題文',
    choices: ['A', 'B', 'C', 'D'],
    answer: 'A',
    hint: '考えるためのヒント'
  }
];
```

現在は1・2年生の国語、算数、生活の問題を同梱しています。3〜6年生は問題データを追加するだけで対応できます。

## カード

初回は3枚のカードでスタートします。カード画面では最大3枚のチームを編成できます。カードパックからモンスターを獲得すると所持カードへ追加されます。

カードとモンスターの定義はデータファイルへ分離しているため、後からレベル、属性、スキル、レアリティ、進化などを追加できます。

## 保存

保存には `edu-components` の `StorageManager` を使用し、namespaceは `1mon-1tou` としています。カードP、所持カード、チーム、間違えた問題を保存します。

## 開発ルール

新しい機能を追加するときは、まず `edu-kit` の設計原則と共通基盤を確認します。教材側に既存の共通部品と同じManagerや判定処理を作らないことを基本とします。

バトルの学習判定は `edu-components`、見た目と演出は `edu-effects`、教材固有のモンスター・カード・問題・ゲームルールは `1mon-1tou` に置きます。
