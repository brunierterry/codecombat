(function () {
  'use strict'

  const transfer = window.JSQuestSaveTransfer
  if (!transfer) return

  const PENDING_KEY = 'japanese-js-quest-startup-pending-v1'
  const INTRO_KEY = 'japanese-js-quest-story-intro-seen-v1'
  const INTRO_SENTINEL = '__startup_gate_waiting__'
  const storage = window.localStorage

  function hasExistingSave () {
    if (storage.getItem(PENDING_KEY) === '1') return false
    if (storage.getItem(transfer.SLOT_KEY) === '1') return true
    return transfer.hasMeaningfulLocalData(storage)
  }

  function markExistingSlot () {
    storage.setItem(transfer.SLOT_KEY, '1')
    storage.removeItem(PENDING_KEY)
  }

  if (hasExistingSave()) {
    markExistingSlot()
    window.JSQuestStartupGate = Object.freeze({ active: false, PENDING_KEY })
    return
  }

  storage.setItem(PENDING_KEY, '1')
  storage.setItem(INTRO_KEY, INTRO_SENTINEL)

  const overlay = document.createElement('section')
  overlay.className = 'startup-gate-overlay'
  overlay.setAttribute('role', 'dialog')
  overlay.setAttribute('aria-modal', 'true')
  overlay.setAttribute('aria-labelledby', 'startup-gate-title')
  overlay.innerHTML = [
    '<div class="startup-gate-card">',
    '  <p class="startup-gate-eyebrow">JavaScript Fantasy Land</p>',
    '  <h1 id="startup-gate-title">冒険をはじめよう</h1>',
    '  <p>新しい冒険をはじめるか、前に保存した冒険を読み込めます。</p>',
    '  <div class="startup-gate-actions">',
    '    <button id="startup-new-game" class="button primary" type="button">✨ 新しくはじめる</button>',
    '    <button id="startup-import-game" class="button" type="button">📦 つづきから</button>',
    '  </div>',
    '  <p class="startup-gate-help">「つづきから」は、このゲームで書き出した ZIP セーブを選びます。</p>',
    '  <p id="startup-gate-status" class="startup-gate-status" aria-live="polite"></p>',
    '  <input id="startup-import-file" type="file" accept=".zip,application/zip,.json,application/json" hidden>',
    '</div>',
  ].join('')
  document.body.appendChild(overlay)
  document.body.classList.add('startup-gate-active')

  const status = overlay.querySelector('#startup-gate-status')
  const input = overlay.querySelector('#startup-import-file')

  function closeGate () {
    overlay.remove()
    document.body.classList.remove('startup-gate-active')
  }

  function startNewGame () {
    transfer.clearQuestStorage(storage)
    storage.setItem(transfer.SLOT_KEY, '1')
    closeGate()
    window.JSQuestStoryIntro?.replay()
  }

  async function importSelectedFile () {
    const file = input.files && input.files[0]
    if (!file) return
    status.className = 'startup-gate-status'
    status.textContent = 'セーブを読み込んでいます…'
    try {
      const result = await transfer.importFile(file, storage)
      storage.removeItem(PENDING_KEY)
      document.dispatchEvent(new CustomEvent('jsquest:saveimported', { detail: result }))
      status.className = 'startup-gate-status success'
      status.textContent = '読み込みました。冒険を開き直します。'
      window.setTimeout(() => window.location.reload(), 350)
    } catch (error) {
      status.className = 'startup-gate-status error'
      status.textContent = error.message
      input.value = ''
    }
  }

  overlay.querySelector('#startup-new-game').addEventListener('click', startNewGame)
  overlay.querySelector('#startup-import-game').addEventListener('click', () => input.click())
  input.addEventListener('change', importSelectedFile)

  window.JSQuestStartupGate = Object.freeze({
    active: true,
    PENDING_KEY,
    startNewGame,
  })
})()
