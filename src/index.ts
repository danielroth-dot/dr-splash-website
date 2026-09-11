import { Hono } from 'hono'

type Bindings = {
  ASSETS: Fetcher
}

const app = new Hono<{ Bindings: Bindings }>()

app.get('/api/health', (c) => c.json({ ok: true, brand: 'Dr. Splash', games: ['autorennen', 'flipper', 'splash-jump'] }))

app.all('*', async (c) => c.env.ASSETS.fetch(c.req.raw))

export default app
