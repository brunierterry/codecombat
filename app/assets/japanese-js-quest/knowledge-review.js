(function (root, factory) {
  const api = factory(root)
  if (typeof module === 'object' && module.exports) module.exports = api
  else {
    root.JSQuestKnowledgeReview = api
    api.install()
  }
})(typeof self !== 'undefined' ? self : this, function (root) {
  'use strict'

  const STORAGE_KEY = 'japanese-js-quest-knowledge-review-v1'
  const CONCEPT_MEMORY_KEY = 'japanese-js-quest-concept-memory-v1'
  const SCHEMA_VERSION = 1
  const MIN_SPACING = 1
  const SESSION_SIZE = 6
  const BASE_POINTS_PER_CARD = 5
  const FIRST_SESSION_BONUS = 10
  const SECOND_SESSION_BONUS = 3

  function storage () {
    return root && root.localStorage ? root.localStorage : null
  }

  function dateKey (date) {
    const value = date || new Date()
    const year = value.getFullYear()
    const month = String(value.getMonth() + 1).padStart(2, '0')
    const day = String(value.getDate()).padStart(2, '0')
    return year + '-' + month + '-' + day
  }

  function emptyState () {
    return {
      schemaVersion: SCHEMA_VERSION,
      cards: {},
      completedSessionsByDate: {},
      sessionBonusPoints: 0,
      activeSession: null,
    }
  }

  function normalizeCard (cardId, card) {
    const value = card && typeof card === 'object' ? card : {}
    return {
      cardId,
      spacing: Math.max(MIN_SPACING, Math.floor(Number(value.spacing) || MIN_SPACING)),
      reviewCount: Math.max(0, Math.floor(Number(value.reviewCount) || 0)),
      reviewPoints: Math.max(0, Math.floor(Number(value.reviewPoints) || 0)),
      lastReviewedDate: typeof value.lastReviewedDate === 'string' ? value.lastReviewedDate : null,
      lastAccuracy: Number.isFinite(Number(value.lastAccuracy)) ? Math.max(0, Math.min(1, Number(value.lastAccuracy))) : null,
      lastRecall: Number.isInteger(Number(value.lastRecall)) ? Math.max(0, Math.min(2, Number(value.lastRecall))) : null,
    }
  }

  function normalizeState (saved) {
    const result = emptyState()
    if (!saved || typeof saved !== 'object') return result

    const cards = saved.cards && typeof saved.cards === 'object' ? saved.cards : {}
    for (const cardId of Object.keys(cards)) {
      if (!/^concept-card-\d+$/.test(cardId)) continue
      result.cards[cardId] = normalizeCard(cardId, cards[cardId])
    }

    const sessions = saved.completedSessionsByDate && typeof saved.completedSessionsByDate === 'object'
      ? saved.completedSessionsByDate
      : {}
    for (const [day, count] of Object.entries(sessions)) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) continue
      result.completedSessionsByDate[day] = Math.max(0, Math.floor(Number(count) || 0))
    }
    result.sessionBonusPoints = Math.max(0, Math.floor(Number(saved.sessionBonusPoints) || 0))

    const active = saved.activeSession
    if (active && typeof active === 'object' && typeof active.date === 'string' && Array.isArray(active.cardIds)) {
      const cardIds = active.cardIds.filter(cardId => typeof cardId === 'string' && result.cards[cardId])
      const completedCardIds = Array.isArray(active.completedCardIds)
        ? active.completedCardIds.filter(cardId => cardIds.includes(cardId))
        : []
      if (cardIds.length) {
        result.activeSession = {
          id: String(active.id || active.date),
          date: active.date,
          cardIds,
          completedCardIds: Array.from(new Set(completedCardIds)),
          startedAt: typeof active.startedAt === 'string' ? active.startedAt : null,
        }
      }
    }
    return result
  }

  function validatedCardIds (targetStorage) {
    try {
      const saved = JSON.parse(targetStorage?.getItem(CONCEPT_MEMORY_KEY) || '{}')
      return Array.isArray(saved.validatedCardIds)
        ? Array.from(new Set(saved.validatedCardIds.filter(cardId => /^concept-card-\d+$/.test(cardId))))
        : []
    } catch (_) {
      return []
    }
  }

  function syncUnlockedCards (state, cardIds) {
    let changed = false
    for (const cardId of cardIds) {
      if (state.cards[cardId]) continue
      state.cards[cardId] = normalizeCard(cardId, { spacing: MIN_SPACING })
      changed = true
    }
    return changed
  }

  function load (targetStorage, now) {
    const target = targetStorage || storage()
    let parsed
    try {
      parsed = JSON.parse(target?.getItem(STORAGE_KEY) || '{}')
    } catch (_) {
      parsed = {}
    }
    const state = normalizeState(parsed)
    const changed = syncUnlockedCards(state, validatedCardIds(target))
    const today = dateKey(now)
    if (state.activeSession && state.activeSession.date !== today) {
      state.activeSession = null
      save(state, target)
    } else if (changed) {
      save(state, target)
    }
    return state
  }

  function save (state, targetStorage) {
    const target = targetStorage || storage()
    target?.setItem(STORAGE_KEY, JSON.stringify(normalizeState(state)))
  }

  function selectionWeight (card) {
    const spacing = Math.max(MIN_SPACING, Number(card.spacing) || MIN_SPACING)
    const newCardBoost = card.reviewCount === 0 ? 1.7 : 1
    return newCardBoost / spacing
  }

  function weightedChoiceIndex (cards, rng) {
    const weights = cards.map(selectionWeight)
    const total = weights.reduce((sum, value) => sum + value, 0)
    if (total <= 0) return 0
    let roll = (rng || Math.random)() * total
    for (let index = 0; index < weights.length; index++) {
      roll -= weights[index]
      if (roll <= 0) return index
    }
    return weights.length - 1
  }

  function selectCardIds (state, count, rng) {
    const remaining = Object.values(state.cards).map(card => Object.assign({}, card))
    const selected = []
    const limit = Math.min(Math.max(0, Number(count) || SESSION_SIZE), remaining.length)
    while (selected.length < limit && remaining.length) {
      const index = weightedChoiceIndex(remaining, rng)
      selected.push(remaining[index].cardId)
      remaining.splice(index, 1)
    }
    return selected
  }

  function nextSpacing (currentSpacing, accuracy, recall) {
    const current = Math.max(MIN_SPACING, Math.floor(Number(currentSpacing) || MIN_SPACING))
    const score = Math.max(0, Math.min(1, Number(accuracy) || 0))
    const selfScore = Math.max(0, Math.min(2, Math.floor(Number(recall) || 0)))

    if (score === 0) {
      const factor = [0.35, 0.45, 0.55][selfScore]
      return Math.max(MIN_SPACING, Math.floor(current * factor))
    }
    if (score < 1) {
      return Math.max(MIN_SPACING, current + [-3, -2, -1][selfScore])
    }
    return current + [1, 3, 7][selfScore]
  }

  function accuracyPoints (correctAnswers, totalQuestions) {
    const correct = Math.max(0, Math.floor(Number(correctAnswers) || 0))
    const total = Math.max(1, Math.floor(Number(totalQuestions) || 1))
    if (correct >= total) return 3
    if (correct > 0) return 1
    return 0
  }

  function beginSession (state, now, rng) {
    const today = dateKey(now)
    if (state.activeSession && state.activeSession.date === today) return state.activeSession
    const cardIds = selectCardIds(state, SESSION_SIZE, rng)
    if (!cardIds.length) return null
    state.activeSession = {
      id: today + '-' + String((now || new Date()).getTime()),
      date: today,
      cardIds,
      completedCardIds: [],
      startedAt: (now || new Date()).toISOString(),
    }
    return state.activeSession
  }

  function reviewCard (state, cardId, correctAnswers, totalQuestions, recall, now, awardPoints) {
    const card = state.cards[cardId]
    if (!card) throw new Error('このカードはまだ復習できません。')
    const total = Math.max(1, Math.floor(Number(totalQuestions) || 1))
    const correct = Math.max(0, Math.min(total, Math.floor(Number(correctAnswers) || 0)))
    const accuracy = correct / total
    const selfScore = Math.max(0, Math.min(2, Math.floor(Number(recall) || 0)))

    card.spacing = nextSpacing(card.spacing, accuracy, selfScore)
    card.reviewCount += 1
    // Voluntary third-or-later sessions still train the memory schedule but do
    // not award per-card knowledge points, so repeated same-day study cannot
    // become a point-farming path.
    if (awardPoints !== false) card.reviewPoints += accuracyPoints(correct, total)
    card.lastReviewedDate = dateKey(now)
    card.lastAccuracy = accuracy
    card.lastRecall = selfScore

    if (state.activeSession && state.activeSession.cardIds.includes(cardId)) {
      if (!state.activeSession.completedCardIds.includes(cardId)) state.activeSession.completedCardIds.push(cardId)
    }
    return card
  }

  function completedSessionsToday (state, now) {
    return Math.max(0, Number(state.completedSessionsByDate[dateKey(now)]) || 0)
  }

  function sessionBonusForIndex (completedBefore) {
    if (completedBefore <= 0) return FIRST_SESSION_BONUS
    if (completedBefore === 1) return SECOND_SESSION_BONUS
    return 0
  }

  function completeActiveSession (state, now) {
    const active = state.activeSession
    if (!active) return { completed: false, bonus: 0 }
    const done = active.cardIds.every(cardId => active.completedCardIds.includes(cardId))
    if (!done) return { completed: false, bonus: 0 }

    const day = active.date || dateKey(now)
    const completedBefore = Math.max(0, Number(state.completedSessionsByDate[day]) || 0)
    const bonus = sessionBonusForIndex(completedBefore)
    state.completedSessionsByDate[day] = completedBefore + 1
    state.sessionBonusPoints += bonus
    state.activeSession = null
    return { completed: true, bonus, sessionNumber: completedBefore + 1 }
  }

  function knowledgePoints (state) {
    const cards = Object.values(state.cards)
    const base = cards.length * BASE_POINTS_PER_CARD
    const review = cards.reduce((sum, card) => sum + Math.max(0, Number(card.reviewPoints) || 0), 0)
    const session = Math.max(0, Number(state.sessionBonusPoints) || 0)
    return { total: base + review + session, base, review, session, cardCount: cards.length }
  }

  function dailyReviewDue (state, now) {
    return Object.keys(state.cards).length > 0 && completedSessionsToday(state, now) === 0
  }

  function dispatchChange (state) {
    if (typeof document === 'undefined') return
    document.dispatchEvent(new CustomEvent('jsquest:knowledgechanged', {
      detail: { state, points: knowledgePoints(state) },
    }))
  }

  function syncAndNotify () {
    const target = storage()
    if (!target) return
    const state = load(target)
    syncUnlockedCards(state, validatedCardIds(target))
    save(state, target)
    dispatchChange(state)
  }

  function install () {
    if (!root || typeof document === 'undefined') return
    const init = () => {
      syncAndNotify()
      document.addEventListener('jsquest:conceptcardschanged', syncAndNotify)
      document.addEventListener('jsquest:saveimported', syncAndNotify)
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init)
    else init()
  }

  return Object.freeze({
    STORAGE_KEY,
    CONCEPT_MEMORY_KEY,
    SCHEMA_VERSION,
    MIN_SPACING,
    SESSION_SIZE,
    BASE_POINTS_PER_CARD,
    FIRST_SESSION_BONUS,
    SECOND_SESSION_BONUS,
    dateKey,
    emptyState,
    normalizeState,
    validatedCardIds,
    syncUnlockedCards,
    load,
    save,
    selectionWeight,
    selectCardIds,
    nextSpacing,
    accuracyPoints,
    beginSession,
    reviewCard,
    completedSessionsToday,
    sessionBonusForIndex,
    completeActiveSession,
    knowledgePoints,
    dailyReviewDue,
    install,
  })
})
