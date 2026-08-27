(function (root, factory) {
  const api = factory()
  if (typeof module === 'object' && module.exports) module.exports = api
  else {
    root.JSQuestMissionTypes = api
    if (typeof document !== 'undefined' && !document.querySelector('link[href="mission-types.css"]')) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'mission-types.css'
      document.head.appendChild(link)
    }
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict'

  const TYPES = Object.freeze({
    concept: Object.freeze({ code: 'concept', emoji: '💡', label: 'コンセプト' }),
    adventure: Object.freeze({ code: 'adventure', emoji: '🗺️', label: '冒険' }),
    typoFix: Object.freeze({ code: 'typo-fix', emoji: '🔧', label: 'タイポ修正' }),
    logicFix: Object.freeze({ code: 'logic-fix', emoji: '🧩', label: '考え方修正' }),
    boss: Object.freeze({ code: 'boss', emoji: '🐉', label: 'ボス' }),
  })

  const BY_CODE = Object.freeze(Object.fromEntries(
    Object.values(TYPES).map(type => [type.code, type]),
  ))

  const REINFORCEMENT_PATTERN = Object.freeze([
    TYPES.concept.code,
    TYPES.adventure.code,
    TYPES.typoFix.code,
    TYPES.logicFix.code,
    TYPES.adventure.code,
    TYPES.boss.code,
  ])

  function get (code) {
    return BY_CODE[code] || null
  }

  function setType (mission, code) {
    const type = get(code)
    if (!mission || !type) throw new Error('Unknown mission type: ' + code)
    mission.type = type.code
    return mission
  }

  return Object.freeze({
    TYPES,
    BY_CODE,
    REINFORCEMENT_PATTERN,
    get,
    setType,
  })
})
