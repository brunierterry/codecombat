(function () {
  'use strict'

  const transfer = window.JSQuestSaveTransfer
  const review = window.JSQuestKnowledgeReview
  if (!transfer || !review) return

  const storage = window.localStorage
  let menuPanel
  let menuToggle
  let pointsButton
  let reviewButton
  let reviewNotice
  let importInput

  function escapeHtml (value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }

  function shuffle (values) {
    const result = values.slice()
    for (let index = result.length - 1; index > 0; index--) {
      const target = Math.floor(Math.random() * (index + 1))
      const temporary = result[index]
      result[index] = result[target]
      result[target] = temporary
    }
    return result
  }

  function currentVersion () {
    return window.JSQuestVersion || (document.getElementById('app-version')?.textContent || '').replace(/^v/, '') || 'unknown'
  }

  function currentState () {
    return review.load(storage)
  }

  function updateKnowledgeDisplay () {
    const state = currentState()
    const points = review.knowledgePoints(state)
    const due = review.dailyReviewDue(state)
    if (pointsButton) {
      pointsButton.innerHTML = '<span aria-hidden="true">🧠</span><strong>' + points.total + '</strong><span class="knowledge-points-label">知識</span>'
      pointsButton.title = '知識ポイント：' + points.total
      pointsButton.setAttribute('aria-label', '知識ポイント ' + points.total)
    }
    if (menuToggle) menuToggle.classList.toggle('has-notification', due)
    if (reviewButton) reviewButton.classList.toggle('has-notification', due)
    if (reviewNotice) reviewNotice.hidden = !due
  }

  function closeMenu () {
    if (!menuPanel || !menuToggle) return
    menuPanel.hidden = true
    menuToggle.setAttribute('aria-expanded', 'false')
  }

  function toggleMenu () {
    if (!menuPanel || !menuToggle) return
    const opening = menuPanel.hidden
    menuPanel.hidden = !opening
    menuToggle.setAttribute('aria-expanded', String(opening))
    if (opening) menuPanel.querySelector('button:not([hidden])')?.focus()
  }

  function moveExistingControlsIntoMenu () {
    const saveStatus = document.getElementById('save-status')
    const reset = document.getElementById('reset-progress')
    const adminBadge = document.querySelector('.top-actions > .admin-mode-badge, #main-menu-admin .admin-mode-badge')
    const adminUnlock = document.getElementById('admin-unlock-all')
    const statusHost = document.getElementById('main-menu-save-status')
    const resetHost = document.getElementById('main-menu-reset-host')
    const adminHost = document.getElementById('main-menu-admin')

    if (saveStatus && statusHost && saveStatus.parentElement !== statusHost) statusHost.appendChild(saveStatus)
    if (reset && resetHost && reset.parentElement !== resetHost) {
      reset.textContent = '🗑️ 進みぐあいをリセット'
      reset.classList.add('main-menu-item')
      resetHost.appendChild(reset)
    }
    if (adminHost && (adminBadge || adminUnlock)) {
      adminHost.hidden = false
      if (adminBadge && adminBadge.parentElement !== adminHost) adminHost.appendChild(adminBadge)
      if (adminUnlock && adminUnlock.parentElement !== adminHost) {
        adminUnlock.classList.add('main-menu-item')
        adminHost.appendChild(adminUnlock)
      }
    }
  }

  function installMenu () {
    const topActions = document.querySelector('.top-actions')
    if (!topActions || document.getElementById('quest-main-menu-toggle')) return

    pointsButton = document.createElement('button')
    pointsButton.id = 'knowledge-points'
    pointsButton.type = 'button'
    pointsButton.className = 'knowledge-points'
    pointsButton.addEventListener('click', openReview)

    const menuWrap = document.createElement('div')
    menuWrap.className = 'quest-main-menu-wrap'
    menuWrap.innerHTML = [
      '<button id="quest-main-menu-toggle" class="quest-main-menu-toggle" type="button" aria-expanded="false" aria-controls="quest-main-menu" aria-label="メニューを開く">',
      '  <span aria-hidden="true"></span><span aria-hidden="true"></span><span aria-hidden="true"></span>',
      '  <i class="menu-notification-dot" aria-hidden="true"></i>',
      '</button>',
      '<div id="quest-main-menu" class="quest-main-menu" hidden>',
      '  <div class="quest-main-menu-heading"><strong>メニュー</strong><button class="main-menu-close" type="button" aria-label="メニューを閉じる">×</button></div>',
      '  <button id="menu-review" class="main-menu-item main-menu-review" type="button"><span>🧠 考え方の復習</span><i id="menu-review-notice" class="review-notice">今日</i></button>',
      '  <button id="menu-export-progress" class="main-menu-item" type="button">📦 進みぐあいを書き出す</button>',
      '  <button id="menu-import-progress" class="main-menu-item" type="button">📥 進みぐあいを読み込む</button>',
      '  <button id="menu-export-anki" class="main-menu-item secondary" type="button">🗂️ Anki用カードを書き出す</button>',
      '  <input id="menu-import-file" type="file" accept=".zip,application/zip,.json,application/json" hidden>',
      '  <div id="main-menu-admin" class="main-menu-admin" hidden></div>',
      '  <div id="main-menu-reset-host" class="main-menu-reset-host"></div>',
      '  <div id="main-menu-save-status" class="main-menu-save-status"></div>',
      '</div>',
    ].join('')

    topActions.append(pointsButton, menuWrap)
    menuToggle = menuWrap.querySelector('#quest-main-menu-toggle')
    menuPanel = menuWrap.querySelector('#quest-main-menu')
    reviewButton = menuWrap.querySelector('#menu-review')
    reviewNotice = menuWrap.querySelector('#menu-review-notice')
    importInput = menuWrap.querySelector('#menu-import-file')

    menuToggle.addEventListener('click', toggleMenu)
    menuWrap.querySelector('.main-menu-close').addEventListener('click', closeMenu)
    reviewButton.addEventListener('click', openReview)
    menuWrap.querySelector('#menu-export-progress').addEventListener('click', exportProgress)
    menuWrap.querySelector('#menu-import-progress').addEventListener('click', () => importInput.click())
    menuWrap.querySelector('#menu-export-anki').addEventListener('click', exportAnki)
    importInput.addEventListener('change', importProgress)

    document.addEventListener('click', event => {
      if (menuPanel.hidden || menuWrap.contains(event.target)) return
      closeMenu()
    })
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !menuPanel.hidden) closeMenu()
    })

    const observer = new MutationObserver(moveExistingControlsIntoMenu)
    observer.observe(topActions, { childList: true, subtree: true })
    moveExistingControlsIntoMenu()
    installResetGuard()
    updateKnowledgeDisplay()
  }

  function exportProgress () {
    closeMenu()
    transfer.exportProgress(storage, currentVersion())
    showToast('進みぐあいを ZIP に保存しました。')
  }

  async function importProgress () {
    const file = importInput.files && importInput.files[0]
    if (!file) return
    closeMenu()
    try {
      const result = await transfer.importFile(file, storage)
      document.dispatchEvent(new CustomEvent('jsquest:saveimported', { detail: result }))
      showToast('セーブを読み込みました。ページを開き直します。', 'success')
      window.setTimeout(() => window.location.reload(), 450)
    } catch (error) {
      showToast(error.message, 'error')
      importInput.value = ''
    }
  }

  function plainAnkiField (html) {
    return String(html || '')
      .replace(/[\t\r\n]+/g, ' ')
      .trim()
  }

  function exportAnki () {
    closeMenu()
    const state = currentState()
    const cardsApi = window.JSQuestConceptCards
    const cardIds = Object.keys(state.cards).sort()
    if (!cardsApi || cardIds.length === 0) {
      showToast('まだ書き出せる考え方のカードがありません。', 'error')
      return
    }

    const lines = [
      '#separator:tab',
      '#html:true',
      '#columns:Front\tBack\tTags',
    ]
    for (const cardId of cardIds) {
      const card = cardsApi.getCard(cardId)
      if (!card) continue
      lines.push([
        plainAnkiField(card.titleHtml),
        plainAnkiField(card.bodyHtml),
        'JavaScriptQuest ' + cardId,
      ].join('\t'))
    }
    const text = '\uFEFF' + lines.join('\n') + '\n'
    const bytes = new TextEncoder().encode(text)
    transfer.downloadBytes(bytes, 'javascript-quest-anki-cards.txt', 'text/plain;charset=utf-8')
    showToast('AnkiDroid で読み込めるカードを書き出しました。')
  }

  function ensureReviewModal () {
    let overlay = document.getElementById('knowledge-review-overlay')
    if (overlay) return overlay
    overlay = document.createElement('section')
    overlay.id = 'knowledge-review-overlay'
    overlay.className = 'knowledge-review-overlay'
    overlay.hidden = true
    overlay.innerHTML = [
      '<div class="knowledge-review-dialog" role="dialog" aria-modal="true" aria-labelledby="knowledge-review-title">',
      '  <div class="knowledge-review-header">',
      '    <div><p class="review-eyebrow">知識を力に変えよう</p><h2 id="knowledge-review-title">考え方の復習</h2></div>',
      '    <button class="review-close" type="button" aria-label="復習を閉じる">×</button>',
      '  </div>',
      '  <p class="review-lore">ヒーローが冒険をあきらめずに進むには、学んだことをときどき思い出すことが大切。短い復習で知識ポイントを集めよう。</p>',
      '  <div id="knowledge-review-body"></div>',
      '</div>',
    ].join('')
    document.body.appendChild(overlay)
    overlay.querySelector('.review-close').addEventListener('click', () => { overlay.hidden = true })
    overlay.addEventListener('click', event => {
      if (event.target === overlay) overlay.hidden = true
    })
    return overlay
  }

  function openReview () {
    closeMenu()
    const state = currentState()
    if (Object.keys(state.cards).length === 0) {
      showToast('「新しい考え方」のカードを覚えると、ここで復習できるようになります。')
      return
    }

    const active = review.beginSession(state, new Date(), Math.random)
    review.save(state, storage)
    const overlay = ensureReviewModal()
    overlay.hidden = false
    renderNextReviewCard(overlay, state, active)
  }

  function renderNextReviewCard (overlay, state, active) {
    const body = overlay.querySelector('#knowledge-review-body')
    const pending = active.cardIds.filter(cardId => !active.completedCardIds.includes(cardId))
    if (pending.length === 0) {
      const result = review.completeActiveSession(state, new Date())
      review.save(state, storage)
      updateKnowledgeDisplay()
      renderReviewComplete(body, state, result)
      return
    }

    const cardId = pending[0]
    const card = window.JSQuestConceptCards?.getCard(cardId)
    const quiz = window.JSQuestConceptCardQuizzes?.getQuiz(cardId) || []
    const completedCount = active.cardIds.length - pending.length
    if (!card || quiz.length === 0) {
      body.innerHTML = '<p class="review-error">このカードの復習データを読み込めませんでした。</p>'
      return
    }

    body.innerHTML = [
      '<div class="review-progress"><span>カード ' + (completedCount + 1) + ' / ' + active.cardIds.length + '</span><span>' + escapeHtml(cardId.replace('concept-card-', 'CARD ')) + '</span></div>',
      '<div class="review-progress-track"><span style="width:' + ((completedCount / active.cardIds.length) * 100) + '%"></span></div>',
      '<article class="review-question-card">',
      '  <h3 class="review-card-title">' + card.titleHtml + '</h3>',
      '  <p class="review-before-note">カードの説明を見る前に、まず思い出して答えてみよう。</p>',
      '  <form id="review-quiz-form"></form>',
      '  <p id="review-quiz-status" class="review-quiz-status" aria-live="polite"></p>',
      '  <div id="review-concept-reveal" class="review-concept-reveal" hidden>',
      '    <p class="review-reveal-label">答え合わせ：考え方をもう一度読もう</p>',
      '    <div class="review-concept-body">' + card.bodyHtml + '</div>',
      '    <div class="review-recall">',
      '      <div id="review-recall-emoji" class="review-recall-emoji" aria-hidden="true">🙂</div>',
      '      <label for="review-recall-slider">どのくらい覚えてた？</label>',
      '      <input id="review-recall-slider" type="range" min="0" max="2" step="1" value="1">',
      '      <div class="review-recall-scale"><span>ぜんぶ忘れてた</span><span>なんとなく覚えてた</span><span>完璧に覚えてた</span></div>',
      '      <strong id="review-recall-label">🙂 なんとなく覚えてた</strong>',
      '    </div>',
      '    <button id="review-next-card" class="button success" type="button">次のカードへ →</button>',
      '  </div>',
      '</article>',
    ].join('')

    const form = body.querySelector('#review-quiz-form')
    quiz.forEach((question, questionIndex) => {
      const fieldset = document.createElement('fieldset')
      fieldset.className = 'review-question'
      const legend = document.createElement('legend')
      legend.textContent = (questionIndex + 1) + '. ' + question.prompt
      fieldset.appendChild(legend)
      shuffle(question.choices).forEach(choice => {
        const label = document.createElement('label')
        label.className = 'review-choice'
        const input = document.createElement('input')
        input.type = 'radio'
        input.name = 'review-question-' + questionIndex
        input.value = choice
        const text = document.createElement('span')
        text.textContent = choice
        label.append(input, text)
        fieldset.appendChild(label)
      })
      form.appendChild(fieldset)
    })
    const submit = document.createElement('button')
    submit.type = 'submit'
    submit.className = 'button primary review-check'
    submit.textContent = '答え合わせ'
    form.appendChild(submit)

    let score = null
    form.addEventListener('submit', event => {
      event.preventDefault()
      const selected = quiz.map((_, questionIndex) => form.querySelector('input[name="review-question-' + questionIndex + '"]:checked'))
      if (selected.some(input => !input)) {
        body.querySelector('#review-quiz-status').textContent = '全部の質問に答えてから、答え合わせをしよう。'
        return
      }
      score = selected.reduce((correct, input, questionIndex) => correct + (input.value === quiz[questionIndex].answer ? 1 : 0), 0)
      form.querySelectorAll('input').forEach(input => { input.disabled = true })
      submit.disabled = true
      const status = body.querySelector('#review-quiz-status')
      status.textContent = score + ' / ' + quiz.length + ' 問正解'
      status.className = 'review-quiz-status ' + (score === quiz.length ? 'success' : score > 0 ? 'partial' : 'error')
      body.querySelector('#review-concept-reveal').hidden = false
      body.querySelector('#review-recall-slider').focus()
    })

    const slider = body.querySelector('#review-recall-slider')
    const emoji = body.querySelector('#review-recall-emoji')
    const recallLabel = body.querySelector('#review-recall-label')
    const recallOptions = [
      { emoji: '😅', label: 'ぜんぶ忘れてた' },
      { emoji: '🙂', label: 'なんとなく覚えてた' },
      { emoji: '😎', label: '完璧に覚えてた' },
    ]
    function updateRecall () {
      const option = recallOptions[Number(slider.value)]
      emoji.textContent = option.emoji
      recallLabel.textContent = option.emoji + ' ' + option.label
    }
    slider.addEventListener('input', updateRecall)
    updateRecall()

    body.querySelector('#review-next-card').addEventListener('click', () => {
      if (score === null) return
      const completedBefore = review.completedSessionsToday(state, new Date())
      const awardPoints = completedBefore < 2
      review.reviewCard(state, cardId, score, quiz.length, Number(slider.value), new Date(), awardPoints)
      review.save(state, storage)
      updateKnowledgeDisplay()
      renderNextReviewCard(overlay, state, active)
    })
  }

  function renderReviewComplete (body, state, result) {
    const points = review.knowledgePoints(state)
    const noMoreDailyPoints = result.sessionNumber >= 3
    body.innerHTML = [
      '<div class="review-complete">',
      '  <div class="review-complete-icon">✨🧠✨</div>',
      '  <h3>復習できた！</h3>',
      '  <p>6枚の考え方を思い出して、冒険を続ける力を保てたよ。</p>',
      '  <p class="review-session-bonus">' + (result.bonus > 0 ? '今日のセッションボーナス：+' + result.bonus + ' 知識ポイント' : noMoreDailyPoints ? '今日は3回目以降なので、追加の知識ポイントはありません。復習は何回でもできます。' : '') + '</p>',
      '  <strong class="review-total-points">知識ポイント ' + points.total + '</strong>',
      '  <div class="review-complete-actions"><button id="review-again" class="button" type="button">もう一度復習する</button><button id="review-finish" class="button success" type="button">冒険にもどる</button></div>',
      '</div>',
    ].join('')
    body.querySelector('#review-again').addEventListener('click', openReview)
    body.querySelector('#review-finish').addEventListener('click', () => {
      document.getElementById('knowledge-review-overlay').hidden = true
    })
  }

  function ensureResetModal () {
    let overlay = document.getElementById('safe-reset-overlay')
    if (overlay) return overlay
    overlay = document.createElement('section')
    overlay.id = 'safe-reset-overlay'
    overlay.className = 'safe-reset-overlay'
    overlay.hidden = true
    overlay.innerHTML = '<div class="safe-reset-dialog" role="dialog" aria-modal="true" aria-labelledby="safe-reset-title"><div id="safe-reset-content"></div></div>'
    document.body.appendChild(overlay)
    return overlay
  }

  function openResetStepOne () {
    closeMenu()
    const overlay = ensureResetModal()
    const content = overlay.querySelector('#safe-reset-content')
    overlay.hidden = false
    content.innerHTML = [
      '<p class="review-eyebrow">大切な確認 1 / 2</p>',
      '<h2 id="safe-reset-title">先に冒険を保存しよう</h2>',
      '<p>リセットすると、このブラウザーにあるミッション、コード、考え方、復習の記録が消えます。</p>',
      '<p>まず ZIP セーブを書き出して、安全な場所に保存してください。</p>',
      '<div class="safe-reset-actions"><button id="safe-reset-export" class="button primary" type="button">📦 セーブを書き出す</button><button id="safe-reset-next" class="button" type="button" disabled>保存したので次へ →</button><button id="safe-reset-cancel" class="button ghost" type="button">やめる</button></div>',
    ].join('')
    const next = content.querySelector('#safe-reset-next')
    content.querySelector('#safe-reset-export').addEventListener('click', () => {
      transfer.exportProgress(storage, currentVersion())
      next.disabled = false
      next.classList.add('success')
    })
    next.addEventListener('click', openResetStepTwo)
    content.querySelector('#safe-reset-cancel').addEventListener('click', () => { overlay.hidden = true })
  }

  function openResetStepTwo () {
    const overlay = ensureResetModal()
    const content = overlay.querySelector('#safe-reset-content')
    content.innerHTML = [
      '<p class="review-eyebrow">大切な確認 2 / 2</p>',
      '<h2 id="safe-reset-title">ZIP をちゃんと保存できた？</h2>',
      '<p>あとで戻したくなったら、今書き出した ZIP が必要です。</p>',
      '<p><strong>本当に、今の進みぐあいをリセットしますか？</strong></p>',
      '<div class="safe-reset-actions"><button id="safe-reset-confirm" class="button danger" type="button">はい、最初からにする</button><button id="safe-reset-back" class="button" type="button">← もどる</button><button id="safe-reset-cancel" class="button ghost" type="button">やめる</button></div>',
    ].join('')
    content.querySelector('#safe-reset-confirm').addEventListener('click', () => {
      transfer.clearQuestStorage(storage)
      window.location.reload()
    })
    content.querySelector('#safe-reset-back').addEventListener('click', openResetStepOne)
    content.querySelector('#safe-reset-cancel').addEventListener('click', () => { overlay.hidden = true })
  }

  function installResetGuard () {
    const reset = document.getElementById('reset-progress')
    if (!reset || reset.dataset.safeResetInstalled) return
    reset.dataset.safeResetInstalled = 'true'
    reset.addEventListener('click', event => {
      event.preventDefault()
      event.stopImmediatePropagation()
      openResetStepOne()
    }, true)
  }

  function showToast (message, type) {
    let toast = document.getElementById('quest-toast')
    if (!toast) {
      toast = document.createElement('div')
      toast.id = 'quest-toast'
      toast.className = 'quest-toast'
      toast.setAttribute('role', 'status')
      document.body.appendChild(toast)
    }
    toast.textContent = message
    toast.className = 'quest-toast show ' + (type || 'neutral')
    window.clearTimeout(showToast.timer)
    showToast.timer = window.setTimeout(() => { toast.className = 'quest-toast' }, 3200)
  }

  function init () {
    installMenu()
    document.addEventListener('jsquest:knowledgechanged', updateKnowledgeDisplay)
    document.addEventListener('jsquest:conceptcardschanged', () => window.setTimeout(updateKnowledgeDisplay, 0))
    window.setTimeout(() => {
      moveExistingControlsIntoMenu()
      installResetGuard()
      updateKnowledgeDisplay()
    }, 0)
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init)
  else init()
})()
