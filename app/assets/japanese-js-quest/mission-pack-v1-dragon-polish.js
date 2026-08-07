(function (root, factory) {
  const missionPack = typeof module === 'object' && module.exports
    ? require('./mission-pack-v1.js')
    : root.JSQuestMissionPackV1
  const api = factory(missionPack)
  if (typeof module === 'object' && module.exports) module.exports = api
  else {
    root.JSQuestDragonPolish = api
    if (root.JSQuestMissions) api.apply(root.JSQuestMissions)
  }
})(typeof self !== 'undefined' ? self : this, function (missionPack) {
  'use strict'

  const MISSION_ID = 6
  const DRAGON_RANGE = 3

  function threeFireCellsToRight (dragon) {
    return [
      { x: dragon.x + 1, y: dragon.y },
      { x: dragon.x + 2, y: dragon.y },
      { x: dragon.x + 3, y: dragon.y },
    ]
  }

  function normalizePreservedScenario () {
    const boss = missionPack?.DRAGON_PILLAR_LEVER_SCENARIO?.boss
    if (!boss?.dragon) return
    boss.attackRange = DRAGON_RANGE
    boss.fireCells = threeFireCellsToRight(boss.dragon)
  }

  function apply (missions) {
    normalizePreservedScenario()
    if (!Array.isArray(missions)) return null
    const mission = missions.find(item => item.id === MISSION_ID && item.type === 'boss')
    if (!mission || mission.__dragonPolishApplied) return mission || null

    const oldStarter = mission.starterCode
    mission.originalStarterCode = mission.originalStarterCode || oldStarter
    mission.story = 'ドラゴンはヒーローを見つけると、上下左右のその方向へ3マスまで火を吐きます。火に当たるとヒーローは倒れてしまいます。右へ逃げよう。'
    mission.instructions = [
      'ドラゴンは、ヒーローが上下左右のどこかで3マス以内に入ると、その方向へ3マス火を吐きます。火の届く3つのマスには炎が広がります。',
      '今はドラゴンから5マス離れています。左へ近づくと危険です。ドラゴンから離れる右方向へ逃げましょう。',
      '途中の宝石を取り、右のゴールまで逃げ切ればクリアです。使う命令は `hero.move(...)` だけです。',
    ]
    mission.starterCode = [
      '// このまま実行すると、ドラゴンに近づいてしまいます',
      'hero.move("left");',
      'hero.move("left");',
      'hero.move("left");',
    ].join('\n')
    mission.hints = [
      'ドラゴンから4マスの場所までは火が届きません。でも、あと1マス近づくと3マス以内に入り、炎が届きます。',
      'ドラゴンと反対の右へ進みましょう。ゴールまでは右へ4マスです。',
    ]

    const variant = mission.variants?.[0]
    const boss = variant?.boss
    if (boss?.dragon) {
      boss.attackRange = DRAGON_RANGE
      boss.fireCells = threeFireCellsToRight(boss.dragon)
    }

    Object.defineProperty(mission, '__dragonPolishApplied', { value: true })
    return mission
  }

  return Object.freeze({
    MISSION_ID,
    DRAGON_RANGE,
    apply,
  })
})
