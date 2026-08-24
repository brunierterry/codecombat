(function () {
  'use strict'

  const FIRST_RIVER_MISSION_ID = 18
  const FIRST_STATUE_MISSION_ID = 19
  const WATER_SYMBOL = '≈'
  const WATER_COLOR = '#dff8ff'

  function currentMissionId () {
    const match = (document.getElementById('mission-number')?.textContent || '').match(/(\d+)/)
    return match ? Number(match[1]) : 0
  }

  function styleWaterSymbol (symbol) {
    if (!symbol) return
    symbol.style.color = WATER_COLOR
    symbol.style.fontWeight = '900'
    symbol.style.textShadow = '0 1px 4px rgba(255, 255, 255, 0.42)'
  }

  function setWaterLegendEntry (legend) {
    let entry = Array.from(legend.children).find(item => item.textContent === '🌊 水' || item.textContent === WATER_SYMBOL + ' 水')
    if (!entry) {
      entry = document.createElement('span')
      legend.appendChild(entry)
    }

    entry.textContent = ''
    const symbol = document.createElement('span')
    symbol.textContent = WATER_SYMBOL
    styleWaterSymbol(symbol)
    entry.append(symbol, document.createTextNode(' 水'))
  }

  function appendLegendEntry (legend, text) {
    if (Array.from(legend.children).some(item => item.textContent === text)) return
    const entry = document.createElement('span')
    entry.textContent = text
    legend.appendChild(entry)
  }

  function appendReferenceValue (values, code, icon, label, tooltip) {
    const existing = values.querySelector('[data-river-value="' + code + '"]')
    if (existing) {
      if (code === 'water') {
        const iconElement = existing.querySelector('.value-icon')
        iconElement.textContent = icon
        styleWaterSymbol(iconElement)
      }
      return
    }

    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'value-card glossary-token'
    button.dataset.riverValue = code
    button.dataset.tooltip = tooltip
    button.innerHTML = '<span class="value-icon">' + icon + '</span><span><code>' + code + '</code><small>' + label + '</small></span>'
    if (code === 'water') styleWaterSymbol(button.querySelector('.value-icon'))
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
      setWaterLegendEntry(legend)
      appendLegendEntry(legend, '🍃 スイレンの葉')
      appendLegendEntry(legend, '🚪 ゴールのドア')
      if (missionId >= FIRST_STATUE_MISSION_ID) appendLegendEntry(legend, '🗿 像')
    }

    const values = document.getElementById('reference-values')
    if (values) {
      appendReferenceValue(values, 'water', WATER_SYMBOL, 'ウォーター：水', '歩いて入れない水のマスです。')
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
