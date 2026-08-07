(function (root, factory) {
  const api = factory(root)
  if (typeof module === 'object' && module.exports) module.exports = api
  else {
    root.JSQuestMissionTypesUI = api
    api.install()
  }
})(typeof self !== 'undefined' ? self : this, function (root) {
  'use strict'

  const STORAGE_KEY = 'japanese-js-quest-progress-v1'

  function normalizedCompleted (completedIds) {
    return new Set(Array.from(completedIds || []).map(Number).filter(Number.isInteger))
  }

  function visibleRangeFor (missions, completedIds, adminShowAll) {
    if (!Array.isArray(missions) || missions.length === 0) return { start: 0, end: -1 }
    if (adminShowAll) return { start: 0, end: missions.length - 1 }
    const completed = normalizedCompleted(completedIds)

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

  function install () {
    if (!root || typeof root.document === 'undefined') return
    const document = root.document
    const missions = root.JSQuestMissions || []
    const types = root.JSQuestMissionTypes
    let adminShowAll = false

    function savedCompleted () {
      try {
        const saved = JSON.parse(root.localStorage.getItem(STORAGE_KEY) || '{}')
        return Array.isArray(saved.completed) ? saved.completed : []
      } catch (_) {
        return []
      }
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
      const completedIds = savedCompleted()
      const completed = normalizedCompleted(completedIds)
      const range = visibleRangeFor(missions, completedIds, adminShowAll)
      let visibleCompleted = 0
      let visibleTotal = 0

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
            root.requestAnimationFrame(applySidebarVisibility)
          }
        })
        observer.observe(list, { childList: true })
      }

      document.addEventListener('jsquest:missionloaded', () => root.requestAnimationFrame(refresh))
      document.addEventListener('jsquest:missioncompleted', () => root.requestAnimationFrame(applySidebarVisibility))
      document.addEventListener('click', event => {
        if (event.target?.closest('#admin-unlock-all')) {
          adminShowAll = true
          root.setTimeout(applySidebarVisibility, 0)
        }
      }, true)

      refresh()
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init)
    else init()
  }

  return Object.freeze({
    visibleRangeFor,
    install,
  })
})
