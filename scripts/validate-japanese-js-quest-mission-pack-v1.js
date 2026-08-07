#!/usr/bin/env node
'use strict'

const assert = require('assert')
const fs = require('fs')
const path = require('path')

const repositoryPath = path.join(__dirname, '..')
const questPath = path.join(repositoryPath, 'app', 'assets', 'japanese-js-quest')

const engine = require(path.join(questPath, 'engine.js'))
const curriculumEngine = require(path.join(questPath, 'curriculum-engine.js'))
curriculumEngine.apply(engine)

const missions = require(path.join(questPath, 'missions.js'))
const curriculum = require(path.join(questPath, 'curriculum-v3.js'))
curriculum.apply(missions)

const missionTypes = require(path.join(questPath, 'mission-types.js'))
const missionPack = require(path.join(questPath, 'mission-pack-v1.js'))
missionPack.apply(missions, curriculum)

const bossMechanics = require(path.join(questPath, 'boss-mechanics.js'))
bossMechanics.apply(engine)

const introMission = require(path.join(questPath, 'intro-mission.js'))
const allMissions = [introMission, ...missions]
const progression = require(path.join(questPath, 'progression.js'))
progression.apply(allMissions, engine)
const loopRules = require(path.join(questPath, 'loop-rules.js'))
loopRules.apply(allMissions)

const remappedCards = require(path.join(questPath, 'concept-card-mission-remap-v1.js'))
const sidebarUi = require(path.join(questPath, 'mission-types-ui.js'))
const conceptMemoryApi = require(path.join(questPath, 'concept-card-memory.js'))

function read (relativePath) {
  return fs.readFileSync(path.join(repositoryPath, relativePath), 'utf8')
}

function visibleIds (completedIds, adminShowAll) {
  return Array.from(sidebarUi.visibleMissionIdsFor(allMissions, completedIds, adminShowAll)).sort((a, b) => a - b)
}

assert.strictEqual(allMissions.length, 28)
assert.deepStrictEqual(allMissions.map(mission => mission.id), Array.from({ length: 28 }, (_, id) => id))
assert.strictEqual(allMissions.reduce((sum, mission) => sum + mission.variants.length, 0), 42)

assert.strictEqual(allMissions[0].type, missionTypes.TYPES.concept.code)
assert.deepStrictEqual(
  allMissions.slice(1, 7).map(mission => mission.type),
  missionTypes.REINFORCEMENT_PATTERN,
)
assert.strictEqual(allMissions[7].title, '曲がり道')
assert(allMissions.slice(7).every(mission => mission.type === 'concept'))
assert(allMissions.slice(2, 7).every(mission => mission.practiceOf === 1))

for (const mission of allMissions.slice(2, 7)) {
  const heroApi = mission.api.filter(item => item.startsWith('hero.'))
  if (mission.id === 3) {
    assert(heroApi.some(item => item.startsWith('hero.transform(')), 'Mission 03 must expose the typo target transform call')
    assert(heroApi.every(item => item.startsWith('hero.move(') || item.startsWith('hero.transform(')))
  } else {
    assert(heroApi.every(item => item.startsWith('hero.move(')), 'Practice mission ' + mission.id + ' must expose only learned movement APIs')
    assert(!heroApi.some(item => item.includes('transform')), 'Practice mission ' + mission.id + ' exposed transform unexpectedly')
  }
}

assert.strictEqual(conceptMemoryApi.requiresCardValidation(allMissions[0]), true)
assert.strictEqual(conceptMemoryApi.requiresCardValidation(allMissions[1]), true)
for (const mission of allMissions.slice(2, 7)) {
  assert.strictEqual(
    conceptMemoryApi.requiresCardValidation(mission),
    false,
    'Non-concept mission ' + mission.id + ' must never be blocked by concept cards',
  )
}
assert.strictEqual(conceptMemoryApi.requiresCardValidation(allMissions[7]), true)
assert.strictEqual(conceptMemoryApi.requiresCardValidation(null), false)

assert.strictEqual(curriculum.finalIdForLegacyId(2), 7)
assert.strictEqual(curriculum.legacyIdForFinalId(2), 1)
assert.strictEqual(curriculum.legacyIdForFinalId(6), 1)
assert.strictEqual(curriculum.legacyIdForFinalId(7), 2)
assert.strictEqual(missionPack.shiftedExistingId(22), 27)

const missionOneCards = remappedCards.getMissionGuide(1)
assert(missionOneCards)
assert.strictEqual(remappedCards.getMissionGuide(2), null)
assert.strictEqual(remappedCards.getMissionGuide(6), null)
assert(remappedCards.getMissionGuide(7))
assert.strictEqual(remappedCards.getMissionGuide(7).cardIds.length, 1)
assert(remappedCards.allCards().every(card => card.missionId < 2 || card.missionId >= 7))

assert.deepStrictEqual(visibleIds([], false), [0, 1])
assert.deepStrictEqual(visibleIds([0], false), [0, 1, 2, 3, 4, 5, 6, 7])
assert.deepStrictEqual(visibleIds([0, 1], false), [0, 1, 2, 3, 4, 5, 6, 7])
assert.deepStrictEqual(visibleIds([0, 1, 2, 3], false), [0, 1, 2, 3, 4, 5, 6, 7])
assert.deepStrictEqual(visibleIds([0, 1, 2, 3, 4, 5, 6], false), [0, 1, 2, 3, 4, 5, 6, 7, 8])
assert.deepStrictEqual(
  visibleIds([0, 1, 2, 20], false),
  [0, 1, 2, 3, 4, 5, 6, 7, 20],
  'A completed mission outside the active segment must remain visible',
)
assert.deepStrictEqual(visibleIds([], true), Array.from({ length: 28 }, (_, id) => id))

const typoMission = allMissions[3]
assert(typoMission.story.includes('タイポ（Typo）'))
assert(typoMission.story.includes('1文字'))
assert(typoMission.story.includes('タイポが2つ'))
assert(typoMission.starterCode.includes('hero.move("right"];'))
assert(typoMission.starterCode.includes('hero.transform("forg");'))
assert(typoMission.solution.includes('hero.transform("frog");'))

const typoStarter = engine.simulate(typoMission.starterCode, typoMission, 0)
assert.strictEqual(typoStarter.ok, false)

const firstTypoOnlyFixedCode = typoMission.starterCode.replace('hero.move("right"];', 'hero.move("right");')
const firstTypoOnlyFixed = engine.simulate(firstTypoOnlyFixedCode, typoMission, 0)
assert.strictEqual(firstTypoOnlyFixed.ok, false)
assert.strictEqual(firstTypoOnlyFixed.error.code, 'invalid-transform')

const typoWithoutTransform = typoMission.solution
  .split('\n')
  .filter(line => !line.includes('hero.transform'))
  .join('\n')
const typoWithoutTransformResult = engine.simulate(typoWithoutTransform, typoMission, 0)
assert.strictEqual(typoWithoutTransformResult.ok, true)
const typoWithoutTransformEvaluation = engine.evaluate(typoMission, typoWithoutTransformResult, typoWithoutTransform)
assert.strictEqual(typoWithoutTransformEvaluation.passed, false)
assert(typoWithoutTransformEvaluation.messages.some(message => message.includes('hero.transform("frog")')))

const typoSolution = engine.simulate(typoMission.solution, typoMission, 0)
assert.strictEqual(typoSolution.ok, true)
assert.strictEqual(typoSolution.state.form, 'frog')
assert.strictEqual(engine.evaluate(typoMission, typoSolution, typoMission.solution).passed, true)

const logicMission = allMissions[4]
const logicStarter = engine.simulate(logicMission.starterCode, logicMission, 0)
assert.strictEqual(logicStarter.ok, true)
assert.strictEqual(engine.evaluate(logicMission, logicStarter, logicMission.starterCode).passed, false)
const logicSolution = engine.simulate(logicMission.solution, logicMission, 0)
assert.strictEqual(engine.evaluate(logicMission, logicSolution, logicMission.solution).passed, true)

const bossMission = allMissions[6]
const bossVariant = bossMission.variants[0]
assert.strictEqual(bossMission.type, 'boss')
assert.strictEqual(bossMission.bossEncounter, true)
assert.strictEqual(bossMission.bossResolution, 'escape')
assert(bossVariant.map.some(row => row.includes('B')))
assert(!bossVariant.map.some(row => row.includes('P')))
assert(!bossVariant.map.some(row => row.includes('L')))
assert.strictEqual(bossVariant.map.length, 3)
assert.strictEqual(bossVariant.boss.attackRange, 4)
assert.strictEqual(bossVariant.boss.resolution, 'escape')
assert.strictEqual(bossVariant.boss.dragon.x, 1)
assert.strictEqual(bossVariant.boss.dragon.y, 1)

const initialBossState = engine.createState(bossMission, 0)
assert.strictEqual(initialBossState.hero.x - bossVariant.boss.dragon.x, 5)
assert.strictEqual(initialBossState.hero.y, bossVariant.boss.dragon.y)

const bossDangerCode = 'hero.move("left");'
const bossDanger = engine.simulate(bossDangerCode, bossMission, 0)
const bossDangerEvaluation = engine.evaluate(bossMission, bossDanger, bossDangerCode)
assert.strictEqual(bossDanger.state.dragonHit, true)
assert(bossDanger.trace.some(frame => frame.type === 'dragon-fire'))
assert.strictEqual(bossDangerEvaluation.passed, false)
assert(bossDangerEvaluation.messages.some(message => message.includes('上下左右')))
assert.deepStrictEqual(
  bossDanger.trace.find(frame => frame.type === 'dragon-fire').fireCells,
  [
    { x: 2, y: 1 },
    { x: 3, y: 1 },
    { x: 4, y: 1 },
    { x: 5, y: 1 },
  ],
)

const openDragonVariant = {
  map: Array.from({ length: 11 }, (_, y) => {
    if (y === 0 || y === 10) return '###########'
    return '#.........#'
  }),
}
const centeredDragon = { dragon: { x: 5, y: 5 }, attackRange: 4 }
for (const direction of ['right', 'left', 'up', 'down']) {
  assert.strictEqual(bossMechanics.dragonRayCells(openDragonVariant, centeredDragon, direction).length, 4)
}
for (const hero of [
  { x: 9, y: 5 },
  { x: 1, y: 5 },
  { x: 5, y: 1 },
  { x: 5, y: 9 },
]) {
  assert.strictEqual(bossMechanics.dragonThreat(openDragonVariant, centeredDragon, hero).hit, true)
}
assert.strictEqual(bossMechanics.dragonThreat(openDragonVariant, centeredDragon, { x: 9, y: 9 }).hit, false)

assert(missionPack.DRAGON_PILLAR_LEVER_SCENARIO.map.some(row => row.includes('P')))
assert(missionPack.DRAGON_PILLAR_LEVER_SCENARIO.map.some(row => row.includes('L')))
assert.strictEqual(missionPack.DRAGON_PILLAR_LEVER_SCENARIO.boss.resolution, 'lever')

const bossSolution = engine.simulate(bossMission.solution, bossMission, 0)
const bossEvaluation = engine.evaluate(bossMission, bossSolution, bossMission.solution)
assert.strictEqual(bossSolution.ok, true)
assert.strictEqual(bossSolution.state.bossDefeated, false)
assert.strictEqual(bossSolution.state.dragonHit, false)
assert(!bossSolution.trace.some(frame => frame.type === 'boss-defeated'))
assert.strictEqual(bossSolution.state.goalReached, true)
assert.strictEqual(bossSolution.state.gems, 1)
assert.strictEqual(bossEvaluation.passed, true, bossEvaluation.messages.join('\n'))

for (const mission of allMissions) {
  if (mission.infiniteLoopDemo) continue
  for (let variantIndex = 0; variantIndex < mission.variants.length; variantIndex++) {
    const result = engine.simulate(mission.solution, mission, variantIndex)
    assert.strictEqual(result.ok, true, 'Mission ' + mission.id + ' solution failed to execute on field ' + (variantIndex + 1))
    const evaluation = engine.evaluate(mission, result, mission.solution)
    assert.strictEqual(
      evaluation.passed,
      true,
      'Mission ' + mission.id + ' solution failed field ' + (variantIndex + 1) + ': ' + evaluation.messages.join(' | '),
    )
  }
}

const conceptMemory = read('app/assets/japanese-js-quest/concept-card-memory.js')
assert(conceptMemory.includes("return mission?.type === 'concept'"))
assert(conceptMemory.includes("codePanel?.classList.remove('concept-cards-pending')"))
assert(conceptMemory.includes('activeMission = event.detail?.mission || currentMission()'))
assert(conceptMemory.includes('if (!currentMissionRequiresCardValidation() || isMissionReady()) return'))

const learningGuide = read('app/assets/japanese-js-quest/learning-guide.js')
assert(learningGuide.includes('existingSection?.remove()'))

const missionTypesUi = read('app/assets/japanese-js-quest/mission-types-ui.js')
assert(missionTypesUi.includes("event.target?.closest('#admin-unlock-all')"))
assert(missionTypesUi.includes("button.classList.toggle('mission-hidden-by-focus', !visible)"))
assert(missionTypesUi.includes('visibleMissionIdsFor'))
assert(missionTypesUi.includes('visible.add(missions[0].id)'))
assert(missionTypesUi.includes('completed.forEach(id =>'))

const missionTypeCss = read('app/assets/japanese-js-quest/mission-types.css')
assert(missionTypeCss.includes('.mission-item.mission-hidden-by-focus'))
assert(missionTypeCss.includes('.tile.boss-fire-active'))
assert(missionTypeCss.includes('@keyframes boss-fire-spread'))

const runtime = read('app/assets/japanese-js-quest/curriculum-runtime.js')
for (const text of ['🐉 ドラゴン', '🔥 炎']) assert(runtime.includes(text))
assert(!runtime.includes("text: '🗿 柱'"))
assert(!runtime.includes("text: '🎚️ レバー'"))
assert(runtime.includes("{ visible: finalId >= 3, text: '🐸 カエル' }"))
assert(runtime.includes('missions().find(item => item.infiniteLoopDemo)'))

const worker = read('app/assets/japanese-js-quest/quest-worker.js')
assert(worker.includes("importScripts('engine.js', 'curriculum-engine.js', 'boss-mechanics.js')"))

const index = read('app/assets/japanese-js-quest/index.html')
assert(index.includes('concept-card-memory.js?v=3'))
assert(index.includes('mission-types-ui.js?v=2'))

const productRules = read('docs/PRODUCT_RULES.md')
for (const text of [
  '`concept`',
  '`adventure`',
  '`typo-fix`',
  '`logic-fix`',
  '`boss`',
  'concept → adventure → typo-fix → logic-fix → adventure → boss',
  'Mission 00 is the exception',
  'explicit debugging exception',
  'full-width',
  'four cardinal directions',
  'four tiles',
  'introductory escape-boss exception',
  'dragon must remain alive',
  'lily',
  'next concept mission',
]) assert(productRules.includes(text), 'Missing product rule: ' + text)

console.log('Validated 28 missions / 42 fields, two-typo debugging, concept-only card gating, permanent completed-history navigation and four-direction dragon boss mechanics.')
