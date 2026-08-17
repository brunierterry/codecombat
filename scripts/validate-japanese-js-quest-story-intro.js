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

assert.strictEqual(version, '0.3.3')
assert(index.includes('<body class="story-intro-checking">'))
assert(index.includes('<link rel="stylesheet" href="story-intro.css">'))
assert(index.includes('<script src="story-intro.js"></script>'))
assert(index.indexOf('story-intro.js') < index.indexOf('engine.js'))

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
  "tooltip: 'ひーろー'",
  'JavaScript のプログラミング魔法',
  '行動を導くことができます',
  'あなたの冒険',
  'MISSION 00',
  '冒険をはじめる',
  "window.localStorage.setItem(STORAGE_KEY, '1')",
]) assert(intro.includes(text), 'Missing story-intro behavior or copy: ' + text)

assert.strictEqual((intro.match(/legend: true/g) || []).length, 3)
assert.strictEqual((intro.match(/eyebrow:/g) || []).length, 7, 'Story introduction must contain seven pages')
assert(intro.includes("token.className = 'reading-token'"))
assert(intro.includes('token.dataset.tooltip = part.tooltip'))
assert(intro.includes('token.tabIndex = 0'))
assert(intro.includes("next.textContent = slide.final ? '冒険をはじめる' : '次へ'"))
assert(intro.indexOf('markIntroSeen()') > intro.indexOf('if (index < slides.length - 1)'))

for (const text of [
  '.story-intro-overlay',
  'position: fixed',
  'place-items: center',
  '.story-intro-copy.is-legend',
  '"Yu Mincho"',
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
]) assert(productRules.includes(text), 'Missing story-intro product rule: ' + text)

assert(developmentRules.includes('MAJOR.MINOR.REVISION'))
assert(developmentRules.includes('each new requested change increments `REVISION` by one'))

console.log('Validated seven-page first-launch story introduction and app version 0.3.3.')
