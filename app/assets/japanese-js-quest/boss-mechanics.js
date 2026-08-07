(function (root, factory) {
  const api = factory()
  if (typeof module === 'object' && module.exports) module.exports = api
  else {
    root.JSQuestBossMechanics = api
    if (root.JSQuestEngine) api.apply(root.JSQuestEngine)
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict'

  const DEFAULT_DRAGON_RANGE = 4
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

  function normalizedMission (mission) {
    if (!isBossMission(mission)) return mission
    return Object.assign({}, mission, {
      variants: mission.variants.map(variant => Object.assign({}, variant, {
        map: variant.map.map(normalizeRow),
      })),
    })
  }

  function sameCell (left, right) {
    return left && right && Number(left.x) === Number(right.x) && Number(left.y) === Number(right.y)
  }

  function mapTile (variant, x, y) {
    if (!variant?.map?.[y] || x < 0 || x >= variant.map[y].length) return '#'
    return variant.map[y][x]
  }

  function blocksDragonFire (tile) {
    return tile === '#' || tile === 'P'
  }

  function dragonRange (boss) {
    const configured = Number(boss?.attackRange)
    return Number.isFinite(configured) && configured > 0 ? Math.floor(configured) : DEFAULT_DRAGON_RANGE
  }

  function dragonRayCells (variant, boss, direction) {
    const delta = CARDINAL_DIRECTIONS[direction]
    if (!variant || !boss?.dragon || !delta) return []
    const range = dragonRange(boss)
    const cells = []

    for (let step = 1; step <= range; step++) {
      const x = boss.dragon.x + (delta[0] * step)
      const y = boss.dragon.y + (delta[1] * step)
      if (blocksDragonFire(mapTile(variant, x, y))) break
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

  function dragonThreat (variant, boss, frame) {
    const direction = directionTowardHero(boss, frame)
    if (!direction) return { hit: false, direction: null, fireCells: [] }
    const fireCells = dragonRayCells(variant, boss, direction)
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

  function visualGrid (grid, boss, bossDefeated, fireCells) {
    let rows = Array.isArray(grid) ? grid.slice() : []
    if (bossDefeated) rows = replaceCell(rows, boss.dragon, '.')
    for (const cell of fireCells || []) rows = replaceCell(rows, cell, 'T')
    return rows
  }

  function withBossState (frame, boss, bossDefeated, extra) {
    const activeFireCells = extra?.type === 'dragon-fire' ? extra.fireCells : []
    return Object.assign({}, frame, {
      grid: visualGrid(frame.grid, boss, bossDefeated, activeFireCells),
      bossDefeated,
    }, extra || {})
  }

  function decorateBossResult (mission, result, variantIndex) {
    if (!isBossMission(mission) || !result) return result
    const safeIndex = ((variantIndex || 0) % mission.variants.length + mission.variants.length) % mission.variants.length
    const variant = mission.variants[safeIndex]
    const boss = variant.boss
    let bossDefeated = false
    let dragonHit = false
    const trace = []

    for (const originalFrame of result.trace || []) {
      const frame = withBossState(originalFrame, boss, bossDefeated)
      trace.push(frame)

      if (frame.type !== 'move') continue

      if (!bossDefeated && boss.lever && sameCell(frame, boss.lever)) {
        bossDefeated = true
        trace.push(withBossState(frame, boss, true, {
          type: 'boss-defeated',
          bossEvent: 'lever',
        }))
        continue
      }

      if (!bossDefeated) {
        const threat = dragonThreat(variant, boss, frame)
        if (threat.hit) {
          dragonHit = true
          trace.push(withBossState(frame, boss, false, {
            type: 'dragon-fire',
            dragonHit: true,
            fireDirection: threat.direction,
            fireCells: threat.fireCells.map(cell => Object.assign({}, cell)),
            dragon: Object.assign({}, boss.dragon),
            attackRange: dragonRange(boss),
          }))
          break
        }
      }
    }

    const lastFrame = trace[trace.length - 1]
    const state = Object.assign({}, result.state, lastFrame || {}, {
      bossDefeated,
      dragonHit,
    })
    state.grid = visualGrid(state.grid, boss, bossDefeated, dragonHit ? lastFrame?.fireCells : [])
    if (dragonHit) state.goalReached = false

    return Object.assign({}, result, { trace, state })
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
        const safeIndex = ((variantIndex || 0) % mission.variants.length + mission.variants.length) % mission.variants.length
        state.variant = mission.variants[safeIndex]
        state.bossDefeated = false
        state.dragonHit = false
      }
      return state
    }

    engine.simulate = function (code, mission, variantIndex) {
      const result = baseSimulate(code, normalizedMission(mission), variantIndex)
      return decorateBossResult(mission, result, variantIndex)
    }

    engine.evaluate = function (mission, result, code) {
      return evaluateBoss(baseEvaluate(mission, result, code), mission, result)
    }

    Object.defineProperty(engine, '__bossMechanicsApplied', { value: true })
    return engine
  }

  return Object.freeze({
    DEFAULT_DRAGON_RANGE,
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