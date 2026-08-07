(function () {
  'use strict'

  const readings = {
    条件分岐: 'じょうけんぶんき',
    優先順位: 'ゆうせんじゅんい',
    文字列: 'もじれつ',
    真偽値: 'しんぎち',
    二重ループ: 'にじゅうるーぷ',
    再読み込み: 'さいよみこみ',
    再起動: 'さいきどう',
    再利用: 'さいりよう',
    初めて: 'はじめて',
    主人公: 'しゅじんこう',
    働きかける: 'はたらきかける',
    保存: 'ほぞん',
    画像: 'がぞう',
    番号: 'ばんごう',
    存在: 'そんざい',
    行動: 'こうどう',
    世界: 'せかい',
    命令: 'めいれい',
    実行: 'じっこう',
    魔法: 'まほう',
    方法: 'ほうほう',
    指定: 'してい',
    情報: 'じょうほう',
    入力: 'にゅうりょく',
    言葉: 'ことば',
    表示: 'ひょうじ',
    表す: 'あらわす',
    値: 'あたい',
    定数: 'ていすう',
    固定: 'こてい',
    代入: 'だいにゅう',
    構造: 'こうぞう',
    戻り値: 'もどりち',
    結果: 'けっか',
    条件: 'じょうけん',
    比較: 'ひかく',
    分岐: 'ぶんき',
    処理: 'しょり',
    繰り返し: 'くりかえし',
    判断: 'はんだん',
    状況: 'じょうきょう',
    複数: 'ふくすう',
    変数: 'へんすう',
    偶数: 'ぐうすう',
    奇数: 'きすう',
    無限: 'むげん',
    総復習: 'そうふくしゅう',
    経験値: 'けいけんち',
    宝石: 'ほうせき',
    看板: 'かんばん',
    上下左右: 'じょうげさゆう',
    方向: 'ほうこう',
    履歴: 'りれき',
    順番: 'じゅんばん',
    画面: 'がめん',
    削除: 'さくじょ',
    左右: 'さゆう',
    正しい: 'ただしい',
    正解: 'せいかい',
    調べる: 'しらべる',
    役割: 'やくわり',
    瞬間: 'しゅんかん',
    外側: 'そとがわ',
    両方: 'りょうほう',
    最初: 'さいしょ',
    最後: 'さいご',
    必要: 'ひつよう',
    選択肢: 'せんたくし',
    回数: 'かいすう',
    利点: 'りてん',
    周回: 'しゅうかい',
    確認: 'かくにん',
    背景色: 'はいけいしょく',
    理由: 'りゆう',
    危険: 'きけん',
    自身: 'じしん',
    追加: 'ついか',
    特別: 'とくべつ',
    自然: 'しぜん',
    反対: 'はんたい',
    距離: 'きょり',
    引用符: 'いんようふ',
    異なる: 'ことなる',
    完成: 'かんせい',
    目的: 'もくてき',
    説明: 'せつめい',
    概念: 'がいねん',
    暗記: 'あんき',
    更新: 'こうしん',
    変身: 'へんしん',
    割り算: 'わりざん',
    余り: 'あまり',
  }
  const readingWords = Object.keys(readings).sort((a, b) => b.length - a.length)

  function displayedMissionId () {
    const match = (document.getElementById('mission-number')?.textContent || '').match(/(\d+)/)
    return match ? Number(match[1]) : 0
  }

  function bindReadingTokens (root) {
    root.querySelectorAll('.reading-token:not([data-reading-bound])').forEach(element => {
      element.dataset.readingBound = 'true'
      element.addEventListener('click', event => {
        event.stopPropagation()
        element.classList.toggle('is-open')
      })
    })
  }

  function bindStoredCardTokens (root) {
    root.querySelectorAll('.glossary-token:not(.reading-token):not([data-concept-card-bound])').forEach(element => {
      element.dataset.conceptCardBound = 'true'
      element.addEventListener('click', event => {
        event.stopPropagation()
        element.classList.toggle('is-open')
      })
    })
  }

  function annotateText (root, variant) {
    if (!root) return
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
    const nodes = []
    while (walker.nextNode()) {
      const node = walker.currentNode
      const parent = node.parentElement
      if (!parent || !node.nodeValue.trim()) continue
      if (parent.closest('code, script, style, .glossary-token, .reading-token, .function-signature, button, a')) continue
      nodes.push(node)
    }

    for (const node of nodes) {
      const text = node.nodeValue
      let index = 0
      let changed = false
      const fragment = document.createDocumentFragment()

      while (index < text.length) {
        let matchedWord = null
        for (const word of readingWords) {
          if (text.startsWith(word, index)) {
            matchedWord = word
            break
          }
        }

        if (!matchedWord) {
          fragment.appendChild(document.createTextNode(text[index]))
          index++
          continue
        }

        changed = true
        const span = document.createElement('span')
        span.className = variant === 'glossary'
          ? 'glossary-token reading-token reading-token-gray'
          : 'glossary-token reading-token'
        span.dataset.meaning = readings[matchedWord]
        span.tabIndex = 0
        span.textContent = matchedWord
        fragment.appendChild(span)
        index += matchedWord.length
      }

      if (changed) node.parentNode.replaceChild(fragment, node)
    }
    bindReadingTokens(root)
  }

  window.JSQuestReadingHelp = Object.freeze({
    readings: Object.freeze(Object.assign({}, readings)),
    annotateText,
  })

  function sourceMissionId () {
    const finalId = displayedMissionId()
    const curriculum = window.JSQuestCurriculumV3
    if (curriculum && typeof curriculum.legacyIdForFinalId === 'function') {
      return curriculum.legacyIdForFinalId(finalId)
    }
    return finalId
  }

  function getStoredGuide () {
    return window.JSQuestConceptCards?.getMissionGuide(displayedMissionId()) || null
  }

  function renderStoredCards () {
    const guide = getStoredGuide()
    if (!guide) return false

    const host = document.querySelector('.mission-card')
    if (!host) return false

    let section = document.getElementById('mission-learning-guide')
    if (!section) {
      section = document.createElement('section')
      section.id = 'mission-learning-guide'
      section.className = 'learning-guide'
      host.appendChild(section)
    }

    section.innerHTML = [
      '<div class="learning-guide-heading">',
      '  <div><h3>📚 新しい考え方</h3><p>このミッションで初めて出てくること</p></div>',
      '</div>',
      '  <h4>' + guide.title + '</h4>',
      '  <div class="learning-guide-grid">',
      guide.cardIds.map(cardId => {
        const card = window.JSQuestConceptCards.getCard(cardId)
        if (!card) return ''
        return '<article class="learning-item" data-concept-card-id="' + card.id + '"><h5>' + card.titleHtml + '</h5><p>' + card.bodyHtml + '</p></article>'
      }).join(''),
      '  </div>',
    ].join('')
    annotateText(section, 'mission')
    return true
  }

  function removeLegacyGuide () {
    document.getElementById('mission-learning-guide')?.remove()
  }

  function renderGuide () {
    const existingSection = document.getElementById('mission-learning-guide')
    const missionId = displayedMissionId()
    const missionData = (window.JSQuestMissions || []).find(item => item.id === missionId)
    if (missionData?.type && missionData.type !== 'concept') {
      existingSection?.remove()
      return
    }
    if (renderStoredCards()) return
    if (missionId > 0) {
      existingSection?.remove()
      return
    }

    const missionCard = document.querySelector('.mission-card')
    if (!missionCard) return

    const sections = []
    const sourceId = sourceMissionId()

    if (sourceId === 0) {
      sections.push({
        title: 'hero は主人公（Object / オブジェクト）',
        body: '<code>hero</code> は、ゲームの世界にいる主人公を表すオブジェクトです。オブジェクトは、情報やできることをまとめて持つものです。',
      })
      sections.push({
        title: '<code>.say</code> はメソッド（Method / メソッド）',
        body: '<code>hero.say</code> の <code>.</code> は「hero が持っている <code>say</code> という方法を使う」という意味です。<code>say</code> は、hero に言葉を言わせるメソッドです。',
      })
      sections.push({
        title: '<code>( )</code> の中はパラメータ（Parameter / パラメータ）',
        body: '<code>say</code> に「何を言うか」という情報を渡します。ここでは <code>"Hello Yuzu"</code> を渡しています。',
      })
      sections.push({
        title: '<code>"Hello Yuzu"</code> は文字列（String / ストリング）',
        body: '<code>" "</code> で囲んだ文字は文字列という値です。引用符の外の <code>hero</code> や <code>say</code> はプログラムの言葉ですが、引用符の中はゲームの世界で使う文字です。',
      })
    }

    if (!sections.length) {
      removeLegacyGuide()
      return
    }

    let section = existingSection
    if (!section) {
      section = document.createElement('section')
      section.id = 'mission-learning-guide'
      section.className = 'learning-guide'
      missionCard.appendChild(section)
    }

    section.innerHTML = [
      '<div class="learning-guide-heading">',
      '  <div><h3>📚 新しい考え方</h3><p>このミッションで初めて出てくること</p></div>',
      '</div>',
      '<div class="learning-guide-grid">',
      sections.map(item => '<article class="learning-item"><h4>' + item.title + '</h4><p>' + item.body + '</p></article>').join(''),
      '</div>',
    ].join('')
    annotateText(section, 'mission')
  }

  function annotateMissionText () {
    const mission = document.querySelector('.mission-card')
    if (mission) annotateText(mission, 'mission')
  }

  function annotateGlossary () {
    const reference = document.getElementById('reference-panel')
    if (reference) annotateText(reference, 'glossary')
  }

  function scheduleAnnotations () {
    for (const delay of [0, 40, 120, 260]) {
      window.setTimeout(() => {
        annotateMissionText()
        annotateGlossary()
      }, delay)
    }
  }

  function scheduleQuizAnnotations () {
    for (const delay of [0, 30, 100]) {
      window.setTimeout(() => {
        const modal = document.getElementById('concept-card-quiz-modal')
        if (modal && !modal.hidden) annotateText(modal, 'mission')
      }, delay)
    }
  }

  function init () {
    renderGuide()
    scheduleAnnotations()
    document.addEventListener('jsquest:missionloaded', () => {
      renderGuide()
      scheduleAnnotations()
    })
    document.addEventListener('click', scheduleQuizAnnotations, true)
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init)
  else init()
})()
