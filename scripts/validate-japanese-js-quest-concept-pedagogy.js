#!/usr/bin/env node
'use strict'

const assert = require('assert')
const fs = require('fs')
const path = require('path')
const vm = require('vm')

const repositoryPath = path.join(__dirname, '..')
const questPath = path.join(repositoryPath, 'app', 'assets', 'japanese-js-quest')

function readQuest (file) {
  return fs.readFileSync(path.join(questPath, file), 'utf8')
}

const missionTypes = require(path.join(questPath, 'mission-types.js'))
const missions = require(path.join(questPath, 'missions.js'))
const curriculum = require(path.join(questPath, 'curriculum-v3.js'))
curriculum.apply(missions)
const packV1 = require(path.join(questPath, 'mission-pack-v1.js'))
packV1.apply(missions, curriculum)
const packV2 = require(path.join(questPath, 'mission-pack-v2.js'))
packV2.apply(missions, curriculum)
const packV3 = require(path.join(questPath, 'mission-pack-v3.js'))
packV3.apply(missions, curriculum)
const packV4 = require(path.join(questPath, 'mission-pack-v4.js'))
packV4.apply(missions, curriculum)
const packV4Pedagogy = require(path.join(questPath, 'mission-pack-v4-pedagogy.js'))
packV4Pedagogy.apply(missions)
const packV5 = require(path.join(questPath, 'mission-pack-v5-order.js'))
packV5.apply(missions, curriculum)
const introMission = require(path.join(questPath, 'intro-mission.js'))
const allMissions = [introMission, ...missions]

const sourceCards = require(path.join(questPath, 'concept-card-curriculum-source.js'))
const finalCards = require(path.join(questPath, 'concept-card-curriculum-final.js'))
const quizzes = require(path.join(questPath, 'concept-card-quizzes-extension.js'))

const expectedSourceGuides = Object.freeze({
  0: ['concept-card-001', 'concept-card-002', 'concept-card-003', 'concept-card-004'],
  1: ['concept-card-037', 'concept-card-038', 'concept-card-036', 'concept-card-005'],
  2: ['concept-card-006'],
  3: ['concept-card-007', 'concept-card-008', 'concept-card-009', 'concept-card-010', 'concept-card-011'],
  4: ['concept-card-012', 'concept-card-013', 'concept-card-014'],
  5: ['concept-card-015'],
  6: ['concept-card-016'],
  7: ['concept-card-039', 'concept-card-017'],
  8: ['concept-card-018'],
  9: ['concept-card-019'],
  10: ['concept-card-020'],
  11: ['concept-card-021'],
  12: ['concept-card-022'],
  13: ['concept-card-023'],
  14: ['concept-card-024', 'concept-card-025', 'concept-card-026', 'concept-card-027'],
  15: ['concept-card-028'],
  16: ['concept-card-029'],
  17: ['concept-card-030'],
  18: ['concept-card-031'],
  19: ['concept-card-032'],
  20: ['concept-card-033'],
  21: ['concept-card-034'],
  22: ['concept-card-035'],
})
const expectedSemanticGuides = Object.freeze({
  'hero-transform-form': ['concept-card-040'],
})

assert.deepStrictEqual(
  Object.keys(sourceCards.missionGuides).map(Number).sort((a, b) => a - b),
  Object.keys(expectedSourceGuides).map(Number),
  'Every core source concept mission must be audited explicitly',
)
assert.deepStrictEqual(
  Object.keys(sourceCards.semanticGuides).sort(),
  Object.keys(expectedSemanticGuides).sort(),
  'Every inserted semantic concept owner must be audited explicitly',
)

for (const [sourceMissionIdText, expectedCardIds] of Object.entries(expectedSourceGuides)) {
  const sourceMissionId = Number(sourceMissionIdText)
  const sourceGuide = sourceCards.getMissionGuide(sourceMissionId)
  assert(sourceGuide, `Source concept mission ${sourceMissionId} must have a guide`)
  assert.deepStrictEqual(
    sourceGuide.cardIds,
    expectedCardIds,
    `Source concept mission ${sourceMissionId} must introduce exactly its audited concepts`,
  )

  const finalMissionId = finalCards.finalMissionIdForSource(sourceMissionId)
  const finalGuide = finalCards.getMissionGuide(finalMissionId)
  assert(finalGuide, `MISSION ${finalMissionId} must receive source concept ${sourceMissionId}`)
  assert.deepStrictEqual(finalGuide.cardIds, expectedCardIds)
  assert.strictEqual(
    allMissions[finalMissionId].type,
    missionTypes.TYPES.concept.code,
    `MISSION ${finalMissionId} must be a concept mission because it owns new-concept cards`,
  )
}

for (const [ownerKey, expectedCardIds] of Object.entries(expectedSemanticGuides)) {
  const sourceGuide = sourceCards.getSemanticGuide(ownerKey)
  assert(sourceGuide, `Semantic concept owner ${ownerKey} must have a guide`)
  assert.deepStrictEqual(sourceGuide.cardIds, expectedCardIds)
  const finalMissionId = finalCards.finalMissionIdForOwner(ownerKey)
  const finalGuide = finalCards.getMissionGuide(finalMissionId)
  assert(finalGuide, `Semantic concept owner ${ownerKey} must resolve to MISSION ${finalMissionId}`)
  assert.deepStrictEqual(finalGuide.cardIds, expectedCardIds)
  assert.strictEqual(allMissions[finalMissionId].type, missionTypes.TYPES.concept.code)
  assert.strictEqual(allMissions[finalMissionId].conceptOwnerKey, ownerKey)
}

const sourceIds = sourceCards.allCards().map(card => card.id)
const finalIds = finalCards.allCards().map(card => card.id)
assert.strictEqual(new Set(sourceIds).size, sourceIds.length, 'Source concept-card IDs must be unique')
assert.deepStrictEqual(finalIds.slice().sort(), sourceIds.slice().sort(), 'Final mapping must preserve every concept card without deletion')
assert.strictEqual(sourceIds.length, 40, 'The audited curriculum contains 40 canonical concept cards')

for (const card of sourceCards.allCards()) {
  const expectedMissionId = card.ownerKey
    ? finalCards.finalMissionIdForOwner(card.ownerKey)
    : finalCards.finalMissionIdForSource(card.missionId)
  assert.strictEqual(finalCards.getCard(card.id).missionId, expectedMissionId, `${card.id} must follow its semantic source lesson`)
  const quiz = quizzes.getQuiz(card.id)
  assert(Array.isArray(quiz) && quiz.length >= 1 && quiz.length <= 3, `${card.id} must keep a valid quiz`)
}

assert.deepStrictEqual(finalCards.getMissionGuide(10).cardIds, expectedSourceGuides[3])
assert.deepStrictEqual(finalCards.getMissionGuide(11).cardIds, expectedSourceGuides[4])
assert.deepStrictEqual(finalCards.getMissionGuide(14).cardIds, expectedSourceGuides[5])
assert.strictEqual(finalCards.getMissionGuide(15), null)
assert.deepStrictEqual(finalCards.getMissionGuide(16).cardIds, expectedSourceGuides[6])
assert.deepStrictEqual(finalCards.getMissionGuide(17).cardIds, expectedSourceGuides[7])
assert.deepStrictEqual(finalCards.getMissionGuide(18).cardIds, expectedSemanticGuides['hero-transform-form'])
assert.deepStrictEqual(finalCards.getMissionGuide(20).cardIds, expectedSourceGuides[8])
assert.deepStrictEqual(finalCards.getMissionGuide(21).cardIds, expectedSourceGuides[9])
assert.deepStrictEqual(finalCards.getMissionGuide(22).cardIds, expectedSourceGuides[10])
assert.deepStrictEqual(finalCards.getMissionGuide(23).cardIds, expectedSourceGuides[11])

for (const missionId of [2, 3, 4, 5, 6, 8, 9, 12, 13, 15, 19]) {
  assert.strictEqual(finalCards.getMissionGuide(missionId), null, `Practice MISSION ${missionId} must not receive new-concept cards`)
}

const readSignCard = sourceCards.getCard('concept-card-012')
assert(readSignCard.titleHtml.includes('hero.readSign()'))
assert(!readSignCard.titleHtml.includes('戻り値'))
assert(!readSignCard.bodyHtml.includes('戻り値'), 'Formal return-value terminology must not be introduced by readSign')

const returnValueCard = sourceCards.getCard('concept-card-016')
assert(returnValueCard.titleHtml.includes('戻り値'))
assert(returnValueCard.titleHtml.includes('Return value'))
assert(returnValueCard.titleHtml.includes('hero.look(direction)'))
assert.strictEqual(finalCards.getCard('concept-card-016').missionId, 16, 'Return value must be formally introduced with hero.look in MISSION 16')

assert.strictEqual(finalCards.getCard('concept-card-015').missionId, 14, 'else must be introduced in MISSION 14')
assert.strictEqual(finalCards.getCard('concept-card-039').missionId, 17, 'hero.canMove must follow its lesson to MISSION 17')
assert.strictEqual(finalCards.getCard('concept-card-040').missionId, 18, 'hero.transform must be introduced at its first meaningful use in MISSION 18')
assert.strictEqual(finalCards.getCard('concept-card-020').missionId, 22, 'else if must be introduced in MISSION 22')
assert.strictEqual(finalCards.getCard('concept-card-021').missionId, 23, 'for must be introduced in MISSION 23')

assert.strictEqual(allMissions[15].title, 'if と else の修理')
assert.strictEqual(allMissions[15].type, missionTypes.TYPES.typoFix.code)
assert.strictEqual(allMissions[16].title, 'となりを調べる')
assert.strictEqual(allMissions[17].title, '安全な道')
assert.strictEqual(allMissions[18].title, 'スイレンの川')
assert.strictEqual(allMissions[18].type, missionTypes.TYPES.concept.code)
assert(allMissions[18].solution.includes('hero.transform("frog")'))
assert(allMissions[18].solution.includes('hero.transform("hero")'))

const browser = vm.createContext({
  console,
  self: {
    JSQuestMissionPackV1: packV1,
    JSQuestMissionPackV2: packV2,
    JSQuestMissionPackV3: packV3,
    JSQuestMissionPackV4: packV4,
    JSQuestMissionPackV4Pedagogy: packV4Pedagogy,
    JSQuestMissionPackV5Order: packV5,
  },
})
for (const file of [
  'concept-card-library.js',
  'concept-card-curriculum-source.js',
  'concept-card-curriculum-final.js',
]) {
  vm.runInContext(readQuest(file), browser, { filename: file })
}
const browserCards = browser.self.JSQuestConceptCards
assert.deepStrictEqual(Array.from(browserCards.getMissionGuide(10).cardIds), expectedSourceGuides[3])
assert.deepStrictEqual(Array.from(browserCards.getMissionGuide(11).cardIds), expectedSourceGuides[4])
assert.deepStrictEqual(Array.from(browserCards.getMissionGuide(14).cardIds), expectedSourceGuides[5])
assert.strictEqual(browserCards.getMissionGuide(15), null)
assert.deepStrictEqual(Array.from(browserCards.getMissionGuide(16).cardIds), expectedSourceGuides[6])
assert.deepStrictEqual(Array.from(browserCards.getMissionGuide(17).cardIds), expectedSourceGuides[7])
assert.deepStrictEqual(Array.from(browserCards.getMissionGuide(18).cardIds), expectedSemanticGuides['hero-transform-form'])
assert.deepStrictEqual(Array.from(browserCards.getMissionGuide(23).cardIds), expectedSourceGuides[11])
assert.strictEqual(browserCards.getMissionGuide(20).cardIds.includes('concept-card-007'), false)
assert.strictEqual(browserCards.getMissionGuide(21).cardIds.includes('concept-card-012'), false)

const index = readQuest('index.html')
assert(index.includes('<script src="mission-pack-v4-pedagogy.js"></script>'))
assert(index.includes('<script src="mission-pack-v5-order.js"></script>'))
assert(index.includes('<script src="concept-card-curriculum-source.js"></script>'))
assert(index.includes('<script src="concept-card-curriculum-final.js"></script>'))
assert(!index.includes('<script src="concept-card-library-extension.js"></script>'))
for (const remapFile of [
  'concept-card-mission-remap-v1.js',
  'concept-card-mission-remap-v2.js',
  'concept-card-mission-remap-v3.js',
  'concept-card-mission-remap-v4.js',
]) {
  assert(!index.includes(`<script src="${remapFile}"></script>`), `${remapFile} must not run in the browser anymore`)
}
assert(index.indexOf('mission-pack-v4.js') < index.indexOf('mission-pack-v4-pedagogy.js'))
assert(index.indexOf('mission-pack-v4-pedagogy.js') < index.indexOf('mission-pack-v5-order.js'))
assert(index.indexOf('mission-pack-v5-order.js') < index.indexOf('concept-card-curriculum-final.js'))
assert(index.indexOf('concept-card-curriculum-source.js') < index.indexOf('concept-card-curriculum-final.js'))

console.log('Validated all 23 core source concept missions plus the inserted transformation concept, all 40 stable cards, browser mapping, reordered MISSION 15-17 ownership, and first-use pedagogy through the final 35-mission curriculum.')
