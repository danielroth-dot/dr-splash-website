(() => {
  const canvas = document.getElementById('game')
  const ctx = canvas.getContext('2d')
  const overlay = document.getElementById('overlay')
  const startBtn = document.getElementById('start-btn')
  const scoreEl = document.getElementById('score')
  const bestEl = document.getElementById('best')
  const W = canvas.width
  const H = canvas.height
  const BEST_KEY = 'drsplash-splashjump-best'

  const mascot = new Image()
  mascot.src = '/assets/dr-splash.png'

  let running = false
  let score = 0
  let best = Number(localStorage.getItem(BEST_KEY) || 0)
  bestEl.textContent = String(best)

  const G = 1600
  const JUMP = -620
  const player = { x: W / 2, y: H - 120, w: 48, h: 64, vx: 0, vy: 0 }
  let platforms = []
  let camera = 0
  let maxHeight = 0
  let last = 0
  const keys = { left: false, right: false }
  let tilt = 0
  let pointerX = null

  function makePlatform(y, forceX) {
    const w = 70 + Math.random() * 50
    const x = forceX != null ? forceX : 20 + Math.random() * (W - w - 40)
    const kind = Math.random() < 0.12 ? 'boost' : 'normal'
    return { x, y, w, h: 14, kind }
  }

  function reset() {
    platforms = []
    camera = 0
    maxHeight = 0
    score = 0
    scoreEl.textContent = '0'
    player.x = W / 2
    player.y = H - 140
    player.vx = 0
    player.vy = 0
    platforms.push({ x: W / 2 - 50, y: H - 60, w: 100, h: 14, kind: 'normal' })
    let y = H - 140
    while (y > -H) {
      y -= 70 + Math.random() * 45
      platforms.push(makePlatform(y))
    }
  }

  function showOverlay(title, msg, btnLabel) {
    overlay.classList.remove('hidden')
    overlay.innerHTML = `
      <h1>${title}</h1>
      <p>${msg}</p>
      ${score > 0 ? `<div class="final-score">${score} m</div>` : ''}
      <button type="button" class="btn primary" id="start-btn">${btnLabel}</button>
    `
    document.getElementById('start-btn').addEventListener('click', startGame)
  }

  function startGame() {
    reset()
    overlay.classList.add('hidden')
    running = true
    last = performance.now()
    requestAnimationFrame(loop)
  }

  function update(dt) {
    let ax = 0
    if (keys.left) ax -= 1
    if (keys.right) ax += 1
    if (pointerX !== null) {
      const dx = pointerX - player.x
      if (Math.abs(dx) > 8) ax = Math.sign(dx)
    }
    ax += tilt

    player.vx += ax * 2200 * dt
    player.vx *= Math.pow(0.88, dt * 60)
    player.vx = Math.max(-340, Math.min(340, player.vx))
    player.vy += G * dt
    player.x += player.vx * dt
    player.y += player.vy * dt

    // wrap horizontally
    if (player.x < -20) player.x = W + 20
    if (player.x > W + 20) player.x = -20

    // platform collisions (only when falling)
    if (player.vy > 0) {
      const footY = player.y + player.h / 2
      for (const p of platforms) {
        const top = p.y
        if (
          footY >= top &&
          footY <= top + p.h + 10 &&
          player.x + player.w * 0.28 > p.x &&
          player.x - player.w * 0.28 < p.x + p.w &&
          player.y + player.h / 2 - player.vy * dt <= top + 4
        ) {
          player.y = top - player.h / 2
          player.vy = p.kind === 'boost' ? JUMP * 1.35 : JUMP
          if (p.kind === 'boost') {
            score += 15
            scoreEl.textContent = String(score)
          }
        }
      }
    }

    // camera follows upward
    const focus = player.y - H * 0.4
    if (focus < camera) camera = focus

    const height = Math.max(0, Math.floor((H - 140 - player.y) / 10))
    if (height > maxHeight) {
      maxHeight = height
      score = Math.max(score, maxHeight)
      scoreEl.textContent = String(score)
    }

    // recycle platforms
    const viewTop = camera - 40
    const viewBottom = camera + H + 80
    platforms = platforms.filter((p) => p.y < viewBottom + 200)
    let highest = platforms.reduce((m, p) => Math.min(m, p.y), Infinity)
    while (highest > viewTop - 80) {
      highest -= 70 + Math.random() * 50
      platforms.push(makePlatform(highest))
    }

    // fall death
    if (player.y - camera > H + 40) {
      gameOver()
    }
  }

  function gameOver() {
    running = false
    if (score > best) {
      best = score
      localStorage.setItem(BEST_KEY, String(best))
      bestEl.textContent = String(best)
    }
    showOverlay('Absturz!', 'Dr. Splash ist runtergefallen. Hoeher naechstes Mal!', 'Nochmal')
  }

  function drawBg() {
    const g = ctx.createLinearGradient(0, 0, 0, H)
    g.addColorStop(0, '#7ec8ff')
    g.addColorStop(0.55, '#b8ecff')
    g.addColorStop(1, '#e8fff8')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, W, H)

    // soft clouds in screen space
    ctx.fillStyle = 'rgba(255,255,255,0.45)'
    for (let i = 0; i < 5; i++) {
      const cy = ((i * 160 - camera * 0.15) % (H + 80) + H + 80) % (H + 80) - 40
      const cx = (i * 97 + 40) % W
      ctx.beginPath()
      ctx.ellipse(cx, cy, 48, 18, 0, 0, Math.PI * 2)
      ctx.ellipse(cx + 28, cy + 4, 34, 14, 0, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  function drawPlatforms() {
    for (const p of platforms) {
      const sy = p.y - camera
      if (sy < -40 || sy > H + 40) continue
      ctx.save()
      ctx.translate(p.x, sy)
      const grad = ctx.createLinearGradient(0, 0, 0, p.h)
      if (p.kind === 'boost') {
        grad.addColorStop(0, '#ffe08a')
        grad.addColorStop(1, '#ff9f1a')
      } else {
        grad.addColorStop(0, '#5ee0ff')
        grad.addColorStop(1, '#1a6cff')
      }
      ctx.fillStyle = grad
      roundRect(0, 0, p.w, p.h, 8)
      ctx.fill()
      ctx.fillStyle = 'rgba(255,255,255,0.45)'
      ctx.fillRect(6, 3, p.w - 12, 3)
      if (p.kind === 'boost') {
        ctx.fillStyle = '#fff'
        ctx.font = 'bold 12px Nunito, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('↑', p.w / 2, 11)
      }
      ctx.restore()
    }
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.arcTo(x + w, y, x + w, y + h, r)
    ctx.arcTo(x + w, y + h, x, y + h, r)
    ctx.arcTo(x, y + h, x, y, r)
    ctx.arcTo(x, y, x + w, y, r)
    ctx.closePath()
  }

  function drawPlayer() {
    const sx = player.x
    const sy = player.y - camera
    ctx.save()
    ctx.translate(sx, sy)
    const lean = Math.max(-0.25, Math.min(0.25, player.vx / 500))
    ctx.rotate(lean)
    // shadow
    ctx.fillStyle = 'rgba(0,60,100,0.18)'
    ctx.beginPath()
    ctx.ellipse(0, player.h / 2 - 2, 18, 6, 0, 0, Math.PI * 2)
    ctx.fill()
    if (mascot.complete && mascot.naturalWidth) {
      ctx.drawImage(mascot, -player.w / 2, -player.h / 2, player.w, player.h)
    } else {
      ctx.fillStyle = '#00c2e0'
      ctx.fillRect(-18, -28, 36, 56)
    }
    ctx.restore()
  }

  function draw() {
    drawBg()
    drawPlatforms()
    drawPlayer()
  }

  function loop(now) {
    if (!running) return
    const dt = Math.min(0.033, (now - last) / 1000)
    last = now
    update(dt)
    draw()
    if (running) requestAnimationFrame(loop)
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = true
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = true
  })
  window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false
  })

  const stage = document.getElementById('stage')
  function setPointer(clientX) {
    const rect = canvas.getBoundingClientRect()
    pointerX = ((clientX - rect.left) / rect.width) * W
  }
  stage.addEventListener('pointerdown', (e) => {
    stage.setPointerCapture(e.pointerId)
    setPointer(e.clientX)
  })
  stage.addEventListener('pointermove', (e) => {
    if (pointerX !== null) setPointer(e.clientX)
  })
  stage.addEventListener('pointerup', () => { pointerX = null })
  stage.addEventListener('pointercancel', () => { pointerX = null })

  if (window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientation', (e) => {
      if (e.gamma == null) return
      tilt = Math.max(-1, Math.min(1, e.gamma / 25))
    })
  }

  startBtn.addEventListener('click', startGame)
  drawBg()
})()
