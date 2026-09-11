(() => {
  const loginPanel = document.getElementById('login-panel')
  const modPanel = document.getElementById('mod-panel')
  const loginForm = document.getElementById('login-form')
  const loginStatus = document.getElementById('login-status')
  const adminList = document.getElementById('admin-list')
  const logoutBtn = document.getElementById('logout-btn')
  let filter = 'all'

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
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

  async function checkAuth() {
    const res = await fetch('/api/admin/me', { credentials: 'include' })
    return res.ok
  }

  function showApp(authed) {
    loginPanel?.classList.toggle('hidden', authed)
    modPanel?.classList.toggle('hidden', !authed)
    logoutBtn?.classList.toggle('hidden', !authed)
  }

  async function loadList() {
    if (!adminList) return
    adminList.innerHTML = '<p class="muted">Lade…</p>'
    const q = filter === 'all' ? '' : `?status=${encodeURIComponent(filter)}`
    const res = await fetch(`/api/admin/feedback${q}`, { credentials: 'include' })
    if (res.status === 401) {
      showApp(false)
      return
    }
    const data = await res.json()
    const items = data.feedback || []
    if (!items.length) {
      adminList.innerHTML = '<p class="muted">Keine Eintraege in diesem Filter.</p>'
      return
    }
    adminList.innerHTML = items
      .map(
        (f) => `
      <article class="admin-card" data-id="${f.id}">
        <div class="top">
          <strong>${escapeHtml(f.name || 'Anonym')}</strong>
          <span class="badge ${escapeHtml(f.status)}">${escapeHtml(f.status)}</span>
        </div>
        <p>${escapeHtml(f.message)}</p>
        <div class="meta muted">
          ${f.rating ? `★ ${f.rating}/5 · ` : ''}${escapeHtml(formatDate(f.created_at))} · #${f.id}
        </div>
        <div class="admin-actions">
          <button type="button" class="btn ok small" data-action="approve">Freigeben</button>
          <button type="button" class="btn warn small" data-action="reject">Ablehnen</button>
          <button type="button" class="btn danger small" data-action="delete">Loeschen</button>
        </div>
      </article>`
      )
      .join('')
  }

  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault()
    if (!loginStatus) return
    loginStatus.className = 'form-status'
    loginStatus.textContent = 'Pruefe…'
    const fd = new FormData(loginForm)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password: fd.get('password') }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Login fehlgeschlagen')
      loginStatus.className = 'form-status ok'
      loginStatus.textContent = 'Willkommen!'
      showApp(true)
      await loadList()
    } catch (err) {
      loginStatus.className = 'form-status err'
      loginStatus.textContent = err.message || 'Login fehlgeschlagen'
    }
  })

  logoutBtn?.addEventListener('click', async () => {
    await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' })
    showApp(false)
  })

  document.querySelectorAll('.chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.chip').forEach((c) => c.classList.remove('active'))
      chip.classList.add('active')
      filter = chip.dataset.filter || 'all'
      loadList()
    })
  })

  adminList?.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-action]')
    if (!btn) return
    const card = btn.closest('[data-id]')
    const id = card?.dataset.id
    const action = btn.dataset.action
    if (!id || !action) return

    let url = `/api/admin/feedback/${id}`
    let method = 'POST'
    if (action === 'approve') url += '/approve'
    else if (action === 'reject') url += '/reject'
    else if (action === 'delete') {
      method = 'DELETE'
      if (!confirm('Diesen Eintrag wirklich loeschen?')) return
    }

    const res = await fetch(url, { method, credentials: 'include' })
    if (res.status === 401) {
      showApp(false)
      return
    }
    await loadList()
  })

  ;(async () => {
    try {
      const ok = await checkAuth()
      showApp(ok)
      if (ok) await loadList()
    } catch {
      showApp(false)
    }
  })()
})()
