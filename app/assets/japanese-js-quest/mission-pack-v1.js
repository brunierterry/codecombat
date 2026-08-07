(function (root, factory) {
  const types = typeof module === 'object' && module.exports
    ? require('./mission-types.js')
    : root.JSQuestMissionTypes
  const api = factory(types)
  if (typeof module === 'object' && module.exports) module.exports = api
  else {
    root.JSQuestMissionPackV1 = api
    if (root.JSQuestMissions) api.apply(root.JSQuestMissions, root.JSQuestCurriculumV3)
  }
})(typeof self !== 'undefined' ? self : this, function (missionTypes) {
  'use strict'

  if (!missionTypes) throw new Error('JSQuestMissionTypes is required')

  const STORAGE_KEY = 'japanese-js-quest-progress-v1'
  const CODE_KEY_PREFIX = 'japanese-js-quest-code-v1-'
  const MIGRATION_KEY = 'japanese-js-quest-mission-pack-v1-migrated'
  const INSERT_AFTER_ID = 1
  const INSERT_COUNT = 5
  const FINAL_MISSION_COUNT = 28

  const syntax = (type, message) => ({ type, message })

  const DRAGON_PILLAR_LEVER_SCENARIO = Object.freeze({
    map: [
      '############',
      '#B....P...G#',
      '#.....#....#',
      '#..H..#..L.#',
      '#.*........#',
      '############',
    ],
    sign: null,
    boss: {
      kind: 'dragon',
      dragon: { x: 1, y: 1 },
      pillar: { x: 6, y: 1 },
      lever: { x: 9, y: 3 },
      attackRange: 4,
      fireCells: [
        { x: 2, y: 1 },
        { x: 3, y: 1 },
        { x: 4, y: 1 },
        { x: 5, y: 1 },
      ],
      resolution: 'lever',
      defeatVisual: 'skull',
    },
  })

  function shiftedExistingId (id) {
    const value = Number(id)
    return value > INSERT_AFTER_ID ? value + INSERT_COUNT : value
  }

  function previousIdForFinalId (id) {
    const value = Number(id)
    if (value >= 2 && value <= 6) return 1
    return value >= 7 ? value - INSERT_COUNT : value
  }

  function adventureOne () {
    return {
      id: 2,
      type: 'adventure',
      practiceOf: 1,
      title: '宝石の一本道',
      concept: 'hero.move(direction) の練習',
      story: '細い通路の先に宝石とゴールがあります。右へ進んで両方にたどり着こう。',
      instructions: [
        '新しい文法はありません。MISSION 01 で使った `hero.move("right")` だけで進めます。',
        '宝石を取ってから、右のゴールまで進みましょう。',
      ],
      api: ['hero.move("right")', 'hero.move("left")'],
      starterCode: '// 宝石を取って、右のゴールまで進もう\nhero.move("right");\n',
      hints: [
        'hero.move("right"); を1回書くと、右へ1マス進みます。',
        'スタートからゴールまでは右へ5マスです。',
      ],
      solution: [
        'hero.move("right");',
        'hero.move("right");',
        'hero.move("right");',
        'hero.move("right");',
        'hero.move("right");',
      ].join('\n'),
      variants: [{ map: ['#########', '#H...*G.#', '#########'], sign: null }],
      requirements: {
        state: { goal: true, minGems: 1, maxMoves: 5 },
        syntax: [syntax('moveParameter', 'hero.move(...) に方向を渡しましょう。')],
      },
    }
  }

  function typoFix () {
    const solution = [
      'hero.move("right");',
      'hero.move("right");',
      'hero.transform("frog");',
      'hero.move("right");',
      'hero.move("right");',
    ].join('\n')

    return {
      id: 3,
      type: 'typo-fix',
      practiceOf: 1,
      title: 'こわれたカッコ',
      concept: 'タイポを見つけて直す',
      story: 'タイポ（Typo）は、1文字だけ入力をまちがえることです。たった1文字でもタイポがあると、コードは動きません。このミッションにはタイポが2つあります。',
      instructions: [
        'コードの中にある2つのタイポを見つけて、1文字ずつ正しく直しましょう。',
        '2つとも直して、カエルに変身し、宝石を取ってゴールまで進めばクリアです。',
      ],
      api: ['hero.move("right")', 'hero.transform("frog")'],
      starterCode: [
        '// タイポが2つあります。1文字ずつよく見よう',
        'hero.move("right");',
        'hero.move("right"];',
        'hero.transform("forg");',
        'hero.move("right");',
        'hero.move("right");',
      ].join('\n'),
      hints: [
        '1つ目は、開く記号と閉じる記号の形を比べてみよう。',
        'もう1つはカエルの英語です。カエルは "frog"。文字の順番をよく見てね。',
        '英語と日本語には、見た目がよく似ていても別の文字があります。今後は全角の（ ）などにも注意しよう。',
      ],
      solution,
      variants: [{ map: ['########', '#H..*G.#', '########'], sign: null }],
      requirements: {
        state: { goal: true, minGems: 1, maxMoves: 4, form: 'frog' },
        syntax: [
          syntax('moveParameter', 'hero.move(...) の書き方を正しく直しましょう。'),
          syntax('transform', 'hero.transform("frog") のタイポも直しましょう。'),
        ],
      },
    }
  }

  function logicFix () {
    const solution = [
      'hero.move("right");',
      'hero.move("left");',
      'hero.move("left");',
      'hero.move("left");',
      'hero.move("left");',
      'hero.move("left");',
    ].join('\n')

    return {
      id: 4,
      type: 'logic-fix',
      practiceOf: 1,
      title: '動くけど、ちがう！',
      concept: '動くコードの考え方を直す',
      story: 'エラーは出ません。でも、このままでは宝石を取らずにゴールへ行ってしまいます。',
      instructions: [
        'コードは文法的には正しいので実行できます。フィールドと動く順番を比べて、考え方のまちがいを直しましょう。',
        '右の宝石を先に取ってから、左のゴールへ進みます。',
      ],
      api: ['hero.move("right")', 'hero.move("left")'],
      starterCode: [
        '// 動くけれど、宝石を取れないコードです',
        'hero.move("left");',
        'hero.move("right");',
        'hero.move("left");',
        'hero.move("left");',
        'hero.move("left");',
        'hero.move("left");',
      ].join('\n'),
      hints: [
        '最初の2回の移動を、ヒーローと宝石の位置と比べてみよう。',
        '正しい最初の動きは右です。宝石を取ったら左へ戻ります。',
      ],
      solution,
      variants: [{ map: ['##########', '#G...H*..#', '##########'], sign: null }],
      requirements: {
        state: { goal: true, minGems: 1, maxMoves: 6 },
        syntax: [syntax('moveParameter', 'hero.move(...) の方向をフィールドに合わせましょう。')],
      },
    }
  }

  function adventureTwo () {
    const solution = [
      'hero.move("right");',
      'hero.move("right");',
      'hero.move("left");',
      'hero.move("left");',
      'hero.move("left");',
      'hero.move("left");',
      'hero.move("left");',
      'hero.move("left");',
    ].join('\n')

    return {
      id: 5,
      type: 'adventure',
      practiceOf: 1,
      title: '往復トンネル',
      concept: '方向を変えて何度も動く',
      story: '宝石は右、ゴールはずっと左。宝石を取ったら来た道を戻ろう。',
      instructions: [
        'MISSION 01 と同じ `hero.move(...)` だけを使います。',
        'まず右の宝石まで進み、そのあと左へ向きを変えてゴールまで戻ります。',
      ],
      api: ['hero.move("right")', 'hero.move("left")'],
      starterCode: [
        '// 右の宝石を取る',
        '',
        '// そのあと左のゴールまで戻る',
      ].join('\n'),
      hints: [
        '宝石までは右へ2マスです。',
        '宝石の場所からゴールまでは左へ6マスです。',
      ],
      solution,
      variants: [{ map: ['###########', '#G...H.*..#', '###########'], sign: null }],
      requirements: {
        state: { goal: true, minGems: 1, maxMoves: 8 },
        syntax: [syntax('moveParameter', 'hero.move(...) を使って往復しましょう。')],
      },
    }
  }

  function bossMission () {
    const solution = [
      'hero.move("right");',
      'hero.move("right");',
      'hero.move("right");',
      'hero.move("right");',
    ].join('\n')

    return {
      id: 6,
      type: 'boss',
      practiceOf: 1,
      title: '炎のドラゴン',
      concept: '覚えた横移動だけでドラゴンから逃げる',
      story: 'ドラゴンはヒーローを見つけると、上下左右のその方向へ4マスまで火を吐きます。近づかずに右へ逃げよう。',
      instructions: [
        'ドラゴンは、ヒーローが上下左右のどこかで4マス以内に入ると、その方向へ4マス火を吐きます。',
        '今はドラゴンから5マス離れているので安全です。ドラゴンへ近づかず、右へ逃げましょう。',
        '途中の宝石を取り、右のゴールまで逃げ切ればクリアです。使う命令は `hero.move("right")` だけです。',
      ],
      api: ['hero.move("right")', 'hero.move("left")'],
      starterCode: [
        '// ドラゴンから離れるように、右のゴールへ逃げよう',
        'hero.move("right");',
      ].join('\n'),
      hints: [
        '左へ1マス進むと、ドラゴンから4マスの場所に入って火が届きます。',
        'ゴールまでは右へ4マスです。同じ命令を必要な回数だけ使おう。',
      ],
      solution,
      variants: [{
        map: [
          '############',
          '#B....H.*.G#',
          '############',
        ],
        sign: null,
        boss: {
          kind: 'dragon',
          dragon: { x: 1, y: 1 },
          attackRange: 4,
          fireCells: [
            { x: 2, y: 1 },
            { x: 3, y: 1 },
            { x: 4, y: 1 },
            { x: 5, y: 1 },
          ],
          resolution: 'escape',
        },
      }],
      bossEncounter: true,
      bossResolution: 'escape',
      requirements: {
        state: { goal: true, minGems: 1, maxMoves: 4, noDragonFire: true },
        syntax: [syntax('moveParameter', 'hero.move(...) でドラゴンから右へ逃げましょう。')],
      },
    }
  }

  function practiceMissions () {
    return [adventureOne(), typoFix(), logicFix(), adventureTwo(), bossMission()]
  }

  function patchCurriculumMapping (curriculum) {
    if (!curriculum || curriculum.__missionPackV1MappingPatched) return curriculum
    const baseFinalForLegacy = curriculum.finalIdForLegacyId.bind(curriculum)
    const baseLegacyForFinal = curriculum.legacyIdForFinalId.bind(curriculum)

    curriculum.finalIdForLegacyId = function (legacyId) {
      return shiftedExistingId(baseFinalForLegacy(legacyId))
    }
    curriculum.legacyIdForFinalId = function (finalId) {
      const id = Number(finalId)
      if (id >= 2 && id <= 6) return 1
      return baseLegacyForFinal(previousIdForFinalId(id))
    }
    Object.defineProperty(curriculum, '__missionPackV1MappingPatched', { value: true })
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
      for (let oldId = 2; oldId <= 22; oldId++) {
        const value = localStorage.getItem(CODE_KEY_PREFIX + oldId)
        if (value != null) savedCodes.set(oldId, value)
      }
      for (let oldId = 2; oldId <= 22; oldId++) localStorage.removeItem(CODE_KEY_PREFIX + oldId)
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
    if (!Array.isArray(missions) || missions.__missionPackV1Applied) return missions

    for (const mission of missions) {
      const previousId = Number(mission.id)
      mission.prePracticeId = previousId
      missionTypes.setType(mission, missionTypes.TYPES.concept.code)
      mission.id = shiftedExistingId(previousId)
    }

    missions.push(...practiceMissions())
    missions.sort((left, right) => left.id - right.id)
    Object.defineProperty(missions, '__missionPackV1Applied', { value: true })

    patchCurriculumMapping(curriculum)
    if (typeof window !== 'undefined') migrateBrowserStorage()
    return missions
  }

  return Object.freeze({
    apply,
    practiceMissions,
    shiftedExistingId,
    previousIdForFinalId,
    patchCurriculumMapping,
    DRAGON_PILLAR_LEVER_SCENARIO,
    FINAL_MISSION_COUNT,
    INSERT_COUNT,
  })
})