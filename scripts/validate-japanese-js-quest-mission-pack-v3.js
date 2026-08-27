#!/usr/bin/env node
'use strict'

const assert = require('assert')
const fs = require('fs')
const path = require('path')

const repositoryPath = path.join(__dirname, '..')
const questPath = path.join(repositoryPath, 'app', 'assets', 'japanese-js-quest')

const engine = require(path.join(questPath, 'engine.js'))
require(path.join(questPath, 'curriculum-engine.js')).apply(engine)
const bossMechanics = require(path.join(questPath, 'boss-mechanics.js'))
bossMechanics.apply(engine)

const missions = require(path.join(questPath, 'missions.js'))
const curriculum = require(path.join(questPath, 'curriculum-v3.js'))
curriculum.apply(missions)
const missionTypes = require(path.join(questPath, 'mission-types.js'))
const packV1 = require(path.join(questPath, 'mission-pack-v1.js'))
packV1.apply(missions, curriculum)
require(path.join(questPath, 'mission-pack-v1-dragon-polish.js')).apply(missions)
const packV2 = require(path.join(questPath, 'mission-pack-v2.js'))
packV2.apply(missions, curriculum)

const legacyForElevenBeforeV3 = curriculum.legacyIdForFinalId(11)
const legacyForTwelveBeforeV3 = curriculum.legacyIdForFinalId(12)
const finalForFourBeforeV3 = curriculum.finalIdForLegacyId(4)

const packV3 = require(path.join(questPath, 'mission-pack-v3.js'))
packV3.apply(missions, curriculum)

const introMission = require(path.join(questPath, 'intro-mission.js'))
const allMissions = [introMission, ...missions]
require(path.join(questPath, 'progression.js')).apply(allMissions, engine)
require(path.join(questPath, 'loop-rules.js')).apply(allMissions)
const remappedCards = require(path.join(questPath, 'concept-card-mission-remap-v3.js'))

function readQuest (file) {
  return fs.readFileSync(path.join(questPath, file), 'utf8')
}

assert.strictEqual(allMissions.length, 32)
assert.deepStrictEqual(allMissions.map(mission => mission.id), Array.from({ length: 32 }, (_, id) => id))
assert.strictEqual(packV3.FINAL_MISSION_COUNT, 32)
assert.strictEqual(packV3.INSERT_COUNT, 2)
assert.strictEqual(packV3.shiftedExistingId(11), 11)
assert.strictEqual(packV3.shiftedExistingId(12), 14)
assert.strictEqual(packV3.shiftedExistingId(29), 31)

const missionNine = allMissions[9]
assert.strictEqual(missionNine.requirements.state.maxMoves, 21)
assert(missionNine.victoryConditions.some(item => item.id === 'max-moves' && item.label === '移動：最大 21 回'))
assert(missionNine.instructions.some(text => text.includes('21回以内')))

const missionEleven = allMissions[11]
assert.strictEqual(missionEleven.title, '最初の if')
assert.strictEqual(missionEleven.type, missionTypes.TYPES.concept.code)

const logicMission = allMissions[12]
assert.strictEqual(logicMission.type, missionTypes.TYPES.logicFix.code)
assert.strictEqual(logicMission.practiceOf, 11)
assert.strictEqual(logicMission.prePracticeId, 3)
assert.strictEqual(logicMission.variants.length, 2)
assert.deepStrictEqual(logicMission.variants.map(variant => variant.sign), ['right', 'left'])
assert.strictEqual(logicMission.requirements.state.maxMoves, 4)

for (let variantIndex = 0; variantIndex < logicMission.variants.length; variantIndex++) {
  const starterResult = engine.simulate(logicMission.starterCode, logicMission, variantIndex)
  assert.strictEqual(starterResult.ok, true)
  assert.strictEqual(engine.evaluate(logicMission, starterResult, logicMission.starterCode).passed, false)

  const solutionResult = engine.simulate(logicMission.solution, logicMission, variantIndex)
  assert.strictEqual(solutionResult.ok, true)
  assert.strictEqual(solutionResult.state.moves, 4)
  assert.strictEqual(solutionResult.state.gems, 1)
  assert.strictEqual(solutionResult.state.goalReached, true)
  assert.strictEqual(engine.evaluate(logicMission, solutionResult, logicMission.solution).passed, true)
}

const bossMission = allMissions[13]
assert.strictEqual(bossMission.type, missionTypes.TYPES.boss.code)
assert.strictEqual(bossMission.practiceOf, 11)
assert.strictEqual(bossMission.prePracticeId, 3)
assert.strictEqual(bossMission.bossEncounter, true)
assert.strictEqual(bossMission.bossResolution, 'escape')
assert.strictEqual(bossMission.variants.length, 2)
assert.deepStrictEqual(bossMission.variants.map(variant => variant.sign), ['right', 'left'])
assert.strictEqual(bossMission.requirements.state.maxMoves, 10)
assert(bossMission.solution.includes('hero.readSign()'))
assert(bossMission.solution.includes('if (direction === "right")'))
assert(bossMission.solution.includes('if (direction === "left")'))

const rightField = bossMission.variants[0]
const leftField = bossMission.variants[1]
assert.deepStrictEqual(rightField.boss.dragon, { x: 6, y: 4 })
assert.deepStrictEqual(leftField.boss.dragon, { x: 6, y: 4 })
assert.strictEqual(rightField.map[4][8], '#')
assert.strictEqual(leftField.map[4][4], '#')
assert.deepStrictEqual(bossMechanics.dragonRayCells(rightField, rightField.boss, 'right'), [{ x: 7, y: 4 }])
assert.deepStrictEqual(bossMechanics.dragonRayCells(leftField, leftField.boss, 'left'), [{ x: 5, y: 4 }])

const unsafeLeftOnRightField = [
  'hero.move("left");',
  'hero.move("left");',
  'hero.move("left");',
  'hero.move("up");',
  'hero.move("up");',
  'hero.move("up");',
  'hero.move("up");',
].join('\n')
const wrongRightFieldResult = engine.simulate(unsafeLeftOnRightField, bossMission, 0)
assert.strictEqual(wrongRightFieldResult.stopped, true)
assert.strictEqual(wrongRightFieldResult.state.alive, false)
assert.strictEqual(wrongRightFieldResult.state.dragonHit, true)
assert.strictEqual(wrongRightFieldResult.state.deathCause, 'dragon-fire')

const unsafeRightOnLeftField = [
  'hero.move("right");',
  'hero.move("right");',
  'hero.move("right");',
  'hero.move("up");',
  'hero.move("up");',
  'hero.move("up");',
  'hero.move("up");',
].join('\n')
const wrongLeftFieldResult = engine.simulate(unsafeRightOnLeftField, bossMission, 1)
assert.strictEqual(wrongLeftFieldResult.stopped, true)
assert.strictEqual(wrongLeftFieldResult.state.alive, false)
assert.strictEqual(wrongLeftFieldResult.state.dragonHit, true)
assert.strictEqual(wrongLeftFieldResult.state.deathCause, 'dragon-fire')

for (let variantIndex = 0; variantIndex < bossMission.variants.length; variantIndex++) {
  const solutionResult = engine.simulate(bossMission.solution, bossMission, variantIndex)
  assert.strictEqual(solutionResult.ok, true)
  assert.strictEqual(solutionResult.state.alive, true)
  assert.strictEqual(solutionResult.state.dragonHit, false)
  assert.strictEqual(solutionResult.state.moves, 10)
  assert.strictEqual(solutionResult.state.gems, 1)
  assert.strictEqual(solutionResult.state.goalReached, true)
  assert.strictEqual(engine.evaluate(bossMission, solutionResult, bossMission.solution).passed, true)
}

assert.strictEqual(curriculum.finalIdForLegacyId(3), 11)
assert.strictEqual(curriculum.finalIdForLegacyId(4), packV3.shiftedExistingId(finalForFourBeforeV3))
assert.strictEqual(curriculum.legacyIdForFinalId(12), legacyForElevenBeforeV3)
assert.strictEqual(curriculum.legacyIdForFinalId(13), legacyForElevenBeforeV3)
assert.strictEqual(curriculum.legacyIdForFinalId(14), legacyForTwelveBeforeV3)
assert(remappedCards.getMissionGuide(11))
assert.strictEqual(remappedCards.getMissionGuide(12), null)
assert.strictEqual(remappedCards.getMissionGuide(13), null)

const index = readQuest('index.html')
assert(index.includes('<script src="mission-pack-v3.js"></script>'))
assert(index.includes('<script src="concept-card-curriculum-final.js"></script>'))
assert(!index.includes('<script src="concept-card-mission-remap-v3.js"></script>'))
assert(index.indexOf('mission-pack-v2.js') < index.indexOf('mission-pack-v3.js'))
assert(index.indexOf('mission-pack-v3.js') < index.indexOf('intro-mission.js'))

const packSource = readQuest('mission-pack-v3.js')
for (const text of [
  'japanese-js-quest-mission-pack-v3-migrated',
  'for (let oldId = 12; oldId <= 29; oldId++)',
  'FINAL_MISSION_COUNT = 32',
  "label: '移動：最大 21 回'",
]) assert(packSource.includes(text))

const productRules = fs.readFileSync(path.join(repositoryPath, 'docs', 'PRODUCT_RULES.md'), 'utf8')
for (const text of ['MISSION 09', '21 moves', 'MISSION 12', 'logic-fix', 'MISSION 13', '看板：right', '看板：left']) {
  assert(productRules.includes(text), 'Missing v3 product rule: ' + text)
}

const version = require(path.join(questPath, 'version.js'))
assert(/^\d+\.\d+\.\d+$/.test(version), 'The application version must use MAJOR.MINOR.REVISION')

console.log('Validated MISSION 09 21-move limit, MISSION 12 if logic repair, MISSION 13 two-field conditional dragon boss and migrations.')
