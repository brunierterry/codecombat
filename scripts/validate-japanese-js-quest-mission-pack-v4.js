#!/usr/bin/env node
'use strict'

const assert = require('assert')
const fs = require('fs')
const path = require('path')

const repositoryPath = path.join(__dirname, '..')
const questPath = path.join(repositoryPath, 'app', 'assets', 'japanese-js-quest')
const readQuest = file => fs.readFileSync(path.join(questPath, file), 'utf8')

const engine = require(path.join(questPath, 'engine.js'))
require(path.join(questPath, 'curriculum-engine.js')).apply(engine)
const bossMechanics = require(path.join(questPath, 'boss-mechanics.js'))
bossMechanics.apply(engine)

const missions = require(path.join(questPath, 'missions.js'))
const curriculum = require(path.join(questPath, 'curriculum-v3.js'))
curriculum.apply(missions)
const missionTypes = require(path.join(questPath, 'mission-types.js'))

const packV1 = require(path.join(questPath, 'mission-pack-v1.js'))
const packV2 = require(path.join(questPath, 'mission-pack-v2.js'))
const packV3 = require(path.join(questPath, 'mission-pack-v3.js'))
const packV4 = require(path.join(questPath, 'mission-pack-v4.js'))
const v4Pedagogy = require(path.join(questPath, 'mission-pack-v4-pedagogy.js'))
const packV5 = require(path.join(questPath, 'mission-pack-v5-order.js'))

packV1.apply(missions, curriculum)
require(path.join(questPath, 'mission-pack-v1-dragon-polish.js')).apply(missions)
packV2.apply(missions, curriculum)
packV3.apply(missions, curriculum)
packV4.apply(missions, curriculum)
v4Pedagogy.apply(missions)
packV5.apply(missions, curriculum)

const introMission = require(path.join(questPath, 'intro-mission.js'))
const allMissions = [introMission, ...missions]
const progression = require(path.join(questPath, 'progression.js'))
progression.apply(allMissions, engine)
require(path.join(questPath, 'loop-rules.js')).apply(allMissions)

assert.strictEqual(allMissions.length, 35)
assert.deepStrictEqual(allMissions.map(mission => mission.id), Array.from({ length: 35 }, (_, id) => id))
assert.strictEqual(packV4.FINAL_MISSION_COUNT, 35)
assert.strictEqual(packV5.FINAL_MISSION_COUNT, 35)
assert.strictEqual(allMissions[14].title, 'if と else')
assert.strictEqual(allMissions[15].title, 'if と else の修理')
assert.strictEqual(allMissions[16].title, 'となりを調べる')
assert.strictEqual(allMissions[17].title, '安全な道')
assert.strictEqual(allMissions[18].title, 'スイレンの川')
assert.strictEqual(allMissions[19].title, 'カエルと守りのドラゴン')

const syntaxMission = allMissions[15]
assert.strictEqual(syntaxMission.type, missionTypes.TYPES.typoFix.code)
assert.strictEqual(syntaxMission.practiceOf, 14)
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
assert.strictEqual(riverMission.type, missionTypes.TYPES.concept.code)
assert.strictEqual(riverMission.conceptOwnerKey, v4Pedagogy.TRANSFORMATION_OWNER_KEY)
assert.strictEqual(riverMission.variants.length, 1)
assert(riverMission.variants[0].map.some(row => row.includes('W')))
assert(riverMission.variants[0].map.some(row => row.includes('O')))
assert(riverMission.variants[0].map.some(row => row.includes('X')))
assert(!riverMission.variants[0].map.some(row => row.includes('G')))
assert.strictEqual(engine.TILE_NAMES.W, 'water')
assert.strictEqual(engine.TILE_NAMES.O, 'lily')
assert.strictEqual(engine.TILE_NAMES.S, 'statue')
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
assert.strictEqual(bossMission.bossResolution, bossMechanics.PROTECTIVE_STATUE_RESOLUTION)
assert(bossMission.solution.includes('const side = hero.readSign();'))
assert(bossMission.solution.includes('const goLeft = side === "left";'))
assert(bossMission.solution.includes('if (goLeft) {'))
assert(!bossMission.solution.includes('||'))
assert(!bossMission.solution.includes('&&'))
assert(bossMission.solution.includes('hero.transform("frog")'))
assert(bossMission.solution.includes('hero.transform("hero")'))

for (const variant of bossMission.variants) {
  assert.strictEqual(variant.map.length, 10)
  assert.strictEqual(variant.map[0], '#....SGS....#')
  assert.strictEqual(variant.map[0][6], 'G')
  assert.strictEqual(variant.map[0][5], 'S')
  assert.strictEqual(variant.map[0][7], 'S')
  assert.strictEqual(variant.map[1][6], '.')
  assert.strictEqual(variant.map[2][6], '.')
  assert.strictEqual(variant.map[3][6], 'B')
  assert.deepStrictEqual(variant.boss.dragon, { x: 6, y: 3 })
  assert.deepStrictEqual(variant.boss.protectiveStatue, { x: 6, y: 2 })
  assert.strictEqual(variant.boss.resolution, bossMechanics.PROTECTIVE_STATUE_RESOLUTION)
  for (let y = 4; y <= 7; y++) assert.strictEqual(variant.map[y], '#WWOWWWWWOWW#')
  assert.strictEqual(variant.map[8][6], 'H')
  assert.strictEqual(variant.map[9][6], '#')
}

assert.deepStrictEqual(
  bossMechanics.dragonRayCells(bossMission.variants[0], bossMission.variants[0].boss, 'up'),
  [{ x: 6, y: 2 }, { x: 6, y: 1 }, { x: 6, y: 0 }],
)
assert.deepStrictEqual(
  bossMechanics.dragonRayCells(bossMission.variants[0], bossMission.variants[0].boss, 'up', { protectiveStatueRaised: true }),
  [],
)

const omnidirectionalStatueVariant = {
  map: [
    '#######',
    '#..S..#',
    '#.....#',
    '#S.B.S#',
    '#.....#',
    '#..S..#',
    '#######',
  ],
}
const omnidirectionalStatueBoss = { dragon: { x: 3, y: 3 }, attackRange: 3 }
assert.deepStrictEqual(bossMechanics.dragonRayCells(omnidirectionalStatueVariant, omnidirectionalStatueBoss, 'up'), [{ x: 3, y: 2 }])
assert.deepStrictEqual(bossMechanics.dragonRayCells(omnidirectionalStatueVariant, omnidirectionalStatueBoss, 'down'), [{ x: 3, y: 4 }])
assert.deepStrictEqual(bossMechanics.dragonRayCells(omnidirectionalStatueVariant, omnidirectionalStatueBoss, 'left'), [{ x: 2, y: 3 }])
assert.deepStrictEqual(bossMechanics.dragonRayCells(omnidirectionalStatueVariant, omnidirectionalStatueBoss, 'right'), [{ x: 4, y: 3 }])

const protectedByStaticStatueCode = [
  'hero.move("left");',
  'hero.move("left");',
  'hero.move("left");',
  'hero.transform("frog");',
  'hero.move("up");',
  'hero.move("up");',
  'hero.move("up");',
  'hero.move("up");',
  'hero.move("up");',
  'hero.transform("hero");',
  'hero.move("up");',
].join('\n')
const protectedByStaticStatue = engine.simulate(protectedByStaticStatueCode, bossMission, 0)
assert.strictEqual(protectedByStaticStatue.ok, true)
assert.strictEqual(protectedByStaticStatue.state.alive, true)
assert.strictEqual(protectedByStaticStatue.state.dragonHit, false)
assert.strictEqual(protectedByStaticStatue.state.protectiveStatueRaised, true)
const blockedFireFrame = protectedByStaticStatue.trace.find(frame => frame.type === 'dragon-fire-blocked' && frame.x === 3 && frame.y === 3)
assert(blockedFireFrame, 'The dragon must visibly breathe toward a protected hero without killing it')
assert.deepStrictEqual(blockedFireFrame.fireCells, [{ x: 5, y: 3 }])
assert.strictEqual(blockedFireFrame.grid[3][4], 'S')
assert.strictEqual(blockedFireFrame.grid[3][5], 'T')

for (let variantIndex = 0; variantIndex < bossMission.variants.length; variantIndex++) {
  const result = engine.simulate(bossMission.solution, bossMission, variantIndex)
  const evaluation = engine.evaluate(bossMission, result, bossMission.solution)
  assert.strictEqual(result.ok, true)
  assert.strictEqual(result.state.alive, true)
  assert.strictEqual(result.state.dragonHit, false)
  assert.strictEqual(result.state.bossDefeated, false)
  assert.strictEqual(result.state.protectiveStatueRaised, true)
  assert.strictEqual(result.state.gems, 1)
  assert.strictEqual(result.state.goalReached, true)
  assert.strictEqual(result.state.moves, 14)
  assert.strictEqual(evaluation.passed, true, evaluation.messages.join('\n'))
  assert(result.trace.some(frame => frame.type === 'protective-statue-raised'))
  assert(!result.trace.some(frame => frame.type === 'boss-defeated'))
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
  'hero.move("up");',
].join('\n')
const wrongSide = engine.simulate(wrongSideCode, bossMission, 0)
assert.strictEqual(wrongSide.ok, true)
assert.strictEqual(wrongSide.stopped, true)
assert.strictEqual(wrongSide.state.alive, false)
assert.strictEqual(wrongSide.state.dragonHit, true)
assert.strictEqual(wrongSide.state.deathCause, 'dragon-fire')
assert.strictEqual(wrongSide.state.protectiveStatueRaised, false)

assert.strictEqual(progression.thresholdForLevel(1), 1)
assert.strictEqual(progression.thresholdForLevel(2), 21)
assert.strictEqual(progression.thresholdForLevel(3), 51)
assert.strictEqual(progression.thresholdForLevel(4), 91)
for (let id = 14; id <= 17; id++) {
  assert.strictEqual(progression.missionReward(allMissions[id]), 1)
  assert.strictEqual(allMissions[id].wizardXpAfter, allMissions[id].wizardXpBefore + 1)
  if (id > 14) assert.strictEqual(allMissions[id].wizardXpBefore, allMissions[id - 1].wizardXpAfter)
}
assert.strictEqual(allMissions[18].wizardXpBefore, allMissions[17].wizardXpAfter)

const finalCards = require(path.join(questPath, 'concept-card-curriculum-final.js'))
assert.strictEqual(finalCards.getMissionGuide(15), null)
assert(finalCards.getMissionGuide(16).cardIds.includes('concept-card-016'))
assert(finalCards.getMissionGuide(17).cardIds.includes('concept-card-039'))
assert(finalCards.getMissionGuide(18).cardIds.includes('concept-card-040'))

for (const mission of allMissions) {
  if (mission.infiniteLoopDemo) continue
  for (let variantIndex = 0; variantIndex < mission.variants.length; variantIndex++) {
    const result = engine.simulate(mission.solution, mission, variantIndex)
    assert.strictEqual(result.ok, true, `Mission ${mission.id} solution must execute on field ${variantIndex + 1}`)
    const evaluation = engine.evaluate(mission, result, mission.solution)
    assert.strictEqual(evaluation.passed, true, `Mission ${mission.id} solution failed field ${variantIndex + 1}: ${evaluation.messages.join(' | ')}`)
  }
}

const index = readQuest('index.html')
assert(index.includes('<script src="mission-pack-v4.js"></script>'))
assert(index.includes('<script src="mission-pack-v4-pedagogy.js"></script>'))
assert(index.includes('<script src="mission-pack-v5-order.js"></script>'))
assert(index.includes('<script src="concept-card-curriculum-final.js"></script>'))
assert(index.includes('<script src="river-ui.js"></script>'))
assert(index.includes('<script src="field-responsive.js"></script>'))
assert(index.includes('<link rel="stylesheet" href="field-responsive.css">'))
for (const obsoleteRemap of [1, 2, 3, 4]) {
  assert(!index.includes(`<script src="concept-card-mission-remap-v${obsoleteRemap}.js"></script>`))
}

const app = readQuest('app-v3.js')
assert(app.includes("O: { text: '🍃', className: 'lily-pad'"))
assert(app.includes("S: { text: '🗿', className: 'statue'"))
assert(app.includes("X: { text: '🚪', className: 'goal-door'"))

const riverUi = readQuest('river-ui.js')
assert(riverUi.includes("const WATER_SYMBOL = '≈'"))
assert(riverUi.includes("const WATER_COLOR = '#dff8ff'"))
assert(riverUi.includes("appendReferenceValue(values, 'water', WATER_SYMBOL"))

const responsiveCss = readQuest('field-responsive.css')
assert(responsiveCss.includes('min-width: 0'))
assert(responsiveCss.includes('place-items: center'))
assert(responsiveCss.includes('@media (max-width: 1180px)'))
const responsiveJs = readQuest('field-responsive.js')
assert(responsiveJs.includes('new ResizeObserver'))
assert(responsiveJs.includes('cellWidth * 0.72'))

const developmentRules = fs.readFileSync(path.join(repositoryPath, 'docs', 'DEVELOPMENT_RULES.md'), 'utf8')
assert(developmentRules.includes('renumbering, insertion, reordering or migration'))

const version = require(path.join(questPath, 'version.js'))
assert(/^\d+\.\d+\.\d+$/.test(version), 'Historical river/boss regression only requires a valid canonical semantic version')

console.log('Validated the reordered MISSION 15 typo drill, MISSION 18 transformation river, MISSION 19 protective-statue dragon mechanics, XP continuity, current concept ownership, water vocabulary and responsive field wiring.')
