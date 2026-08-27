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
        require('./mission-pack-v5-order.js'),
      ]
    : [
        root.JSQuestMissionPackV1,
        root.JSQuestMissionPackV2,
        root.JSQuestMissionPackV3,
        root.JSQuestMissionPackV4,
        root.JSQuestMissionPackV5Order,
      ]
  const v4Pedagogy = typeof module === 'object' && module.exports
    ? require('./mission-pack-v4-pedagogy.js')
    : root.JSQuestMissionPackV4Pedagogy
  const api = factory(source, packs, v4Pedagogy)
  if (typeof module === 'object' && module.exports) module.exports = api
  else root.JSQuestConceptCards = api
})(typeof self !== 'undefined' ? self : this, function (source, packs, v4Pedagogy) {
  'use strict'

  if (!source) throw new Error('Stable concept-card source is missing')
  if (!packs.every(Boolean)) throw new Error('Concept-card curriculum mapping dependencies are missing')
  if (!v4Pedagogy) throw new Error('Mission-pack v4 pedagogy mapping is missing')

  function finalMissionIdForSource (sourceMissionId) {
    return packs.reduce(
      (missionId, pack) => pack.shiftedExistingId(missionId),
      Number(sourceMissionId),
    )
  }

  function finalMissionIdForOwner (ownerKey) {
    const owner = v4Pedagogy.semanticOwner(ownerKey)
    if (!owner) throw new Error('Unknown semantic concept owner: ' + ownerKey)
    return packs.slice(owner.packIndex + 1).reduce(
      (missionId, pack) => pack.shiftedExistingId(missionId),
      Number(owner.missionId),
    )
  }

  function finalMissionIdForCard (card) {
    return card.ownerKey
      ? finalMissionIdForOwner(card.ownerKey)
      : finalMissionIdForSource(card.missionId)
  }

  const cards = source.allCards().map(card => Object.freeze(Object.assign({}, card, {
    missionId: finalMissionIdForCard(card),
  })))
  const cardsById = Object.freeze(Object.fromEntries(cards.map(card => [card.id, card])))

  const sourceGuides = Object.entries(source.missionGuides).map(([sourceMissionId, guide]) => [
    finalMissionIdForSource(sourceMissionId),
    Object.freeze({
      title: guide.title,
      cardIds: Object.freeze(Array.from(guide.cardIds)),
    }),
  ])
  const semanticGuides = Object.entries(source.semanticGuides || {}).map(([ownerKey, guide]) => [
    finalMissionIdForOwner(ownerKey),
    Object.freeze({
      title: guide.title,
      cardIds: Object.freeze(Array.from(guide.cardIds)),
    }),
  ])
  const missionGuides = Object.freeze(Object.fromEntries([...sourceGuides, ...semanticGuides]))

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
    finalMissionIdForOwner,
  })
})
