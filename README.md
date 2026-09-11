# Dr. Splash Website

Marketing-Website fuer **Dr. Splash** (de-CH, ss statt ß) mit animiertem Landing und drei Mini-Games.

## Live

| | URL |
|---|---|
| **Website** | https://dr-splash-website.midi-caravan.workers.dev |

> Deployed via Cloudflare Workers. Bei Preview-Account ggf. neu deployen mit `npx wrangler deploy` (oder `--temporary`).

## Features

- Animiertes Landing mit Dr. Splash (Bounce, Blink, Splash-Partikel)
- Drei Mini-Games (Canvas, mobilfreundlich):
  1. **Autorennen** – endloses Top-Down-Rennen, Hindernisse ausweichen, Tropfen sammeln
  2. **Flipper** – Pinball mit Dr. Splash als Kugel, Flipper & Bumper
  3. **Splash Jump** – Endless Jumper von Plattform zu Plattform
- Kein Feedback-Formular, kein Admin, keine D1-Datenbank

## Spielen

| Spiel | Steuerung |
|---|---|
| Autorennen | ← → oder A/D · Touch ziehen |
| Flipper | Z/← links, X/→ rechts · Touch linke/rechte Haelfte |
| Splash Jump | ← → oder A/D · Touch ziehen · Geraeteneigung |

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
