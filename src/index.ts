import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'

type Bindings = {
  DB: D1Database
  ASSETS: Fetcher
  ADMIN_PASSWORD: string
}

type FeedbackRow = {
  id: number
  name: string | null
  message: string
  rating: number | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('/api/*', cors({ origin: (o) => o || '*', credentials: true }))

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let out = 0
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return out === 0
}

function isAdmin(
  c: { env: Bindings; req: { header: (n: string) => string | undefined } },
  cookieToken?: string
): boolean {
  const expected = c.env.ADMIN_PASSWORD || 'drsplash-admin'
  const auth = c.req.header('Authorization')
  if (auth?.startsWith('Bearer ')) {
    return timingSafeEqual(auth.slice(7), expected)
  }
  if (cookieToken) {
    return timingSafeEqual(cookieToken, expected)
  }
  return false
}

function isHttps(c: { req: { url: string } }): boolean {
  return new URL(c.req.url).protocol === 'https:'
}

async function ensureSchema(db: D1Database) {
  await db.batch([
    db.prepare(`
      CREATE TABLE IF NOT EXISTS feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        message TEXT NOT NULL,
        rating INTEGER CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_feedback_created ON feedback(created_at DESC)`),
  ])
}

app.get('/api/health', (c) => c.json({ ok: true, brand: 'Dr. Splash' }))

app.get('/api/feedback', async (c) => {
  await ensureSchema(c.env.DB)
  const { results } = await c.env.DB.prepare(
    `SELECT id, name, message, rating, created_at
     FROM feedback
     WHERE status = 'approved'
     ORDER BY created_at DESC
     LIMIT 100`
  ).all<Pick<FeedbackRow, 'id' | 'name' | 'message' | 'rating' | 'created_at'>>()
  return c.json({ feedback: results ?? [] })
})

app.post('/api/feedback', async (c) => {
  await ensureSchema(c.env.DB)
  let body: { name?: string; message?: string; rating?: number | null }
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Ungueltige Anfrage' }, 400)
  }

  const message = (body.message ?? '').trim()
  if (!message || message.length < 2) {
    return c.json({ error: 'Bitte eine Nachricht eingeben.' }, 400)
  }
  if (message.length > 2000) {
    return c.json({ error: 'Nachricht ist zu lang (max. 2000 Zeichen).' }, 400)
  }

  const name = (body.name ?? '').trim().slice(0, 80) || null
  let rating: number | null = null
  if (body.rating !== undefined && body.rating !== null) {
    const r = Number(body.rating)
    if (!Number.isInteger(r) || r < 1 || r > 5) {
      return c.json({ error: 'Bewertung muss zwischen 1 und 5 liegen.' }, 400)
    }
    rating = r
  }

  const result = await c.env.DB.prepare(
    `INSERT INTO feedback (name, message, rating, status) VALUES (?, ?, ?, 'pending')`
  )
    .bind(name, message, rating)
    .run()

  return c.json(
    {
      ok: true,
      id: result.meta.last_row_id,
      message: 'Danke! Dein Feedback wartet auf Freigabe.',
    },
    201
  )
})

app.post('/api/admin/login', async (c) => {
  let body: { password?: string }
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Ungueltige Anfrage' }, 400)
  }
  const expected = c.env.ADMIN_PASSWORD || 'drsplash-admin'
  if (!body.password || !timingSafeEqual(String(body.password), expected)) {
    return c.json({ error: 'Falsches Passwort' }, 401)
  }
  setCookie(c, 'dr_splash_admin', expected, {
    httpOnly: true,
    secure: isHttps(c),
    sameSite: 'Lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
  return c.json({ ok: true })
})

app.post('/api/admin/logout', (c) => {
  deleteCookie(c, 'dr_splash_admin', { path: '/' })
  return c.json({ ok: true })
})

app.get('/api/admin/me', (c) => {
  const token = getCookie(c, 'dr_splash_admin')
  if (!isAdmin(c, token)) return c.json({ authenticated: false }, 401)
  return c.json({ authenticated: true })
})

app.get('/api/admin/feedback', async (c) => {
  const token = getCookie(c, 'dr_splash_admin')
  if (!isAdmin(c, token)) return c.json({ error: 'Nicht autorisiert' }, 401)
  await ensureSchema(c.env.DB)
  const status = c.req.query('status')
  let query = `SELECT id, name, message, rating, status, created_at FROM feedback`
  const params: string[] = []
  if (status && ['pending', 'approved', 'rejected'].includes(status)) {
    query += ` WHERE status = ?`
    params.push(status)
  }
  query += ` ORDER BY created_at DESC LIMIT 200`
  const stmt = c.env.DB.prepare(query)
  const { results } = params.length
    ? await stmt.bind(...params).all<FeedbackRow>()
    : await stmt.all<FeedbackRow>()
  return c.json({ feedback: results ?? [] })
})

app.post('/api/admin/feedback/:id/approve', async (c) => {
  const token = getCookie(c, 'dr_splash_admin')
  if (!isAdmin(c, token)) return c.json({ error: 'Nicht autorisiert' }, 401)
  const id = Number(c.req.param('id'))
  if (!Number.isInteger(id)) return c.json({ error: 'Ungueltige ID' }, 400)
  await ensureSchema(c.env.DB)
  await c.env.DB.prepare(`UPDATE feedback SET status = 'approved' WHERE id = ?`).bind(id).run()
  return c.json({ ok: true, status: 'approved' })
})

app.post('/api/admin/feedback/:id/reject', async (c) => {
  const token = getCookie(c, 'dr_splash_admin')
  if (!isAdmin(c, token)) return c.json({ error: 'Nicht autorisiert' }, 401)
  const id = Number(c.req.param('id'))
  if (!Number.isInteger(id)) return c.json({ error: 'Ungueltige ID' }, 400)
  await ensureSchema(c.env.DB)
  await c.env.DB.prepare(`UPDATE feedback SET status = 'rejected' WHERE id = ?`).bind(id).run()
  return c.json({ ok: true, status: 'rejected' })
})

app.delete('/api/admin/feedback/:id', async (c) => {
  const token = getCookie(c, 'dr_splash_admin')
  if (!isAdmin(c, token)) return c.json({ error: 'Nicht autorisiert' }, 401)
  const id = Number(c.req.param('id'))
  if (!Number.isInteger(id)) return c.json({ error: 'Ungueltige ID' }, 400)
  await ensureSchema(c.env.DB)
  await c.env.DB.prepare(`DELETE FROM feedback WHERE id = ?`).bind(id).run()
  return c.json({ ok: true })
})

// Pretty admin URL
app.get('/admin', (c) => c.redirect('/admin.html', 302))
app.get('/admin/', (c) => c.redirect('/admin.html', 302))

app.all('*', async (c) => {
  return c.env.ASSETS.fetch(c.req.raw)
})

export default app
