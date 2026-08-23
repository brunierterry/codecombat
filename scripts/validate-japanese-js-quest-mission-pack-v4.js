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
assert(!bossMission.solution.includes('confirmedLeft'))
assert(!bossMission.solution.includes('west'))
assert(!bossMission.starterCode.includes('||'))
assert(!bossMission.starterCode.includes('&&'))
assert(bossMission.solution.includes('hero.transform("frog")'))
assert(bossMission.solution.includes('hero.transform("hero")'))
assert.strictEqual(bossMechanics.FROG_LEVER_MESSAGE.includes('人の姿'), true)

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
  for (let y = 4; y <= 7; y++) {
    assert.strictEqual(variant.map[y], '#WWOWWWWWOWW#')
    assert.strictEqual(variant.map[y][6], 'W')
  }
  assert.strictEqual(variant.map[8][6], 'H')
  assert.strictEqual(variant.map[9][6], '#')
}

assert.deepStrictEqual(
  bossMechanics.dragonRayCells(bossMission.variants[0], bossMission.variants[0].boss, 'up'),
  [{ x: 6, y: 2 }, { x: 6, y: 1 }, { x: 6, y: 0 }],
)
assert.deepStrictEqual(
  bossMechanics.dragonRayCells(
    bossMission.variants[0],
    bossMission.variants[0].boss,
    'up',
    { protectiveStatueRaised: true },
  ),
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
assert.deepStrictEqual(
  bossMechanics.dragonRayCells(omnidirectionalStatueVariant, omnidirectionalStatueBoss, 'up'),
  [{ x: 3, y: 2 }],
)
assert.deepStrictEqual(
  bossMechanics.dragonRayCells(omnidirectionalStatueVariant, omnidirectionalStatueBoss, 'down'),
  [{ x: 3, y: 4 }],
)
assert.deepStrictEqual(
  bossMechanics.dragonRayCells(omnidirectionalStatueVariant, omnidirectionalStatueBoss, 'left'),
  [{ x: 2, y: 3 }],
)
assert.deepStrictEqual(
  bossMechanics.dragonRayCells(omnidirectionalStatueVariant, omnidirectionalStatueBoss, 'right'),
  [{ x: 4, y: 3 }],
)

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
assert.notStrictEqual(protectedByStaticStatue.stopped, true)
assert.strictEqual(protectedByStaticStatue.state.alive, true)
assert.strictEqual(protectedByStaticStatue.state.dragonHit, false)
assert.strictEqual(protectedByStaticStatue.state.x, 3)
assert.strictEqual(protectedByStaticStatue.state.y, 2)
assert.strictEqual(protectedByStaticStatue.state.protectiveStatueRaised, true)
const blockedFireFrame = protectedByStaticStatue.trace.find(frame => frame.type === 'dragon-fire-blocked' && frame.x === 3 && frame.y === 3)
assert(blockedFireFrame, 'The dragon must visibly breathe toward a protected hero without killing it')
assert.deepStrictEqual(blockedFireFrame.fireCells, [{ x: 5, y: 3 }])
assert.strictEqual(blockedFireFrame.grid[3][4], 'S')
assert.strictEqual(blockedFireFrame.grid[3][5], 'T')
assert.strictEqual(blockedFireFrame.alive, true)

for (let variantIndex = 0; variantIndex < bossMission.variants.length; variantIndex++) {
  const result = engine.simulate(bossMission.solution, bossMission, variantIndex)
  const evaluation = engine.evaluate(bossMission, result, bossMission.solution)
  assert.strictEqual(result.ok, true)
  assert.strictEqual(result.state.alive, true)
  assert.strictEqual(result.state.dragonHit, false)
  assert.strictEqual(result.state.bossDefeated, false)
  assert.strictEqual(result.state.protectiveStatueRaised, true)
  assert.strictEqual(result.state.grid[2][6], 'S')
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
const wrongSideEvaluation = engine.evaluate(bossMission, wrongSide, wrongSideCode)
assert(wrongSideEvaluation.messages.some(message => message.includes('ただし、像があると炎はそこで止まります。')))

const frogLeverBypassCode = [
  'hero.move("left");',
  'hero.move("left");',
  'hero.move("left");',
  'hero.transform("frog");',
  'hero.move("up");',
  'hero.move("up");',
  'hero.move("up");',
  'hero.move("up");',
  'hero.move("up");',
  'hero.move("up");',
  'hero.move("up");',
  'hero.transform("hero");',
  'hero.move("right");',
  'hero.move("right");',
  'hero.move("right");',
].join('\n')
const frogLeverBypass = engine.simulate(frogLeverBypassCode, bossMission, 0)
assert.strictEqual(frogLeverBypass.ok, true)
assert.strictEqual(frogLeverBypass.stopped, true)
assert.strictEqual(frogLeverBypass.state.alive, false)
assert.strictEqual(frogLeverBypass.state.dragonHit, true)
assert.strictEqual(frogLeverBypass.state.protectiveStatueRaised, false)
assert(frogLeverBypass.trace.some(frame => frame.type === 'say' && frame.bossEvent === 'lever-refused'))

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
const levelTwoCrossing = allMissions.find(mission => mission.wizardXpBefore < 21 && mission.wizardXpAfter >= 21)
assert(levelTwoCrossing, 'The campaign must cross the 21-gem threshold')
assert.strictEqual(levelTwoCrossing.wizardLevel, 1)
assert.strictEqual(levelTwoCrossing.wizardLevelAfter, 2)
const afterLevelTwo = allMissions[levelTwoCrossing.id + 1]
if (afterLevelTwo) assert.strictEqual(afterLevelTwo.wizardLevel, 2)

const sourceLegacyId = curriculum.legacyIdForFinalId(16)
assert.strictEqual(curriculum.legacyIdForFinalId(17), sourceLegacyId)
assert.strictEqual(curriculum.legacyIdForFinalId(18), sourceLegacyId)
assert.strictEqual(curriculum.legacyIdForFinalId(19), sourceLegacyId)
const shiftedLegacyEight = curriculum.finalIdForLegacyId(8)
assert(shiftedLegacyEight >= 20)
assert.strictEqual(curriculum.legacyIdForFinalId(shiftedLegacyEight), 8)
assert.strictEqual(remappedCards.getMissionGuide(17), null)
assert.strictEqual(remappedCards.getMissionGuide(18), null)
assert.strictEqual(remappedCards.getMissionGuide(19), null)
assert(remappedCards.getMissionGuide(shiftedLegacyEight))

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
assert(app.includes("els.fieldRun.addEventListener('click', runCurrentCode)"))
assert(!app.includes("els.fieldRun.addEventListener('click', () => els.run.click())"))
assert(app.includes('new MutationObserver(syncRunButtons)'))
assert(app.includes("W: { text: '≈', className: 'water'"))
assert(app.includes("O: { text: '🍃', className: 'lily-pad'"))
assert(app.includes("S: { text: '🗿', className: 'statue'"))
assert(app.includes("X: { text: '🚪', className: 'goal-door'"))
assert(!app.includes('🪷'))
assert(app.includes('els.grid.dataset.variantIndex = String(currentVariant)'))

const riverUi = readQuest('river-ui.js')
assert(riverUi.includes('🍃 スイレンの葉'))
assert(riverUi.includes('🗿 像'))
assert(riverUi.includes("appendReferenceValue(values, 'statue', '🗿'"))
assert(!riverUi.includes('🪷'))

const runtime = readQuest('curriculum-runtime.js')
assert(runtime.includes("const fieldRun = document.getElementById('run-code-field')"))
assert(runtime.includes('[run, fieldRun].filter(Boolean).forEach'))

const worker = readQuest('quest-worker.js')
assert(worker.includes('const cacheToken = String(Date.now())'))
assert(worker.includes("'boss-mechanics.js?v=' + cacheToken"))

const styles = readQuest('styles.css')
for (const selector of ['.tile.water', '.tile.lily-pad', '.tile.statue', '.tile.goal-door', '.field-actions']) {
  assert(styles.includes(selector), 'Missing visible river/field control styling: ' + selector)
}
assert(styles.includes('font-size: clamp(1.8rem, 3.4vw, 2.6rem)'))
assert(styles.includes('margin-top: 1rem'))

const bossUi = readQuest('boss-ui.js')
assert(bossUi.includes('grid?.dataset.variantIndex'))
assert(bossUi.includes("!['escape', 'protective-statue'].includes(boss.resolution)"))

const version = require(path.join(questPath, 'version.js'))
assert.strictEqual(version, '0.4.6')

console.log('Validated visible non-lethal statue-blocked dragon fire, continued hero execution, omnidirectional statue blocking, simplified MISSION 19 sign logic and fresh worker mechanics.')
