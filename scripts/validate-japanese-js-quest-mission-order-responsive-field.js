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
require(path.join(questPath, 'boss-mechanics.js')).apply(engine)

const missions = require(path.join(questPath, 'missions.js'))
const curriculum = require(path.join(questPath, 'curriculum-v3.js'))
curriculum.apply(missions)

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

assert.strictEqual(allMissions[14].title, 'if と else')
assert.strictEqual(allMissions[15].title, 'if と else の修理')
assert.strictEqual(allMissions[16].title, 'となりを調べる')
assert.strictEqual(allMissions[17].title, '安全な道')
assert.strictEqual(allMissions[18].title, 'スイレンの川')
assert.strictEqual(allMissions[19].title, 'カエルと守りのドラゴン')
assert.strictEqual(allMissions[20].title, '二つの合言葉')
assert.strictEqual(allMissions[15].type, 'typo-fix')
assert.strictEqual(allMissions[15].practiceOf, 14)
assert.strictEqual(allMissions[15].prePracticeId, 5)
assert.strictEqual(allMissions[18].type, 'concept')

assert.deepStrictEqual(packV5.OLD_TO_NEW, { 15: 16, 16: 17, 17: 15 })
assert.strictEqual(packV5.shiftedExistingId(14), 14)
assert.strictEqual(packV5.shiftedExistingId(15), 16)
assert.strictEqual(packV5.shiftedExistingId(16), 17)
assert.strictEqual(packV5.shiftedExistingId(17), 15)
assert.strictEqual(packV5.shiftedExistingId(18), 18)
assert.strictEqual(packV5.shiftedExistingId(20), 20)
assert.strictEqual(packV5.previousIdForFinalId(15), 17)
assert.strictEqual(packV5.previousIdForFinalId(16), 15)
assert.strictEqual(packV5.previousIdForFinalId(17), 16)

for (let id = 14; id <= 17; id++) {
  const mission = allMissions[id]
  assert.strictEqual(progression.missionReward(mission), 1, `MISSION ${id} must award exactly one crystal`)
  assert.strictEqual(mission.wizardXpAfter, mission.wizardXpBefore + 1, `MISSION ${id} must add exactly one accumulated crystal`)
  assert.strictEqual(mission.wizardLevel, progression.levelForXp(mission.wizardXpBefore))
  assert.strictEqual(mission.wizardLevelAfter, progression.levelForXp(mission.wizardXpAfter))
  if (id > 14) {
    assert.strictEqual(
      mission.wizardXpBefore,
      allMissions[id - 1].wizardXpAfter,
      `MISSION ${id} level bar must start exactly where MISSION ${id - 1} ended`,
    )
  }
}
assert.strictEqual(allMissions[18].wizardXpBefore, allMissions[17].wizardXpAfter)

const finalCards = require(path.join(questPath, 'concept-card-curriculum-final.js'))
assert(finalCards.getMissionGuide(14), 'MISSION 14 must keep its else concept')
assert.strictEqual(finalCards.getMissionGuide(15), null, 'Moved typo MISSION 15 must introduce no concept cards')
assert(finalCards.getMissionGuide(16).cardIds.includes('concept-card-016'), 'Return value / hero.look belongs to MISSION 16')
assert(finalCards.getMissionGuide(17).cardIds.includes('concept-card-039'), 'hero.canMove belongs to MISSION 17')
assert(finalCards.getMissionGuide(17).cardIds.includes('concept-card-017'), '&& / !== stays with MISSION 17')
assert(finalCards.getMissionGuide(18).cardIds.includes('concept-card-040'), 'Transformation concept remains on MISSION 18')
assert.strictEqual(finalCards.getMissionGuide(19), null, 'Boss MISSION 19 must not gain concept cards')
assert(finalCards.getMissionGuide(20), 'MISSION 20 and later must keep their existing numbering')

const packSource = readQuest('mission-pack-v5-order.js')
for (const text of [
  '15: 16',
  '16: 17',
  '17: 15',
  'CODE_KEY_PREFIX + shiftedExistingId(oldId)',
  'saved.completed.map(Number).map(id => shiftedExistingId(id))',
  'unlocked: deriveUnlocked(completed, FINAL_MISSION_COUNT)',
]) assert(packSource.includes(text), 'Missing mission-order persistence invariant: ' + text)

const responsiveCss = readQuest('field-responsive.css')
for (const text of [
  'container-type: inline-size',
  'min-width: 0',
  'min-height: 0',
  'aspect-ratio: 1 / 1',
  'place-items: center',
  'overflow: hidden',
  'var(--field-icon-size',
  'var(--field-lily-size',
  '@media (max-width: 1180px)',
]) assert(responsiveCss.includes(text), 'Missing responsive field rule: ' + text)

const responsiveJs = readQuest('field-responsive.js')
for (const text of [
  'new ResizeObserver',
  'getBoundingClientRect()',
  '--field-icon-size',
  '--field-lily-size',
  '--field-statue-size',
  'cellWidth * 0.62',
  'cellWidth * 0.72',
]) assert(responsiveJs.includes(text), 'Missing actual-field-width icon scaling: ' + text)

const riverUi = readQuest('river-ui.js')
for (const text of [
  "const WATER_SYMBOL = '≈'",
  "const WATER_COLOR = '#dff8ff'",
  'setWaterLegendEntry(legend)',
  "appendReferenceValue(values, 'water', WATER_SYMBOL",
  'styleWaterSymbol(button.querySelector(\'.value-icon\'))',
]) assert(riverUi.includes(text), 'Missing water-symbol consistency rule: ' + text)

const index = readQuest('index.html')
assert(index.includes('<link rel="stylesheet" href="field-responsive.css">'))
assert(index.includes('<script src="mission-pack-v5-order.js"></script>'))
assert(index.includes('<script src="field-responsive.js"></script>'))
assert(index.indexOf('mission-pack-v4-pedagogy.js') < index.indexOf('mission-pack-v5-order.js'))
assert(index.indexOf('mission-pack-v5-order.js') < index.indexOf('concept-card-curriculum-final.js'))
assert(index.indexOf('app-v3.js') < index.indexOf('field-responsive.js'))

const version = require(path.join(questPath, 'version.js'))
assert(/^\d+\.\d+\.\d+$/.test(version), 'Historical mission-order regression only requires a valid canonical semantic version')

console.log('Validated MISSION 14-20 ordering, one-crystal XP continuity, responsive field sizing, and consistent water symbols.')
