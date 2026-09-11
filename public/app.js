(() => {
  const yearEl = document.getElementById('year')
  if (yearEl) yearEl.textContent = String(new Date().getFullYear())

  const mascot = document.getElementById('mascot')
  const blink = document.getElementById('blink')
  const particles = document.getElementById('particles')
  const bubble = document.getElementById('speech-bubble')

  const PHRASES = [
    'Hey ich bin kitzelig',
    'Lass das',
    'Hihi',
    'Autsch, meine Kappe!',
    'Mehr Wasser, weniger Finger!',
    'Stopp, ich kicher!',
    'Das kitzelt!',
    'Hey, Hände weg vom Cap!',
    'Hihihi, nochmal!',
    'Platsch! Das war nah!',
    'Ohje, ich spritze gleich!',
    'Kicherwasser aktiviert!',
  ]

  let busy = false
  let phraseIndex = 0
  let audioCtx = null
  let bubbleTimer = null

  function getAudioCtx() {
    if (!audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext
      if (!Ctx) return null
      audioCtx = new Ctx()
    }
    if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {})
    return audioCtx
  }

  function playTone(freq, start, duration, type, gainValue) {
    const ctx = getAudioCtx()
    if (!ctx) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, ctx.currentTime + start)
    gain.gain.setValueAtTime(0.0001, ctx.currentTime + start)
    gain.gain.exponentialRampToValueAtTime(gainValue, ctx.currentTime + start + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + duration)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(ctx.currentTime + start)
    osc.stop(ctx.currentTime + start + duration + 0.02)
  }

  function playSplashSounds() {
    // tickle / pop / splash-like blips via Web Audio (no assets)
    playTone(880, 0, 0.08, 'square', 0.08)
    playTone(1320, 0.06, 0.07, 'triangle', 0.07)
    playTone(520, 0.12, 0.12, 'sine', 0.09)
    playTone(240, 0.18, 0.18, 'sine', 0.06)
    playTone(1100, 0.22, 0.05, 'square', 0.05)
  }

  function showBubble(text) {
    if (!bubble) return
    bubble.textContent = text
    bubble.hidden = false
    bubble.classList.remove('show')
    void bubble.offsetWidth
    bubble.classList.add('show')
    if (bubbleTimer) clearTimeout(bubbleTimer)
    bubbleTimer = setTimeout(() => {
      bubble.classList.remove('show')
      bubble.hidden = true
    }, 2200)
  }

  function speak(text) {
    return new Promise((resolve) => {
      const synth = window.speechSynthesis
      if (!synth || typeof SpeechSynthesisUtterance === 'undefined') {
        resolve(false)
        return
      }
      let settled = false
      const finish = (ok) => {
        if (settled) return
        settled = true
        clearTimeout(safety)
        resolve(ok)
      }
      const safety = setTimeout(() => finish(true), Math.min(4500, 900 + text.length * 90))
      try {
        synth.cancel()
        const utter = new SpeechSynthesisUtterance(text)
        utter.lang = 'de-DE'
        utter.rate = 1.08
        utter.pitch = 1.35
        utter.onend = () => finish(true)
        utter.onerror = () => finish(false)
        const voices = synth.getVoices()
        const de = voices.find((v) => v.lang && v.lang.toLowerCase().startsWith('de'))
        if (de) utter.voice = de
        synth.speak(utter)
      } catch {
        finish(false)
      }
    })
  }

  function nextPhrase() {
    const text = PHRASES[phraseIndex % PHRASES.length]
    phraseIndex += 1
    return text
  }

  function doBlink() {
    if (!blink) return
    blink.classList.remove('on')
    void blink.offsetWidth
    blink.classList.add('on')
    setTimeout(() => blink.classList.remove('on'), 180)
  }

  function spawnSplash() {
    if (!particles || !mascot) return
    mascot.classList.remove('splash-burst')
    void mascot.offsetWidth
    mascot.classList.add('splash-burst')
    for (let i = 0; i < 14; i++) {
      const p = document.createElement('span')
      p.className = 'particle'
      const angle = (Math.PI * 2 * i) / 14 + Math.random() * 0.4
      const dist = 70 + Math.random() * 90
      p.style.setProperty('--dx', `${Math.cos(angle) * dist}px`)
      p.style.setProperty('--dy', `${Math.sin(angle) * dist - 20}px`)
      p.style.background = i % 2
        ? 'radial-gradient(circle at 30% 30%, #fff, #00c2e0)'
        : 'radial-gradient(circle at 30% 30%, #fff, #1a6cff)'
      particles.appendChild(p)
      setTimeout(() => p.remove(), 950)
    }
    doBlink()
  }

  async function onMascotActivate() {
    if (busy) return
    busy = true
    const phrase = nextPhrase()
    spawnSplash()
    playSplashSounds()
    showBubble(phrase)
    try {
      await speak(phrase)
    } finally {
      // short cooldown so rapid clicks don't stack
      setTimeout(() => {
        busy = false
      }, 350)
    }
  }

  if (mascot) {
    mascot.addEventListener('click', onMascotActivate)
    mascot.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onMascotActivate()
      }
    })
    mascot.setAttribute('tabindex', '0')
    mascot.setAttribute('role', 'button')
    mascot.setAttribute('aria-label', 'Dr. Splash antippen fuer Splash, Sound und Sprueche')
  }

  // Chrome loads voices async
  if (window.speechSynthesis) {
    window.speechSynthesis.getVoices()
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices()
    }
  }

  setInterval(() => {
    if (Math.random() > 0.35) doBlink()
  }, 2800)

  setInterval(() => {
    if (!particles || Math.random() > 0.55) return
    const p = document.createElement('span')
    p.className = 'particle'
    p.style.setProperty('--dx', `${(Math.random() - 0.5) * 40}px`)
    p.style.setProperty('--dy', `${40 + Math.random() * 50}px`)
    p.style.width = '7px'
    p.style.height = '7px'
    p.style.left = `${40 + Math.random() * 20}%`
    p.style.top = '58%'
    particles.appendChild(p)
    setTimeout(() => p.remove(), 950)
  }, 1600)
})()
