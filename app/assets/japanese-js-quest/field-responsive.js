(function () {
  'use strict'

  function clamp (value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value))
  }

  function init () {
    const grid = document.getElementById('game-grid')
    if (!grid) return

    function columnCount () {
      const inlineTemplate = grid.style.gridTemplateColumns || ''
      const repeatMatch = inlineTemplate.match(/repeat\(\s*(\d+)/)
      if (repeatMatch) return Math.max(1, Number(repeatMatch[1]))

      const computedTracks = getComputedStyle(grid).gridTemplateColumns
        .split(/\s+/)
        .filter(Boolean)
      return Math.max(1, computedTracks.length)
    }

    function syncIconScale () {
      const columns = columnCount()
      const rect = grid.getBoundingClientRect()
      if (!rect.width || columns < 1) return

      // Account for the field border before estimating one grid track.
      const cellWidth = Math.max(1, (rect.width - 4) / columns)
      grid.style.setProperty('--field-icon-size', clamp(cellWidth * 0.62, 10, 32).toFixed(2) + 'px')
      grid.style.setProperty('--field-lily-size', clamp(cellWidth * 0.72, 11, 36).toFixed(2) + 'px')
      grid.style.setProperty('--field-statue-size', clamp(cellWidth * 0.64, 10, 32).toFixed(2) + 'px')
    }

    const mutationObserver = new MutationObserver(() => requestAnimationFrame(syncIconScale))
    mutationObserver.observe(grid, { childList: true })

    if (typeof ResizeObserver !== 'undefined') {
      const resizeObserver = new ResizeObserver(() => requestAnimationFrame(syncIconScale))
      resizeObserver.observe(grid)
    } else {
      window.addEventListener('resize', syncIconScale)
    }

    requestAnimationFrame(syncIconScale)
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init)
  else init()
})()
