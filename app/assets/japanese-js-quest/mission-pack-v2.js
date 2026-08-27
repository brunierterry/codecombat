(function (root, factory) {
  const api = factory()
  if (typeof module === 'object' && module.exports) module.exports = api
  else {
    root.JSQuestMissionPackV2 = api
    if (root.JSQuestMissions) api.apply(root.JSQuestMissions, root.JSQuestCurriculumV3)
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict'

  const STORAGE_KEY = 'japanese-js-quest-progress-v1'
  const CODE_KEY_PREFIX = 'japanese-js-quest-code-v1-'
  const MIGRATION_KEY = 'japanese-js-quest-mission-pack-v2-migrated'
  const INSERT_AFTER_ID = 7
  const INSERT_COUNT = 2
  const FINAL_MISSION_COUNT = 30

  const syntax = (type, message) => ({ type, message })

  function shiftedExistingId (id) {
    const value = Number(id)
    return value > INSERT_AFTER_ID ? value + INSERT_COUNT : value
  }

  function previousIdForFinalId (id) {
    const value = Number(id)
    if (value === 8 || value === 9) return INSERT_AFTER_ID
    return value >= 10 ? value - INSERT_COUNT : value
  }

  function patchMissionSeven (missions) {
    const mission = missions.find(item => Number(item.id) === 7)
    if (!mission) return null

    const movementApis = [
      'hero.move("up")',
      'hero.move("right")',
      'hero.move("down")',
      'hero.move("left")',
    ]
    const otherApis = (mission.api || []).filter(item => !item.startsWith('hero.move('))
    mission.api = [...movementApis, ...otherApis]
    return mission
  }

  function typoMission () {
    const solution = [
      'hero.move("right");',
      'hero.move("right");',
      'hero.move("right");',
      'hero.move("down");',
      'hero.move("down");',
      'hero.move("down");',
      'hero.move("down");',
    ].join('\n')

    return {
      id: 8,
      type: 'typo-fix',
      practiceOf: 7,
      title: 'まちがった down',
      concept: '方向のタイポを1文字直す',
      story: '道順は合っていますが、下へ進む direction のつづりが1か所だけまちがっています。',
      instructions: [
        'コードにはタイポが1つだけあります。MISSION 07 で使った上下左右の方向を思い出して直しましょう。',
        '宝石を取って、そのまま下のゴールまで進めばクリアです。',
      ],
      api: [
        'hero.move("up")',
        'hero.move("right")',
        'hero.move("down")',
        'hero.move("left")',
      ],
      starterCode: [
        '// タイポは1か所だけ。下へ進む direction をよく見よう',
        'hero.move("right");',
        'hero.move("right");',
        'hero.move("right");',
        'hero.move("dwon");',
        'hero.move("down");',
        'hero.move("down");',
        'hero.move("down");',
      ].join('\n'),
      hints: [
        '下は英語で down です。4文字の順番を見比べてみよう。',
        '`dwon` ではなく `down` にすると、下へ進めます。',
      ],
      solution,
      variants: [{
        map: [
          '#######',
          '#H....#',
          '#.....#',
          '#...*.#',
          '#.....#',
          '#...G.#',
          '#######',
        ],
        sign: null,
      }],
      requirements: {
        state: { goal: true, minGems: 1, maxMoves: 7 },
        syntax: [syntax('moveParameter', 'hero.move(...) の direction のタイポを直しましょう。')],
      },
    }
  }

  function bossMission () {
    const solution = [
      'hero.move("up");',
      'hero.move("up");',
      'hero.move("up");',
      'hero.move("up");',
      'hero.move("up");',
      'hero.move("up");',
      'hero.move("right");',
      'hero.move("right");',
      'hero.move("right");',
      'hero.move("right");',
      'hero.move("right");',
      'hero.move("right");',
      'hero.move("right");',
      'hero.move("right");',
      'hero.move("down");',
      'hero.move("down");',
      'hero.move("down");',
      'hero.move("down");',
      'hero.move("down");',
      'hero.move("down");',
      'hero.move("right");',
    ].join('\n')

    return {
      id: 9,
      type: 'boss',
      practiceOf: 7,
      title: '炎をまわりこめ',
      concept: '上下左右の移動でドラゴンを迂回する',
      story: '宝石とゴールは右に見えます。でも、まっすぐ進むと中央のドラゴンの炎が下まで届きます。',
      instructions: [
        'ドラゴンは、ヒーローが上下左右の同じ列や行で3マス以内に入ると、その方向へ炎を吐きます。',
        'ドラゴンの左・上・右には、1マス空けて石の壁があります。壁の向こう側まで大きく回り込みましょう。',
        '下の道をまっすぐ右へ進むと炎に当たります。上へ回り、ドラゴンの向こう側へ出てから宝石とゴールへ向かいましょう。',
      ],
      api: [
        'hero.move("up")',
        'hero.move("right")',
        'hero.move("down")',
        'hero.move("left")',
      ],
      starterCode: [
        '// まっすぐ右へ行くと、ドラゴンの炎が届いてしまう！',
        'hero.move("right");',
        'hero.move("right");',
        'hero.move("right");',
        'hero.move("right");',
        'hero.move("right");',
      ].join('\n'),
      hints: [
        'ドラゴンの真下を通ると、下向きの炎が3マス先まで届きます。',
        'まず上へ6マス進み、上の壁より向こう側の列を通って右側へ回り込むと安全です。',
        '上で右へ8マス進み、下へ6マス進むと宝石です。最後に右へ1マス進めばゴールです。',
      ],
      solution,
      variants: [{
        map: [
          '#############',
          '#...........#',
          '#.....#.....#',
          '#...........#',
          '#...#.B.#...#',
          '#...........#',
          '#...........#',
          '#H.......*G.#',
          '#############',
        ],
        sign: null,
        boss: {
          kind: 'dragon',
          dragon: { x: 6, y: 4 },
          attackRange: 3,
          resolution: 'escape',
        },
      }],
      bossEncounter: true,
      bossResolution: 'escape',
      requirements: {
        state: { goal: true, minGems: 1, maxMoves: 21, noDragonFire: true },
        syntax: [syntax('moveParameter', 'hero.move(...) を使ってドラゴンを大きく回り込みましょう。')],
      },
    }
  }

  function reinforcementMissions () {
    return [typoMission(), bossMission()]
  }

  function patchCurriculumMapping (curriculum) {
    if (!curriculum || curriculum.__missionPackV2MappingPatched) return curriculum
    const baseFinalForLegacy = curriculum.finalIdForLegacyId.bind(curriculum)
    const baseLegacyForFinal = curriculum.legacyIdForFinalId.bind(curriculum)

    curriculum.finalIdForLegacyId = function (legacyId) {
      return shiftedExistingId(baseFinalForLegacy(legacyId))
    }
    curriculum.legacyIdForFinalId = function (finalId) {
      const id = Number(finalId)
      if (id === 8 || id === 9) return baseLegacyForFinal(INSERT_AFTER_ID)
      return baseLegacyForFinal(previousIdForFinalId(id))
    }
    Object.defineProperty(curriculum, '__missionPackV2MappingPatched', { value: true })
    return curriculum
  }

  function deriveUnlocked (completed, missionCount) {
    const complete = new Set(completed)
    let unlocked = 1
    while (unlocked < missionCount && complete.has(unlocked - 1)) unlocked++
    return unlocked
  }

  function migrateBrowserStorage () {
    if (typeof localStorage === 'undefined' || localStorage.getItem(MIGRATION_KEY) === 'done') return

    try {
      const savedCodes = new Map()
      for (let oldId = 8; oldId <= 27; oldId++) {
        const value = localStorage.getItem(CODE_KEY_PREFIX + oldId)
        if (value != null) savedCodes.set(oldId, value)
      }
      for (let oldId = 8; oldId <= 27; oldId++) localStorage.removeItem(CODE_KEY_PREFIX + oldId)
      for (const [oldId, value] of savedCodes) {
        localStorage.setItem(CODE_KEY_PREFIX + shiftedExistingId(oldId), value)
      }

      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
      const completed = Array.isArray(saved.completed)
        ? Array.from(new Set(saved.completed.map(Number).map(id => shiftedExistingId(id))))
          .filter(id => Number.isInteger(id) && id >= 0 && id < FINAL_MISSION_COUNT)
          .sort((left, right) => left - right)
        : []
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        completed,
        unlocked: deriveUnlocked(completed, FINAL_MISSION_COUNT),
      }))
      localStorage.setItem(MIGRATION_KEY, 'done')
    } catch (_) {
      // Keep the campaign usable when browser storage is unavailable or malformed.
    }
  }

  function apply (missions, curriculum) {
    if (!Array.isArray(missions) || missions.__missionPackV2Applied) return missions

    patchMissionSeven(missions)
    for (const mission of missions) {
      const previousId = Number(mission.id)
      if (previousId <= INSERT_AFTER_ID) continue
      mission.preReinforcementPackV2Id = previousId
      mission.id = shiftedExistingId(previousId)
    }

    missions.push(...reinforcementMissions())
    missions.sort((left, right) => left.id - right.id)
    Object.defineProperty(missions, '__missionPackV2Applied', { value: true })

    patchCurriculumMapping(curriculum)
    if (typeof window !== 'undefined') migrateBrowserStorage()
    return missions
  }

  return Object.freeze({
    apply,
    reinforcementMissions,
    shiftedExistingId,
    previousIdForFinalId,
    patchMissionSeven,
    patchCurriculumMapping,
    FINAL_MISSION_COUNT,
    INSERT_COUNT,
  })
})
