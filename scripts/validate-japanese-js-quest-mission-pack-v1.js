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

function read (relativePath) {
  return fs.readFileSync(path.join(repositoryPath, relativePath), 'utf8')
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
  assert.deepStrictEqual(
    mission.api.filter(item => item.startsWith('hero.')).every(item => item.startsWith('hero.move(')),
    true,
    'Practice mission ' + mission.id + ' must expose only hero.move from learned JavaScript APIs',
  )
  assert(!mission.api.some(item => item.includes('transform')), 'Practice mission ' + mission.id + ' exposed transform too early')
}

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

const beforeMissionZero = sidebarUi.visibleRangeFor(allMissions, [], false)
assert.deepStrictEqual(beforeMissionZero, { start: 0, end: 1 })
const firstPackRange = sidebarUi.visibleRangeFor(allMissions, [0], false)
assert.deepStrictEqual(firstPackRange, { start: 1, end: 7 })
const duringFirstPack = sidebarUi.visibleRangeFor(allMissions, [0, 1, 2, 3], false)
assert.deepStrictEqual(duringFirstPack, { start: 1, end: 7 })
const afterFirstPack = sidebarUi.visibleRangeFor(allMissions, [0, 1, 2, 3, 4, 5, 6], false)
assert.deepStrictEqual(afterFirstPack, { start: 7, end: 8 })
const adminRange = sidebarUi.visibleRangeFor(allMissions, [], true)
assert.deepStrictEqual(adminRange, { start: 0, end: 27 })

const typoMission = allMissions[3]
const typoStarter = engine.simulate(typoMission.starterCode, typoMission, 0)
assert.strictEqual(typoStarter.ok, false)
assert(typoMission.starterCode.includes('hero.move("right"];'))
const typoSolution = engine.simulate(typoMission.solution, typoMission, 0)
assert.strictEqual(typoSolution.ok, true)
assert.strictEqual(engine.evaluate(typoMission, typoSolution, typoMission.solution).passed, true)

const logicMission = allMissions[4]
const logicStarter = engine.simulate(logicMission.starterCode, logicMission, 0)
assert.strictEqual(logicStarter.ok, true)
assert.strictEqual(engine.evaluate(logicMission, logicStarter, logicMission.starterCode).passed, false)
const logicSolution = engine.simulate(logicMission.solution, logicMission, 0)
assert.strictEqual(engine.evaluate(logicMission, logicSolution, logicMission.solution).passed, true)

const bossMission = allMissions[6]
assert.strictEqual(bossMission.type, 'boss')
assert.strictEqual(bossMission.bossEncounter, true)
assert(bossMission.variants[0].map.some(row => row.includes('B')))
assert(bossMission.variants[0].map.some(row => row.includes('P')))
assert(bossMission.variants[0].map.some(row => row.includes('L')))

const bossShortcutCode = [
  'hero.move("up");',
  'hero.move("up");',
].join('\n')
const bossShortcut = engine.simulate(bossShortcutCode, bossMission, 0)
const bossShortcutEvaluation = engine.evaluate(bossMission, bossShortcut, bossShortcutCode)
assert.strictEqual(bossShortcut.state.dragonHit, true)
assert(bossShortcut.trace.some(frame => frame.type === 'dragon-fire'))
assert.strictEqual(bossShortcutEvaluation.passed, false)
assert(bossShortcutEvaluation.messages.some(message => message.includes('ドラゴンの火')))

const bossSolution = engine.simulate(bossMission.solution, bossMission, 0)
const bossEvaluation = engine.evaluate(bossMission, bossSolution, bossMission.solution)
assert.strictEqual(bossSolution.ok, true)
assert.strictEqual(bossSolution.state.bossDefeated, true)
assert.strictEqual(bossSolution.state.dragonHit, false)
assert(bossSolution.trace.some(frame => frame.type === 'boss-defeated'))
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
assert(conceptMemory.includes('cardIds.length === 0 || cardIds.every(isValidated)'))

const learningGuide = read('app/assets/japanese-js-quest/learning-guide.js')
assert(learningGuide.includes('existingSection?.remove()'))

const missionTypesUi = read('app/assets/japanese-js-quest/mission-types-ui.js')
assert(missionTypesUi.includes("event.target?.closest('#admin-unlock-all')"))
assert(missionTypesUi.includes("button.classList.toggle('mission-hidden-by-focus', !visible)"))

const missionTypeCss = read('app/assets/japanese-js-quest/mission-types.css')
assert(missionTypeCss.includes('.mission-item.mission-hidden-by-focus'))
assert(missionTypeCss.includes('.tile.boss-fire-active'))
assert(missionTypeCss.includes('@keyframes boss-fire-spread'))

const runtime = read('app/assets/japanese-js-quest/curriculum-runtime.js')
for (const text of ['🐉 ドラゴン', '🗿 柱', '🎚️ レバー', '🔥 炎']) assert(runtime.includes(text))
assert(runtime.includes('missions().find(item => item.infiniteLoopDemo)'))

const worker = read('app/assets/japanese-js-quest/quest-worker.js')
assert(worker.includes("importScripts('engine.js', 'curriculum-engine.js', 'boss-mechanics.js')"))

const productRules = read('docs/PRODUCT_RULES.md')
for (const text of [
  '`concept`',
  '`adventure`',
  '`typo-fix`',
  '`logic-fix`',
  '`boss`',
  'concept → adventure → typo-fix → logic-fix → adventure → boss',
  'Mission 00 is the exception',
  'only concepts already introduced',
  'full-width',
  'dragon',
  'lily',
  'next concept mission',
]) assert(productRules.includes(text), 'Missing product rule: ' + text)

console.log('Validated 28 missions / 42 fields, five mission types, first reinforcement pack, boss mechanics, remapped cards and focused navigation.')
