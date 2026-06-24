# ismitchmcconnella.live

Unofficial live status site for Senator Mitch McConnell — built with **Astro 7**, **React islands**, and **Convex**.

## Features

- Giant **YES / NO** status hero with real-time Convex updates
- Three theme modes: **Neutral**, **Happy Now**, **Happy Later**
- Scroll-reveal sections: news, biography, editorial placeholder
- Password-protected `/admin` for status flips and news link management

## Quick start

```bash
npm install
cp .env.example .env.local
npx convex dev   # terminal 1
npm run dev      # terminal 2 — http://localhost:4321
npm run seed     # once, to populate status + news
```

See [DEPLOY.md](./DEPLOY.md) for production deployment.

## Stack

- Astro 7 + Vite 8
- React islands + Tailwind CSS 4
- Convex (status, news, admin sessions)

## Disclaimer

Unofficial parody site. Not medical information. Not affiliated with the U.S. Senate.
