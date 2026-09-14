# Dr. Splash Website

**Aktuelle Live-URL (mit Impressum):** https://dr-splash-website.island-albatross.workers.dev

Ältere `*.workers.dev`-Preview-URLs ohne Impressum bitte nicht mehr teilen.

Marketing-Website fuer **Dr. Splash** (Deutsch) mit animiertem Landing und fuenf Mini-Games.

## Live

| | URL |
|---|---|
| **Website** | https://dr-splash-website.clean-sycamore.workers.dev |

> Cloudflare Workers **temporary preview account** (Clean Sycamore). Claim within ~60 minutes of the latest deploy so it stays yours:
> https://dash.cloudflare.com/claim-preview?claimToken=wjPikHmIjCHjA6mfIemu2toowD8wjr85Ax1zuKNIOI0
>
> After claiming (or with your own Cloudflare login), re-run `npx wrangler deploy` for a permanent workers.dev URL under your account.

## Features

- Animiertes Landing mit Dr. Splash (Bounce, Blink, Splash-Partikel, Klick-Sounds & deutsche Sprueche)
- «Mehr erfahren» oeffnet WhatsApp an +41795888887 mit vorgefuelltem Text
- Fuenf Mini-Games (Canvas, mobilfreundlich):
  1. **Autorennen** – endloses Top-Down-Rennen, Hindernisse ausweichen, Tropfen sammeln
  2. **Flipper** – Pinball mit Dr. Splash als Kugel, Flipper & Bumper
  3. **Memory** – klassisches Memory mit Flaschen-/Splash-Motiven
  4. **Bowling** – Dr. Splash als Kugel, Flaschen-Pins abraeumen
  5. **Tennis** – Court-Mini-Game mit Dr. Splash als Schlaeger
- Kein Feedback-Formular, kein Admin, keine D1-Datenbank

## Spielen

| Spiel | Steuerung |
|---|---|
| Autorennen | ← → oder A/D · Touch ziehen |
| Flipper | Z/← links, X/→ rechts · Touch linke/rechte Haelfte |
| Memory | Tippen zum Umdrehen |
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
