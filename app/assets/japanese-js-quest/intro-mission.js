(function (root, factory) {
  const mission = factory()
  if (typeof module === 'object' && module.exports) module.exports = mission
  else if (root.JSQuestMissions && !root.JSQuestMissions.some(item => item.id === mission.id)) {
    root.JSQuestMissions.unshift(mission)
    if (typeof document !== 'undefined' && document.readyState === 'loading' && !root.JSQuestProgression) {
      document.write('<script src="progression.js"><\/script>')
    }
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict'

  return {
    id: 0,
    type: 'concept',
    title: 'こんにちは、女神さま！',
    concept: 'はじめての関数：話す',
    story: 'まずはヒーローに、女神さまへあいさつしてもらおう。宝石を集めると、魔法使いは経験値をもらって強くなります。',
    instructions: [
      '`hero.say(...)` は、ヒーローに言葉を話してもらう命令です。',
      'コードはもう完成しています。「実行する」を押して、ふきだしを読んだら × で閉じましょう。',
    ],
    api: ['hero.say("Hello goddess!")'],
    starterCode: '// goddess は「神さま・女神さま」の意味。ヒーローに自分の名前で呼ばれてもいいなら、「自分の名前 + sama」に変えてもいいよ。\nhero.say("Hello goddess!");',
    hints: ['このミッションはコードを直さなくてもクリアできます。「実行する」を押しましょう。'],
    solution: '// goddess は「神さま・女神さま」の意味。ヒーローに自分の名前で呼ばれてもいいなら、「自分の名前 + sama」に変えてもいいよ。\nhero.say("Hello goddess!");',
    variants: [{
      map: [
        '#########',
        '#.......#',
        '#...H...#',
        '#.......#',
        '#########',
      ],
      sign: null,
    }],
    requirements: {
      state: { maxMoves: 0 },
      syntax: [{ type: 'say', message: 'hero.say(...) を使ってあいさつしましょう。' }],
    },
  }
})
