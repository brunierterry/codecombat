(function () {
  'use strict'

  const missions = window.JSQuestMissions || []

  function currentMission () {
    const match = (document.getElementById('mission-number')?.textContent || '').match(/(\d+)/)
    return match ? missions.find(mission => mission.id === Number(match[1])) : null
  }

  function tileAt (grid, width, point) {
    if (!grid || !point || !Number.isInteger(point.x) || !Number.isInteger(point.y)) return null
    return grid.children[(point.y * width) + point.x] || null
  }

  function decorateBossGrid () {
    const mission = currentMission()
    const variant = mission?.variants?.[0]
    const boss = variant?.boss
    const grid = document.getElementById('game-grid')
    if (!grid || !boss || !variant.map?.length) return

    const width = variant.map[0].length
    const dragon = tileAt(grid, width, boss.dragon)
    const pillar = tileAt(grid, width, boss.pillar)
    const lever = tileAt(grid, width, boss.lever)

    if (dragon) {
      const defeated = dragon.classList.contains('floor')
      dragon.classList.remove('enemy')
      dragon.classList.add(defeated ? 'boss-defeated' : 'boss-dragon')
      dragon.textContent = defeated ? '💀' : '🐉'
      dragon.setAttribute('aria-label', defeated ? '倒したドラゴン' : 'ドラゴン')
    }

    if (pillar) {
      pillar.classList.add('boss-pillar')
      pillar.textContent = '🗿'
      pillar.setAttribute('aria-label', '柱')
    }

    if (lever) {
      lever.classList.add('boss-lever')
      lever.textContent = '🎚️'
      lever.setAttribute('aria-label', 'レバー')
    }

    ;(boss.fireCells || []).forEach((cell, index) => {
      const tile = tileAt(grid, width, cell)
      if (!tile) return
      const active = tile.classList.contains('trap')
      tile.classList.add('boss-fire-zone')
      if (active) {
        tile.classList.remove('trap')
        tile.classList.add('boss-fire-active')
        tile.textContent = '🔥'
        tile.style.setProperty('--fire-step', String(index))
        tile.setAttribute('aria-label', 'ドラゴンの炎')
      }
    })
  }

  function scheduleDecoration () {
    window.requestAnimationFrame(decorateBossGrid)
  }

  function init () {
    const grid = document.getElementById('game-grid')
    if (grid) {
      const observer = new MutationObserver(mutations => {
        if (mutations.some(mutation => mutation.target === grid && mutation.type === 'childList')) {
          scheduleDecoration()
        }
      })
      observer.observe(grid, { childList: true })
    }

    document.addEventListener('jsquest:missionloaded', scheduleDecoration)
    scheduleDecoration()
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init)
  else init()
})()
