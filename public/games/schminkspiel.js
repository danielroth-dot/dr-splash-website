(() => {
  const canvas = document.getElementById('game')
  const ctx = canvas.getContext('2d')
  const overlay = document.getElementById('overlay')
  const startBtn = document.getElementById('start-btn')
  const scoreEl = document.getElementById('score')
  const bestEl = document.getElementById('best')
  const tray = document.getElementById('tray')
  const W = canvas.width
  const H = canvas.height
  const BEST_KEY = 'drsplash-schmink-best'

  const mascot = new Image()
  mascot.src = '/assets/dr-splash.png'

  let running = false
  let score = 0
  let best = Number(localStorage.getItem(BEST_KEY) || 0)
  bestEl.textContent = String(best)
  let selected = null
  let last = 0
  let sparkles = []

  const ITEMS = [
    { id: 'lipstick', label: 'Lippenstift', emoji: '💄', pts: 20 },
    { id: 'blush', label: 'Rouge', emoji: '🌸', pts: 15 },
    { id: 'glasses', label: 'Brille', emoji: '👓', pts: 25 },
    { id: 'hat', label: 'Hut', emoji: '🎩', pts: 30 },
    { id: 'bow', label: 'Schleife', emoji: '🎀', pts: 20 },
    { id: 'mustache', label: 'Schnurrbart', emoji: '🥸', pts: 18 },
    { id: 'star', label: 'Glitzer', emoji: '✨', pts: 12 },
    { id: 'crown', label: 'Krone', emoji: '👑', pts: 35 },
  ]

  const look = {
    lipstick: false,
    blush: false,
    glasses: false,
    hat: false,
    bow: false,
    mustache: false,
    star: false,
    crown: false,
  }

  function resetLook() {
    for (const k of Object.keys(look)) look[k] = false
    score = 0
    scoreEl.textContent = '0'
    selected = null
    sparkles = []
    updateTray()
  }

  function calcScore() {
    let s = 0
    for (const item of ITEMS) {
      if (look[item.id]) s += item.pts
    }
    // combo bonus
    const count = Object.values(look).filter(Boolean).length
    if (count >= 4) s += 25
    if (count >= 6) s += 40
    if (count === ITEMS.length) s += 80
    return s
  }

  function updateScore() {
    score = calcScore()
    scoreEl.textContent = String(score)
  }

  function updateTray() {
    tray.hidden = !running
    tray.innerHTML = ''
    for (const item of ITEMS) {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.textContent = `${item.emoji} ${item.label}`
      if (look[item.id]) btn.classList.add('active')
      if (selected === item.id) btn.style.outline = '2px solid #0090b0'
      btn.addEventListener('click', () => {
        selected = item.id
        updateTray()
      })
      tray.appendChild(btn)
    }
    const clearBtn = document.createElement('button')
    clearBtn.type = 'button'
    clearBtn.textContent = '🧹 Reset'
    clearBtn.addEventListener('click', () => {
      resetLook()
      running = true
      updateTray()
    })
    tray.appendChild(clearBtn)

    const doneBtn = document.createElement('button')
    doneBtn.type = 'button'
    doneBtn.textContent = '✅ Fertig'
    doneBtn.classList.add('active')
    doneBtn.addEventListener('click', finishLook)
    tray.appendChild(doneBtn)
  }

  function showOverlay(title, msg, btnLabel) {
    overlay.classList.remove('hidden')
    overlay.innerHTML = `
      <h1>${title}</h1>
      <p>${msg}</p>
      ${score > 0 ? `<div class="final-score">${score} Style-Punkte</div>` : ''}
      <button type="button" class="btn primary" id="start-btn">${btnLabel}</button>
    `
    document.getElementById('start-btn').addEventListener('click', startGame)
  }

  function startGame() {
    resetLook()
    overlay.classList.add('hidden')
    running = true
    updateTray()
    last = performance.now()
    requestAnimationFrame(loop)
  }

  function finishLook() {
    running = false
    tray.hidden = true
    if (score > best) {
      best = score
      localStorage.setItem(BEST_KEY, String(best))
      bestEl.textContent = String(best)
    }
    const count = Object.values(look).filter(Boolean).length
    const msg =
      count === 0
        ? 'Noch gar kein Look – versuch’s mit ein paar Accessoires!'
        : count >= 6
          ? 'Wow, was fuer ein Glamour-Splash!'
          : 'Suesser Look – Dr. Splash strahlt!'
    showOverlay('Look fertig!', msg, 'Nochmal schminken')
  }

  function applySelected() {
    if (!selected || !running) return
    const item = ITEMS.find((i) => i.id === selected)
    if (!item) return
    const wasOn = look[selected]
    look[selected] = !look[selected]
    if (look[selected] && !wasOn) {
      for (let i = 0; i < 10; i++) {
        sparkles.push({
          x: W / 2 + (Math.random() - 0.5) * 120,
          y: H * 0.42 + (Math.random() - 0.5) * 100,
          life: 0.6 + Math.random() * 0.4,
          vx: (Math.random() - 0.5) * 80,
          vy: -40 - Math.random() * 60,
        })
      }
    }
    updateScore()
    updateTray()
  }

  function drawBg() {
    const g = ctx.createLinearGradient(0, 0, 0, H)
    g.addColorStop(0, '#5a1a3a')
    g.addColorStop(0.5, '#2a1040')
    g.addColorStop(1, '#0d1a30')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, W, H)
    // vanity lights
    for (let i = 0; i < 8; i++) {
      const x = 30 + i * ((W - 60) / 7)
      ctx.fillStyle = i % 2 ? '#fff6a8' : '#ffe0f0'
      ctx.beginPath()
      ctx.arc(x, 28, 8, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = 'rgba(255,255,255,0.12)'
    ctx.fillRect(40, H - 120, W - 80, 14)
  }

  function drawMascot() {
    const cx = W / 2
    const cy = H * 0.48
    const mw = 220
    const mh = 260
    ctx.save()
    ctx.translate(cx, cy)
    if (mascot.complete && mascot.naturalWidth) {
      ctx.drawImage(mascot, -mw / 2, -mh / 2, mw, mh)
    } else {
      ctx.fillStyle = '#00c2e0'
      ctx.beginPath()
      ctx.ellipse(0, 10, 70, 100, 0, 0, Math.PI * 2)
      ctx.fill()
    }

    // blush
    if (look.blush) {
      ctx.fillStyle = 'rgba(255, 120, 160, 0.45)'
      ctx.beginPath()
      ctx.ellipse(-38, 10, 18, 12, 0, 0, Math.PI * 2)
      ctx.ellipse(38, 10, 18, 12, 0, 0, Math.PI * 2)
      ctx.fill()
    }

    // lipstick
    if (look.lipstick) {
      ctx.strokeStyle = '#e6395a'
      ctx.lineWidth = 5
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.ellipse(0, 42, 16, 8, 0, 0.15, Math.PI - 0.15)
      ctx.stroke()
      ctx.fillStyle = 'rgba(230, 57, 90, 0.35)'
      ctx.beginPath()
      ctx.ellipse(0, 42, 14, 7, 0, 0, Math.PI * 2)
      ctx.fill()
    }

    // mustache
    if (look.mustache) {
      ctx.fillStyle = '#3a2a1a'
      ctx.beginPath()
      ctx.ellipse(-14, 28, 16, 7, -0.3, 0, Math.PI * 2)
      ctx.ellipse(14, 28, 16, 7, 0.3, 0, Math.PI * 2)
      ctx.fill()
    }

    // glasses
    if (look.glasses) {
      ctx.strokeStyle = '#1a1a2e'
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.arc(-28, -8, 22, 0, Math.PI * 2)
      ctx.arc(28, -8, 22, 0, Math.PI * 2)
      ctx.moveTo(-6, -8)
      ctx.lineTo(6, -8)
      ctx.moveTo(-50, -8)
      ctx.lineTo(-62, -12)
      ctx.moveTo(50, -8)
      ctx.lineTo(62, -12)
      ctx.stroke()
      ctx.fillStyle = 'rgba(120, 200, 255, 0.2)'
      ctx.beginPath()
      ctx.arc(-28, -8, 20, 0, Math.PI * 2)
      ctx.arc(28, -8, 20, 0, Math.PI * 2)
      ctx.fill()
    }

    // bow
    if (look.bow) {
      ctx.fillStyle = '#ff4d8d'
      ctx.beginPath()
      ctx.moveTo(-36, 78)
      ctx.lineTo(-8, 70)
      ctx.lineTo(-8, 90)
      ctx.closePath()
      ctx.moveTo(36, 78)
      ctx.lineTo(8, 70)
      ctx.lineTo(8, 90)
      ctx.closePath()
      ctx.fill()
      ctx.beginPath()
      ctx.arc(0, 80, 8, 0, Math.PI * 2)
      ctx.fill()
    }

    // hat
    if (look.hat) {
      ctx.fillStyle = '#1a1a2e'
      ctx.fillRect(-55, -118, 110, 12)
      ctx.fillRect(-32, -158, 64, 42)
      ctx.fillStyle = '#00c2e0'
      ctx.fillRect(-32, -125, 64, 8)
    }

    // crown
    if (look.crown) {
      ctx.fillStyle = '#f5b800'
      ctx.beginPath()
      ctx.moveTo(-40, -110)
      ctx.lineTo(-40, -145)
      ctx.lineTo(-20, -125)
      ctx.lineTo(0, -155)
      ctx.lineTo(20, -125)
      ctx.lineTo(40, -145)
      ctx.lineTo(40, -110)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = '#ff4d8d'
      ctx.beginPath()
      ctx.arc(0, -140, 5, 0, Math.PI * 2)
      ctx.fill()
    }

    // glitter stars
    if (look.star) {
      ctx.fillStyle = '#fff6a8'
      const pts = [
        [-70, -40],
        [72, -50],
        [-60, 60],
        [65, 50],
        [0, -90],
      ]
      for (const [sx, sy] of pts) {
        ctx.font = '18px Nunito, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('✨', sx, sy)
      }
    }

    ctx.restore()
  }

  function drawSparkles(dt) {
    sparkles = sparkles.filter((s) => s.life > 0)
    for (const s of sparkles) {
      s.life -= dt
      s.x += s.vx * dt
      s.y += s.vy * dt
      ctx.globalAlpha = Math.max(0, s.life)
      ctx.font = '16px Nunito, sans-serif'
      ctx.fillText('✨', s.x, s.y)
      ctx.globalAlpha = 1
    }
  }

  function drawHint() {
    if (!running) return
    ctx.fillStyle = 'rgba(255,255,255,0.9)'
    ctx.font = '700 15px Nunito, sans-serif'
    ctx.textAlign = 'center'
    const tip = selected
      ? `Tippe auf Dr. Splash fuer: ${ITEMS.find((i) => i.id === selected)?.label || ''}`
      : 'Waehle unten ein Accessoire'
    ctx.fillText(tip, W / 2, H - 40)
  }

  function draw(dt) {
    drawBg()
    drawMascot()
    drawSparkles(dt)
    drawHint()
  }

  function loop(now) {
    if (!running) {
      draw(0)
      return
    }
    const dt = Math.min(0.033, (now - last) / 1000)
    last = now
    draw(dt)
    requestAnimationFrame(loop)
  }

  canvas.addEventListener('pointerdown', () => {
    if (running) applySelected()
  })

  startBtn.addEventListener('click', startGame)
  draw(0)
})()
