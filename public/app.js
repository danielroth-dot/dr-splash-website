(() => {
  const yearEl = document.getElementById('year')
  if (yearEl) yearEl.textContent = String(new Date().getFullYear())

  const mascot = document.getElementById('mascot')
  const blink = document.getElementById('blink')
  const particles = document.getElementById('particles')

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

  if (mascot) {
    mascot.addEventListener('click', spawnSplash)
    mascot.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        spawnSplash()
      }
    })
    mascot.setAttribute('tabindex', '0')
    mascot.setAttribute('role', 'button')
    mascot.setAttribute('aria-label', 'Dr. Splash antippen fuer Splash-Effekt')
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
