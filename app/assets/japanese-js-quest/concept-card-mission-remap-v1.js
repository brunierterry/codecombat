(function (root, factory) {
  const base = typeof module === 'object' && module.exports
    ? require('./concept-card-library-extension.js')
    : root.JSQuestConceptCards
  const pack = typeof module === 'object' && module.exports
    ? require('./mission-pack-v1.js')
    : root.JSQuestMissionPackV1
  const api = factory(base, pack)
  if (typeof module === 'object' && module.exports) module.exports = api
  else root.JSQuestConceptCards = api
})(typeof self !== 'undefined' ? self : this, function (base, pack) {
  'use strict'

  if (!base || !pack) throw new Error('Concept-card remap dependencies are missing')

  function remapMissionId (missionId) {
    const id = Number(missionId)
    return id >= 2 ? pack.shiftedExistingId(id) : id
  }

  const cards = base.allCards().map(card => Object.freeze(Object.assign({}, card, {
    missionId: remapMissionId(card.missionId),
  })))
  const cardsById = Object.freeze(Object.fromEntries(cards.map(card => [card.id, card])))

  const missionGuides = Object.freeze(Object.fromEntries(
    Object.entries(base.missionGuides).map(([missionId, guide]) => [
      remapMissionId(Number(missionId)),
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
  })
})
