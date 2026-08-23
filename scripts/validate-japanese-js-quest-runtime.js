#!/usr/bin/env node
'use strict'

const assert = require('assert')
const fs = require('fs')
const path = require('path')
const vm = require('vm')

const root = path.join(__dirname, '..')
const questRoot = path.join(root, 'app/assets/japanese-js-quest')

function readQuest (name) {
  return fs.readFileSync(path.join(questRoot, name), 'utf8')
}

const postedMessages = []
const context = vm.createContext({
  console,
  self: {
    postMessage: message => postedMessages.push(message),
  },
})

context.importScripts = function (...names) {
  for (const name of names) {
    const fileName = String(name).split('?')[0]
    vm.runInContext(readQuest(fileName), context, { filename: name })
  }
}

vm.runInContext(readQuest('quest-worker.js'), context, { filename: 'quest-worker.js' })

const introMission = require(path.join(questRoot, 'intro-mission.js'))
context.self.onmessage({
  data: {
    code: introMission.solution,
    mission: introMission,
    variantIndex: 0,
  },
})

assert.strictEqual(postedMessages.length, 1)
assert(!postedMessages[0].workerError)
assert(postedMessages[0].result.ok)
assert(postedMessages[0].evaluation.passed)
assert(postedMessages[0].result.state.says.includes('Hello goddess!'))

const workerSource = readQuest('quest-worker.js')
assert(workerSource.includes('const cacheToken = String(Date.now())'))
assert(workerSource.includes("'engine.js?v=' + cacheToken"))
assert(workerSource.includes("'curriculum-engine.js?v=' + cacheToken"))
assert(workerSource.includes("'boss-mechanics.js?v=' + cacheToken"))
assert(workerSource.includes('workerError'))

const progressAccess = require(path.join(questRoot, 'progress-access.js'))
assert.deepStrictEqual(
  progressAccess.normalizeProgress({ completed: [], unlocked: 23 }, 23),
  { completed: [], unlocked: 1 },
)
assert.deepStrictEqual(
  progressAccess.normalizeProgress({ completed: [0, 1, 2], unlocked: 23 }, 23),
  { completed: [0, 1, 2], unlocked: 4 },
)
assert.deepStrictEqual(
  progressAccess.normalizeProgress({ completed: [0, 5, 14], unlocked: 23 }, 23),
  { completed: [0, 5, 14], unlocked: 2 },
)
assert.deepStrictEqual(
  progressAccess.normalizeProgress({ completed: [2, 1, 1, 0, 99, -1], unlocked: 23 }, 23),
  { completed: [0, 1, 2], unlocked: 4 },
)

const storedValues = new Map([
  ['japanese-js-quest-progress-v1', JSON.stringify({ completed: [0], unlocked: 23 })],
])
const fakeStorage = {
  getItem: key => storedValues.get(key) || null,
  setItem: (key, value) => storedValues.set(key, value),
}
progressAccess.normalizeStorage(fakeStorage, 'japanese-js-quest-progress-v1', 23)
assert.strictEqual(
  storedValues.get('japanese-js-quest-progress-v1'),
  JSON.stringify({ completed: [0], unlocked: 2 }),
)

const solutionHelp = require(path.join(questRoot, 'solution-help.js'))
const baseEngine = require(path.join(questRoot, 'engine.js'))
const introPartial = solutionHelp.partialForMission(introMission, baseEngine)
assert.notStrictEqual(introPartial, introMission.solution)
assert(introPartial.includes('// TODO:'))
assert(introPartial.includes('// ヒント:'))
assert(!baseEngine.evaluate(
  introMission,
  baseEngine.simulate(introPartial, introMission, 0),
  introPartial,
).passed)

const appSource = readQuest('app-v3.js')
for (const text of [
  'let adminUnlockedAll = false',
  'function isUnlocked (index)',
  'const unlocked = isUnlocked(index)',
  'if (!isUnlocked(index) || running) return',
  'adminUnlockedAll = true',
  "new URL('quest-worker.js', window.location.href)",
  "workerUrl.searchParams.set('v', String(window.JSQuestVersion || Date.now()))",
  '}, 5000)',
  'let failedAttempts = {}',
  'function recordFailedAttempt (mission)',
  "els.solution.textContent = '答えを見る'",
  "'ほぼ完成コードを見る'",
  'solutionHelp.partialForMission(mission, engine)',
  '管理者用の正解コードを表示しました。保存はしていません。',
]) assert(appSource.includes(text))
assert(!appSource.includes('URL.createObjectURL'))
assert(!appSource.includes('new Blob('))
assert(!appSource.includes('progress.unlocked = missions.length'))
assert(!appSource.includes('localStorage.setItem(codeKeyPrefix + mission.id, mission.solution)'))

const indexSource = readQuest('index.html')
assert(indexSource.includes('<script src="progress-access.js"></script>'))
assert(indexSource.includes('<script src="solution-help.js"></script>'))
assert(indexSource.includes('<script src="story-intro-replay.js"></script>'))
assert(indexSource.indexOf('progress-access.js') < indexSource.indexOf('app-v3.js'))
assert(indexSource.indexOf('solution-help.js') < indexSource.indexOf('app-v3.js'))
assert(indexSource.includes('id="show-solution"'))
assert(indexSource.includes('disabled hidden>ヘルプ</button>'))

for (const file of [
  'boss-mechanics.js',
  'mission-types.js',
  'mission-pack-v1.js',
  'mission-pack-v4-pedagogy.js',
  'mission-pack-v5-order.js',
  'concept-card-curriculum-source.js',
  'concept-card-curriculum-final.js',
  'field-responsive.js',
  'mission-types-ui.js',
  'boss-ui.js',
]) {
  assert(indexSource.includes(`<script src="${file}`), `${file} must be loaded by index.html`)
}
for (const obsoleteRemap of [
  'concept-card-mission-remap-v1.js',
  'concept-card-mission-remap-v2.js',
  'concept-card-mission-remap-v3.js',
  'concept-card-mission-remap-v4.js',
]) {
  assert(!indexSource.includes(`<script src="${obsoleteRemap}`), `${obsoleteRemap} must not be loaded by the browser`)
}
assert(indexSource.includes('<link rel="stylesheet" href="mission-types.css">'))
assert(indexSource.includes('<link rel="stylesheet" href="field-responsive.css">'))
assert(!indexSource.includes('23のミッション'))
assert(!indexSource.includes('0 / 23'))
assert(indexSource.includes('いろいろなミッションで、JavaScriptを少しずつ身につけよう'))
assert(indexSource.includes('id="progress-label">0 / 2'))
assert(indexSource.indexOf('curriculum-engine.js') < indexSource.indexOf('boss-mechanics.js'))
assert(indexSource.indexOf('curriculum-v3.js') < indexSource.indexOf('mission-pack-v1.js'))
assert(indexSource.indexOf('mission-types.js') < indexSource.indexOf('mission-pack-v1.js'))
assert(indexSource.indexOf('mission-pack-v4.js') < indexSource.indexOf('mission-pack-v4-pedagogy.js'))
assert(indexSource.indexOf('mission-pack-v4-pedagogy.js') < indexSource.indexOf('mission-pack-v5-order.js'))
assert(indexSource.indexOf('mission-pack-v5-order.js') < indexSource.indexOf('concept-card-curriculum-final.js'))
assert(indexSource.indexOf('concept-card-curriculum-source.js') < indexSource.indexOf('concept-card-curriculum-final.js'))
assert(indexSource.indexOf('concept-card-curriculum-final.js') < indexSource.indexOf('learning-guide.js'))
assert(indexSource.indexOf('mission-pack-v1.js') < indexSource.indexOf('progress-access.js'))
assert(indexSource.indexOf('mission-pack-v1.js') < indexSource.indexOf('app-v3.js'))
assert(indexSource.indexOf('app-v3.js') < indexSource.indexOf('field-responsive.js'))
assert(indexSource.indexOf('app-v3.js') < indexSource.indexOf('mission-types-ui.js'))
assert(indexSource.indexOf('app-v3.js') < indexSource.indexOf('boss-ui.js'))

const curriculumEngineSource = readQuest('curriculum-engine.js')
assert(!curriculumEngineSource.includes('installWorkerAdapter(window'))
assert(!curriculumEngineSource.includes('rootObject.Worker ='))

const learningGuideSource = readQuest('learning-guide.js')
assert(learningGuideSource.includes('scheduleAnnotations'))
assert(!learningGuideSource.includes('new MutationObserver'))

const productRules = fs.readFileSync(path.join(root, 'docs/PRODUCT_RULES.md'), 'utf8')
for (const text of [
  'static `quest-worker.js` worker',
  'must not globally replace or monkey-patch',
  'same admin-unlocked state',
  'bounded number of times',
  'derived from the consecutive completed mission prefix',
  'temporary to the current loaded page',
  'must not unlock missions before the admin button is activated',
  '## Final answers and learner partial help',
  'only in admin mode',
  'three failed executions',
  'must remain incomplete',
]) assert(productRules.includes(text))

console.log('Validated mission 00 goddess greeting, cache-busted worker URL/import execution, current browser curriculum wiring, responsive field assets, temporary admin access, normal progress repair and separated solution help.')
