(() => {
  const canvas = document.getElementById('game')
  const ctx = canvas.getContext('2d')
  const overlay = document.getElementById('overlay')
  const startBtn = document.getElementById('start-btn')
  const scoreEl = document.getElementById('score')
  const bestEl = document.getElementById('best')
  const W = canvas.width
  const H = canvas.height
  const BEST_KEY = 'drsplash-flipper-best'

  const mascot = new Image()
  mascot.src = '/assets/dr-splash-flat.png'

  let running = false
  let score = 0
  let best = Number(localStorage.getItem(BEST_KEY) || 0)
  bestEl.textContent = String(best)

  const G = 980
  const ballR = 16

  const leftFlip = { x: 110, y: H - 90, len: 78, angle: 0.45, target: 0.45, up: -0.75 }
  const rightFlip = { x: W - 110, y: H - 90, len: 78, angle: Math.PI - 0.45, target: Math.PI - 0.45, up: Math.PI + 0.75 }

  const bumpers = [
    { x: W / 2, y: 170, r: 28, pts: 50, flash: 0 },
    { x: 110, y: 250, r: 22, pts: 30, flash: 0 },
    { x: W - 110, y: 250, r: 22, pts: 30, flash: 0 },
    { x: W / 2, y: 330, r: 20, pts: 40, flash: 0 },
  ]

  let ball = { x: W / 2, y: 120, vx: 80, vy: 0 }
  let last = 0
  let leftDown = false
  let rightDown = false

  function resetBall() {
    ball = { x: W - 48, y: H - 200, vx: 0, vy: 0 }
    // launch up the plunger lane
    ball.vx = -40 - Math.random() * 40
    ball.vy = -520 - Math.random() * 80
    score = 0
    scoreEl.textContent = '0'
    for (const b of bumpers) b.flash = 0
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
    resetBall()
    overlay.classList.add('hidden')
    running = true
    last = performance.now()
    requestAnimationFrame(loop)
  }

  function flipperTip(f) {
    return {
      x: f.x + Math.cos(f.angle) * f.len,
      y: f.y + Math.sin(f.angle) * f.len,
    }
  }

  function collideFlipper(f, rising) {
    const tip = flipperTip(f)
    const dx = tip.x - f.x
    const dy = tip.y - f.y
    const len = Math.hypot(dx, dy) || 1
    const nx = -dy / len
    const ny = dx / len
    // project ball onto flipper segment
    const bx = ball.x - f.x
    const by = ball.y - f.y
    let t = (bx * dx + by * dy) / (len * len)
    t = Math.max(0, Math.min(1, t))
    const cx = f.x + dx * t
    const cy = f.y + dy * t
    const ox = ball.x - cx
    const oy = ball.y - cy
    const dist = Math.hypot(ox, oy)
    if (dist >= ballR + 6) return

    // push out
    const push = ballR + 6 - dist
    const oxn = ox / (dist || 1)
    const oyn = oy / (dist || 1)
    ball.x += oxn * push
    ball.y += oyn * push

    // reflect velocity
    let vn = ball.vx * oxn + ball.vy * oyn
    if (vn < 0) {
      ball.vx -= 2 * vn * oxn
      ball.vy -= 2 * vn * oyn
    }
    if (rising) {
      const boost = 380 + Math.abs(f.angle - f.target) * 200
      ball.vx += oxn * boost * 0.15
      ball.vy -= boost
      score += 10
      scoreEl.textContent = String(score)
    } else {
      ball.vx *= 0.92
      ball.vy *= 0.92
    }
  }

  function update(dt) {
    leftFlip.target = leftDown ? leftFlip.up : 0.45
    rightFlip.target = rightDown ? rightFlip.up : Math.PI - 0.45

    const prevL = leftFlip.angle
    const prevR = rightFlip.angle
    leftFlip.angle += (leftFlip.target - leftFlip.angle) * Math.min(1, dt * 18)
    rightFlip.angle += (rightFlip.target - rightFlip.angle) * Math.min(1, dt * 18)
    const risingL = leftFlip.angle < prevL - 0.01
    const risingR = rightFlip.angle > prevR + 0.01

    ball.vy += G * dt
    ball.x += ball.vx * dt
    ball.y += ball.vy * dt

    // walls
    if (ball.x < ballR + 18) {
      ball.x = ballR + 18
      ball.vx = Math.abs(ball.vx) * 0.85
    }
    if (ball.x > W - ballR - 18) {
      ball.x = W - ballR - 18
      ball.vx = -Math.abs(ball.vx) * 0.85
    }
    if (ball.y < ballR + 18) {
      ball.y = ballR + 18
      ball.vy = Math.abs(ball.vy) * 0.8
    }

    // slanted shoulders near top
    // drain
    if (ball.y > H - 20) {
      gameOver()
      return
    }

    collideFlipper(leftFlip, risingL)
    collideFlipper(rightFlip, risingR)

    // bumpers
    for (const b of bumpers) {
      b.flash = Math.max(0, b.flash - dt)
      const dx = ball.x - b.x
      const dy = ball.y - b.y
      const dist = Math.hypot(dx, dy)
      const min = b.r + ballR
      if (dist < min && dist > 0) {
        const nx = dx / dist
        const ny = dy / dist
        ball.x = b.x + nx * min
        ball.y = b.y + ny * min
        const vn = ball.vx * nx + ball.vy * ny
        ball.vx -= 2.2 * vn * nx
        ball.vy -= 2.2 * vn * ny
        const speed = Math.hypot(ball.vx, ball.vy)
        if (speed < 280) {
          ball.vx += nx * 200
          ball.vy += ny * 200
        }
        score += b.pts
        scoreEl.textContent = String(score)
        b.flash = 0.25
      }
    }

    // side posts near flippers
    const posts = [
      { x: 52, y: H - 140, r: 14 },
      { x: W - 52, y: H - 140, r: 14 },
    ]
    for (const p of posts) {
      const dx = ball.x - p.x
      const dy = ball.y - p.y
      const dist = Math.hypot(dx, dy)
      const min = p.r + ballR
      if (dist < min && dist > 0) {
        const nx = dx / dist
        const ny = dy / dist
        ball.x = p.x + nx * min
        ball.y = p.y + ny * min
        const vn = ball.vx * nx + ball.vy * ny
        if (vn < 0) {
          ball.vx -= 1.8 * vn * nx
          ball.vy -= 1.8 * vn * ny
        }
      }
    }

    // soft damping
    ball.vx *= 0.999
    ball.vy *= 0.999
  }

  function gameOver() {
    running = false
    if (score > best) {
      best = score
      localStorage.setItem(BEST_KEY, String(best))
      bestEl.textContent = String(best)
    }
    showOverlay('Drain!', 'Die Kugel ist raus – Dr. Splash faellt durch. Nochmal?', 'Nochmal')
  }

  function drawTable() {
    const g = ctx.createLinearGradient(0, 0, 0, H)
    g.addColorStop(0, '#0a2a55')
    g.addColorStop(0.5, '#0d3a70')
    g.addColorStop(1, '#071830')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, W, H)

    // rails
    ctx.strokeStyle = '#7ae8ff'
    ctx.lineWidth = 10
    ctx.strokeRect(12, 12, W - 24, H - 24)

    ctx.fillStyle = 'rgba(0, 194, 224, 0.08)'
    ctx.beginPath()
    ctx.arc(W / 2, 200, 110, 0, Math.PI * 2)
    ctx.fill()

    // decorative arcs
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(W / 2, 40, 140, 0.15 * Math.PI, 0.85 * Math.PI)
    ctx.stroke()
  }

  function drawBumpers() {
    for (const b of bumpers) {
      ctx.save()
      ctx.translate(b.x, b.y)
      const glow = b.flash > 0 ? 1 : 0
      ctx.beginPath()
      ctx.arc(0, 0, b.r + 4, 0, Math.PI * 2)
      ctx.fillStyle = glow ? 'rgba(255, 200, 80, 0.55)' : 'rgba(0, 194, 224, 0.25)'
      ctx.fill()
      ctx.beginPath()
      ctx.arc(0, 0, b.r, 0, Math.PI * 2)
      ctx.fillStyle = glow ? '#ffd060' : '#00c2e0'
      ctx.fill()
      if (mascot.complete && mascot.naturalWidth) {
        const s = b.r * 1.35
        ctx.drawImage(mascot, -s / 2, -s / 2, s, s)
      }
      ctx.restore()
    }
  }

  function drawFlipper(f, mirror) {
    ctx.save()
    ctx.translate(f.x, f.y)
    ctx.rotate(f.angle)
    ctx.fillStyle = '#e8f4ff'
    ctx.strokeStyle = '#1a6cff'
    ctx.lineWidth = 3
    const h = 14
    ctx.beginPath()
    ctx.moveTo(0, -h / 2)
    ctx.lineTo(f.len - 8, -h / 3)
    ctx.lineTo(f.len, 0)
    ctx.lineTo(f.len - 8, h / 3)
    ctx.lineTo(0, h / 2)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(0, 0, 10, 0, Math.PI * 2)
    ctx.fillStyle = '#00c2e0'
    ctx.fill()
    ctx.restore()
  }

  function drawBall() {
    ctx.save()
    ctx.translate(ball.x, ball.y)
    ctx.beginPath()
    ctx.arc(0, 0, ballR + 2, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(0,0,0,0.25)'
    ctx.fill()
    if (mascot.complete && mascot.naturalWidth) {
      ctx.drawImage(mascot, -ballR - 2, -ballR - 2, (ballR + 2) * 2, (ballR + 2) * 2)
    } else {
      ctx.beginPath()
      ctx.arc(0, 0, ballR, 0, Math.PI * 2)
      ctx.fillStyle = '#00c2e0'
      ctx.fill()
    }
    ctx.restore()
  }

  function drawPosts() {
    for (const p of [
      { x: 52, y: H - 140 },
      { x: W - 52, y: H - 140 },
    ]) {
      ctx.beginPath()
      ctx.arc(p.x, p.y, 14, 0, Math.PI * 2)
      ctx.fillStyle = '#1a6cff'
      ctx.fill()
      ctx.strokeStyle = '#7ae8ff'
      ctx.lineWidth = 3
      ctx.stroke()
    }
  }

  function draw() {
    drawTable()
    drawBumpers()
    drawPosts()
    drawFlipper(leftFlip)
    drawFlipper(rightFlip)
    drawBall()

    // drain hint
    ctx.fillStyle = 'rgba(255,80,80,0.35)'
    ctx.fillRect(W / 2 - 40, H - 18, 80, 10)
  }

  function loop(now) {
    if (!running) return
    const dt = Math.min(0.033, (now - last) / 1000)
    last = now
    // substeps for stability
    const steps = 2
    for (let i = 0; i < steps; i++) update(dt / steps)
    draw()
    if (running) requestAnimationFrame(loop)
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'z' || e.key === 'Z' || e.key === 'a' || e.key === 'A') leftDown = true
    if (e.key === 'ArrowRight' || e.key === '/' || e.key === 'd' || e.key === 'D' || e.key === 'x' || e.key === 'X') rightDown = true
  })
  window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'z' || e.key === 'Z' || e.key === 'a' || e.key === 'A') leftDown = false
    if (e.key === 'ArrowRight' || e.key === '/' || e.key === 'd' || e.key === 'D' || e.key === 'x' || e.key === 'X') rightDown = false
  })

  const stage = document.getElementById('stage')
  stage.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    if (x < rect.width / 2) leftDown = true
    else rightDown = true
  })
  stage.addEventListener('pointerup', () => { leftDown = false; rightDown = false })
  stage.addEventListener('pointercancel', () => { leftDown = false; rightDown = false })
  stage.addEventListener('pointerleave', () => { leftDown = false; rightDown = false })

  startBtn.addEventListener('click', startGame)
  drawTable()
  drawBumpers()
  drawPosts()
  drawFlipper(leftFlip)
  drawFlipper(rightFlip)
})()
