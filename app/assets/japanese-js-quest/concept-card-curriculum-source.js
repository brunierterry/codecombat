(function (root, factory) {
  const base = typeof module === 'object' && module.exports
    ? require('./concept-card-library.js')
    : root.JSQuestConceptCards
  const api = factory(base)
  if (typeof module === 'object' && module.exports) module.exports = api
  else {
    root.JSQuestConceptCardsSource = api
    root.JSQuestConceptCards = api
  }
})(typeof self !== 'undefined' ? self : this, function (base) {
  'use strict'

  if (!base) throw new Error('JSQuestConceptCards must be loaded before the curriculum source')

  function tooltip (text, reading, extraClass) {
    return '<span class="glossary-token ' + (extraClass || '') + '" tabindex="0" role="button" data-tooltip="' +
      text + '（' + reading + '）">' + text + '</span>'
  }

  function card (id, missionId, titleHtml, bodyHtml) {
    return Object.freeze({ id, missionId, titleHtml, bodyHtml })
  }

  function semanticCard (id, ownerKey, titleHtml, bodyHtml) {
    return Object.freeze({ id, ownerKey, titleHtml, bodyHtml })
  }

  function guide (title, cardIds) {
    return Object.freeze({ title, cardIds: Object.freeze(cardIds) })
  }

  const replacementCards = Object.freeze([
    card(
      'concept-card-004',
      0,
      '<code>"Hello goddess!"</code> は文字列リテラル',
      'ふつう、ローマ字はプログラムの命令を書くために使います。でも <code>" "</code> の中に入れると、主人公の世界で使う「文字そのもの」になります。これは文字列という値です。'
    ),
    card(
      'concept-card-005',
      1,
      '<code>hero.move(direction)</code>',
      '<code>move</code> は動くメソッドです。パラメーター <code>direction</code> に <code>"left"</code> や <code>"right"</code> を渡して、動く方向を指定します。' +
        '<br><br>1回呼ぶと、ヒーローはその方向へ1マスだけ進みます。何マスも進みたいときは、進む回数だけこのメソッドを呼びます。'
    ),
    card(
      'concept-card-012',
      4,
      '<code>hero.readSign()</code> で看板を読む',
      '<code>hero.readSign()</code> を使うと、看板に書かれた <code>"right"</code> や <code>"left"</code> をコードで使えます。<code>const direction = hero.readSign();</code> のように書くと、その文字を <code>direction</code> という名前で使って、あとで <code>if</code> で比べられます。'
    ),
    card(
      'concept-card-016',
      6,
      tooltip('戻り値', 'もどりち') + '（' + tooltip('Return value', 'リターン・バリュー', 'tech-term') + '）と <code>hero.look(direction)</code>',
      'メソッドは行動するだけでなく、調べた結果を値として返すことがあります。この返ってくる値を ' + tooltip('戻り値', 'もどりち') + ' といいます。<code>hero.look("right")</code> は、となりのマスを調べて <code>"gem"</code> などの文字列を返すので、その値を <code>===</code> ですぐに比べられます。'
    ),
    card(
      'concept-card-028',
      15,
      '<code>hero.isAtGoal()</code> と <code>!</code>',
      '<code>hero.isAtGoal()</code> は、ゴールに着いていれば <code>true</code>、まだなら <code>false</code> を返します。先頭の <code>!</code> はブール値を反対にするので、<code>!hero.isAtGoal()</code> は「まだゴールではない」を表します。これを <code>while</code> の条件にすると、ゴールまで繰り返せます。'
    ),
    card(
      'concept-card-029',
      16,
      '<code>&gt;</code> で数を比較してから <code>for</code>',
      '<code>distance &gt; 0</code> の <code>&gt;</code> は、左の数が右の数より大きいかを調べる比較です。距離が 0 より大きい場合だけ <code>for</code> を始め、保存した <code>distance</code> を繰り返す回数として再利用します。'
    ),
    card(
      'concept-card-030',
      17,
      '二重ループと <code>条件 ? 値1 : 値2</code>',
      '二重ループでは、外側のループが段を数え、内側のループが一つの段の移動を繰り返します。<code>条件 ? 値1 : 値2</code> は、条件が正しければ値1、そうでなければ値2を選ぶ短い書き方です。'
    ),
  ])

  const additionalCards = Object.freeze([
    card(
      'concept-card-037',
      1,
      tooltip('JavaScript', 'ジャバスクリプト', 'tech-term') + ' は' +
        tooltip('プログラミング言語', 'ぷろぐらみんぐげんご'),
      tooltip('JavaScript', 'ジャバスクリプト', 'tech-term') + ' は、コンピューターにしてほしいことを、決められた言葉と書き方で伝える ' +
        tooltip('プログラミング言語', 'ぷろぐらみんぐげんご') + ' です。この冒険では、JavaScript でヒーローに命令します。'
    ),
    card(
      'concept-card-038',
      1,
      tooltip('Editor', 'エディター', 'tech-term') + ' はコードを書く場所',
      tooltip('Editor', 'エディター', 'tech-term') + ' は、プログラムのコードを読んだり、書いたり、直したりする場所です。ここに JavaScript を書き、<code>実行する</code> で動かします。'
    ),
    card(
      'concept-card-039',
      7,
      '<code>hero.canMove(direction)</code>',
      '<code>hero.canMove(direction)</code> は、その方向へ進めるかを調べるメソッドです。進めるなら <code>true</code>、壁などがあって進めないなら <code>false</code> を戻り値として返します。だから <code>if</code> や <code>&&</code> の条件にそのまま使えます。'
    ),
  ])

  const semanticCards = Object.freeze([
    semanticCard(
      'concept-card-040',
      'hero-transform-form',
      '<code>hero.transform(form)</code> で' + tooltip('姿', 'すがた') + 'を変える',
      '<code>hero.transform("frog")</code> でカエルの' + tooltip('姿', 'すがた') + 'に変わり、<code>hero.transform("hero")</code> で人の' + tooltip('姿', 'すがた') + 'に戻ります。' +
        'パラメーター <code>form</code> に、なりたい' + tooltip('姿', 'すがた') + 'を文字列で渡します。カエルなら軽いのでスイレンの葉を渡れますが、ドアを使うには人の' + tooltip('姿', 'すがた') + 'に戻る必要があります。'
    ),
  ])

  const replacementById = Object.freeze(Object.fromEntries(
    replacementCards.map(item => [item.id, item]),
  ))
  const additionalById = Object.freeze(Object.fromEntries(
    additionalCards.map(item => [item.id, item]),
  ))
  const semanticById = Object.freeze(Object.fromEntries(
    semanticCards.map(item => [item.id, item]),
  ))
  const cardsById = Object.freeze(Object.assign({}, base.cardsById, replacementById, additionalById, semanticById))

  const guideOverrides = Object.freeze({
    1: guide('JavaScript editor とコメント、新しいメソッド：動く', [
      'concept-card-037',
      'concept-card-038',
      'concept-card-036',
      'concept-card-005',
    ]),
    4: guide('看板の文字で最初の if を動かそう', [
      'concept-card-012',
      'concept-card-013',
      'concept-card-014',
    ]),
    6: guide('戻り値を初めて使って、となりを調べる', ['concept-card-016']),
    7: guide('進めるか調べて、二つの条件をつなぐ', [
      'concept-card-039',
      'concept-card-017',
    ]),
    15: guide('ゴールまで続ける条件を作る', ['concept-card-028']),
    16: guide('数を比較してからループを始める', ['concept-card-029']),
    17: guide('二重ループと条件で値を選ぶ書き方', ['concept-card-030']),
  })
  const missionGuides = Object.freeze(Object.assign({}, base.missionGuides, guideOverrides))
  const semanticGuides = Object.freeze({
    'hero-transform-form': guide('姿を変えて、できることを変える', ['concept-card-040']),
  })

  function getCard (id) {
    return cardsById[id] || null
  }

  function getMissionGuide (missionId) {
    const guideRecord = missionGuides[missionId]
    if (!guideRecord) return null
    return {
      title: guideRecord.title,
      cardIds: guideRecord.cardIds.slice(),
      cards: guideRecord.cardIds.map(getCard),
    }
  }

  function getSemanticGuide (ownerKey) {
    const guideRecord = semanticGuides[ownerKey]
    if (!guideRecord) return null
    return {
      title: guideRecord.title,
      cardIds: guideRecord.cardIds.slice(),
      cards: guideRecord.cardIds.map(getCard),
    }
  }

  function allCards () {
    return base.allCards()
      .map(item => replacementById[item.id] || item)
      .concat(additionalCards, semanticCards)
  }

  return Object.freeze({
    cardsById,
    missionGuides,
    semanticGuides,
    getCard,
    getMissionGuide,
    getSemanticGuide,
    allCards,
  })
})
