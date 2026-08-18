(function () {
  'use strict'

  const STORAGE_KEY = 'japanese-js-quest-story-intro-seen-v1'
  const HERO_READING = Object.freeze({
    text: 'hero',
    tooltip: 'ひーろー → 主人公（しゅじんこう）',
  })
  const INTRO_READINGS = Object.freeze({
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
  })
  const readingWords = Object.keys(INTRO_READINGS).sort((a, b) => b.length - a.length)
  const slides = [
    {
      eyebrow: 'JavaScript Fantasy Land',
      title: 'ようこそ、見習いの神さま。',
      image: 'story-intro-page-1.webp',
      imageAlt: 'JavaScript Fantasy Land に現れる見習いの神さま',
      paragraphs: [
        'あなたは、JavaScript Fantasy Land にやってきた見習いの神さまです。',
      ],
    },
    {
      eyebrow: 'プログラミングの魔法',
      title: '世界には、魔法のルールがあります。',
      image: 'story-intro-page-2.webp',
      imageAlt: 'プログラミングの魔法で世界に働きかける見習いの神さま',
      paragraphs: [
        '見習いの神さまは、プログラミングの魔法を使って世界に少しずつ影響し、ヒーローたちが運命をかなえるのを助けられます。',
        'でも、何でも好きにできるわけではありません。魔法にはルールがあります。ルールをひとつずつ学ぶほど、世界にできることが増えていきます。',
      ],
    },
    {
      eyebrow: 'あるヒーローの伝説',
      title: 'むかしむかし……',
      image: 'story-intro-page-3.webp',
      imageAlt: 'お父さんと楽しく過ごす小さな女の子',
      legend: true,
      paragraphs: [
        'とても美しく、好奇心いっぱいで、勇気のある小さな女の子がいました。',
        'その子は、踊ること、木に登ること、そして大好きなお父さんのために小さなものを作ることが大好きでした。',
      ],
    },
    {
      eyebrow: 'あるヒーローの伝説',
      title: 'ところが、ある日……',
      image: 'story-intro-page-4.webp',
      imageAlt: '魔女の呪いでおじいさんの姿に変えられる女の子',
      legend: true,
      paragraphs: [
        'その若さをねたんだ魔女が、女の子に恐ろしい呪いをかけました。',
        '女の子は、なんとおじいさんの姿に変えられてしまったのです。',
      ],
    },
    {
      eyebrow: 'あるヒーローの伝説',
      title: 'それでも、希望は捨てませんでした。',
      image: 'story-intro-page-5.webp',
      imageAlt: 'おじいさんの姿で魔法を学び始めるヒーロー',
      legend: true,
      paragraphs: [
        'おじいさんの姿なら、大人として魔法を学べます。しかも、もう誰にも正体を知られません。',
        'そこで彼女は、自分の姿を取り戻し、魔女がもう誰も傷つけられないようにするため、魔法を学ぶことを決めました。',
      ],
    },
    {
      eyebrow: '小さな女の子を助けよう',
      title: '冒険を手伝おう。',
      image: 'story-intro-page-6.webp',
      imageAlt: '見習いの神さまがヒーローの魔法を導く様子',
      paragraphs: [
        {
          parts: [
            '見習いの神さまとして、この小さなおじいさん……じゃなくて、小さな女の子……いや、この ',
            HERO_READING,
            ' の冒険を助けて、もとの姿を取り戻そう！',
          ],
        },
        {
          parts: [
            'JavaScript のプログラミング魔法を使って、',
            HERO_READING,
            ' の行動を導くことができます。',
          ],
        },
      ],
    },
    {
      eyebrow: 'あなたの冒険',
      title: 'さあ、最初の魔法を。',
      image: 'story-intro-page-7.webp',
      imageAlt: '見習いの神さまとヒーローが冒険へ出発する様子',
      paragraphs: [
        'あなたの最初の魔法は、MISSION 00 から始まります。',
      ],
      final: true,
    },
  ]

  function hasSeenIntro () {
    try {
      return window.localStorage.getItem(STORAGE_KEY) === '1'
    } catch {
      return false
    }
  }

  function markIntroSeen () {
    try {
      window.localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      // The introduction still works when localStorage is unavailable; it may
      // simply be shown again on the next visit.
    }
  }

  function campaignElements () {
    return Array.from(document.body.children).filter(element => !['SCRIPT', 'STYLE'].includes(element.tagName) && !element.classList.contains('story-intro-overlay'))
  }

  function setCampaignInert (inert) {
    for (const element of campaignElements()) element.inert = inert
  }

  function makeReadingToken (text, tooltip) {
    const token = document.createElement('span')
    token.className = 'reading-token'
    token.textContent = text
    token.dataset.tooltip = tooltip
    token.tabIndex = 0
    token.setAttribute('role', 'button')
    token.setAttribute('aria-label', text + '：' + tooltip)
    token.addEventListener('click', event => {
      event.stopPropagation()
      token.classList.toggle('is-open')
    })
    return token
  }

  function appendAnnotatedText (element, text) {
    if (!text) return
    const pattern = new RegExp(readingWords.join('|'), 'g')
    let cursor = 0
    for (const match of text.matchAll(pattern)) {
      element.appendChild(document.createTextNode(text.slice(cursor, match.index)))
      const word = match[0]
      element.appendChild(makeReadingToken(word, word + '（' + INTRO_READINGS[word] + '）'))
      cursor = match.index + word.length
    }
    element.appendChild(document.createTextNode(text.slice(cursor)))
  }

  function renderAnnotatedText (element, text) {
    element.innerHTML = ''
    appendAnnotatedText(element, text)
  }

  function appendParagraphPart (element, part) {
    if (typeof part === 'string') {
      appendAnnotatedText(element, part)
      return
    }
    element.appendChild(makeReadingToken(part.text, part.tooltip))
  }

  function renderParagraph (copy, paragraph) {
    const element = document.createElement('p')
    if (typeof paragraph === 'string') appendAnnotatedText(element, paragraph)
    else for (const part of paragraph.parts) appendParagraphPart(element, part)
    copy.appendChild(element)
  }

  function skipIntro () {
    document.body.classList.remove('story-intro-checking')
    setCampaignInert(false)
  }

  function showIntro () {
    if (document.querySelector('.story-intro-overlay')) return

    const overlay = document.createElement('section')
    overlay.className = 'story-intro-overlay'
    overlay.setAttribute('role', 'dialog')
    overlay.setAttribute('aria-modal', 'true')
    overlay.setAttribute('aria-labelledby', 'story-intro-title')

    const panel = document.createElement('div')
    panel.className = 'story-intro-panel'

    const eyebrow = document.createElement('p')
    eyebrow.className = 'story-intro-eyebrow'

    const title = document.createElement('h1')
    title.id = 'story-intro-title'
    title.className = 'story-intro-title'

    const image = document.createElement('img')
    image.className = 'story-intro-image'
    image.width = 640
    image.height = 480

    const copy = document.createElement('div')
    copy.className = 'story-intro-copy'

    const progress = document.createElement('div')
    progress.className = 'story-intro-progress'
    progress.setAttribute('aria-hidden', 'true')

    const actions = document.createElement('div')
    actions.className = 'story-intro-actions'

    const previous = document.createElement('button')
    previous.className = 'story-intro-previous'
    previous.type = 'button'
    previous.textContent = '← 前へ'

    const next = document.createElement('button')
    next.className = 'story-intro-next'
    next.type = 'button'

    actions.append(previous, next)
    panel.append(eyebrow, title, image, copy, progress, actions)
    overlay.appendChild(panel)
    document.body.appendChild(overlay)
    setCampaignInert(true)
    document.body.classList.remove('story-intro-checking')
    document.body.classList.add('story-intro-active')

    let index = 0

    function render () {
      const slide = slides[index]
      renderAnnotatedText(eyebrow, slide.eyebrow)
      renderAnnotatedText(title, slide.title)
      image.src = slide.image
      image.alt = slide.imageAlt
      copy.classList.toggle('is-legend', Boolean(slide.legend))
      copy.innerHTML = ''
      for (const paragraph of slide.paragraphs) renderParagraph(copy, paragraph)
      progress.innerHTML = ''
      slides.forEach((_, dotIndex) => {
        const dot = document.createElement('span')
        dot.className = 'story-intro-dot' + (dotIndex === index ? ' is-current' : '')
        progress.appendChild(dot)
      })
      previous.hidden = index === 0
      previous.disabled = index === 0
      next.textContent = slide.final ? '冒険をはじめる' : '次へ'
      next.focus()
    }

    function closeIntro () {
      setCampaignInert(false)
      overlay.remove()
      document.body.classList.remove('story-intro-active')
    }

    function advance () {
      if (index < slides.length - 1) {
        index++
        render()
        return
      }
      markIntroSeen()
      closeIntro()
    }

    function goBack () {
      if (index === 0) return
      index--
      render()
    }

    previous.addEventListener('click', goBack)
    next.addEventListener('click', advance)

    render()
  }

  const replay = document.getElementById('replay-story-intro')
  if (replay) replay.addEventListener('click', showIntro)

  if (hasSeenIntro()) skipIntro()
  else showIntro()

  window.JSQuestStoryIntro = Object.freeze({
    STORAGE_KEY,
    replay: showIntro,
    slides: slides.map(slide => Object.freeze(Object.assign({}, slide, { paragraphs: Object.freeze(slide.paragraphs.slice()) }))),
  })
})()
