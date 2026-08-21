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

const introMission = require(path.join(questPath, 'intro-mission.js'))
const allMissions = [introMission, ...missions]
require(path.join(questPath, 'progression.js')).apply(allMissions, engine)
require(path.join(questPath, 'loop-rules.js')).apply(allMissions)
const remappedCards = require(path.join(questPath, 'concept-card-mission-remap-v2.js'))

function readQuest (file) {
  return fs.readFileSync(path.join(questPath, file), 'utf8')
}

assert.strictEqual(allMissions.length, 30)
assert.deepStrictEqual(allMissions.map(mission => mission.id), Array.from({ length: 30 }, (_, id) => id))
assert.strictEqual(packV2.FINAL_MISSION_COUNT, 30)
assert.strictEqual(packV2.INSERT_COUNT, 2)
assert.strictEqual(packV2.shiftedExistingId(7), 7)
assert.strictEqual(packV2.shiftedExistingId(8), 10)
assert.strictEqual(packV2.shiftedExistingId(27), 29)

const missionSeven = allMissions[7]
assert.strictEqual(missionSeven.title, '曲がり道')
for (const direction of ['up', 'right', 'down', 'left']) {
  assert(missionSeven.api.includes(`hero.move("${direction}")`), `MISSION 07 must expose move ${direction}`)
}

const typoMission = allMissions[8]
assert.strictEqual(typoMission.type, missionTypes.TYPES.typoFix.code)
assert.strictEqual(typoMission.practiceOf, 7)
assert.strictEqual(typoMission.title, 'まちがった down')
assert.strictEqual((typoMission.starterCode.match(/dwon/g) || []).length, 1)
assert(!typoMission.solution.includes('dwon'))
assert(typoMission.solution.includes('hero.move("down");'))

const typoStarter = engine.simulate(typoMission.starterCode, typoMission, 0)
assert.strictEqual(typoStarter.ok, false)
assert.strictEqual(typoStarter.error.code, 'invalid-direction')
const typoFixedCode = typoMission.starterCode.replace('hero.move("dwon");', 'hero.move("down");')
const typoFixed = engine.simulate(typoFixedCode, typoMission, 0)
assert.strictEqual(typoFixed.ok, true)
assert.strictEqual(engine.evaluate(typoMission, typoFixed, typoFixedCode).passed, true)
assert.strictEqual(typoFixed.state.gems, 1)
assert.strictEqual(typoFixed.state.goalReached, true)

const bossMission = allMissions[9]
const bossVariant = bossMission.variants[0]
assert.strictEqual(bossMission.type, missionTypes.TYPES.boss.code)
assert.strictEqual(bossMission.practiceOf, 7)
assert.strictEqual(bossMission.bossEncounter, true)
assert.strictEqual(bossMission.bossResolution, 'escape')
assert.strictEqual(bossVariant.boss.attackRange, 3)
assert.deepStrictEqual(bossVariant.boss.dragon, { x: 6, y: 4 })
assert.strictEqual(bossVariant.map[4][4], '#')
assert.strictEqual(bossVariant.map[4][8], '#')
assert.strictEqual(bossVariant.map[2][6], '#')
assert.strictEqual(bossVariant.map[4][5], '.')
assert.strictEqual(bossVariant.map[4][7], '.')
assert.strictEqual(bossVariant.map[3][6], '.')
assert.strictEqual(bossVariant.map[7][1], 'H')
assert.strictEqual(bossVariant.map[7][9], '*')
assert.strictEqual(bossVariant.map[7][10], 'G')

const directPath = Array.from({ length: 9 }, () => 'hero.move("right");').join('\n')
const directResult = engine.simulate(directPath, bossMission, 0)
assert.strictEqual(directResult.ok, true)
assert.strictEqual(directResult.stopped, true)
assert.strictEqual(directResult.state.alive, false)
assert.strictEqual(directResult.state.deathCause, 'dragon-fire')
assert.strictEqual(directResult.state.dragonHit, true)
assert.strictEqual(directResult.state.x, 6)
assert.strictEqual(directResult.state.y, 7)
const directFire = directResult.trace.find(frame => frame.type === 'dragon-fire')
assert(directFire)
assert.strictEqual(directFire.fireDirection, 'down')
assert.deepStrictEqual(directFire.fireCells, [
  { x: 6, y: 5 },
  { x: 6, y: 6 },
  { x: 6, y: 7 },
])

assert.deepStrictEqual(
  bossMechanics.dragonRayCells(bossVariant, bossVariant.boss, 'up'),
  [{ x: 6, y: 3 }],
  'The upper pillar must block the dragon ray and create a safe route above it',
)

const bossSolution = engine.simulate(bossMission.solution, bossMission, 0)
const bossEvaluation = engine.evaluate(bossMission, bossSolution, bossMission.solution)
assert.strictEqual(bossSolution.ok, true)
assert.strictEqual(bossSolution.state.alive, true)
assert.strictEqual(bossSolution.state.dragonHit, false)
assert.strictEqual(bossSolution.state.gems, 1)
assert.strictEqual(bossSolution.state.goalReached, true)
assert.strictEqual(bossSolution.state.moves, 21)
assert.strictEqual(bossEvaluation.passed, true, bossEvaluation.messages.join('\n'))

const bossUi = readQuest('boss-ui.js')
assert(bossUi.includes("tile.textContent = '🔥'"))
assert(bossUi.includes("tile.textContent = '💀'"))
assert(bossUi.includes('HERO_BURN_DELAY_MS'))

assert.strictEqual(curriculum.finalIdForLegacyId(2), 7)
assert.strictEqual(curriculum.finalIdForLegacyId(3), 11)
assert.strictEqual(curriculum.legacyIdForFinalId(8), 2)
assert.strictEqual(curriculum.legacyIdForFinalId(9), 2)
assert.strictEqual(curriculum.legacyIdForFinalId(10), 2)
assert.strictEqual(curriculum.legacyIdForFinalId(11), 3)

assert(remappedCards.getMissionGuide(7))
assert.strictEqual(remappedCards.getMissionGuide(8), null)
assert.strictEqual(remappedCards.getMissionGuide(9), null)
assert(remappedCards.allCards().every(card => card.missionId <= 7 || card.missionId >= 10))

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
assert(index.includes('<script src="mission-pack-v2.js"></script>'))
assert(index.includes('<script src="concept-card-mission-remap-v2.js"></script>'))
assert(index.indexOf('mission-pack-v1-dragon-polish.js') < index.indexOf('mission-pack-v2.js'))
assert(index.indexOf('mission-pack-v2.js') < index.indexOf('intro-mission.js'))
assert(index.indexOf('concept-card-mission-remap-v1.js') < index.indexOf('concept-card-mission-remap-v2.js'))
assert(index.indexOf('concept-card-mission-remap-v2.js') < index.indexOf('learning-guide.js'))

const packSource = readQuest('mission-pack-v2.js')
for (const text of [
  'japanese-js-quest-mission-pack-v2-migrated',
  'for (let oldId = 8; oldId <= 27; oldId++)',
  'shiftedExistingId(oldId)',
  'FINAL_MISSION_COUNT = 30',
]) assert(packSource.includes(text))

const version = require(path.join(questPath, 'version.js'))
assert.strictEqual(version, '0.4.1')

console.log('Validated MISSION 07 four-direction help, MISSION 08 one-typo repair, MISSION 09 two-dimensional dragon detour, ID migration and current application version.')
