#!/usr/bin/env node
'use strict'

const assert = require('assert')
const fs = require('fs')
const path = require('path')

const repositoryPath = path.join(__dirname, '..')
const questPath = path.join(repositoryPath, 'app', 'assets', 'japanese-js-quest')

const engine = require(path.join(questPath, 'engine.js'))
require(path.join(questPath, 'curriculum-engine.js')).apply(engine)

const missions = require(path.join(questPath, 'missions.js'))
const curriculum = require(path.join(questPath, 'curriculum-v3.js'))
curriculum.apply(missions)

const missionPack = require(path.join(questPath, 'mission-pack-v1.js'))
missionPack.apply(missions, curriculum)

const dragonPolish = require(path.join(questPath, 'mission-pack-v1-dragon-polish.js'))
dragonPolish.apply(missions)

const bossMechanics = require(path.join(questPath, 'boss-mechanics.js'))
bossMechanics.apply(engine)

const mission = missions.find(item => item.id === 6)
assert(mission, 'Mission 06 must exist')
assert.strictEqual(mission.type, 'boss')
assert.strictEqual(bossMechanics.DEFAULT_DRAGON_RANGE, 3)
assert.strictEqual(mission.variants[0].boss.attackRange, 3)
assert.strictEqual(dragonPolish.DRAGON_RANGE, 3)
assert.strictEqual(missionPack.DRAGON_PILLAR_LEVER_SCENARIO.boss.attackRange, 3)
assert.strictEqual(missionPack.DRAGON_PILLAR_LEVER_SCENARIO.boss.fireCells.length, 3)

const leftCalls = mission.starterCode.match(/hero\.move\("left"\);/g) || []
assert.strictEqual(leftCalls.length, 3, 'Mission 06 starter must contain exactly three left moves')
assert(!/hero\.move\("right"\);/.test(mission.starterCode), 'Mission 06 starter must initially move toward the dragon')
assert(mission.originalStarterCode.includes('hero.move("right");'), 'Previous canonical starter must remain available for exact saved-code migration')

const boss = mission.variants[0].boss
assert.deepStrictEqual(
  bossMechanics.dragonRayCells(mission.variants[0], boss, 'right'),
  [
    { x: 2, y: 1 },
    { x: 3, y: 1 },
    { x: 4, y: 1 },
  ],
)

const oneStepResult = engine.simulate('hero.move("left");', mission, 0)
assert.strictEqual(oneStepResult.state.dragonHit, false)
assert(!oneStepResult.trace.some(frame => frame.type === 'dragon-fire'))

const starterResult = engine.simulate(mission.starterCode, mission, 0)
assert.strictEqual(starterResult.ok, true)
assert.strictEqual(starterResult.state.dragonHit, true)
assert.strictEqual(starterResult.state.x, 4, 'Visible execution must stop on the tile where the hero is hit')
assert.strictEqual(starterResult.state.y, 1)
assert.strictEqual(starterResult.state.goalReached, false)
const fireFrame = starterResult.trace.find(frame => frame.type === 'dragon-fire')
assert(fireFrame, 'Dragon fire frame must be present')
assert.strictEqual(fireFrame.fireCells.length, 3)
assert.deepStrictEqual(fireFrame.fireCells, [
  { x: 2, y: 1 },
  { x: 3, y: 1 },
  { x: 4, y: 1 },
])
assert(fireFrame.fireCells.some(cell => cell.x === fireFrame.x && cell.y === fireFrame.y), 'The final flame cell must be the hero tile')
assert.strictEqual(engine.evaluate(mission, starterResult, mission.starterCode).passed, false)

const solutionResult = engine.simulate(mission.solution, mission, 0)
assert.strictEqual(solutionResult.ok, true)
assert.strictEqual(solutionResult.state.dragonHit, false)
assert.strictEqual(solutionResult.state.bossDefeated, false)
assert.strictEqual(engine.evaluate(mission, solutionResult, mission.solution).passed, true)

const occupiedCreatureMission = {
  id: 999,
  wizardLevel: 1,
  bossEncounter: true,
  variants: [{
    map: [
      '#####',
      '#BH.#',
      '#####',
    ],
    sign: null,
    boss: {
      kind: 'dragon',
      dragon: { x: 1, y: 1 },
      attackRange: 3,
      resolution: 'escape',
    },
  }],
  requirements: { state: {} },
}
const creatureCollision = engine.simulate('hero.move("left");', occupiedCreatureMission, 0)
assert.strictEqual(creatureCollision.ok, true)
assert.strictEqual(creatureCollision.state.x, 2, 'Hero must not enter a creature-occupied tile')
assert.strictEqual(creatureCollision.state.y, 1)
assert(creatureCollision.trace.some(frame => frame.type === 'blocked' && frame.tile === 'enemy'))
assert(!creatureCollision.trace.some(frame => frame.type === 'dragon-fire'), 'Creature collision is independently blocking even before attack handling')

const bossUi = fs.readFileSync(path.join(questPath, 'boss-ui.js'), 'utf8')
assert(bossUi.includes("tile.textContent = '🔥'"))
assert(bossUi.includes("tile.textContent = '💀'"))
assert(bossUi.includes('HERO_BURN_DELAY_MS'))
assert(bossUi.includes("tile.classList.contains('hero')"))

const index = fs.readFileSync(path.join(questPath, 'index.html'), 'utf8')
assert(index.includes('<script src="mission-pack-v1-dragon-polish.js"></script>'))

const productRules = fs.readFileSync(path.join(repositoryPath, 'docs', 'PRODUCT_RULES.md'), 'utf8')
for (const text of [
  'three tiles in the four cardinal directions',
  'one flame per reachable attack tile',
  'hero becomes a skeleton',
  'occupied by a creature',
  'three leftward moves',
]) assert(productRules.includes(text), 'Missing dragon product rule: ' + text)

console.log('Validated three-tile dragon fire, flame-to-skeleton failure, three-left starter and creature-occupied collision blocking.')
