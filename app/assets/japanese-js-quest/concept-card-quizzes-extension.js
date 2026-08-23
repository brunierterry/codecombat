(function (root, factory) {
  const base = typeof module === 'object' && module.exports
    ? require('./concept-card-quizzes.js')
    : root.JSQuestConceptCardQuizzes
  const api = factory(base)
  if (typeof module === 'object' && module.exports) module.exports = api
  else root.JSQuestConceptCardQuizzes = api
})(typeof self !== 'undefined' ? self : this, function (base) {
  'use strict'

  if (!base) throw new Error('JSQuestConceptCardQuizzes must be loaded before its extension')

  function question (prompt, answer, wrongChoices) {
    return Object.freeze({
      prompt,
      answer,
      choices: Object.freeze([answer, ...wrongChoices])
    })
  }

  const replacementQuizzes = Object.freeze({
    'concept-card-004': Object.freeze([
      question('" " の中に書いたものは何になりますか？', '文字列の値', ['新しいメソッド', 'コメント']),
      question('文字列の中の Hello goddess! はどう扱われますか？', '文字そのもの', ['JavaScript の命令', '変数の名前だけ'])
    ]),
    'concept-card-005': Object.freeze([
      question('hero.move(direction) は何をしますか？', '主人公を指定した方向へ動かす', ['主人公に話させる', 'ページを再読み込みする']),
      question('hero.move(...) を1回呼ぶと何マス進みますか？', '1マス', ['3マス', 'ゴールまで全部']),
      question('何マスも進みたいときはどうしますか？', '進む回数だけ hero.move(...) を呼ぶ', ['一度だけ呼ぶ', 'コメントに書くだけ'])
    ]),
    'concept-card-012': Object.freeze([
      question('hero.readSign() は何をするメソッドですか？', '看板に書かれた文字をコードで使えるようにする', ['主人公を変身させる', 'ページを再読み込みする']),
      question('const direction = hero.readSign(); と書くと、看板の文字を何という名前で使えますか？', 'direction', ['hero', 'const'])
    ]),
    'concept-card-016': Object.freeze([
      question('戻り値とは何ですか？', 'メソッドが調べた結果として返してくる値', ['コメントの色', 'ミッション番号']),
      question('hero.look("right") の戻り値の例は？', '"gem"', ['Ctrl+F5', 'JavaScript editor'])
    ]),
    'concept-card-028': Object.freeze([
      question('hero.isAtGoal() はゴールに着いているとき何を返しますか？', 'true', ['false', '"goal" だけ']),
      question('! はブール値をどうしますか？', 'true と false を反対にする', ['数字を1増やす', '文字列を作る'])
    ]),
    'concept-card-029': Object.freeze([
      question('distance > 0 の > は何を調べますか？', '左の数が右の数より大きいか', ['二つの文字列をつなぐか', '値を固定するか']),
      question('保存した distance はどこで再利用できますか？', 'for の繰り返す回数', ['CSSの色だけ', 'ブラウザーのタイトルだけ'])
    ]),
    'concept-card-030': Object.freeze([
      question('二重ループの外側は何を数えますか？', '段', ['文字列の引用符', 'ブラウザーのタブ']),
      question('内側のループは何を繰り返しますか？', '一つの段の移動', ['ミッションの再読み込み', 'カードの保存']),
      question('条件 ? 値1 : 値2 は何をしますか？', '条件によって二つの値から一つを選ぶ', ['必ず二つの値を足す', 'コメントを消す'])
    ])
  })

  const additionalQuizzes = Object.freeze({
    'concept-card-037': Object.freeze([
      question(
        'JavaScript は何のためのことばですか？',
        'コンピューターにしてほしいことを伝えるため',
        ['宝石の色を決めるため', 'ブラウザーを閉じるため']
      ),
      question(
        'この冒険では JavaScript で何をしますか？',
        'ヒーローに命令する',
        ['カードを印刷する', '画面の明るさを変える']
      )
    ]),
    'concept-card-038': Object.freeze([
      question(
        'Editor は何をする場所ですか？',
        'コードを読んだり書いたり直したりする場所',
        ['宝石を置くだけの場所', 'ミッションを消す場所']
      ),
      question(
        'Editor に書いたコードを動かすにはどうしますか？',
        '実行するを押す',
        ['Editor を閉じる', 'コメントだけを書く']
      )
    ]),
    'concept-card-039': Object.freeze([
      question('hero.canMove(direction) は何を調べますか？', 'その方向へ進めるか', ['宝石の数', '看板の色']),
      question('進めないとき hero.canMove(...) は何を返しますか？', 'false', ['true', '"wall" だけ'])
    ])
  })

  function getQuiz (cardId) {
    return replacementQuizzes[cardId] || additionalQuizzes[cardId] || base.getQuiz(cardId)
  }

  function allQuizzes () {
    return Object.freeze(Object.assign({}, base.allQuizzes(), replacementQuizzes, additionalQuizzes))
  }

  return Object.freeze({
    getQuiz,
    allQuizzes
  })
})