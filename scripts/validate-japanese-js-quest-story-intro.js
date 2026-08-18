#!/usr/bin/env node
'use strict'

const assert = require('assert')
const fs = require('fs')
const path = require('path')

const repositoryPath = path.join(__dirname, '..')
const questPath = path.join(repositoryPath, 'app', 'assets', 'japanese-js-quest')

function readQuest (file) {
  return fs.readFileSync(path.join(questPath, file), 'utf8')
}

const index = readQuest('index.html')
const intro = readQuest('story-intro.js')
const replay = readQuest('story-intro-replay.js')
const introCss = readQuest('story-intro.css')
const version = require(path.join(questPath, 'version.js'))
const productRules = fs.readFileSync(path.join(repositoryPath, 'docs', 'PRODUCT_RULES.md'), 'utf8')
const developmentRules = fs.readFileSync(path.join(repositoryPath, 'docs', 'DEVELOPMENT_RULES.md'), 'utf8')

assert.strictEqual(version, '0.3.6')
assert(index.includes('<body class="story-intro-checking">'))
assert(index.includes('<link rel="stylesheet" href="story-intro.css">'))
assert(index.includes('<script src="story-intro.js"></script>'))
assert(index.includes('<script src="story-intro-replay.js"></script>'))
assert(index.indexOf('story-intro.js') < index.indexOf('engine.js'))
assert(index.includes('id="replay-story-intro"'))
assert(index.includes('📖 物語をもう一度'))
assert(index.indexOf('id="replay-story-intro"') < index.indexOf('id="mission-story"'), 'Replay control must appear before the MISSION 00 story text')
assert(index.indexOf('id="replay-story-intro"') < index.indexOf('<footer>'), 'Replay control must live in the mission card, not in the footer')

for (const text of [
  'japanese-js-quest-story-intro-seen-v1',
  'JavaScript Fantasy Land',
  '見習いの神さま',
  'プログラミングの魔法',
  'むかしむかし',
  '踊ること',
  '木に登ること',
  'お父さん',
  '魔女',
  'おじいさんの姿',
  '自分の姿を取り戻し',
  '小さな女の子を助けよう',
  '冒険を手伝おう',
  '小さなおじいさん……じゃなくて、小さな女の子',
  "text: 'hero'",
  "tooltip: 'ひーろー → 主人公（しゅじんこう）'",
  'JavaScript のプログラミング魔法',
  '行動を導くことができます',
  'あなたの冒険',
  'MISSION 00',
  '冒険をはじめる',
  "window.localStorage.setItem(STORAGE_KEY, '1')",
]) assert(intro.includes(text), 'Missing story-intro behavior or copy: ' + text)

const expectedReadings = {
  見習い: 'みならい',
  魔法: 'まほう',
  運命: 'うんめい',
  好奇心: 'こうきしん',
  踊る: 'おどる',
  魔女: 'まじょ',
  恐ろしい: 'おそろしい',
  呪い: 'のろい',
  姿なら: 'すがたなら',
  姿: 'すがた',
  希望: 'きぼう',
  捨て: 'すて',
  傷つけ: 'きずつけ',
  冒険: 'ぼうけん',
  導く: 'みちびく',
  手伝おう: 'てつだおう',
}
for (const [word, reading] of Object.entries(expectedReadings)) {
  assert(intro.includes(`${word}: '${reading}'`), `Missing intro reading: ${word} → ${reading}`)
}
assert(intro.includes("Object.keys(INTRO_READINGS).sort((a, b) => b.length - a.length)"), 'Intro readings must prefer the longest matching word')

assert.strictEqual((intro.match(/legend: true/g) || []).length, 3)
assert.strictEqual((intro.match(/eyebrow:/g) || []).length, 7, 'Story introduction must contain seven pages')
assert.strictEqual((intro.match(/image: 'story-intro-page-\d\.webp'/g) || []).length, 7, 'Every story page must reference one numbered WebP illustration directly')
for (let page = 1; page <= 7; page++) {
  const imageAsset = `story-intro-page-${page}.webp`
  assert(intro.includes(`image: '${imageAsset}'`), `Story page ${page} must reference ${imageAsset} directly`)

  const imagePath = path.join(questPath, imageAsset)
  assert(fs.existsSync(imagePath), `Missing physical story illustration: ${imageAsset}`)
  const image = fs.readFileSync(imagePath)
  assert(image.length > 5000, `${imageAsset} must contain a real illustration, not a placeholder`)
  assert.strictEqual(image.subarray(0, 4).toString('ascii'), 'RIFF', `${imageAsset} must be a WebP RIFF file`)
  assert.strictEqual(image.subarray(8, 12).toString('ascii'), 'WEBP', `${imageAsset} must be a WebP image`)
}

assert(intro.includes("token.className = 'reading-token'"))
assert(intro.includes('token.dataset.tooltip = tooltip'))
assert(intro.includes('token.tabIndex = 0'))
assert(intro.includes("previous.className = 'story-intro-previous'"))
assert(intro.includes("previous.textContent = '← 前へ'"))
assert(intro.includes('previous.hidden = index === 0'))
assert(intro.includes('previous.disabled = index === 0'))
assert(intro.includes('index--'))
assert(intro.includes("next.textContent = slide.final ? '冒険をはじめる' : '次へ'"))
assert(intro.includes("document.getElementById('replay-story-intro')"))
assert(intro.includes("replay.addEventListener('click', showIntro)"))
assert(intro.includes('replay: showIntro'))
assert(intro.indexOf('markIntroSeen()') > intro.indexOf('if (index < slides.length - 1)'))
assert(!intro.includes('localStorage.removeItem(STORAGE_KEY)'), 'Replaying the story must not reset the first-launch flag')

assert(replay.includes("displayedMissionId() !== 0"), 'Replay control must be visible only on MISSION 00')
assert(replay.includes("document.addEventListener('jsquest:missionloaded', syncReplayVisibility)"))
assert(replay.includes('window.setTimeout(syncReplayVisibility, 0)'))

for (const text of [
  '.story-intro-overlay',
  'position: fixed',
  'place-items: center',
  '.story-intro-image',
  'aspect-ratio: 4 / 3',
  '.story-intro-copy.is-legend',
  '"Yu Mincho"',
  '.story-intro-actions',
  '.story-intro-previous',
  '.story-intro-replay',
  '.story-intro-replay[hidden]',
  'body.story-intro-active',
  'overflow: hidden',
]) assert(introCss.includes(text), 'Missing story-intro CSS invariant: ' + text)

for (const text of [
  'first launch',
  'JavaScript Fantasy Land',
  'apprentice god',
  'story-intro-seen',
  'different narrative typography',
  'MISSION 00',
  'one illustration per introduction page',
  'previous-page control',
  'replay the introduction',
  'does not alter mission progress',
  '主人公（しゅじんこう）',
]) assert(productRules.includes(text), 'Missing story-intro product rule: ' + text)

assert(developmentRules.includes('MAJOR.MINOR.REVISION'))
assert(developmentRules.includes('each new requested change increments `REVISION` by one'))

console.log('Validated seven directly loaded WebP story pages, readings, back navigation, MISSION 00 replay behavior and app version 0.3.6.')
