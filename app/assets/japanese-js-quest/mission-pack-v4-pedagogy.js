(function (root, factory) {
  const api = factory()
  if (typeof module === 'object' && module.exports) module.exports = api
  else {
    root.JSQuestMissionPackV4Pedagogy = api
    if (root.JSQuestMissions) api.apply(root.JSQuestMissions)
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict'

  const TRANSFORMATION_OWNER_KEY = 'hero-transform-form'
  const TRANSFORMATION_MISSION_ID_AT_V4 = 18
  const PACK_INDEX = 3

  function apply (missions) {
    if (!Array.isArray(missions) || missions.__missionPackV4PedagogyApplied) return missions

    const mission = missions.find(item => Number(item.id) === TRANSFORMATION_MISSION_ID_AT_V4)
    if (mission && mission.title === 'スイレンの川') {
      mission.type = 'concept'
      mission.conceptOwnerKey = TRANSFORMATION_OWNER_KEY
      delete mission.practiceOf
      delete mission.prePracticeId
    }

    Object.defineProperty(missions, '__missionPackV4PedagogyApplied', { value: true })
    return missions
  }

  function semanticOwner (ownerKey) {
    if (ownerKey !== TRANSFORMATION_OWNER_KEY) return null
    return Object.freeze({
      ownerKey: TRANSFORMATION_OWNER_KEY,
      missionId: TRANSFORMATION_MISSION_ID_AT_V4,
      packIndex: PACK_INDEX,
    })
  }

  return Object.freeze({
    apply,
    semanticOwner,
    TRANSFORMATION_OWNER_KEY,
    TRANSFORMATION_MISSION_ID_AT_V4,
    PACK_INDEX,
  })
})
