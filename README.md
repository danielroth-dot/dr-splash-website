# Dr. Splash Website

Marketing-Website fuer **Dr. Splash** (Deutsch) mit animiertem Landing und sechs Mini-Games.

## Live

| | URL |
|---|---|
| **Website** | https://dr-splash-website.midi-caravan.workers.dev |

> Cloudflare Workers **temporary preview account** (Midi Caravan). Claim after deploy so it stays yours, then re-run `npx wrangler deploy` for a permanent workers.dev URL under your account.

## Features

- Animiertes Landing mit Dr. Splash (Bounce, Blink, Splash-Partikel)
- Sechs Mini-Games (Canvas, mobilfreundlich):
  1. **Autorennen** – endloses Top-Down-Rennen, Hindernisse ausweichen, Tropfen sammeln
  2. **Flipper** – Pinball mit Dr. Splash als Kugel, Flipper & Bumper
  3. **Memory** – klassisches Memory mit Flaschen-/Splash-Motiven
  4. **Flasche Schminkspiel** – Accessoires auf Dr. Splash (Lippenstift, Brille, Hut, …)
  5. **Bowling** – Dr. Splash als Kugel, Flaschen-Pins abraeumen
  6. **Tennis** – Court-Mini-Game mit Dr. Splash als Schlaeger
- Kein Feedback-Formular, kein Admin, keine D1-Datenbank

## Spielen

| Spiel | Steuerung |
|---|---|
| Autorennen | ← → oder A/D · Touch ziehen |
| Flipper | Z/← links, X/→ rechts · Touch linke/rechte Haelfte |
| Memory | Tippen zum Umdrehen |
| Schminkspiel | Accessoire waehlen, auf Flasche tippen, Fertig |
| Bowling | ← → zielen · Leertaste / Tippen zum Rollen |
| Tennis | ← → oder A/D · Touch ziehen |

Jedes Spiel hat Startbildschirm, Punkte/Bestwert (localStorage) und Neustart.

## Stack

Cloudflare Workers + Hono + Static Assets (`public/`) · reine Canvas/JS-Games (keine schweren Game-Engines)

## Lokal starten

```bash
npm install
npm run dev
```

App: http://127.0.0.1:8787

## Deploy

```bash
npx wrangler login   # einmalig, eigenes Konto
npm run deploy
```

Oder Preview/temporaer:

```bash
npx wrangler deploy --temporary
```

## Marke

Nur **Dr. Splash** – keine anderen Markennamen verwenden.
