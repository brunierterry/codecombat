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
const packV3 = require(path.join(questPath, 'mission-pack-v3.js'))
packV3.apply(missions, curriculum)
const packV4 = require(path.join(questPath, 'mission-pack-v4.js'))
packV4.apply(missions, curriculum)

const introMission = require(path.join(questPath, 'intro-mission.js'))
const allMissions = [introMission, ...missions]
const progression = require(path.join(questPath, 'progression.js'))
progression.apply(allMissions, engine)
require(path.join(questPath, 'loop-rules.js')).apply(allMissions)
const remappedCards = require(path.join(questPath, 'concept-card-mission-remap-v4.js'))

function readQuest (file) {
  return fs.readFileSync(path.join(questPath, file), 'utf8')
}

assert.strictEqual(allMissions.length, 35)
assert.deepStrictEqual(allMissions.map(mission => mission.id), Array.from({ length: 35 }, (_, id) => id))
assert.strictEqual(packV4.FINAL_MISSION_COUNT, 35)
assert.strictEqual(packV4.INSERT_COUNT, 3)
assert.strictEqual(packV4.shiftedExistingId(16), 16)
assert.strictEqual(packV4.shiftedExistingId(17), 20)
assert.strictEqual(packV4.shiftedExistingId(31), 34)
assert.strictEqual(allMissions[16].title, '安全な道')

const syntaxMission = allMissions[17]
assert.strictEqual(syntaxMission.type, missionTypes.TYPES.typoFix.code)
assert.strictEqual(syntaxMission.practiceOf, 16)
assert.strictEqual(syntaxMission.variants.length, 2)
assert(syntaxMission.starterCode.includes('else {'))
assert.strictEqual(engine.simulate(syntaxMission.starterCode, syntaxMission, 0).ok, false)
for (let variantIndex = 0; variantIndex < syntaxMission.variants.length; variantIndex++) {
  const result = engine.simulate(syntaxMission.solution, syntaxMission, variantIndex)
  assert.strictEqual(result.ok, true)
  assert.strictEqual(engine.evaluate(syntaxMission, result, syntaxMission.solution).passed, true)
  assert.strictEqual(result.state.gems, 1)
  assert.strictEqual(result.state.goalReached, true)
}

const riverMission = allMissions[18]
assert.strictEqual(riverMission.type, missionTypes.TYPES.adventure.code)
assert.strictEqual(riverMission.variants.length, 1)
assert(riverMission.variants[0].map.some(row => row.includes('W')))
assert(riverMission.variants[0].map.some(row => row.includes('O')))
assert(riverMission.variants[0].map.some(row => row.includes('X')))
assert(!riverMission.variants[0].map.some(row => row.includes('G')))
assert.strictEqual(engine.TILE_NAMES.W, 'water')
assert.strictEqual(engine.TILE_NAMES.O, 'lily')
assert.strictEqual(engine.TILE_NAMES.X, 'door')

const heavyAttempt = engine.simulate('hero.move("up");\nhero.move("up");', riverMission, 0)
assert.strictEqual(heavyAttempt.ok, true)
assert.strictEqual(heavyAttempt.state.goalReached, false)
assert.strictEqual(heavyAttempt.state.x, 4)
assert.strictEqual(heavyAttempt.state.y, 6)
assert(heavyAttempt.state.says.includes(engine.LILY_BLOCKED_MESSAGE))
assert(heavyAttempt.trace.some(frame => frame.type === 'say' && frame.blockedTerrain === 'lily'))

const frogAtDoorCode = [
  'hero.move("up");',
  'hero.transform("frog");',
  'hero.move("up");',
  'hero.move("up");',
  'hero.move("up");',
  'hero.move("up");',
  'hero.move("up");',
].join('\n')
const frogAtDoor = engine.simulate(frogAtDoorCode, riverMission, 0)
assert.strictEqual(frogAtDoor.ok, true)
assert.strictEqual(frogAtDoor.state.goalReached, false)
assert.strictEqual(frogAtDoor.state.form, 'frog')
assert(frogAtDoor.state.says.includes(engine.GOAL_DOOR_FROG_MESSAGE))
assert(frogAtDoor.trace.some(frame => frame.type === 'say' && frame.blockedTerrain === 'goal-door'))

const riverSolution = engine.simulate(riverMission.solution, riverMission, 0)
assert.strictEqual(riverSolution.ok, true)
assert.strictEqual(riverSolution.state.goalReached, true)
assert.strictEqual(riverSolution.state.gems, 1)
assert.strictEqual(riverSolution.state.form, 'hero')
assert.strictEqual(riverSolution.state.moves, 6)
assert.strictEqual(engine.evaluate(riverMission, riverSolution, riverMission.solution).passed, true)

const bossMission = allMissions[19]
assert.strictEqual(bossMission.type, missionTypes.TYPES.boss.code)
assert.strictEqual(bossMission.variants.length, 2)
assert.strictEqual(bossMission.bossEncounter, true)
assert.strictEqual(bossMission.bossResolution, 'lever')
assert(bossMission.solution.includes('||'))
assert(bossMission.solution.includes('&&'))
assert(bossMission.solution.includes('hero.transform("frog")'))
assert(bossMission.solution.includes('hero.transform("hero")'))

for (let variantIndex = 0; variantIndex < bossMission.variants.length; variantIndex++) {
  const result = engine.simulate(bossMission.solution, bossMission, variantIndex)
  const evaluation = engine.evaluate(bossMission, result, bossMission.solution)
  assert.strictEqual(result.ok, true)
  assert.strictEqual(result.state.alive, true)
  assert.strictEqual(result.state.dragonHit, false)
  assert.strictEqual(result.state.bossDefeated, true)
  assert.strictEqual(result.state.gems, 1)
  assert.strictEqual(result.state.goalReached, true)
  assert.strictEqual(result.state.moves, 11)
  assert.strictEqual(evaluation.passed, true, evaluation.messages.join('\n'))
  assert(result.trace.some(frame => frame.type === 'boss-defeated'))
}

const wrongSideCode = [
  'hero.move("right");',
  'hero.move("right");',
  'hero.move("right");',
  'hero.transform("frog");',
  'hero.move("up");',
  'hero.move("up");',
  'hero.move("up");',
  'hero.move("up");',
  'hero.transform("hero");',
  'hero.move("up");',
].join('\n')
const wrongSide = engine.simulate(wrongSideCode, bossMission, 0)
assert.strictEqual(wrongSide.ok, true)
assert.strictEqual(wrongSide.stopped, true)
assert.strictEqual(wrongSide.state.alive, false)
assert.strictEqual(wrongSide.state.dragonHit, true)
assert.strictEqual(wrongSide.state.deathCause, 'dragon-fire')

assert.strictEqual(progression.thresholdForLevel(1), 1)
assert.strictEqual(progression.thresholdForLevel(2), 21)
assert.strictEqual(progression.thresholdForLevel(3), 51)
assert.strictEqual(progression.thresholdForLevel(4), 91)
assert.strictEqual(progression.levelForXp(20), 1)
assert.strictEqual(progression.levelForXp(21), 2)
assert.strictEqual(progression.levelForXp(50), 2)
assert.strictEqual(progression.levelForXp(51), 3)
assert.strictEqual(allMissions[1].wizardXpAfter, 1)
assert.strictEqual(allMissions[1].wizardLevelAfter, 1)
assert.strictEqual(allMissions[21].wizardXpBefore, 20)
assert.strictEqual(allMissions[21].wizardXpAfter, 21)
assert.strictEqual(allMissions[21].wizardLevel, 1)
assert.strictEqual(allMissions[21].wizardLevelAfter, 2)
assert.strictEqual(allMissions[22].wizardLevel, 2)

assert.strictEqual(curriculum.finalIdForLegacyId(8), 20)
assert.strictEqual(curriculum.legacyIdForFinalId(17), 7)
assert.strictEqual(curriculum.legacyIdForFinalId(18), 7)
assert.strictEqual(curriculum.legacyIdForFinalId(19), 7)
assert.strictEqual(curriculum.legacyIdForFinalId(20), 8)
assert.strictEqual(remappedCards.getMissionGuide(17), null)
assert.strictEqual(remappedCards.getMissionGuide(18), null)
assert.strictEqual(remappedCards.getMissionGuide(19), null)
assert(remappedCards.getMissionGuide(20))

for (const mission of allMissions) {
  if (mission.infiniteLoopDemo) continue
  for (let variantIndex = 0; variantIndex < mission.variants.length; variantIndex++) {
    const result = engine.simulate(mission.solution, mission, variantIndex)
    assert.strictEqual(result.ok, true, `Mission ${mission.id} solution must execute on field ${variantIndex + 1}`)
    const evaluation = engine.evaluate(mission, result, mission.solution)
    assert.strictEqual(
      evaluation.passed,
      true,
      `Mission ${mission.id} solution failed field ${variantIndex + 1}: ${evaluation.messages.join(' | ')}`,
    )
  }
}

const index = readQuest('index.html')
assert(index.includes('id="run-code-field"'))
assert(index.includes('<script src="mission-pack-v4.js"></script>'))
assert(index.includes('<script src="concept-card-mission-remap-v4.js"></script>'))
assert(index.includes('<script src="river-ui.js"></script>'))
assert(index.indexOf('mission-pack-v3.js') < index.indexOf('mission-pack-v4.js'))
assert(index.indexOf('mission-pack-v4.js') < index.indexOf('intro-mission.js'))
assert(index.indexOf('concept-card-mission-remap-v3.js') < index.indexOf('concept-card-mission-remap-v4.js'))

const app = readQuest('app-v3.js')
assert(app.includes("fieldRun: document.getElementById('run-code-field')"))
assert(app.includes('els.fieldRun.addEventListener(\'click\', () => els.run.click())'))
assert(app.includes('new MutationObserver(syncRunButtons)'))
assert(app.includes("W: { text: '≈', className: 'water'"))
assert(app.includes("O: { text: '🪷', className: 'lily-pad'"))
assert(app.includes("X: { text: '🚪', className: 'goal-door'"))
assert(app.includes('els.grid.dataset.variantIndex = String(currentVariant)'))

const bossUi = readQuest('boss-ui.js')
assert(bossUi.includes('grid?.dataset.variantIndex'))

const version = require(path.join(questPath, 'version.js'))
assert.strictEqual(version, '0.4.2')

console.log('Validated mirrored field execution, 1/21/51 wizard thresholds, MISSION 17 syntax repair, MISSION 18 frog river, MISSION 19 two-field frog dragon boss and ID migration.')
