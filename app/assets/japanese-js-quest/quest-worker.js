/* global importScripts */
'use strict'

const cacheToken = String(Date.now())
importScripts(
  'engine.js?v=' + cacheToken,
  'curriculum-engine.js?v=' + cacheToken,
  'boss-mechanics.js?v=' + cacheToken,
)

const engine = self.JSQuestEngine

self.onmessage = function (event) {
  const data = event.data || {}

  try {
    if (!engine) throw new Error('実行エンジンを読み込めませんでした。')
    const result = engine.simulate(data.code, data.mission, data.variantIndex)
    const evaluation = engine.evaluate(data.mission, result, data.code)
    self.postMessage({ result, evaluation })
  } catch (error) {
    self.postMessage({
      workerError: {
        message: error && error.message ? error.message : 'コードを実行できませんでした。',
        name: error && error.name ? error.name : 'Error',
      },
    })
  }
}
