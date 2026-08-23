(function (root, factory) {
  const api = factory()
  if (typeof module === 'object' && module.exports) module.exports = api
  else {
    root.JSQuestBossMechanics = api
    if (root.JSQuestEngine) api.apply(root.JSQuestEngine)
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict'

  const DEFAULT_DRAGON_RANGE = 3
  const PROTECTIVE_STATUE_RESOLUTION = 'protective-statue'
  const FROG_LEVER_MESSAGE = 'カエルの姿ではレバーを動かせないよ。人の姿に戻ってから使おう。'
  const CARDINAL_DIRECTIONS = Object.freeze({
    right: [1, 0],
    left: [-1, 0],
    down: [0, 1],
    up: [0, -1],
  })

  function isBossMission (mission) {
    return Boolean(mission && mission.bossEncounter && mission.variants?.some(variant => variant.boss))
  }

  function normalizeRow (row) {
    return String(row)
      .replace(/B/g, 'E')
      .replace(/P/g, '#')
      .replace(/L/g, '.')
  }

  function sameCell (left, right) {
    return left && right && Number(left.x) === Number(right.x) && Number(left.y) === Number(right.y)
  }

  function mapTile (variant, x, y) {
    if (!variant?.map?.[y] || x < 0 || x >= variant.map[y].length) return '#'
    return variant.map[y][x]
  }

  function mapTileWithState (variant, boss, state, x, y) {
    if (state?.protectiveStatueRaised && sameCell(boss?.protectiveStatue, { x, y })) return 'S'
    return mapTile(variant, x, y)
  }

  function blocksDragonFire (tile) {
    return tile === '#' || tile === 'P' || tile === 'S'
  }

  function dragonRange (boss) {
    const configured = Number(boss?.attackRange)
    return Number.isFinite(configured) && configured > 0 ? Math.floor(configured) : DEFAULT_DRAGON_RANGE
  }

  function dragonRayCells (variant, boss, direction, state) {
    const delta = CARDINAL_DIRECTIONS[direction]
    if (!variant || !boss?.dragon || !delta) return []
    const range = dragonRange(boss)
    const cells = []

    for (let step = 1; step <= range; step++) {
      const x = boss.dragon.x + (delta[0] * step)
      const y = boss.dragon.y + (delta[1] * step)
      if (blocksDragonFire(mapTileWithState(variant, boss, state, x, y))) break
      cells.push({ x, y })
    }
    return cells
  }

  function directionTowardHero (boss, frame) {
    if (!boss?.dragon || !frame) return null
    const dx = Number(frame.x) - Number(boss.dragon.x)
    const dy = Number(frame.y) - Number(boss.dragon.y)
    if (dy === 0 && dx > 0) return 'right'
    if (dy === 0 && dx < 0) return 'left'
    if (dx === 0 && dy > 0) return 'down'
    if (dx === 0 && dy < 0) return 'up'
    return null
  }

  function dragonThreat (variant, boss, frame, state) {
    const direction = directionTowardHero(boss, frame)
    if (!direction) return { hit: false, direction: null, fireCells: [] }
    const fireCells = dragonRayCells(variant, boss, direction, state)
    return {
      hit: fireCells.some(cell => sameCell(cell, frame)),
      direction,
      fireCells,
    }
  }

  function replaceCell (rows, cell, value) {
    if (!Array.isArray(rows) || !cell || !rows[cell.y] || cell.x < 0 || cell.x >= rows[cell.y].length) return rows
    const next = rows.slice()
    const row = next[cell.y]
    next[cell.y] = row.slice(0, cell.x) + value + row.slice(cell.x + 1)
    return next
  }

  function visualGrid (grid, boss, bossDefeated, fireCells, protectiveStatueRaised) {
    let rows = Array.isArray(grid) ? grid.slice() : []
    if (bossDefeated) rows = replaceCell(rows, boss.dragon, '.')
    if (protectiveStatueRaised && boss.protectiveStatue) rows = replaceCell(rows, boss.protectiveStatue, 'S')
    for (const cell of fireCells || []) rows = replaceCell(rows, cell, 'T')
    return rows
  }

  function currentGridRows (state) {
    return state.grid.map(row => Array.isArray(row) ? row.join('') : String(row))
  }

  function raiseProtectiveStatue (state, boss) {
    const cell = boss.protectiveStatue
    if (!cell || !state.grid[cell.y] || state.grid[cell.y][cell.x] == null) return
    state.grid[cell.y][cell.x] = 'S'
  }

  function protectiveStatueOutcome (state, phase, action, boss) {
    if (state.form !== 'hero') {
      if (phase !== 'after' || action?.type !== 'move' || state.leverRefusalShown) return null
      state.leverRefusalShown = true
      return {
        trace: {
          type: 'say',
          speech: FROG_LEVER_MESSAGE,
          bossEvent: 'lever-refused',
          grid: visualGrid(currentGridRows(state), boss, false, [], state.protectiveStatueRaised),
        },
      }
    }

    if (state.protectiveStatueRaised) return null
    state.protectiveStatueRaised = true
    raiseProtectiveStatue(state, boss)
    if (phase !== 'after') return null
    return {
      trace: {
        type: 'protective-statue-raised',
        bossEvent: 'lever',
        grid: visualGrid(currentGridRows(state), boss, false, [], true),
      },
    }
  }

  function bossActionHook (variant) {
    const boss = variant.boss
    return function ({ state, phase, action }) {
      if (state.bossDefeated == null) state.bossDefeated = false
      if (state.dragonHit == null) state.dragonHit = false
      if (state.protectiveStatueRaised == null) state.protectiveStatueRaised = false
      if (state.alive === false) return null

      if (!state.bossDefeated && boss.lever && sameCell(state.hero, boss.lever)) {
        if (boss.resolution === PROTECTIVE_STATUE_RESOLUTION) {
          const outcome = protectiveStatueOutcome(state, phase, action, boss)
          if (outcome) return outcome
        } else {
          state.bossDefeated = true
          if (phase === 'after') {
            return {
              trace: {
                type: 'boss-defeated',
                bossEvent: 'lever',
                grid: visualGrid(currentGridRows(state), boss, true, [], state.protectiveStatueRaised),
              },
            }
          }
        }
      }

      if (state.bossDefeated) return null
      const threat = dragonThreat(variant, boss, state.hero, state)
      if (!threat.hit) return null

      state.dragonHit = true
      return {
        killHero: true,
        deathCause: 'dragon-fire',
        message: 'ドラゴンの炎に当たって、ヒーローが倒れました。',
        trace: {
          type: 'dragon-fire',
          dragonHit: true,
          fireDirection: threat.direction,
          fireCells: threat.fireCells.map(cell => Object.assign({}, cell)),
          dragon: Object.assign({}, boss.dragon),
          attackRange: dragonRange(boss),
          grid: visualGrid(currentGridRows(state), boss, false, threat.fireCells, state.protectiveStatueRaised),
        },
      }
    }
  }

  function normalizedMission (mission) {
    if (!isBossMission(mission)) return mission
    return Object.assign({}, mission, {
      variants: mission.variants.map(variant => {
        const normalized = Object.assign({}, variant, {
          map: variant.map.map(normalizeRow),
        })
        normalized.runtimeActionHook = bossActionHook(variant)
        return normalized
      }),
    })
  }

  function decorateBossResult (mission, result) {
    return result
  }

  function evaluateBoss (base, mission, result) {
    if (!isBossMission(mission) || !result?.ok) return base
    const messages = base.messages.slice()
    const stateRules = mission.requirements?.state || {}
    const state = result.state || {}
    const variant = mission.variants?.[state.variantIndex || 0] || mission.variants?.[0]
    const boss = variant?.boss

    if (stateRules.noDragonFire && state.dragonHit) {
      messages.push('ドラゴンの火は上下左右に' + dragonRange(boss) + 'マスまで届きます。ドラゴンから離れる方向へ進みましょう。')
    }
    if (stateRules.bossDefeated && !state.bossDefeated) {
      messages.push(boss?.lever
        ? 'まだドラゴンを倒していません。レバーを踏んで仕掛けを作動させよう。'
        : 'まだボスを倒したり捕まえたりしていません。')
    }
    if (stateRules.protectiveStatueRaised && !state.protectiveStatueRaised) {
      messages.push('人の姿でレバーを動かして、ドラゴンの上に炎をさえぎる像を出しましょう。')
    }

    return { passed: messages.length === 0, messages }
  }

  function apply (engine) {
    if (!engine || engine.__bossMechanicsApplied) return engine

    const baseCreateState = engine.createState.bind(engine)
    const baseSimulate = engine.simulate.bind(engine)
    const baseEvaluate = engine.evaluate.bind(engine)

    engine.createState = function (mission, variantIndex) {
      const state = baseCreateState(normalizedMission(mission), variantIndex)
      if (isBossMission(mission)) {
        state.bossDefeated = false
        state.dragonHit = false
        state.protectiveStatueRaised = false
      }
      return state
    }

    engine.simulate = function (code, mission, variantIndex) {
      return baseSimulate(code, normalizedMission(mission), variantIndex)
    }

    engine.evaluate = function (mission, result, code) {
      return evaluateBoss(baseEvaluate(mission, result, code), mission, result)
    }

    Object.defineProperty(engine, '__bossMechanicsApplied', { value: true })
    return engine
  }

  return Object.freeze({
    DEFAULT_DRAGON_RANGE,
    PROTECTIVE_STATUE_RESOLUTION,
    FROG_LEVER_MESSAGE,
    apply,
    isBossMission,
    normalizedMission,
    dragonRange,
    dragonRayCells,
    dragonThreat,
    decorateBossResult,
    evaluateBoss,
    visualGrid,
  })
})