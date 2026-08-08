(function () {
  'use strict'

  const STORAGE_KEY = 'japanese-js-quest-story-intro-seen-v1'
  const slides = [
    {
      eyebrow: 'JavaScript Fantasy Land',
      title: 'ようこそ、見習いの神さま。',
      paragraphs: [
        'あなたは、JavaScript Fantasy Land にやってきた見習いの神さまです。',
      ],
    },
    {
      eyebrow: 'プログラミングの魔法',
      title: '世界には、魔法のルールがあります。',
      paragraphs: [
        '見習いの神さまは、プログラミングの魔法を使って世界に少しずつ影響し、ヒーローたちが運命をかなえるのを助けられます。',
        'でも、何でも好きにできるわけではありません。魔法にはルールがあります。ルールをひとつずつ学ぶほど、世界にできることが増えていきます。',
      ],
    },
    {
      eyebrow: 'あるヒーローの伝説',
      title: 'むかしむかし……',
      legend: true,
      paragraphs: [
        'とても美しく、好奇心いっぱいで、勇気のある小さな女の子がいました。',
        'その子は、踊ること、木に登ること、そして大好きなお父さんのために小さなものを作ることが大好きでした。',
      ],
    },
    {
      eyebrow: 'あるヒーローの伝説',
      title: 'ところが、ある日……',
      legend: true,
      paragraphs: [
        'その若さをねたんだ魔女が、女の子に恐ろしい呪いをかけました。',
        '女の子は、なんとおじいさんの姿に変えられてしまったのです。',
      ],
    },
    {
      eyebrow: 'あるヒーローの伝説',
      title: 'それでも、希望は捨てませんでした。',
      legend: true,
      paragraphs: [
        'おじいさんの姿なら、大人として魔法を学べます。しかも、もう誰にも正体を知られません。',
        'そこで彼女は、自分の姿を取り戻し、魔女がもう誰も傷つけられないようにするため、魔法を学ぶことを決めました。',
      ],
    },
    {
      eyebrow: 'あなたの冒険',
      title: 'さあ、最初の魔法を。',
      paragraphs: [
        '見習いの神さまとして、この小さな女の子の冒険を助けてください。',
        'あなたの最初の魔法は、MISSION 00 から始まります。',
      ],
      final: true,
    },
  ]

  function hasSeenIntro () {
    try {
      return window.localStorage.getItem(STORAGE_KEY) === '1'
    } catch (error) {
      return false
    }
  }

  function markIntroSeen () {
    try {
      window.localStorage.setItem(STORAGE_KEY, '1')
    } catch (error) {
      // The introduction still works when localStorage is unavailable; it may
      // simply be shown again on the next visit.
    }
  }

  function skipIntro () {
    document.body.classList.remove('story-intro-checking')
  }

  function showIntro () {
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

    const copy = document.createElement('div')
    copy.className = 'story-intro-copy'

    const progress = document.createElement('div')
    progress.className = 'story-intro-progress'
    progress.setAttribute('aria-hidden', 'true')

    const next = document.createElement('button')
    next.className = 'story-intro-next'
    next.type = 'button'

    panel.append(eyebrow, title, copy, progress, next)
    overlay.appendChild(panel)
    document.body.appendChild(overlay)
    document.body.classList.replace('story-intro-checking', 'story-intro-active')

    let index = 0

    function render () {
      const slide = slides[index]
      eyebrow.textContent = slide.eyebrow
      title.textContent = slide.title
      copy.classList.toggle('is-legend', Boolean(slide.legend))
      copy.innerHTML = ''
      for (const paragraph of slide.paragraphs) {
        const element = document.createElement('p')
        element.textContent = paragraph
        copy.appendChild(element)
      }
      progress.innerHTML = ''
      slides.forEach((item, dotIndex) => {
        const dot = document.createElement('span')
        dot.className = 'story-intro-dot' + (dotIndex === index ? ' is-current' : '')
        progress.appendChild(dot)
      })
      next.textContent = slide.final ? '冒険をはじめる' : '次へ'
      next.focus()
    }

    function advance () {
      if (index < slides.length - 1) {
        index++
        render()
        return
      }
      markIntroSeen()
      overlay.remove()
      document.body.classList.remove('story-intro-active')
    }

    next.addEventListener('click', advance)
    overlay.addEventListener('keydown', event => {
      if ((event.key === 'Enter' || event.key === ' ') && event.target !== next) {
        event.preventDefault()
        advance()
      }
    })

    render()
  }

  if (hasSeenIntro()) skipIntro()
  else showIntro()

  window.JSQuestStoryIntro = Object.freeze({
    STORAGE_KEY,
    slides: slides.map(slide => Object.freeze(Object.assign({}, slide, { paragraphs: Object.freeze(slide.paragraphs.slice()) }))),
  })
})()
