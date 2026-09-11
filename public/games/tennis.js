(() => {
  const canvas = document.getElementById('game')
  const ctx = canvas.getContext('2d')
  const overlay = document.getElementById('overlay')
  const startBtn = document.getElementById('start-btn')
  const scoreEl = document.getElementById('score')
  const bestEl = document.getElementById('best')
  const W = canvas.width
  const H = canvas.height
  const BEST_KEY = 'drsplash-tennis-best'

  const mascot = new Image()
  mascot.src = '/assets/dr-splash-flat.png'

  let running = false
  let score = 0
  let lives = 3
  let best = Number(localStorage.getItem(BEST_KEY) || 0)
  bestEl.textContent = String(best)

  const keys = { left: false, right: false }
  let pointerX = null
  let last = 0

  const paddle = { x: W / 2, y: H - 70, w: 78, h: 56, speed: 380 }
  let ball = { x: W / 2, y: H / 2, r: 12, vx: 160, vy: -240 }
  let enemy = { x: W / 2, y: 80, w: 70, h: 14, speed: 210 }

  function resetBall(serveDown = false) {
    ball.x = W / 2
    ball.y = H / 2
    const dir = Math.random() < 0.5 ? -1 : 1
    ball.vx = dir * (150 + Math.random() * 80)
    ball.vy = serveDown ? 220 : -220 - Math.random() * 40
  }

  function reset() {
    score = 0
    lives = 3
    scoreEl.textContent = '0'
    paddle.x = W / 2
    enemy.x = W / 2
    resetBall(false)
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
    last = performance.now()
    requestAnimationFrame(loop)
  }

  function gameOver() {
    running = false
    if (score > best) {
      best = score
      localStorage.setItem(BEST_KEY, String(best))
      bestEl.textContent = String(best)
    }
    showOverlay('Aus!', 'Der Ball ist raus – naechste Runde?', 'Nochmal')
  }

  function update(dt) {
    let vx = 0
    if (keys.left) vx -= 1
    if (keys.right) vx += 1
    if (pointerX !== null) {
      const dx = pointerX - paddle.x
      if (Math.abs(dx) > 5) vx = Math.sign(dx)
    }
    paddle.x += vx * paddle.speed * dt
    paddle.x = Math.max(paddle.w / 2 + 8, Math.min(W - paddle.w / 2 - 8, paddle.x))

    // simple AI
    const target = ball.x + ball.vx * 0.12
    if (Math.abs(target - enemy.x) > 4) {
      enemy.x += Math.sign(target - enemy.x) * enemy.speed * dt
    }
    enemy.x = Math.max(enemy.w / 2 + 8, Math.min(W - enemy.w / 2 - 8, enemy.x))

    ball.x += ball.vx * dt
    ball.y += ball.vy * dt

    // walls
    if (ball.x < ball.r + 12) {
      ball.x = ball.r + 12
      ball.vx = Math.abs(ball.vx)
    }
    if (ball.x > W - ball.r - 12) {
      ball.x = W - ball.r - 12
      ball.vx = -Math.abs(ball.vx)
    }

    // enemy paddle
    if (
      ball.vy < 0 &&
      ball.y - ball.r < enemy.y + enemy.h / 2 &&
      ball.y + ball.r > enemy.y - enemy.h / 2 &&
      Math.abs(ball.x - enemy.x) < enemy.w / 2 + ball.r
    ) {
      ball.y = enemy.y + enemy.h / 2 + ball.r
      ball.vy = Math.abs(ball.vy) * 1.03
      ball.vx += (ball.x - enemy.x) * 3
    }

    // player paddle (Dr. Splash)
    const py = paddle.y - 8
    if (
      ball.vy > 0 &&
      ball.y + ball.r > py - paddle.h * 0.15 &&
      ball.y - ball.r < py + 10 &&
      Math.abs(ball.x - paddle.x) < paddle.w / 2 + ball.r
    ) {
      ball.y = py - paddle.h * 0.15 - ball.r
      const speed = Math.min(520, Math.hypot(ball.vx, ball.vy) * 1.04 + 8)
      const offset = (ball.x - paddle.x) / (paddle.w / 2)
      const angle = -Math.PI / 2 + offset * 0.7
      ball.vx = Math.cos(angle) * speed
      ball.vy = Math.sin(angle) * speed
      score += 10
      scoreEl.textContent = String(score)
    }

    // out top = point
    if (ball.y < -20) {
      score += 50
      scoreEl.textContent = String(score)
      enemy.speed = Math.min(340, enemy.speed + 8)
      resetBall(true)
    }

    // out bottom = lose life
    if (ball.y > H + 30) {
      lives--
      if (lives <= 0) {
        gameOver()
        return
      }
      resetBall(false)
    }

    // clamp ball speed
    const spd = Math.hypot(ball.vx, ball.vy)
    if (spd > 560) {
      ball.vx *= 560 / spd
      ball.vy *= 560 / spd
    }
  }

  function drawCourt() {
    const g = ctx.createLinearGradient(0, 0, 0, H)
    g.addColorStop(0, '#1a6b3a')
    g.addColorStop(1, '#0d3d22')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, W, H)

    ctx.strokeStyle = 'rgba(255,255,255,0.85)'
    ctx.lineWidth = 3
    ctx.strokeRect(16, 16, W - 32, H - 32)
    ctx.beginPath()
    ctx.moveTo(16, H / 2)
    ctx.lineTo(W - 16, H / 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(W / 2, H / 2, 36, 0, Math.PI * 2)
    ctx.stroke()
    // net
    ctx.fillStyle = 'rgba(255,255,255,0.35)'
    ctx.fillRect(20, H / 2 - 3, W - 40, 6)
  }

  function drawEnemy() {
    ctx.fillStyle = '#ff6b6b'
    ctx.beginPath()
    roundRect(enemy.x - enemy.w / 2, enemy.y - enemy.h / 2, enemy.w, enemy.h, 6)
    ctx.fill()
  }

  function drawPaddle() {
    ctx.save()
    ctx.translate(paddle.x, paddle.y)
    if (mascot.complete && mascot.naturalWidth) {
      ctx.drawImage(mascot, -paddle.w / 2, -paddle.h / 2, paddle.w, paddle.h)
    } else {
      ctx.fillStyle = '#00c2e0'
      ctx.fillRect(-paddle.w / 2, -20, paddle.w, 28)
    }
    // racket hint
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.ellipse(22, -18, 16, 12, 0.4, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(10, -8)
    ctx.lineTo(-4, 10)
    ctx.stroke()
    ctx.restore()
  }

  function drawBall() {
    ctx.save()
    ctx.translate(ball.x, ball.y)
    const grd = ctx.createRadialGradient(-3, -3, 2, 0, 0, ball.r)
    grd.addColorStop(0, '#e8ff8a')
    grd.addColorStop(1, '#9acc00')
    ctx.fillStyle = grd
    ctx.beginPath()
    ctx.arc(0, 0, ball.r, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = 'rgba(0,80,0,0.35)'
    ctx.beginPath()
    ctx.arc(0, 0, ball.r * 0.55, -0.8, 0.8)
    ctx.stroke()
    ctx.restore()
  }

  function drawLives() {
    ctx.fillStyle = 'rgba(255,255,255,0.92)'
    ctx.font = '800 16px Nunito, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('❤'.repeat(Math.max(0, lives)), 24, 40)
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

  function draw() {
    drawCourt()
    drawEnemy()
    drawPaddle()
    drawBall()
    drawLives()
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

  startBtn.addEventListener('click', startGame)
  draw()
})()
