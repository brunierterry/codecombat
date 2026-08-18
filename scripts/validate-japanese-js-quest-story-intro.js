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
const introCss = readQuest('story-intro.css')
const version = require(path.join(questPath, 'version.js'))
const productRules = fs.readFileSync(path.join(repositoryPath, 'docs', 'PRODUCT_RULES.md'), 'utf8')
const developmentRules = fs.readFileSync(path.join(repositoryPath, 'docs', 'DEVELOPMENT_RULES.md'), 'utf8')

assert.strictEqual(version, '0.3.4')
assert(index.includes('<body class="story-intro-checking">'))
assert(index.includes('<link rel="stylesheet" href="story-intro.css">'))
assert(index.includes('<script src="story-intro.js"></script>'))
assert(index.indexOf('story-intro.js') < index.indexOf('engine.js'))
assert(index.includes('id="replay-story-intro"'))
assert(index.includes('物語をもう一度'))

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
assert.strictEqual((intro.match(/image: 'story-intro-page-\d\.svg'/g) || []).length, 7, 'Every story page must reference one numbered illustration')
for (let page = 1; page <= 7; page++) {
  const asset = `story-intro-page-${page}.svg`
  assert(intro.includes(`image: '${asset}'`), `Story page ${page} must reference ${asset}`)
  const assetPath = path.join(questPath, asset)
  assert(fs.existsSync(assetPath), `Missing physical story illustration: ${asset}`)
  const image = fs.readFileSync(assetPath, 'utf8')
  assert(image.includes('<svg'), `${asset} must be an SVG image asset`)
  assert(image.includes('data:image/webp;base64,'), `${asset} must contain the selected embedded illustration`)
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

console.log('Validated seven illustrated story pages, readings, back navigation, replay behavior and app version 0.3.4.')
