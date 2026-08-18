(function () {
  'use strict'

  function displayedMissionId () {
    const match = (document.getElementById('mission-number')?.textContent || '').match(/(\d+)/)
    return match ? Number(match[1]) : null
  }

  function syncReplayVisibility () {
    const replay = document.getElementById('replay-story-intro')
    if (!replay) return
    replay.hidden = displayedMissionId() !== 0
  }

  function init () {
    document.addEventListener('jsquest:missionloaded', syncReplayVisibility)
    window.setTimeout(syncReplayVisibility, 0)
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init)
  else init()
})()
