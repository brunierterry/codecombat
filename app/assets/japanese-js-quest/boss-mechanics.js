(function (root, factory) {
  const api = factory()
  if (typeof module === 'object' && module.exports) module.exports = api
  else {
    root.JSQuestBossMechanics = api
    if (root.JSQuestEngine) api.apply(root.JSQuestEngine)
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict'

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

  function isFireCell (boss, frame) {
    return (boss.fireCells || []).some(cell => sameCell(cell, frame))
  }

  function replaceCell (rows, cell, value) {
    if (!Array.isArray(rows) || !cell || !rows[cell.y] || cell.x < 0 || cell.x >= rows[cell.y].length) return rows
    const next = rows.slice()
    const row = next[cell.y]
    next[cell.y] = row.slice(0, cell.x) + value + row.slice(cell.x + 1)
    return next
  }

  function visualGrid (grid, boss, bossDefeated, fireActive) {
    let rows = Array.isArray(grid) ? grid.slice() : []
    if (bossDefeated) rows = replaceCell(rows, boss.dragon, '.')
    if (fireActive) {
      for (const cell of boss.fireCells || []) rows = replaceCell(rows, cell, 'T')
    }
    return rows
  }

  function withBossState (frame, boss, bossDefeated, extra) {
    const fireActive = extra?.type === 'dragon-fire'
    return Object.assign({}, frame, {
      grid: visualGrid(frame.grid, boss, bossDefeated, fireActive),
      bossDefeated,
    }, extra || {})
  }

  function decorateBossResult (mission, result, variantIndex) {
    if (!isBossMission(mission) || !result) return result
    const safeIndex = ((variantIndex || 0) % mission.variants.length + mission.variants.length) % mission.variants.length
    const boss = mission.variants[safeIndex].boss
    let bossDefeated = false
    let dragonHit = false
    const trace = []

    for (const originalFrame of result.trace || []) {
      const frame = withBossState(originalFrame, boss, bossDefeated)
      trace.push(frame)

      if (frame.type !== 'move') continue

      if (!bossDefeated && sameCell(frame, boss.lever)) {
        bossDefeated = true
        trace.push(withBossState(frame, boss, true, {
          type: 'boss-defeated',
          bossEvent: 'lever',
        }))
        continue
      }

      if (!bossDefeated && isFireCell(boss, frame)) {
        dragonHit = true
        trace.push(withBossState(frame, boss, false, {
          type: 'dragon-fire',
          dragonHit: true,
          fireCells: (boss.fireCells || []).map(cell => Object.assign({}, cell)),
          dragon: Object.assign({}, boss.dragon),
          pillar: Object.assign({}, boss.pillar),
        }))
        break
      }
    }

    const lastFrame = trace[trace.length - 1]
    const state = Object.assign({}, result.state, lastFrame || {}, {
      bossDefeated,
      dragonHit,
    })
    state.grid = visualGrid(state.grid, boss, bossDefeated, dragonHit)
    if (dragonHit) state.goalReached = false

    return Object.assign({}, result, { trace, state })
  }

  function evaluateBoss (base, mission, result) {
    if (!isBossMission(mission) || !result?.ok) return base
    const messages = base.messages.slice()
    const stateRules = mission.requirements?.state || {}
    const state = result.state || {}

    if (stateRules.noDragonFire && state.dragonHit) {
      messages.push('ドラゴンの火に当たりました。炎の通り道を避けて、柱の下から回りましょう。')
    }
    if (stateRules.bossDefeated && !state.bossDefeated) {
      messages.push('まだドラゴンを倒していません。右側のレバーを踏んで罠を作動させよう。')
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
    apply,
    isBossMission,
    normalizedMission,
    decorateBossResult,
    evaluateBoss,
    visualGrid,
  })
})
