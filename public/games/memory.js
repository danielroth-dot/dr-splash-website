(() => {
  const canvas = document.getElementById('game')
  const ctx = canvas.getContext('2d')
  const overlay = document.getElementById('overlay')
  const startBtn = document.getElementById('start-btn')
  const scoreEl = document.getElementById('score')
  const bestEl = document.getElementById('best')
  const W = canvas.width
  const H = canvas.height
  const BEST_KEY = 'drsplash-memory-best'

  const mascot = new Image()
  mascot.src = '/assets/dr-splash-flat.png'

  const SYMBOLS = [
    { id: 'drop', emoji: '💧', color: '#00c2e0' },
    { id: 'bottle', emoji: '🧴', color: '#1a6cff' },
    { id: 'star', emoji: '⭐', color: '#f5b800' },
    { id: 'heart', emoji: '💙', color: '#5ad8ff' },
    { id: 'spark', emoji: '✨', color: '#7c5cff' },
    { id: 'wave', emoji: '🌊', color: '#0090b0' },
  ]

  let running = false
  let score = 0
  let moves = 0
  let matched = 0
  let best = Number(localStorage.getItem(BEST_KEY) || 0)
  bestEl.textContent = String(best)

  let cards = []
  let flipped = []
  let lock = false
  let cols = 3
  let rows = 4
  let cardW = 0
  let cardH = 0
  let gap = 12
  let originX = 0
  let originY = 0
  let last = 0

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
  }

  function layout() {
    const pad = 24
    gap = 12
    cardW = (W - pad * 2 - gap * (cols - 1)) / cols
    cardH = (H - pad * 2 - 60 - gap * (rows - 1)) / rows
    originX = pad
    originY = 50
  }

  function reset() {
    layout()
    const deck = []
    for (const s of SYMBOLS) {
      deck.push({ ...s })
      deck.push({ ...s })
    }
    shuffle(deck)
    cards = deck.map((s, i) => ({
      ...s,
      col: i % cols,
      row: Math.floor(i / cols),
      faceUp: false,
      matched: false,
      flip: 0,
    }))
    flipped = []
    lock = false
    moves = 0
    matched = 0
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
    last = performance.now()
    requestAnimationFrame(loop)
  }

  function cardRect(c) {
    return {
      x: originX + c.col * (cardW + gap),
      y: originY + c.row * (cardH + gap),
      w: cardW,
      h: cardH,
    }
  }

  function hitCard(mx, my) {
    for (const c of cards) {
      if (c.matched) continue
      const r = cardRect(c)
      if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) return c
    }
    return null
  }

  function flipCard(c) {
    if (!running || lock || c.matched || c.faceUp) return
    c.faceUp = true
    flipped.push(c)
    if (flipped.length === 2) {
      moves++
      lock = true
      const [a, b] = flipped
      if (a.id === b.id) {
        setTimeout(() => {
          a.matched = true
          b.matched = true
          matched += 2
          score += Math.max(50, 200 - moves * 5)
          scoreEl.textContent = String(score)
          flipped = []
          lock = false
          if (matched >= cards.length) win()
        }, 380)
      } else {
        setTimeout(() => {
          a.faceUp = false
          b.faceUp = false
          flipped = []
          lock = false
        }, 700)
      }
    }
  }

  function win() {
    running = false
    const bonus = Math.max(0, 400 - moves * 10)
    score += bonus
    scoreEl.textContent = String(score)
    if (score > best) {
      best = score
      localStorage.setItem(BEST_KEY, String(best))
      bestEl.textContent = String(best)
    }
    showOverlay('Geschafft!', `Alle Paare in ${moves} Zuegen gefunden!`, 'Nochmal')
  }

  function drawBg() {
    const g = ctx.createLinearGradient(0, 0, 0, H)
    g.addColorStop(0, '#2a1a5e')
    g.addColorStop(1, '#0d1a3a')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = 'rgba(255,255,255,0.9)'
    ctx.font = '800 18px Nunito, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`Zuege: ${moves}`, W / 2, 28)
  }

  function drawCard(c, now) {
    const r = cardRect(c)
    const target = c.faceUp || c.matched ? 1 : 0
    c.flip += (target - c.flip) * 0.22
    const scaleX = Math.max(0.08, Math.abs(Math.cos(c.flip * Math.PI)))
    const showingFront = c.flip > 0.5

    ctx.save()
    ctx.translate(r.x + r.w / 2, r.y + r.h / 2)
    ctx.scale(scaleX, 1)

    const rr = 14
    if (showingFront) {
      ctx.fillStyle = c.matched ? '#1a4a3a' : '#ffffff'
      roundRect(-r.w / 2, -r.h / 2, r.w, r.h, rr)
      ctx.fill()
      ctx.strokeStyle = c.color
      ctx.lineWidth = 3
      ctx.stroke()
      ctx.fillStyle = '#0b2340'
      ctx.font = `${Math.floor(r.h * 0.38)}px Nunito, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(c.emoji, 0, 2)
    } else {
      const g = ctx.createLinearGradient(-r.w / 2, -r.h / 2, r.w / 2, r.h / 2)
      g.addColorStop(0, '#00c2e0')
      g.addColorStop(1, '#1a6cff')
      ctx.fillStyle = g
      roundRect(-r.w / 2, -r.h / 2, r.w, r.h, rr)
      ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.55)'
      ctx.lineWidth = 2
      ctx.stroke()
      if (mascot.complete && mascot.naturalWidth) {
        const s = Math.min(r.w, r.h) * 0.55
        ctx.drawImage(mascot, -s / 2, -s / 2, s, s)
      } else {
        ctx.fillStyle = 'white'
        ctx.font = 'bold 28px Nunito, sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('💧', 0, 0)
      }
    }
    ctx.restore()
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

  function draw(now) {
    drawBg()
    for (const c of cards) drawCard(c, now)
  }

  function loop(now) {
    if (!running) {
      draw(now)
      return
    }
    last = now
    draw(now)
    requestAnimationFrame(loop)
  }

  function canvasPos(e) {
    const rect = canvas.getBoundingClientRect()
    const clientX = e.clientX ?? e.touches?.[0]?.clientX
    const clientY = e.clientY ?? e.touches?.[0]?.clientY
    return {
      x: ((clientX - rect.left) / rect.width) * W,
      y: ((clientY - rect.top) / rect.height) * H,
    }
  }

  canvas.addEventListener('pointerdown', (e) => {
    if (!running) return
    const p = canvasPos(e)
    const c = hitCard(p.x, p.y)
    if (c) flipCard(c)
  })

  startBtn.addEventListener('click', startGame)
  layout()
  reset()
  draw(0)
})()
