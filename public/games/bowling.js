(() => {
  const canvas = document.getElementById('game')
  const ctx = canvas.getContext('2d')
  const overlay = document.getElementById('overlay')
  const startBtn = document.getElementById('start-btn')
  const scoreEl = document.getElementById('score')
  const bestEl = document.getElementById('best')
  const W = canvas.width
  const H = canvas.height
  const BEST_KEY = 'drsplash-bowling-best'

  const mascot = new Image()
  mascot.src = '/assets/dr-splash.png'

  let running = false
  let score = 0
  let frames = 0
  let best = Number(localStorage.getItem(BEST_KEY) || 0)
  bestEl.textContent = String(best)

  const keys = { left: false, right: false }
  let phase = 'aim' // aim | rolling | settle | between
  let aimX = W / 2
  let ball = null
  let pins = []
  let last = 0
  let settleTimer = 0
  let throwsLeft = 2
  let framePinsDown = 0
  let totalFrames = 5
  let message = ''

  function makePins() {
    const rows = [
      [0],
      [-1, 1],
      [-2, 0, 2],
      [-3, -1, 1, 3],
    ]
    const pinsList = []
    const baseY = 130
    const spacingX = 34
    const spacingY = 38
    rows.forEach((row, ri) => {
      row.forEach((slot) => {
        pinsList.push({
          x: W / 2 + slot * (spacingX / 2),
          y: baseY + ri * spacingY,
          r: 14,
          vx: 0,
          vy: 0,
          down: false,
          rot: 0,
          vr: 0,
        })
      })
    })
    return pinsList
  }

  function resetFrame() {
    pins = makePins()
    ball = { x: aimX, y: H - 90, r: 22, vx: 0, vy: 0, rolling: false }
    phase = 'aim'
    throwsLeft = 2
    framePinsDown = 0
    message = `Frame ${frames + 1}/${totalFrames}`
  }

  function resetGame() {
    score = 0
    frames = 0
    scoreEl.textContent = '0'
    resetFrame()
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
    resetGame()
    overlay.classList.add('hidden')
    running = true
    last = performance.now()
    requestAnimationFrame(loop)
  }

  function launch() {
    if (phase !== 'aim' || !running) return
    ball.x = aimX
    ball.vx = (Math.random() - 0.5) * 40
    ball.vy = -520 - Math.random() * 40
    ball.rolling = true
    phase = 'rolling'
    throwsLeft--
  }

  function circleHit(a, b) {
    const dx = a.x - b.x
    const dy = a.y - b.y
    const dist = Math.hypot(dx, dy)
    const min = a.r + b.r
    if (dist >= min || dist === 0) return
    const nx = dx / dist
    const ny = dy / dist
    const overlap = min - dist
    // separate
    if (!a.down) {
      // ball pushes pin
    }
    b.x -= nx * overlap * 0.6
    b.y -= ny * overlap * 0.6
    a.x += nx * overlap * 0.4
    a.y += ny * overlap * 0.4
    // exchange velocity-ish
    const avx = a.vx ?? 0
    const avy = a.vy ?? 0
    const impact = Math.abs(avx * nx + avy * ny) + Math.abs((b.vx || 0) * nx + (b.vy || 0) * ny)
    b.vx += -nx * (180 + impact * 0.4)
    b.vy += -ny * (140 + impact * 0.3)
    b.vr = (Math.random() - 0.5) * 10
    a.vx *= 0.75
    a.vy *= 0.85
  }

  function update(dt) {
    if (phase === 'aim') {
      let vx = 0
      if (keys.left) vx -= 1
      if (keys.right) vx += 1
      aimX += vx * 260 * dt
      aimX = Math.max(50, Math.min(W - 50, aimX))
      ball.x = aimX
      return
    }

    if (phase === 'rolling' || phase === 'settle') {
      // ball
      if (ball.rolling) {
        ball.vy += 40 * dt
        ball.x += ball.vx * dt
        ball.y += ball.vy * dt
        ball.vx *= 0.995
        if (ball.x < ball.r + 20 || ball.x > W - ball.r - 20) {
          ball.vx *= -0.6
          ball.x = Math.max(ball.r + 20, Math.min(W - ball.r - 20, ball.x))
        }
        if (ball.y < 40) {
          ball.y = 40
          ball.vy *= -0.3
        }
        for (const p of pins) {
          if (p.down) continue
          const dx = ball.x - p.x
          const dy = ball.y - p.y
          const dist = Math.hypot(dx, dy)
          if (dist < ball.r + p.r) {
            circleHit(ball, p)
            const impact = Math.hypot(ball.vx, ball.vy)
            if (impact > 120) {
              p.vx += (p.x - ball.x) * 4
              p.vy += (p.y - ball.y) * 3 - 80
              p.vr = (Math.random() - 0.5) * 14
              if (impact > 200 || Math.hypot(p.vx, p.vy) > 100) {
                p.down = true
                score += 10
                framePinsDown++
                scoreEl.textContent = String(score)
              }
            }
          }
        }
        if (ball.y > H + 40 || Math.hypot(ball.vx, ball.vy) < 18) {
          ball.rolling = false
          phase = 'settle'
          settleTimer = 0.85
        }
      }

      // pins physics
      for (const p of pins) {
        if (p.down) continue
        p.vx *= 0.98
        p.vy *= 0.98
        p.x += p.vx * dt
        p.y += p.vy * dt
        p.rot += p.vr * dt
        if (Math.hypot(p.vx, p.vy) > 90 || Math.abs(p.vr) > 4) {
          // tipping
          if (Math.hypot(p.vx, p.vy) > 140) {
            p.down = true
            score += 10
            framePinsDown++
            scoreEl.textContent = String(score)
          }
        }
        // pin-pin
        for (const q of pins) {
          if (p === q || q.down) continue
          circleHit(p, q)
          if (Math.hypot(p.vx, p.vy) > 120) {
            // mark near-down
          }
        }
        // gutters / out of lane => down
        if (p.x < 30 || p.x > W - 30 || p.y < 50 || p.y > 340) {
          if (!p.down && Math.hypot(p.vx, p.vy) > 40) {
            p.down = true
            score += 10
            framePinsDown++
            scoreEl.textContent = String(score)
          }
        }
      }

      // also knock down if overlapping heavily after hit
      for (const p of pins) {
        if (p.down) continue
        if (Math.hypot(p.vx, p.vy) > 160) {
          p.down = true
          score += 10
          framePinsDown++
          scoreEl.textContent = String(score)
        }
      }

      if (phase === 'settle') {
        settleTimer -= dt
        if (settleTimer <= 0) endThrow()
      }
    }
  }

  function endThrow() {
    const standing = pins.filter((p) => !p.down).length
    if (standing === 0) {
      // strike or spare bonus
      if (throwsLeft === 1) {
        score += 30
        message = 'Strike!'
      } else {
        score += 15
        message = 'Spare!'
      }
      scoreEl.textContent = String(score)
      nextFrame()
      return
    }
    if (throwsLeft > 0) {
      ball = { x: aimX, y: H - 90, r: 22, vx: 0, vy: 0, rolling: false }
      phase = 'aim'
      message = `Noch ${throwsLeft} Wurf${throwsLeft > 1 ? 'e' : ''}`
    } else {
      nextFrame()
    }
  }

  function nextFrame() {
    frames++
    if (frames >= totalFrames) {
      running = false
      if (score > best) {
        best = score
        localStorage.setItem(BEST_KEY, String(best))
        bestEl.textContent = String(best)
      }
      showOverlay('Spiel vorbei!', 'Tolle Serie auf der Bahn!', 'Nochmal')
      return
    }
    resetFrame()
  }

  function drawLane() {
    const g = ctx.createLinearGradient(0, 0, 0, H)
    g.addColorStop(0, '#1a3048')
    g.addColorStop(1, '#0a1828')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, W, H)

    // wood lane
    ctx.fillStyle = '#c4a574'
    ctx.fillRect(40, 60, W - 80, H - 140)
    ctx.fillStyle = 'rgba(0,0,0,0.08)'
    for (let i = 0; i < 8; i++) {
      ctx.fillRect(40 + i * ((W - 80) / 8), 60, 2, H - 140)
    }
    // gutters
    ctx.fillStyle = '#2a3340'
    ctx.fillRect(20, 60, 20, H - 140)
    ctx.fillRect(W - 40, 60, 20, H - 140)
    // arrows
    ctx.fillStyle = 'rgba(40,80,120,0.35)'
    for (let i = 0; i < 5; i++) {
      const x = W / 2 + (i - 2) * 36
      ctx.beginPath()
      ctx.moveTo(x, H - 220)
      ctx.lineTo(x - 8, H - 200)
      ctx.lineTo(x + 8, H - 200)
      ctx.closePath()
      ctx.fill()
    }
  }

  function drawPin(p) {
    ctx.save()
    ctx.translate(p.x, p.y)
    ctx.rotate(p.down ? Math.PI / 2 + p.rot * 0.2 : p.rot * 0.15)
    if (p.down) ctx.globalAlpha = 0.45
    // bottle pin silhouette
    ctx.fillStyle = '#00c2e0'
    ctx.beginPath()
    ctx.ellipse(0, 4, 10, 16, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#1a6cff'
    ctx.fillRect(-7, -18, 14, 12)
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(-3, 0, 2.5, 0, Math.PI * 2)
    ctx.arc(3, 0, 2.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  function drawBall() {
    if (!ball) return
    ctx.save()
    ctx.translate(ball.x, ball.y)
    if (mascot.complete && mascot.naturalWidth) {
      ctx.drawImage(mascot, -ball.r - 4, -ball.r - 8, ball.r * 2 + 8, ball.r * 2 + 14)
    } else {
      ctx.fillStyle = '#00c2e0'
      ctx.beginPath()
      ctx.arc(0, 0, ball.r, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
    if (phase === 'aim') {
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'
      ctx.setLineDash([6, 8])
      ctx.beginPath()
      ctx.moveTo(aimX, ball.y - 20)
      ctx.lineTo(aimX + (Math.sin(performance.now() / 200) * 8), 160)
      ctx.stroke()
      ctx.setLineDash([])
    }
  }

  function drawHudMsg() {
    ctx.fillStyle = 'rgba(255,255,255,0.92)'
    ctx.font = '800 16px Nunito, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(message || `Frame ${frames + 1}/${totalFrames}`, W / 2, 36)
  }

  function draw() {
    drawLane()
    for (const p of pins) drawPin(p)
    drawBall()
    drawHudMsg()
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
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      launch()
    }
  })
  window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false
  })

  const stage = document.getElementById('stage')
  let dragging = false
  stage.addEventListener('pointerdown', (e) => {
    dragging = true
    stage.setPointerCapture(e.pointerId)
    const rect = canvas.getBoundingClientRect()
    aimX = ((e.clientX - rect.left) / rect.width) * W
    aimX = Math.max(50, Math.min(W - 50, aimX))
  })
  stage.addEventListener('pointermove', (e) => {
    if (!dragging || phase !== 'aim') return
    const rect = canvas.getBoundingClientRect()
    aimX = ((e.clientX - rect.left) / rect.width) * W
    aimX = Math.max(50, Math.min(W - 50, aimX))
  })
  stage.addEventListener('pointerup', () => {
    if (dragging && phase === 'aim') launch()
    dragging = false
  })

  startBtn.addEventListener('click', startGame)
  resetGame()
  draw()
})()
