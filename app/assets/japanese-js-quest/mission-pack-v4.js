(function (root, factory) {
  const api = factory()
  if (typeof module === 'object' && module.exports) module.exports = api
  else {
    root.JSQuestMissionPackV4 = api
    if (root.JSQuestMissions) api.apply(root.JSQuestMissions, root.JSQuestCurriculumV3)
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict'

  const STORAGE_KEY = 'japanese-js-quest-progress-v1'
  const CODE_KEY_PREFIX = 'japanese-js-quest-code-v1-'
  const MIGRATION_KEY = 'japanese-js-quest-mission-pack-v4-migrated'
  const INSERT_AFTER_ID = 16
  const INSERT_COUNT = 3
  const FINAL_MISSION_COUNT = 35
  const SOURCE_CONCEPT_ID = 7

  const syntax = (type, message) => ({ type, message })

  function shiftedExistingId (id) {
    const value = Number(id)
    return value > INSERT_AFTER_ID ? value + INSERT_COUNT : value
  }

  function previousIdForFinalId (id) {
    const value = Number(id)
    if (value >= 17 && value <= 19) return INSERT_AFTER_ID
    return value >= 20 ? value - INSERT_COUNT : value
  }

  function syntaxRepairMission () {
    const solution = [
      'const direction = hero.readSign();',
      '',
      'if (direction === "up") {',
      '  hero.move("up");',
      '  hero.move("up");',
      '} else {',
      '  hero.move("right");',
      '  hero.move("right");',
      '}',
    ].join('\n')

    return {
      id: 17,
      type: 'typo-fix',
      practiceOf: 16,
      prePracticeId: SOURCE_CONCEPT_ID,
      title: 'if と else の修理',
      concept: 'if / else の構文エラーを直す',
      story: '考え方は合っていますが、if と else のつなぎ方がこわれていて、コードを実行できません。',
      instructions: [
        'コードの意味は変えずに、if と else の `{ }` を正しくつないで構文エラーを直しましょう。',
        '同じコードで、看板が `up` のフィールドと `right` のフィールドを両方クリアします。',
      ],
      api: [
        'hero.readSign()',
        'hero.move("up")',
        'hero.move("right")',
      ],
      starterCode: [
        'const direction = hero.readSign();',
        '',
        '// if と else のつなぎ方に、構文のまちがいが1つあります',
        'if (direction === "up") {',
        '  hero.move("up");',
        '  hero.move("up");',
        'else {',
        '  hero.move("right");',
        '  hero.move("right");',
        '}',
      ].join('\n'),
      hints: [
        '`else` は、if の `{ ... }` が終わったあとに続きます。',
        'if 側を閉じる `}` がどこに必要か見てみよう。',
      ],
      solution,
      variants: [
        {
          map: [
            '#######',
            '#..G..#',
            '#..*..#',
            '#..H..#',
            '#######',
          ],
          sign: 'up',
        },
        {
          map: [
            '#######',
            '#.....#',
            '#.....#',
            '#..H*G#',
            '#######',
          ],
          sign: 'right',
        },
      ],
      victoryConditions: [
        { id: 'max-moves', label: '移動：最大 2 回' },
      ],
      requirements: {
        state: { goal: true, minGems: 1, maxMoves: 2 },
        syntax: [
          syntax('if', 'if を残して直しましょう。'),
          syntax('else', 'else を残して直しましょう。'),
          syntax('comparison', '=== で看板の値を比べましょう。'),
          syntax('readSign', 'hero.readSign() で看板を読みましょう。'),
        ],
      },
    }
  }

  function lilyRiverAdventure () {
    const solution = [
      'hero.move("up");',
      'hero.transform("frog");',
      'hero.move("up");',
      'hero.move("up");',
      'hero.move("up");',
      'hero.move("up");',
      'hero.transform("hero");',
      'hero.move("up");',
    ].join('\n')

    return {
      id: 18,
      type: 'adventure',
      practiceOf: 16,
      prePracticeId: SOURCE_CONCEPT_ID,
      title: 'スイレンの川',
      concept: '姿を使い分けて川とドアを越える',
      story: '向こう岸のドアがゴールです。でも橋はなく、川にはスイレンの葉だけが浮かんでいます。',
      instructions: [
        'まずフィールドを見て、自分で渡り方を考えてみましょう。',
        'スイレンの葉やゴールのドアへ進めないときは、ヒーローのふきだしを読んでください。そこに大切なヒントがあります。',
        '宝石を取って、上のドアを通ればクリアです。',
      ],
      api: [
        'hero.move("up")',
        'hero.move("right")',
        'hero.move("down")',
        'hero.move("left")',
        'hero.transform("frog")',
        'hero.transform("hero")',
      ],
      starterCode: [
        '// 向こう岸のドアまで行こう',
        '// 進めない場所では、ヒーローのふきだしを読んでみよう',
        'hero.move("up");',
      ].join('\n'),
      hints: [
        'スイレンの葉は、人の姿には小さすぎます。姿を変える方法を思い出そう。',
        'スイレンの葉を渡るには `hero.transform("frog")` でカエルに変身します。',
        'ドアを通るには人の姿が必要です。向こう岸で `hero.transform("hero")` を使って人の姿に戻りましょう。',
      ],
      solution,
      variants: [{
        map: [
          '#########',
          '#...X...#',
          '#...*...#',
          '#WWWOWWW#',
          '#WWWOWWW#',
          '#WWWOWWW#',
          '#.......#',
          '#...H...#',
          '#########',
        ],
        sign: null,
      }],
      victoryConditions: [
        { id: 'max-moves', label: '移動：最大 6 回' },
      ],
      requirements: {
        state: { goal: true, minGems: 1, maxMoves: 6 },
        syntax: [
          syntax('transform', '姿を変える hero.transform(...) を使いましょう。'),
          syntax('moveParameter', 'hero.move(...) で川とドアを越えましょう。'),
        ],
      },
    }
  }

  function frogDragonBossMission () {
    const solution = [
      'const side = hero.readSign();',
      'const goLeft = side === "left" || side === "west";',
      'const confirmedLeft = goLeft && side !== "right";',
      '',
      'if (confirmedLeft) {',
      '  hero.move("left");',
      '  hero.move("left");',
      '  hero.move("left");',
      '} else {',
      '  hero.move("right");',
      '  hero.move("right");',
      '  hero.move("right");',
      '}',
      '',
      'hero.transform("frog");',
      'hero.move("up");',
      'hero.move("up");',
      'hero.move("up");',
      'hero.move("up");',
      '',
      'hero.transform("hero");',
      'hero.move("up");',
      'hero.move("up");',
      'hero.move("up");',
      'hero.move("up");',
    ].join('\n')

    const sharedRiverRows = [
      '#WWOWWWWWOWW#',
      '#WWOWWWWWOWW#',
      '#WWOWWWWWOWW#',
    ]

    return {
      id: 19,
      type: 'boss',
      practiceOf: 16,
      prePracticeId: SOURCE_CONCEPT_ID,
      title: 'カエルと封印のドラゴン',
      concept: 'if / else、AND、OR、変身を組み合わせる総合ボス',
      story: 'ドラゴンが川の向こうを守っています。看板が示す側には炎を止める柱があり、その先のレバーでドラゴンを封印できます。',
      instructions: [
        '同じコードで2つのフィールドをクリアします。看板を読み、`left` / `west` なら左、その他なら右のスイレンの道へ進みましょう。',
        '`||` で左を表す2つの言葉をまとめ、`&&` でもう1つの条件と組み合わせて、安全な側を選びます。',
        '川はカエルの姿でスイレンを渡り、向こう岸では人の姿に戻ります。',
        '柱の外側からドラゴンの横を通ってレバーを踏み、封印したら宝石を取ってゴールへ進みましょう。',
      ],
      api: [
        'hero.readSign()',
        'hero.transform("frog")',
        'hero.transform("hero")',
        'hero.move(direction)',
      ],
      starterCode: [
        'const side = hero.readSign();',
        'const goLeft = side === "left" || side === "west";',
        'const confirmedLeft = goLeft && side !== "right";',
        '',
        'if (confirmedLeft) {',
        '  // 左のスイレンの道へ進む',
        '} else {',
        '  // 右のスイレンの道へ進む',
        '}',
        '',
        '// カエルに変身して、スイレンを上へ渡ろう',
        '',
        '// 向こう岸で人の姿に戻って、レバーとゴールへ進もう',
      ].join('\n'),
      hints: [
        '`goLeft` は、看板が `left` または `west` のとき true になります。`confirmedLeft` では `&&` でもう1つの条件も確認します。',
        '左なら左へ3マス、右なら右へ3マス進み、カエルに変身してスイレンを上へ4マス渡ります。',
        '向こう岸で人の姿に戻したら、そのまま上へ4マス。正しい側なら柱が炎を止め、途中のレバーでドラゴンを封印できます。',
      ],
      solution,
      variants: [
        {
          map: [
            '#############',
            '#..G........#',
            '#..*........#',
            '#..L........#',
            '#...P.B.....#',
            '#...........#',
            ...sharedRiverRows,
            '#.....H.....#',
            '#############',
          ],
          sign: 'left',
          boss: {
            kind: 'dragon',
            dragon: { x: 6, y: 4 },
            pillar: { x: 4, y: 4 },
            lever: { x: 3, y: 3 },
            attackRange: 3,
            resolution: 'lever',
            defeatVisual: 'skull',
          },
        },
        {
          map: [
            '#############',
            '#........G..#',
            '#........*..#',
            '#........L..#',
            '#.....B.P...#',
            '#...........#',
            ...sharedRiverRows,
            '#.....H.....#',
            '#############',
          ],
          sign: 'right',
          boss: {
            kind: 'dragon',
            dragon: { x: 6, y: 4 },
            pillar: { x: 8, y: 4 },
            lever: { x: 9, y: 3 },
            attackRange: 3,
            resolution: 'lever',
            defeatVisual: 'skull',
          },
        },
      ],
      bossEncounter: true,
      bossResolution: 'lever',
      victoryConditions: [
        { id: 'max-moves', label: '移動：最大 11 回' },
      ],
      requirements: {
        state: { goal: true, minGems: 1, maxMoves: 11, noDragonFire: true, bossDefeated: true },
        syntax: [
          syntax('variable', 'const で看板の結果と条件に名前をつけましょう。'),
          syntax('if', 'if を使って進む側を選びましょう。'),
          syntax('else', 'else を使って反対側も処理しましょう。'),
          syntax('comparison', '=== や !== で看板の値を比べましょう。'),
          syntax('logicalOr', '|| で left と west をまとめましょう。'),
          syntax('logicalAnd', '&& で2つの条件を組み合わせましょう。'),
          syntax('readSign', 'hero.readSign() で看板を読みましょう。'),
          syntax('transform', 'カエルと人の姿を使い分けましょう。'),
          syntax('moveParameter', 'hero.move(...) で安全な道を進みましょう。'),
        ],
      },
    }
  }

  function reinforcementMissions () {
    return [syntaxRepairMission(), lilyRiverAdventure(), frogDragonBossMission()]
  }

  function patchCurriculumMapping (curriculum) {
    if (!curriculum || curriculum.__missionPackV4MappingPatched) return curriculum
    const baseFinalForLegacy = curriculum.finalIdForLegacyId.bind(curriculum)
    const baseLegacyForFinal = curriculum.legacyIdForFinalId.bind(curriculum)

    curriculum.finalIdForLegacyId = function (legacyId) {
      return shiftedExistingId(baseFinalForLegacy(legacyId))
    }
    curriculum.legacyIdForFinalId = function (finalId) {
      const id = Number(finalId)
      if (id >= 17 && id <= 19) return baseLegacyForFinal(INSERT_AFTER_ID)
      return baseLegacyForFinal(previousIdForFinalId(id))
    }
    Object.defineProperty(curriculum, '__missionPackV4MappingPatched', { value: true })
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
      for (let oldId = 17; oldId <= 31; oldId++) {
        const value = localStorage.getItem(CODE_KEY_PREFIX + oldId)
        if (value != null) savedCodes.set(oldId, value)
      }
      for (let oldId = 17; oldId <= 31; oldId++) localStorage.removeItem(CODE_KEY_PREFIX + oldId)
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
    if (!Array.isArray(missions) || missions.__missionPackV4Applied) return missions

    for (const mission of missions) {
      const previousId = Number(mission.id)
      if (previousId <= INSERT_AFTER_ID) continue
      mission.preReinforcementPackV4Id = previousId
      mission.id = shiftedExistingId(previousId)
    }

    missions.push(...reinforcementMissions())
    missions.sort((left, right) => left.id - right.id)
    Object.defineProperty(missions, '__missionPackV4Applied', { value: true })

    patchCurriculumMapping(curriculum)
    if (typeof window !== 'undefined') migrateBrowserStorage()
    return missions
  }

  return Object.freeze({
    apply,
    reinforcementMissions,
    shiftedExistingId,
    previousIdForFinalId,
    patchCurriculumMapping,
    FINAL_MISSION_COUNT,
    INSERT_COUNT,
  })
})
