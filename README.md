# Dr. Splash Website

Marketing-Website fuer **Dr. Splash** (de-CH, ss statt ß) mit animiertem Landing, Feedback-Formular und Admin-Moderation.

## Live

| | URL |
|---|---|
| **Website** | https://dr-splash-website.midi-caravan.workers.dev |
| **Admin** | https://dr-splash-website.midi-caravan.workers.dev/admin |

> Deployed via Cloudflare Workers **temporary preview account**. Claim the account within ~60 minutes of deploy so it stays yours:
> https://dash.cloudflare.com/claim-preview?claimToken=u3t6axUQWzd5W-BYfhyfl4bh6qTHnt53ddRwOyA6hxk
>
> After claiming (or with your own Cloudflare login), re-run `npx wrangler deploy` for a permanent workers.dev URL under your account.

## Admin-Passwort

```text
drsplash-admin
```

Aendern (empfohlen nach Claim):

```bash
npx wrangler secret put ADMIN_PASSWORD
```

Oder in `wrangler.toml` unter `[vars] ADMIN_PASSWORD`.

## Features

- Animiertes Landing mit Dr. Splash (Bounce, Blink, Splash-Partikel)
- Feedback: Name optional, Nachricht Pflicht, Bewertung 1–5 optional
- Neue Eintraege starten als **pending**
- Oeffentliche Liste zeigt nur **approved**
- Admin unter `/admin`: freigeben / ablehnen / loeschen
- Durable Storage: Cloudflare D1 (SQLite)

## Stack

Cloudflare Workers + Hono + D1 + Static Assets (`public/`)

## Lokal starten

```bash
npm install
npm run db:migrate:local
npm run dev
```

- App: http://127.0.0.1:8787
- Admin: http://127.0.0.1:8787/admin

## Eigenes Cloudflare-Konto (dauerhaft)

```bash
npx wrangler login
npx wrangler d1 create dr-splash-db
# database_id in wrangler.toml eintragen
npm run db:migrate
npm run deploy
```

Aktuelle D1 `database_id` (temp account): `ecac9e38-2ec9-43a5-95a2-1a8d70b71518`

## Marke

Nur **Dr. Splash** – keine anderen Markennamen verwenden.
