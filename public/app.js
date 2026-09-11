(() => {
  const yearEl = document.getElementById('year')
  if (yearEl) yearEl.textContent = String(new Date().getFullYear())

  // --- Mascot animations ---
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

  // Auto blink every few seconds
  setInterval(() => {
    if (Math.random() > 0.35) doBlink()
  }, 2800)

  // Soft ambient particle drip
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

  // --- Rating stars ---
  const stars = document.querySelectorAll('.stars button')
  const ratingInput = document.getElementById('rating-value')
  let currentRating = 0

  function paintStars(n) {
    stars.forEach((btn) => {
      const v = Number(btn.dataset.rating)
      btn.classList.toggle('on', v <= n)
    })
  }

  stars.forEach((btn) => {
    btn.addEventListener('click', () => {
      const v = Number(btn.dataset.rating)
      currentRating = currentRating === v ? 0 : v
      if (ratingInput) ratingInput.value = currentRating ? String(currentRating) : ''
      paintStars(currentRating)
    })
    btn.addEventListener('mouseenter', () => paintStars(Number(btn.dataset.rating)))
    btn.addEventListener('mouseleave', () => paintStars(currentRating))
  })

  // --- Feedback form ---
  const form = document.getElementById('feedback-form')
  const statusEl = document.getElementById('form-status')

  form?.addEventListener('submit', async (e) => {
    e.preventDefault()
    if (!statusEl) return
    statusEl.className = 'form-status'
    statusEl.textContent = 'Sende…'

    const fd = new FormData(form)
    const payload = {
      name: String(fd.get('name') || '').trim() || undefined,
      message: String(fd.get('message') || '').trim(),
      rating: fd.get('rating') ? Number(fd.get('rating')) : null,
    }

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Fehler beim Senden')
      statusEl.className = 'form-status ok'
      statusEl.textContent = data.message || 'Danke! Dein Feedback wartet auf Freigabe.'
      form.reset()
      currentRating = 0
      if (ratingInput) ratingInput.value = ''
      paintStars(0)
      spawnSplash()
    } catch (err) {
      statusEl.className = 'form-status err'
      statusEl.textContent = err.message || 'Etwas ist schiefgelaufen.'
    }
  })

  // --- Public approved list ---
  const list = document.getElementById('feedback-list')

  function starsText(n) {
    if (!n) return ''
    return '★'.repeat(n) + '☆'.repeat(5 - n)
  }

  function formatDate(iso) {
    try {
      return new Intl.DateTimeFormat('de-CH', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Europe/Zurich',
      }).format(new Date(iso + (iso.endsWith('Z') ? '' : 'Z')))
    } catch {
      return iso
    }
  }

  async function loadFeedback() {
    if (!list) return
    try {
      const res = await fetch('/api/feedback')
      const data = await res.json()
      const items = data.feedback || []
      if (!items.length) {
        list.innerHTML = '<p class="muted">Noch keine freigegebenen Stimmen – sei die erste Person!</p>'
        return
      }
      list.innerHTML = items
        .map(
          (f) => `
        <article class="feedback-card">
          <div class="meta">
            <span>${escapeHtml(f.name || 'Anonym')}</span>
            <span>${f.rating ? `<span class="stars-static">${starsText(f.rating)}</span> · ` : ''}${escapeHtml(formatDate(f.created_at))}</span>
          </div>
          <p>${escapeHtml(f.message)}</p>
        </article>`
        )
        .join('')
    } catch {
      list.innerHTML = '<p class="muted">Stimmen konnten nicht geladen werden.</p>'
    }
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }

  loadFeedback()
})()
