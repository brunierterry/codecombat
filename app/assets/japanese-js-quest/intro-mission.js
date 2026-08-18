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
    title: 'こんにちは、女神さま！',
    concept: 'はじめての関数：話す',
    story: 'まずはヒーローに、女神さまへあいさつしてもらおう。宝石を集めると、魔法使いは経験値をもらって強くなります。',
    instructions: [
      '`hero.say(...)` は、ヒーローに言葉を話してもらう命令です。',
      'コードはもう完成しています。「実行する」を押して、ふきだしを読んだら × で閉じましょう。',
    ],
    api: ['hero.say("Hello goddess!")'],
    starterCode: 'hero.say("Hello goddess!");',
    hints: ['このミッションはコードを直さなくてもクリアできます。「実行する」を押しましょう。'],
    solution: 'hero.say("Hello goddess!");',
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
      state: { sayText: 'Hello goddess!', maxMoves: 0 },
      syntax: [{ type: 'say', message: 'hero.say(...) を使ってあいさつしましょう。' }],
    },
  }
})
