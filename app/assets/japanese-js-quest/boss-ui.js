(function () {
  'use strict'

  const missions = window.JSQuestMissions || []
  const HERO_BURN_DELAY_MS = 850

  function currentMission () {
    const match = (document.getElementById('mission-number')?.textContent || '').match(/(\d+)/)
    return match ? missions.find(mission => mission.id === Number(match[1])) : null
  }

  function tileAt (grid, width, point) {
    if (!grid || !point || !Number.isInteger(point.x) || !Number.isInteger(point.y)) return null
    return grid.children[(point.y * width) + point.x] || null
  }

  function scheduleBurnedHero (tile) {
    window.setTimeout(() => {
      if (!tile.isConnected || !tile.classList.contains('hero') || !tile.classList.contains('boss-fire-active')) return
      tile.classList.add('boss-hero-dead')
      tile.textContent = '💀'
      tile.setAttribute('aria-label', 'ドラゴンの炎で倒れたヒーロー')
    }, HERO_BURN_DELAY_MS)
  }

  function decorateBossGrid () {
    const mission = currentMission()
    const grid = document.getElementById('game-grid')
    const variantIndex = Number(grid?.dataset.variantIndex) || 0
    const variant = mission?.variants?.[variantIndex] || mission?.variants?.[0]
    const boss = variant?.boss
    if (!grid || !boss || !variant.map?.length) return

    const width = variant.map[0].length
    const dragon = tileAt(grid, width, boss.dragon)
    const pillar = tileAt(grid, width, boss.pillar)
    const lever = tileAt(grid, width, boss.lever)

    if (dragon) {
      const explicitlyDefeatable = boss.resolution && !['escape', 'protective-statue'].includes(boss.resolution)
      const defeated = explicitlyDefeatable && dragon.classList.contains('floor')
      dragon.classList.remove('enemy', 'boss-defeated', 'boss-dragon')
      dragon.classList.add(defeated ? 'boss-defeated' : 'boss-dragon')
      dragon.textContent = defeated ? '💀' : '🐉'
      dragon.setAttribute('aria-label', defeated ? '倒したドラゴン' : 'ドラゴン')
    }

    if (pillar) {
      pillar.classList.add('boss-pillar')
      pillar.textContent = '🗿'
      pillar.setAttribute('aria-label', '像')
    }

    if (lever) {
      lever.classList.add('boss-lever')
      lever.textContent = '🎚️'
      lever.setAttribute('aria-label', 'レバー')
    }

    Array.from(grid.children).forEach((tile, index) => {
      if (!tile.classList.contains('trap')) return
      const x = index % width
      const y = Math.floor(index / width)
      const distance = Math.abs(x - boss.dragon.x) + Math.abs(y - boss.dragon.y)
      tile.classList.remove('trap')
      tile.classList.add('boss-fire-zone', 'boss-fire-active')
      tile.textContent = '🔥'
      tile.style.setProperty('--fire-step', String(Math.max(0, distance - 1)))
      tile.setAttribute('aria-label', tile.classList.contains('hero') ? 'ヒーローに当たったドラゴンの炎' : 'ドラゴンの炎')
      if (tile.classList.contains('hero')) scheduleBurnedHero(tile)
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
