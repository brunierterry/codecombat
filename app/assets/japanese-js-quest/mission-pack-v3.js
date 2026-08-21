(function (root, factory) {
  const api = factory()
  if (typeof module === 'object' && module.exports) module.exports = api
  else {
    root.JSQuestMissionPackV3 = api
    if (root.JSQuestMissions) api.apply(root.JSQuestMissions, root.JSQuestCurriculumV3)
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict'

  const STORAGE_KEY = 'japanese-js-quest-progress-v1'
  const CODE_KEY_PREFIX = 'japanese-js-quest-code-v1-'
  const MIGRATION_KEY = 'japanese-js-quest-mission-pack-v3-migrated'
  const INSERT_AFTER_ID = 11
  const INSERT_COUNT = 2
  const FINAL_MISSION_COUNT = 32
  const SOURCE_CONCEPT_ID = 3

  const syntax = (type, message) => ({ type, message })

  function shiftedExistingId (id) {
    const value = Number(id)
    return value > INSERT_AFTER_ID ? value + INSERT_COUNT : value
  }

  function previousIdForFinalId (id) {
    const value = Number(id)
    if (value === 12 || value === 13) return INSERT_AFTER_ID
    return value >= 14 ? value - INSERT_COUNT : value
  }

  function patchMissionNine (missions) {
    const mission = missions.find(item => Number(item.id) === 9)
    if (!mission) return null

    mission.requirements = mission.requirements || {}
    mission.requirements.state = Object.assign({}, mission.requirements.state, { maxMoves: 21 })
    const existing = Array.isArray(mission.victoryConditions) ? mission.victoryConditions : []
    mission.victoryConditions = [
      { id: 'max-moves', label: '移動：最大 21 回' },
      ...existing.filter(item => item && item.id !== 'max-moves'),
    ]
    const limitInstruction = '21回以内の移動で、宝石を取ってゴールまでたどり着きましょう。'
    if (!mission.instructions.includes(limitInstruction)) mission.instructions.push(limitInstruction)
    return mission
  }

  function logicFixMission () {
    const solution = [
      'const direction = hero.readSign();',
      '',
      'if (direction === "right") {',
      '  hero.move("right");',
      '  hero.move("right");',
      '  hero.move("right");',
      '  hero.move("right");',
      '}',
      '',
      'if (direction === "left") {',
      '  hero.move("left");',
      '  hero.move("left");',
      '  hero.move("left");',
      '  hero.move("left");',
      '}',
    ].join('\n')

    return {
      id: 12,
      type: 'logic-fix',
      practiceOf: 11,
      prePracticeId: SOURCE_CONCEPT_ID,
      title: '反対に進んでる！',
      concept: 'if の中の進む方向を直す',
      story: 'コードはエラーなく動きます。でも、看板と反対の方向へ進んでしまいます。',
      instructions: [
        '看板が `right` なら右、`left` なら左へ進むように、if の中のロジックを直しましょう。',
        '同じコードで2つのフィールドをクリアし、宝石を取ってゴールへ進みます。',
      ],
      api: [
        'hero.readSign()',
        'hero.move("up")',
        'hero.move("right")',
        'hero.move("down")',
        'hero.move("left")',
      ],
      starterCode: [
        'const direction = hero.readSign();',
        '',
        '// コードは動くけど、進む方向が反対です',
        'if (direction === "right") {',
        '  hero.move("left");',
        '  hero.move("left");',
        '  hero.move("left");',
        '  hero.move("left");',
        '}',
        '',
        'if (direction === "left") {',
        '  hero.move("right");',
        '  hero.move("right");',
        '  hero.move("right");',
        '  hero.move("right");',
        '}',
      ].join('\n'),
      hints: [
        'if の条件は正しいです。まちがっているのは `{ }` の中の移動方向です。',
        '`right` の中では right、`left` の中では left へ進みます。',
      ],
      solution,
      variants: [
        { map: ['###########', '#....H..*G#', '###########'], sign: 'right' },
        { map: ['###########', '#G*..H....#', '###########'], sign: 'left' },
      ],
      victoryConditions: [
        { id: 'max-moves', label: '移動：最大 4 回' },
      ],
      requirements: {
        state: { goal: true, minGems: 1, maxMoves: 4 },
        syntax: [
          syntax('if', 'if を使って看板の方向を選びましょう。'),
          syntax('comparison', '=== で看板の文字を比べましょう。'),
          syntax('readSign', 'hero.readSign() で看板を読みましょう。'),
        ],
      },
    }
  }

  function conditionalDragonBossMission () {
    const solution = [
      'const direction = hero.readSign();',
      '',
      'if (direction === "right") {',
      '  hero.move("right");',
      '  hero.move("right");',
      '  hero.move("right");',
      '  hero.move("up");',
      '  hero.move("up");',
      '  hero.move("up");',
      '  hero.move("up");',
      '  hero.move("up");',
      '  hero.move("up");',
      '  hero.move("up");',
      '  hero.move("left");',
      '  hero.move("left");',
      '  hero.move("left");',
      '}',
      '',
      'if (direction === "left") {',
      '  hero.move("left");',
      '  hero.move("left");',
      '  hero.move("left");',
      '  hero.move("up");',
      '  hero.move("up");',
      '  hero.move("up");',
      '  hero.move("up");',
      '  hero.move("up");',
      '  hero.move("up");',
      '  hero.move("up");',
      '  hero.move("right");',
      '  hero.move("right");',
      '  hero.move("right");',
      '}',
    ].join('\n')

    return {
      id: 13,
      type: 'boss',
      practiceOf: 11,
      prePracticeId: SOURCE_CONCEPT_ID,
      title: '看板と炎のドラゴン',
      concept: 'if で安全な側を選んでドラゴンを迂回する',
      story: '看板は、ドラゴンの炎を止めてくれる柱が右と左のどちらにあるか教えてくれます。',
      instructions: [
        '看板が `right` のフィールドでは、ドラゴンの右側の柱が炎を止めます。右へ回り込んで、下から上へ進みましょう。',
        '看板が `left` のフィールドでは、左側の柱が炎を止めます。左へ回り込んで、下から上へ進みましょう。',
        '柱の外側を通れば、ドラゴンと同じ横列を通っても炎は柱で止まります。同じ if のコードで2つのフィールドをクリアしてください。',
        '13回以内の移動で宝石を取り、上のゴールへたどり着きましょう。',
      ],
      api: [
        'hero.readSign()',
        'hero.move("up")',
        'hero.move("right")',
        'hero.move("down")',
        'hero.move("left")',
      ],
      starterCode: [
        'const direction = hero.readSign();',
        '',
        'if (direction === "right") {',
        '  // 右の柱の外側を通って、下から上へ回りこもう',
        '}',
        '',
        'if (direction === "left") {',
        '  // 左の柱の外側を通って、下から上へ回りこもう',
        '}',
      ].join('\n'),
      hints: [
        'スタート地点からまっすぐ上へ進むと、ドラゴンの下向きの炎に入ります。まず横へ逃げましょう。',
        '`right` なら右へ3マス、`left` なら左へ3マス進むと、柱の外側の安全な列に入れます。',
        '安全な列を上へ7マス進み、最後に中央へ3マス戻ると、宝石を取ってゴールへ着きます。',
      ],
      solution,
      variants: [
        {
          map: [
            '#############',
            '#.....G*....#',
            '#...........#',
            '#...........#',
            '#.....B.#...#',
            '#...........#',
            '#...........#',
            '#...........#',
            '#.....H.....#',
            '#############',
          ],
          sign: 'right',
          boss: {
            kind: 'dragon',
            dragon: { x: 6, y: 4 },
            attackRange: 3,
            resolution: 'escape',
          },
        },
        {
          map: [
            '#############',
            '#....*G.....#',
            '#...........#',
            '#...........#',
            '#...#.B.....#',
            '#...........#',
            '#...........#',
            '#...........#',
            '#.....H.....#',
            '#############',
          ],
          sign: 'left',
          boss: {
            kind: 'dragon',
            dragon: { x: 6, y: 4 },
            attackRange: 3,
            resolution: 'escape',
          },
        },
      ],
      bossEncounter: true,
      bossResolution: 'escape',
      victoryConditions: [
        { id: 'max-moves', label: '移動：最大 13 回' },
      ],
      requirements: {
        state: { goal: true, minGems: 1, maxMoves: 13, noDragonFire: true },
        syntax: [
          syntax('if', 'if を使って看板が示す安全な側を選びましょう。'),
          syntax('comparison', '=== で `right` と `left` を比べましょう。'),
          syntax('readSign', 'hero.readSign() で看板を読みましょう。'),
          syntax('moveParameter', 'hero.move(...) で安全な道を進みましょう。'),
        ],
      },
    }
  }

  function reinforcementMissions () {
    return [logicFixMission(), conditionalDragonBossMission()]
  }

  function patchCurriculumMapping (curriculum) {
    if (!curriculum || curriculum.__missionPackV3MappingPatched) return curriculum
    const baseFinalForLegacy = curriculum.finalIdForLegacyId.bind(curriculum)
    const baseLegacyForFinal = curriculum.legacyIdForFinalId.bind(curriculum)

    curriculum.finalIdForLegacyId = function (legacyId) {
      return shiftedExistingId(baseFinalForLegacy(legacyId))
    }
    curriculum.legacyIdForFinalId = function (finalId) {
      const id = Number(finalId)
      if (id === 12 || id === 13) return baseLegacyForFinal(INSERT_AFTER_ID)
      return baseLegacyForFinal(previousIdForFinalId(id))
    }
    Object.defineProperty(curriculum, '__missionPackV3MappingPatched', { value: true })
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
      for (let oldId = 12; oldId <= 29; oldId++) {
        const value = localStorage.getItem(CODE_KEY_PREFIX + oldId)
        if (value != null) savedCodes.set(oldId, value)
      }
      for (let oldId = 12; oldId <= 29; oldId++) localStorage.removeItem(CODE_KEY_PREFIX + oldId)
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
    if (!Array.isArray(missions) || missions.__missionPackV3Applied) return missions

    patchMissionNine(missions)
    for (const mission of missions) {
      const previousId = Number(mission.id)
      if (previousId <= INSERT_AFTER_ID) continue
      mission.preReinforcementPackV3Id = previousId
      mission.id = shiftedExistingId(previousId)
    }

    missions.push(...reinforcementMissions())
    missions.sort((left, right) => left.id - right.id)
    Object.defineProperty(missions, '__missionPackV3Applied', { value: true })

    patchCurriculumMapping(curriculum)
    if (typeof window !== 'undefined') migrateBrowserStorage()
    return missions
  }

  return Object.freeze({
    apply,
    reinforcementMissions,
    shiftedExistingId,
    previousIdForFinalId,
    patchMissionNine,
    patchCurriculumMapping,
    FINAL_MISSION_COUNT,
    INSERT_COUNT,
  })
})
