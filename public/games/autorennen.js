(() => {
  const canvas = document.getElementById('game')
  const ctx = canvas.getContext('2d')
  const overlay = document.getElementById('overlay')
  const startBtn = document.getElementById('start-btn')
  const scoreEl = document.getElementById('score')
  const bestEl = document.getElementById('best')
  const W = canvas.width
  const H = canvas.height
  const BEST_KEY = 'drsplash-autorennen-best'

  const mascot = new Image()
  mascot.src = '/assets/dr-splash.png'

  let running = false
  let score = 0
  let best = Number(localStorage.getItem(BEST_KEY) || 0)
  bestEl.textContent = String(best)

  const keys = { left: false, right: false }
  let pointerX = null

  const state = {
    player: { x: W / 2, y: H - 110, w: 54, h: 72, speed: 320 },
    obstacles: [],
    coins: [],
    roadOffset: 0,
    speed: 280,
    spawnTimer: 0,
    coinTimer: 0,
    last: 0,
  }

  function reset() {
    state.player.x = W / 2
    state.obstacles = []
    state.coins = []
    state.roadOffset = 0
    state.speed = 280
    state.spawnTimer = 0.6
    state.coinTimer = 1.2
    score = 0
    scoreEl.textContent = '0'
  }

  function showOverlay(title, msg, btnLabel) {
    overlay.classList.remove('hidden')
    overlay.innerHTML = `
      <h1>${title}</h1>
      <p>${msg}</p>
      ${score > 0 ? `<div class="final-score">${score} Punkte</div>` : ''}
      <button type="button" class="btn primary" id="start-btn">${btnLabel}</button>
    `
    document.getElementById('start-btn').addEventListener('click', startGame)
  }

  function startGame() {
    reset()
    overlay.classList.add('hidden')
    running = true
    state.last = performance.now()
    requestAnimationFrame(loop)
  }

  function spawnObstacle() {
    const laneW = (W - 80) / 3
    const lane = Math.floor(Math.random() * 3)
    const x = 40 + lane * laneW + laneW / 2
    const kind = Math.random() < 0.55 ? 'cone' : 'rock'
    state.obstacles.push({
      x,
      y: -40,
      w: kind === 'cone' ? 34 : 42,
      h: kind === 'cone' ? 40 : 36,
      kind,
    })
  }

  function spawnCoin() {
    const x = 50 + Math.random() * (W - 100)
    state.coins.push({ x, y: -20, r: 12 })
  }

  function update(dt) {
    state.speed = Math.min(520, 280 + score * 0.35)
    state.roadOffset = (state.roadOffset + state.speed * dt) % 60

    let vx = 0
    if (keys.left) vx -= 1
    if (keys.right) vx += 1
    if (pointerX !== null) {
      const dx = pointerX - state.player.x
      if (Math.abs(dx) > 6) vx = Math.sign(dx)
    }
    state.player.x += vx * state.player.speed * dt
    state.player.x = Math.max(46, Math.min(W - 46, state.player.x))

    state.spawnTimer -= dt
    if (state.spawnTimer <= 0) {
      spawnObstacle()
      state.spawnTimer = Math.max(0.45, 1.1 - score * 0.004)
    }
    state.coinTimer -= dt
    if (state.coinTimer <= 0) {
      spawnCoin()
      state.coinTimer = 1.1 + Math.random() * 0.9
    }

    const py = state.player.y
    const pw = state.player.w * 0.55
    const ph = state.player.h * 0.55

    for (const o of state.obstacles) {
      o.y += state.speed * dt
      if (
        Math.abs(o.x - state.player.x) < (o.w + pw) / 2 &&
        Math.abs(o.y - py) < (o.h + ph) / 2
      ) {
        gameOver()
        return
      }
    }
    state.obstacles = state.obstacles.filter((o) => o.y < H + 50)

    for (const c of state.coins) {
      c.y += state.speed * dt
      const dx = c.x - state.player.x
      const dy = c.y - py
      if (dx * dx + dy * dy < (c.r + 24) ** 2) {
        c.got = true
        score += 25
        scoreEl.textContent = String(Math.floor(score))
      }
    }
    state.coins = state.coins.filter((c) => !c.got && c.y < H + 40)

    score += dt * 12
    scoreEl.textContent = String(Math.floor(score))
  }

  function gameOver() {
    running = false
    const final = Math.floor(score)
    if (final > best) {
      best = final
      localStorage.setItem(BEST_KEY, String(best))
      bestEl.textContent = String(best)
    }
    showOverlay('Crash!', 'Dr. Splash braucht einen Neustart. Versuch’s nochmal!', 'Nochmal')
  }

  function drawRoad() {
    const g = ctx.createLinearGradient(0, 0, 0, H)
    g.addColorStop(0, '#1a4a2e')
    g.addColorStop(1, '#0d2a1a')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, W, H)

    ctx.fillStyle = '#2a3340'
    ctx.fillRect(30, 0, W - 60, H)

    ctx.strokeStyle = '#f0c040'
    ctx.lineWidth = 6
    ctx.setLineDash([])
    ctx.beginPath()
    ctx.moveTo(36, 0)
    ctx.lineTo(36, H)
    ctx.moveTo(W - 36, 0)
    ctx.lineTo(W - 36, H)
    ctx.stroke()

    ctx.strokeStyle = 'rgba(255,255,255,0.85)'
    ctx.lineWidth = 4
    ctx.setLineDash([28, 32])
    ctx.lineDashOffset = -state.roadOffset
    ctx.beginPath()
    ctx.moveTo(W / 2, 0)
    ctx.lineTo(W / 2, H)
    ctx.stroke()
    ctx.setLineDash([])
  }

  function drawPlayer() {
    const p = state.player
    ctx.save()
    ctx.translate(p.x, p.y)
    if (mascot.complete && mascot.naturalWidth) {
      ctx.drawImage(mascot, -p.w / 2, -p.h / 2, p.w, p.h)
    } else {
      ctx.fillStyle = '#00c2e0'
      ctx.fillRect(-18, -28, 36, 56)
    }
    // little car shadow / wheels hint
    ctx.fillStyle = 'rgba(0,0,0,0.25)'
    ctx.beginPath()
    ctx.ellipse(0, p.h / 2 - 4, 22, 6, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  function drawObstacle(o) {
    ctx.save()
    ctx.translate(o.x, o.y)
    if (o.kind === 'cone') {
      ctx.fillStyle = '#ff7a1a'
      ctx.beginPath()
      ctx.moveTo(0, -o.h / 2)
      ctx.lineTo(o.w / 2, o.h / 2)
      ctx.lineTo(-o.w / 2, o.h / 2)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = '#fff'
      ctx.fillRect(-o.w / 5, -2, (o.w * 2) / 5, 8)
    } else {
      ctx.fillStyle = '#6b7280'
      ctx.beginPath()
      ctx.ellipse(0, 0, o.w / 2, o.h / 2, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#9ca3af'
      ctx.beginPath()
      ctx.ellipse(-4, -4, 8, 6, 0, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  }

  function drawCoin(c) {
    ctx.save()
    ctx.translate(c.x, c.y)
    const grd = ctx.createRadialGradient(-3, -3, 2, 0, 0, c.r)
    grd.addColorStop(0, '#fff6a8')
    grd.addColorStop(1, '#f5b800')
    ctx.fillStyle = grd
    ctx.beginPath()
    ctx.arc(0, 0, c.r, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#00c2e0'
    ctx.font = 'bold 12px Nunito, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('💧', 0, 1)
    ctx.restore()
  }

  function draw() {
    drawRoad()
    for (const c of state.coins) drawCoin(c)
    for (const o of state.obstacles) drawObstacle(o)
    drawPlayer()
  }

  function loop(now) {
    if (!running) return
    const dt = Math.min(0.033, (now - state.last) / 1000)
    state.last = now
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

  startBtn.addEventListener('click', startGame)
  drawRoad()
})()
