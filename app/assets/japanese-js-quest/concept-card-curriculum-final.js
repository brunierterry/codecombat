(function (root, factory) {
  const source = typeof module === 'object' && module.exports
    ? require('./concept-card-curriculum-source.js')
    : root.JSQuestConceptCardsSource
  const packs = typeof module === 'object' && module.exports
    ? [
        require('./mission-pack-v1.js'),
        require('./mission-pack-v2.js'),
        require('./mission-pack-v3.js'),
        require('./mission-pack-v4.js'),
      ]
    : [
        root.JSQuestMissionPackV1,
        root.JSQuestMissionPackV2,
        root.JSQuestMissionPackV3,
        root.JSQuestMissionPackV4,
      ]
  const api = factory(source, packs)
  if (typeof module === 'object' && module.exports) module.exports = api
  else root.JSQuestConceptCards = api
})(typeof self !== 'undefined' ? self : this, function (source, packs) {
  'use strict'

  if (!source) throw new Error('Stable concept-card source is missing')
  if (!packs.every(Boolean)) throw new Error('Concept-card curriculum mapping dependencies are missing')

  function finalMissionIdForSource (sourceMissionId) {
    return packs.reduce(
      (missionId, pack) => pack.shiftedExistingId(missionId),
      Number(sourceMissionId),
    )
  }

  const cards = source.allCards().map(card => Object.freeze(Object.assign({}, card, {
    missionId: finalMissionIdForSource(card.missionId),
  })))
  const cardsById = Object.freeze(Object.fromEntries(cards.map(card => [card.id, card])))

  const missionGuides = Object.freeze(Object.fromEntries(
    Object.entries(source.missionGuides).map(([sourceMissionId, guide]) => [
      finalMissionIdForSource(sourceMissionId),
      Object.freeze({
        title: guide.title,
        cardIds: Object.freeze(Array.from(guide.cardIds)),
      }),
    ]),
  ))

  function getCard (id) {
    return cardsById[id] || null
  }

  function getMissionGuide (missionId) {
    const guide = missionGuides[missionId]
    if (!guide) return null
    return {
      title: guide.title,
      cardIds: guide.cardIds.slice(),
      cards: guide.cardIds.map(getCard),
    }
  }

  function allCards () {
    return cards.slice()
  }

  return Object.freeze({
    cardsById,
    missionGuides,
    getCard,
    getMissionGuide,
    allCards,
    finalMissionIdForSource,
  })
})
