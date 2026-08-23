(function () {
  'use strict'

  const FIRST_RIVER_MISSION_ID = 18
  const FIRST_STATUE_MISSION_ID = 19

  function currentMissionId () {
    const match = (document.getElementById('mission-number')?.textContent || '').match(/(\d+)/)
    return match ? Number(match[1]) : 0
  }

  function appendLegendEntry (legend, text) {
    if (Array.from(legend.children).some(item => item.textContent === text)) return
    const entry = document.createElement('span')
    entry.textContent = text
    legend.appendChild(entry)
  }

  function appendReferenceValue (values, code, icon, label, tooltip) {
    if (values.querySelector('[data-river-value="' + code + '"]')) return
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'value-card glossary-token'
    button.dataset.riverValue = code
    button.dataset.tooltip = tooltip
    button.innerHTML = '<span class="value-icon">' + icon + '</span><span><code>' + code + '</code><small>' + label + '</small></span>'
    button.addEventListener('click', event => {
      event.stopPropagation()
      button.classList.toggle('is-open')
    })
    values.appendChild(button)
  }

  function enhanceRiverVocabulary () {
    const missionId = currentMissionId()
    if (missionId < FIRST_RIVER_MISSION_ID) return

    const legend = document.querySelector('.game-panel .legend')
    if (legend) {
      appendLegendEntry(legend, '🌊 水')
      appendLegendEntry(legend, '🍃 スイレンの葉')
      appendLegendEntry(legend, '🚪 ゴールのドア')
      if (missionId >= FIRST_STATUE_MISSION_ID) appendLegendEntry(legend, '🗿 像')
    }

    const values = document.getElementById('reference-values')
    if (values) {
      appendReferenceValue(values, 'water', '🌊', 'ウォーター：水', '歩いて入れない水のマスです。')
      appendReferenceValue(values, 'lily', '🍃', 'リリー：スイレンの葉', 'カエルの姿なら渡れるスイレンの葉です。hero.look(direction) では lily として見えます。')
      appendReferenceValue(values, 'goal door', '🚪', 'ゴールのドア', '人の姿で入るとミッションのゴールになるドアです。')
      if (missionId >= FIRST_STATUE_MISSION_ID) {
        appendReferenceValue(values, 'statue', '🗿', 'スタチュー：像', '通り抜けられず、ドラゴンの炎をさえぎる像です。')
      }
    }
  }

  function init () {
    document.addEventListener('jsquest:missionloaded', () => window.setTimeout(enhanceRiverVocabulary, 0))
    window.setTimeout(enhanceRiverVocabulary, 0)
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init)
  else init()
})()
