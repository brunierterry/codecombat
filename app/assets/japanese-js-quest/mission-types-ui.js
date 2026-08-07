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

  function visibleMissionIdsFor (missions, completedIds, adminShowAll) {
    const visible = new Set()
    if (!Array.isArray(missions) || missions.length === 0) return visible

    if (adminShowAll) {
      missions.forEach(mission => visible.add(mission.id))
      return visible
    }

    const completed = normalizedCompleted(completedIds)
    const knownIds = new Set(missions.map(mission => mission.id))

    // Mission 00 is part of the permanent history and never disappears.
    visible.add(missions[0].id)

    // Every mission already completed remains visible forever, including
    // non-contiguous completions created during admin review.
    completed.forEach(id => {
      if (knownIds.has(id)) visible.add(id)
    })

    // Before mission 00 is complete, reveal only the environment intro and
    // the first concept mission as the next destination.
    if (!completed.has(missions[0].id)) {
      if (missions[1]) visible.add(missions[1].id)
      return visible
    }

    const firstIncompleteIndex = missions.findIndex(mission => !completed.has(mission.id))
    if (firstIncompleteIndex < 0) {
      missions.forEach(mission => visible.add(mission.id))
      return visible
    }

    // Find the concept segment containing the first unfinished mission.
    let anchorIndex = firstIncompleteIndex
    while (anchorIndex > 0 && missions[anchorIndex].type !== 'concept') anchorIndex--
    if (missions[anchorIndex]?.type !== 'concept') anchorIndex = firstIncompleteIndex

    // Reveal the whole current segment and the next concept mission as its
    // visible boundary. Nothing unfinished after that boundary is shown.
    let boundaryIndex = anchorIndex + 1
    while (boundaryIndex < missions.length && missions[boundaryIndex].type !== 'concept') boundaryIndex++
    if (boundaryIndex >= missions.length) boundaryIndex = missions.length - 1

    for (let index = anchorIndex; index <= boundaryIndex; index++) {
      visible.add(missions[index].id)
    }

    return visible
  }

  function visibleRangeFor (missions, completedIds, adminShowAll) {
    const ids = visibleMissionIdsFor(missions, completedIds, adminShowAll)
    const indexes = missions
      .map((mission, index) => ids.has(mission.id) ? index : -1)
      .filter(index => index >= 0)
    if (!indexes.length) return { start: 0, end: -1 }
    return { start: Math.min(...indexes), end: Math.max(...indexes) }
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
      const existing = number.querySelector('.mission-type-badge')
      if (existing) existing.remove()
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
      const visibleIds = visibleMissionIdsFor(missions, completedIds, adminShowAll)
      let visibleCompleted = 0
      let visibleTotal = 0

      buttons.forEach((button, index) => {
        const mission = missions[index]
        if (!mission) return
        const type = types.get(mission.type) || types.TYPES.concept
        button.dataset.missionType = type.code
        const visible = visibleIds.has(mission.id)
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
    visibleMissionIdsFor,
    visibleRangeFor,
    install,
  })
})
