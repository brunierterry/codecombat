(function () {
  'use strict'

  function topOffset () {
    const topbar = document.querySelector('.topbar')
    if (!topbar) return 16
    const position = window.getComputedStyle(topbar).position
    if (position !== 'sticky' && position !== 'fixed') return 16
    return Math.ceil(topbar.getBoundingClientRect().height) + 16
  }

  function scrollMissionOverviewIntoView () {
    const missionCard = document.querySelector('.mission-card')
    if (!missionCard) return

    const targetTop = Math.max(
      0,
      window.scrollY + missionCard.getBoundingClientRect().top - topOffset(),
    )
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: targetTop, behavior: reduceMotion ? 'auto' : 'smooth' })
  }

  function scheduleMissionScroll () {
    // app-v3 still focuses the editor at the very end of loadMission(). Waiting
    // until the next frame lets that focus finish first, then restores the
    // learner to the newly selected mission's title and instructions.
    window.requestAnimationFrame(() => window.requestAnimationFrame(scrollMissionOverviewIntoView))
  }

  document.addEventListener('jsquest:missionloaded', scheduleMissionScroll)

  window.JSQuestMissionNavigation = Object.freeze({
    scrollMissionOverviewIntoView,
  })
})()
