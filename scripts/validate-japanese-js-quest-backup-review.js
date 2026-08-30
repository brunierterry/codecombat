#!/usr/bin/env node
'use strict'

const assert = require('assert')
const fs = require('fs')
const path = require('path')

const repositoryPath = path.join(__dirname, '..')
const questPath = path.join(repositoryPath, 'app', 'assets', 'japanese-js-quest')
const readQuest = file => fs.readFileSync(path.join(questPath, file), 'utf8')

const transfer = require(path.join(questPath, 'save-transfer.js'))
const review = require(path.join(questPath, 'knowledge-review.js'))

class MemoryStorage {
  constructor (initial) {
    this.values = new Map(Object.entries(initial || {}))
  }

  get length () { return this.values.size }
  key (index) { return Array.from(this.values.keys())[index] || null }
  getItem (key) { return this.values.has(key) ? this.values.get(key) : null }
  setItem (key, value) { this.values.set(String(key), String(value)) }
  removeItem (key) { this.values.delete(String(key)) }
}

const progressKey = 'japanese-js-quest-progress-v1'
const codeKey = 'japanese-js-quest-code-v1-19'
const conceptKey = 'japanese-js-quest-concept-memory-v1'
const sourceStorage = new MemoryStorage({
  [progressKey]: JSON.stringify({ completed: [0, 1, 2, 19], unlocked: 20 }),
  [codeKey]: 'hero.move("up");',
  [conceptKey]: JSON.stringify({ validatedCardIds: ['concept-card-001', 'concept-card-015'] }),
  unrelated: 'must-not-export',
})

const payload = transfer.backupPayload(sourceStorage, '0.5.0', new Date('2026-08-30T08:00:00Z'))
assert.strictEqual(payload.format, transfer.FORMAT)
assert.strictEqual(payload.schemaVersion, 1)
assert.strictEqual(payload.appVersion, '0.5.0')
assert.strictEqual(payload.storage[progressKey], sourceStorage.getItem(progressKey))
assert.strictEqual(payload.storage[codeKey], 'hero.move("up");')
assert.strictEqual(payload.storage[conceptKey], sourceStorage.getItem(conceptKey))
assert.strictEqual(payload.storage.unrelated, undefined)

const zipBytes = transfer.backupArchiveBytes(sourceStorage, '0.5.0', new Date('2026-08-30T08:00:00Z'))
assert(zipBytes instanceof Uint8Array)
assert.strictEqual(new DataView(zipBytes.buffer, zipBytes.byteOffset, zipBytes.byteLength).getUint32(0, true), 0x04034B50)
const zipFiles = transfer.parseStoredZip(zipBytes)
assert(zipFiles['progress.json'])
const roundTrip = transfer.parseBackupBytes(zipBytes)
assert.deepStrictEqual(roundTrip.storage, payload.storage)

const targetStorage = new MemoryStorage({
  [progressKey]: JSON.stringify({ completed: [], unlocked: 1 }),
  'japanese-js-quest-old-value': 'remove-me',
  unrelated: 'keep-me',
})
const restoredCount = transfer.restorePayload(roundTrip, targetStorage)
assert(restoredCount >= 3)
assert.strictEqual(targetStorage.getItem(progressKey), sourceStorage.getItem(progressKey))
assert.strictEqual(targetStorage.getItem(codeKey), 'hero.move("up");')
assert.strictEqual(targetStorage.getItem('japanese-js-quest-old-value'), null)
assert.strictEqual(targetStorage.getItem('unrelated'), 'keep-me')
assert.strictEqual(targetStorage.getItem(transfer.SLOT_KEY), '1')
assert.throws(() => transfer.validatePayload({ format: transfer.FORMAT, schemaVersion: 1, storage: { dangerous: 'x' } }))

const reviewStorage = new MemoryStorage({
  [review.CONCEPT_MEMORY_KEY]: JSON.stringify({
    validatedCardIds: [
      'concept-card-001', 'concept-card-002', 'concept-card-003',
      'concept-card-004', 'concept-card-005', 'concept-card-006',
      'concept-card-007',
    ],
  }),
})
let state = review.load(reviewStorage, new Date(2026, 7, 30, 9, 0, 0))
assert.strictEqual(Object.keys(state.cards).length, 7)
assert(Object.values(state.cards).every(card => card.spacing === 1))
assert.strictEqual(review.knowledgePoints(state).base, 35)
assert.strictEqual(review.dailyReviewDue(state, new Date(2026, 7, 30, 9, 0, 0)), true)

assert(review.selectionWeight({ spacing: 1, reviewCount: 1 }) > review.selectionWeight({ spacing: 10, reviewCount: 1 }))
assert.strictEqual(review.nextSpacing(1, 0, 0), 1)
assert(review.nextSpacing(20, 0, 2) < 20, '0% must decrease spacing even when the learner claims perfect recall')
assert(review.nextSpacing(5, 1, 2) > review.nextSpacing(5, 1, 1))
assert(review.nextSpacing(5, 1, 1) > review.nextSpacing(5, 1, 0))
assert.strictEqual(review.accuracyPoints(0, 2), 0)
assert.strictEqual(review.accuracyPoints(1, 2), 1)
assert.strictEqual(review.accuracyPoints(2, 2), 3)

const deterministic = () => 0
let session = review.beginSession(state, new Date(2026, 7, 30, 9, 0, 0), deterministic)
assert.strictEqual(session.cardIds.length, 6)
assert.strictEqual(new Set(session.cardIds).size, 6)
for (const cardId of session.cardIds) review.reviewCard(state, cardId, 2, 2, 2, new Date(2026, 7, 30, 9, 5, 0), true)
let completion = review.completeActiveSession(state, new Date(2026, 7, 30, 9, 10, 0))
assert.strictEqual(completion.completed, true)
assert.strictEqual(completion.bonus, 10)
assert.strictEqual(completion.sessionNumber, 1)
assert.strictEqual(review.completedSessionsToday(state, new Date(2026, 7, 30, 10, 0, 0)), 1)
assert.strictEqual(review.dailyReviewDue(state, new Date(2026, 7, 30, 10, 0, 0)), false)

session = review.beginSession(state, new Date(2026, 7, 30, 10, 0, 0), deterministic)
for (const cardId of session.cardIds) review.reviewCard(state, cardId, 1, 2, 1, new Date(2026, 7, 30, 10, 5, 0), true)
completion = review.completeActiveSession(state, new Date(2026, 7, 30, 10, 10, 0))
assert.strictEqual(completion.bonus, 3)
assert.strictEqual(completion.sessionNumber, 2)

const reviewPointsBeforeThird = review.knowledgePoints(state).review
session = review.beginSession(state, new Date(2026, 7, 30, 11, 0, 0), deterministic)
for (const cardId of session.cardIds) review.reviewCard(state, cardId, 2, 2, 2, new Date(2026, 7, 30, 11, 5, 0), false)
completion = review.completeActiveSession(state, new Date(2026, 7, 30, 11, 10, 0))
assert.strictEqual(completion.bonus, 0)
assert.strictEqual(completion.sessionNumber, 3)
assert.strictEqual(review.knowledgePoints(state).review, reviewPointsBeforeThird, 'Third same-day session must not farm knowledge points')
assert.strictEqual(review.knowledgePoints(state).session, 13)

review.save(state, reviewStorage)
state = review.load(reviewStorage, new Date(2026, 7, 30, 12, 0, 0))
assert.strictEqual(review.completedSessionsToday(state, new Date(2026, 7, 30, 12, 0, 0)), 3)
assert.strictEqual(Object.keys(state.cards).length, 7)
assert.strictEqual(review.dailyReviewDue(state, new Date(2026, 7, 31, 8, 0, 0)), true)

const index = readQuest('index.html')
for (const asset of [
  'knowledge-review.css',
  'save-transfer.js',
  'startup-gate.js',
  'knowledge-review.js',
  'knowledge-review-ui.js',
  'mission-navigation-ui.js',
]) assert(index.includes(asset), 'Missing backup/review/navigation asset: ' + asset)
assert(index.indexOf('save-transfer.js') < index.indexOf('startup-gate.js'))
assert(index.indexOf('startup-gate.js') < index.indexOf('story-intro.js'))
assert(index.indexOf('concept-card-memory.js') < index.indexOf('knowledge-review.js'))
assert(index.indexOf('app-v3.js') < index.indexOf('mission-navigation-ui.js'))
assert(index.indexOf('mission-navigation-ui.js') < index.indexOf('field-responsive.js'))
assert(index.indexOf('version.js') < index.indexOf('knowledge-review-ui.js'))
assert(index.includes('メニューから ZIP に書き出せます'))

const startup = readQuest('startup-gate.js')
for (const text of [
  '新しくはじめる',
  'つづきから',
  'storage.setItem(PENDING_KEY, \'1\')',
  'storage.setItem(INTRO_KEY, \'1\')',
  'transfer.clearQuestStorage(storage)',
  'transfer.importFile(file, storage)',
  'window.JSQuestStoryIntro?.replay()',
]) assert(startup.includes(text), 'Missing startup flow: ' + text)

const ui = readQuest('knowledge-review-ui.js')
for (const text of [
  '考え方の復習',
  'knowledge-points',
  'menu-notification-dot',
  'ぜんぶ忘れてた',
  'なんとなく覚えてた',
  '完璧に覚えてた',
  'emoji: \'😅\'',
  'emoji: \'🙂\'',
  'emoji: \'😎\'',
  'Anki用カードを書き出す',
  '#separator:tab',
  '#html:true',
  '大切な確認 1 / 2',
  '大切な確認 2 / 2',
  'completedBefore < 2',
]) assert(ui.includes(text), 'Missing review/menu behavior: ' + text)

const reviewCss = readQuest('knowledge-review.css')
for (const text of [
  '.quest-main-menu',
  '.knowledge-points',
  '.menu-notification-dot',
  '.knowledge-review-overlay',
  '.review-recall-emoji',
  '.safe-reset-overlay',
  '@media (max-width: 650px)',
]) assert(reviewCss.includes(text), 'Missing responsive review/menu style: ' + text)

const navigation = readQuest('mission-navigation-ui.js')
for (const text of [
  'document.addEventListener(\'jsquest:missionloaded\', scheduleMissionScroll)',
  'document.querySelector(\'.mission-card\')',
  'document.querySelector(\'.topbar\')',
  'getComputedStyle(topbar).position',
  'window.requestAnimationFrame(() => window.requestAnimationFrame(scrollMissionOverviewIntoView))',
  'window.scrollTo({ top: targetTop',
  'prefers-reduced-motion: reduce',
]) assert(navigation.includes(text), 'Missing mission-navigation scroll rule: ' + text)

const productRules = fs.readFileSync(path.join(repositoryPath, 'docs', 'PRODUCT_RULES.md'), 'utf8')
for (const text of [
  'portable ZIP save',
  'six concept cards',
  'knowledge points',
  'spaced review',
  'AnkiDroid',
  '10 points',
  '3 points',
  'mission overview',
]) assert(productRules.includes(text), 'Missing backup/review/navigation product rule: ' + text)

const version = require(path.join(questPath, 'version.js'))
assert.strictEqual(version, '0.5.1')

console.log('Validated portable ZIP save/import, fresh-start choice, spaced six-card review, knowledge points, daily anti-farming rules, Anki export, responsive top menu and mission-change overview scrolling.')
