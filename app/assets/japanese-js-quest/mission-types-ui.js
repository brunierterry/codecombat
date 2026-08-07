(function () {
  'use strict'

  const missions = window.JSQuestMissions || []
  const types = window.JSQuestMissionTypes
  const STORAGE_KEY = 'japanese-js-quest-progress-v1'
  let adminShowAll = false

  function savedCompleted () {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
      return new Set(Array.isArray(saved.completed) ? saved.completed.map(Number) : [])
    } catch (_) {
      return new Set()
    }
  }

  function visibleRange () {
    if (adminShowAll) return { start: 0, end: Math.max(0, missions.length - 1) }
    const completed = savedCompleted()

    if (!completed.has(0)) return { start: 0, end: Math.min(1, missions.length - 1) }

    let firstIncomplete = missions.findIndex(mission => !completed.has(mission.id))
    if (firstIncomplete < 0) firstIncomplete = missions.length - 1

    let start = firstIncomplete
    while (start > 0 && missions[start].type !== 'concept') start--
    if (missions[start]?.type !== 'concept') start = Math.max(0, firstIncomplete)

    let end = start + 1
    while (end < missions.length && missions[end].type !== 'concept') end++
    end = Math.min(end, missions.length - 1)

    return { start, end }
  }

  function decorateMissionNumber () {
    const number = document.getElementById('mission-number')
    if (!number || !types) return
    const match = number.textContent.match(/(\d+)/)
    const mission = match ? missions.find(item => item.id === Number(match[1])) : null
    const type = mission ? types.get(mission.type) : null
    if (!mission || !type) return

    number.classList.add('mission-number-row')
    if (number.querySelector('.mission-type-badge')) return
    const badge = document.createElement('span')
    badge.className = 'mission-type-badge'
    badge.textContent = type.emoji + ' ' + type.label
    badge.dataset.missionType = type.code
    number.appendChild(badge)
  }

  function applySidebarVisibility () {
    const list = document.getElementById('mission-list')
    if (!list || !types) return
    const buttons = Array.from(list.children)
    if (!buttons.length) return
    const range = visibleRange()
    let visibleCompleted = 0
    let visibleTotal = 0
    const completed = savedCompleted()

    buttons.forEach((button, index) => {
      const mission = missions[index]
      if (!mission) return
      const type = types.get(mission.type) || types.TYPES.concept
      button.dataset.missionType = type.code
      const visible = adminShowAll || (index >= range.start && index <= range.end)
      button.hidden = !visible
      button.classList.toggle('mission-hidden-by-focus', !visible)
      if (visible) {
        visibleTotal++
        if (completed.has(mission.id)) visibleCompleted++
      }
    })

    const label = document.getElementById('progress-label')
    if (label) label.textContent = visibleCompleted + ' / ' + visibleTotal
  }

  function refresh () {
    decorateMissionNumber()
    applySidebarVisibility()
    const subtitle = document.querySelector('.subtitle')
    if (subtitle) subtitle.textContent = 'いろいろなミッションで、JavaScriptを少しずつ身につけよう'
  }

  function init () {
    const list = document.getElementById('mission-list')
    if (list) {
      const observer = new MutationObserver(mutations => {
        if (mutations.some(mutation => mutation.target === list && mutation.type === 'childList')) {
          window.requestAnimationFrame(applySidebarVisibility)
        }
      })
      observer.observe(list, { childList: true })
    }

    document.addEventListener('jsquest:missionloaded', () => window.requestAnimationFrame(refresh))
    document.addEventListener('jsquest:missioncompleted', () => window.requestAnimationFrame(applySidebarVisibility))
    document.addEventListener('click', event => {
      if (event.target?.closest('#admin-unlock-all')) {
        adminShowAll = true
        window.setTimeout(applySidebarVisibility, 0)
      }
    }, true)

    refresh()
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init)
  else init()
})()
