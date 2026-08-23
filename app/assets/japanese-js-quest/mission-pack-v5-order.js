(function (root, factory) {
  const api = factory()
  if (typeof module === 'object' && module.exports) module.exports = api
  else {
    root.JSQuestMissionPackV5Order = api
    if (root.JSQuestMissions) api.apply(root.JSQuestMissions, root.JSQuestCurriculumV3)
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict'

  const STORAGE_KEY = 'japanese-js-quest-progress-v1'
  const CODE_KEY_PREFIX = 'japanese-js-quest-code-v1-'
  const MIGRATION_KEY = 'japanese-js-quest-mission-order-v5-migrated'
  const FINAL_MISSION_COUNT = 35

  const OLD_TO_NEW = Object.freeze({
    15: 16,
    16: 17,
    17: 15,
  })
  const NEW_TO_OLD = Object.freeze({
    15: 17,
    16: 15,
    17: 16,
  })

  function shiftedExistingId (id) {
    const value = Number(id)
    return Object.prototype.hasOwnProperty.call(OLD_TO_NEW, value) ? OLD_TO_NEW[value] : value
  }

  function previousIdForFinalId (id) {
    const value = Number(id)
    return Object.prototype.hasOwnProperty.call(NEW_TO_OLD, value) ? NEW_TO_OLD[value] : value
  }

  function patchCurriculumMapping (curriculum) {
    if (!curriculum || curriculum.__missionPackV5OrderMappingPatched) return curriculum
    const baseFinalForLegacy = curriculum.finalIdForLegacyId.bind(curriculum)
    const baseLegacyForFinal = curriculum.legacyIdForFinalId.bind(curriculum)

    curriculum.finalIdForLegacyId = function (legacyId) {
      return shiftedExistingId(baseFinalForLegacy(legacyId))
    }
    curriculum.legacyIdForFinalId = function (finalId) {
      const id = Number(finalId)
      // The moved typo drill now follows MISSION 14 and must expose only the
      // vocabulary/concepts available through that concept lesson.
      if (id === 15) return baseLegacyForFinal(14)
      return baseLegacyForFinal(previousIdForFinalId(id))
    }
    Object.defineProperty(curriculum, '__missionPackV5OrderMappingPatched', { value: true })
    return curriculum
  }

  function deriveUnlocked (completed, missionCount) {
    const complete = new Set(completed)
    let unlocked = 1
    while (unlocked < missionCount && complete.has(unlocked - 1)) unlocked++
    return unlocked
  }

  function migrateBrowserStorage () {
    if (typeof localStorage === 'undefined' || localStorage.getItem(MIGRATION_KEY) === 'done') return

    try {
      const savedCodes = new Map()
      for (const oldId of [15, 16, 17]) {
        const value = localStorage.getItem(CODE_KEY_PREFIX + oldId)
        if (value != null) savedCodes.set(oldId, value)
      }
      for (const oldId of [15, 16, 17]) localStorage.removeItem(CODE_KEY_PREFIX + oldId)
      for (const [oldId, value] of savedCodes) {
        localStorage.setItem(CODE_KEY_PREFIX + shiftedExistingId(oldId), value)
      }

      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
      const completed = Array.isArray(saved.completed)
        ? Array.from(new Set(saved.completed.map(Number).map(id => shiftedExistingId(id))))
          .filter(id => Number.isInteger(id) && id >= 0 && id < FINAL_MISSION_COUNT)
          .sort((left, right) => left - right)
        : []
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        completed,
        unlocked: deriveUnlocked(completed, FINAL_MISSION_COUNT),
      }))
      localStorage.setItem(MIGRATION_KEY, 'done')
    } catch (_) {
      // Keep the campaign usable when browser storage is unavailable or malformed.
    }
  }

  function apply (missions, curriculum) {
    if (!Array.isArray(missions) || missions.__missionPackV5OrderApplied) return missions

    for (const mission of missions) {
      const previousId = Number(mission.id)
      mission.id = shiftedExistingId(previousId)
    }
    missions.sort((left, right) => left.id - right.id)

    const typoMission = missions.find(mission => Number(mission.id) === 15 && mission.title === 'if と else の修理')
    if (typoMission) {
      typoMission.practiceOf = 14
      typoMission.prePracticeId = 5
    }

    Object.defineProperty(missions, '__missionPackV5OrderApplied', { value: true })
    patchCurriculumMapping(curriculum)
    if (typeof window !== 'undefined') migrateBrowserStorage()
    return missions
  }

  return Object.freeze({
    apply,
    shiftedExistingId,
    previousIdForFinalId,
    patchCurriculumMapping,
    FINAL_MISSION_COUNT,
    OLD_TO_NEW,
    NEW_TO_OLD,
  })
})
