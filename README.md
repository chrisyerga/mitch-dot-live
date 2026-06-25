# Is Mitch McConnell Alive?

**Live site:** [ismitchmcconnella.live](https://ismitchmcconnella.live)

An unofficial, non-partisan status tracker that answers one question in giant letters: **YES**, **NO**, or **MAYBE**. Built by [Lindale Labs, LLC](https://lindale.tech).

Built as an exercise to try out Astro which I haven't used in years. The idea was a website that would get either a few hits per day or a thousand per second, and could sustain that while still doing interesting work. I'm hosting this on a $6/mo shared VPS on Digital Ocean and a Convex free-tier backend. It typically serves the main site page in under 100ms. Naive load testing from my laptop shows the p90 response time stays under 1 second up to about 250rps.

All those users **will** call the Convex backend queries as this is currently built. That is the likely next bottleneck and some local KV-store caching seems the obvious approach if that becomes problematic. I will need to use a better load-tester that runs "real" browser clients and Javascript to explore that. If users click on the [ismitchmcconnella.live/sources/](https://ismitchmcconnella.live/sources/) link that should provide live queries so none of that is cached or planned to be and I think that's fine.

This was also an exercise in SEO and web app analytics, which is why this has Posthog integrated. Astro is an excellent choice for that as well and this repo does its best (as far as my naïve knowledge goes) to optimize not only page load and app responsiveness, but also SEO metadata, OpenGraph metadata, etc. For example, the initial build failed to provide an actual answer to crawlers because the SSR simply said "Loading..." unless Javascript was running on the client. Still figuring all that out, but the Google search "Is Mitch McConnell alive website" (you need the word website it there for now) shows this site as the #2 result right under his own congressional website. We're #7 on the second page without the word "website" in the query. I've done nothing to build backlinks and haven't done any research with Ahrefs or other tools so I'm sure there's plenty more that could be optimized.

I'm an engineer, not a content marketer. But I do know that "answer" sites like this are an interesting SEO challenge/opportunity. This particular one is unique in that it's value and interest is entirely time-bounded so this site will disappear into obscurity after the Senator's passing. I am a Political moderate and have no interest in this particular politician. He was chosen solely because of his visibility and interest in his health.

## Features

### Public site

- **YES / NO / MAYBE hero** — the headline answer updates in real time via Convex. When data sources disagree (e.g. a wire headline reports death but structured records don't confirm), the site shows **MAYBE** with a breakdown of which sources say what. A transition to NO, indicating the Senator has passed, requires manual confirmation via the /admin interface.
- **Live data source table** — Wikidata, Wikipedia, Congress.gov, and wire headlines are polled every 15 minutes. Each source shows its parsed status, confidence score (0–100), and last-checked time. These are Convex functions triggered by a Convex cron job and can be kicked off manually from /admin
- **Three theme modes** — visitors pick a disposition stored in `localStorage`:
  - **Neutral** — plain factual presentation
  - **Happy Now** — celebrate life / mourn death
  - **Happy Later** — mourn now / celebrate when he passes
- **Scroll-reveal sections** — live age & Senate tenure counters, curated news links, biography, career timeline, and FAQ accordion.
- **Data source history** — [`/sources`](https://ismitchmcconnella.live/sources) shows polling snapshots and per-source check history.
- **SEO-ready static build** — the current YES/NO answer is baked into HTML at build time (via a Convex prefetch) so crawlers see the real answer, not a loading placeholder. Includes Open Graph tags, JSON-LD (`WebSite`, `Person`, `FAQPage`), sitemap, and a custom 404 page.

### Automated polling

Convex cron jobs poll enabled data sources every **15 minutes**:

| Source | Confidence | What it checks |
|---|---|---|
| Wikidata / Google Knowledge | 90 | Death date property (`P570`) on entity `Q355522` |
| Wikipedia (en) | 88 | Death-related templates and categories on the article |
| Congress.gov | 92 | Bioguide record `M000355` for active/deceased status |
| Major wire headlines | 75 | Google News search across AP, Reuters, BBC, NYT, WaPo for recent death/obituary headlines |
| X (Twitter) trends | 25 | Social rumor detection (disabled by default) |

Poll results are stored as `pollSnapshots`. The public **MAYBE** state is driven by a weighted consensus algorithm — polling alone never auto-flips the admin-controlled YES/NO status.

### Admin (`/admin`)

Deadass simple Password-protected panel (noindex) for operators:

- Flip the official **alive / deceased** status and set a custom hero message
- Manage curated **news links** (create, edit, publish/unpublish, reorder)
- Enable/disable individual **data sources** and preview the MAYBE state in dev
- View **consensus breakdown** — per-source contributions, confidence weights, and pass/fail checks

## Stack

| Layer | Technology |
|---|---|
| Frontend | [Astro 7](https://astro.build) (static SSG) + [React 19](https://react.dev) islands |
| Styling | [Tailwind CSS 4](https://tailwindcss.com) via Vite plugin |
| Backend | [Convex](https://convex.dev) — real-time queries, mutations, cron jobs, actions |
| Analytics | [PostHog](https://posthog.com) — pageviews + custom events (theme picks, FAQ expands, news clicks, status viewed) |
| Hosting | Docker + Caddy, deployed via [Porch](https://github.com/lindale/porch) on a shared VPS |
| CI/CD | GitHub Actions → GHCR → Porch service register |

**Node.js ≥ 22.12** required.

## Project structure

```
├── src/
│   ├── pages/           # Astro routes (index, admin, sources, 404)
│   ├── layouts/         # BaseLayout (meta, OG, JSON-LD, PostHog)
│   ├── components/      # React islands (StatusHero, AdminPanel, etc.)
│   ├── data/            # Static content (FAQ, timeline, facts)
│   └── lib/             # Shared helpers (themes, consensus, analytics)
├── convex/
│   ├── polling/         # Per-source poll actions (wikidata, wikipedia, news, …)
│   ├── lib/             # Auth, poll status validators, seed data
│   ├── schema.ts        # Database tables
│   ├── crons.ts         # 15-minute poll schedule
│   ├── status.ts        # Public status query + admin mutations
│   ├── news.ts          # Curated news CRUD
│   └── dataSources.ts   # Source list + enable/disable
├── public/              # Favicons, OG image, robots.txt
├── Caddyfile            # Canonical-domain redirects + static file serving
├── Dockerfile           # Multi-stage: Astro build → Caddy runner
└── .github/workflows/   # Deploy (Docker + Porch) + Convex deploy
```

## Local development

**Prerequisites:** Node 22+, a [Convex](https://convex.dev) account.

```bash
npm install
cp .env.example .env.local
```

Edit `.env.local`:

```env
PUBLIC_CONVEX_URL=<your dev deployment URL from `npx convex dev`>
PUBLIC_POSTHOG_PROJECT_TOKEN=   # optional for local analytics
PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
ADMIN_PASSWORD=<pick a password>
```

Set `ADMIN_PASSWORD` in the Convex dashboard (Settings → Environment Variables) for the dev deployment, then start both processes:

```bash
npx convex dev          # terminal 1 — backend + schema push
npm run dev             # terminal 2 — http://localhost:4321
```

Seed the database once:

```bash
npm run seed
# or against production: npx convex run init:seed --prod
```

### Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Astro dev server |
| `npm run build` | Production static build → `dist/` |
| `npm run preview` | Preview the production build locally |
| `npx convex dev` | Start Convex dev deployment |
| `npx convex deploy` | Deploy Convex functions to production |
| `npm run seed` | Seed status, news, and data sources |

## Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `PUBLIC_CONVEX_URL` | Frontend build | Convex deployment URL (baked into static JS) |
| `PUBLIC_POSTHOG_PROJECT_TOKEN` | Frontend build | PostHog project API key |
| `PUBLIC_POSTHOG_HOST` | Frontend build | PostHog ingest host (default: `https://us.i.posthog.com`) |
| `ADMIN_PASSWORD` | Convex dashboard | Admin login password (never in frontend code) |

See [`.env.example`](./.env.example) for a starter template.

## Deployment

Production deploys run automatically on push to `main` via GitHub Actions:

1. Build Astro static site with production env vars
2. Push Docker image to `ghcr.io/chrisyerga/mitch-dot-live`
3. Register/update the service on the VPS via [Porch](https://github.com/chrisyerga/porch), which is a tool I use to manage my shared VPS infrastructure. If you plan on hosting a variant of this yourself, I'd suggest spinning your own deploy workflow as Porch is very much in-development and likely has some rough edges. Having said that, it's published on the NPM registry and you can just run it via ```npx @lindale/porch``` as it is done here
4. Deploy Convex functions in a parallel job

Full details — Convex setup, GitHub secrets, manual deploy commands — are in **[DEPLOY.md](./DEPLOY.md)**. Porch service registration is documented in **[PORCH.md](./PORCH.md)** and you can tell your coding agent how to use porch with the SKILL.md in that repo.

### Domains

This was also an exercise in SEO and 
Three domains point at the same app. The canonical domain is served directly; the others 301-redirect to it:

| Domain | Role |
|---|---|
| `ismitchmcconnella.live` | **Canonical** — indexed by search engines |
| `ismitchmcconnell.live` | Alias → 301 redirect |
| `mitchmcconnell.live` | Alias → 301 redirect |

## How status changes work

1. **Polling** runs every 15 minutes and updates each data source's `currentStatus`.
2. **Consensus** computes a weighted YES / NO / MAYBE from enabled sources. MAYBE appears when credible sources disagree — it does **not** change the official status.
3. **Admin flip** — an operator reviews evidence and manually sets `status.isAlive` to `true` or `false`. Only then does the hero show a definitive NO (or return to YES).
4. **Rebuild** — the static HTML is regenerated on deploy, baking the current answer into the page for SEO. Live Convex subscriptions update the answer in-browser without a refresh.

## Analytics events

PostHog tracks these custom events (see [`src/lib/analytics.ts`](./src/lib/analytics.ts)):

| Event | Trigger |
|---|---|
| `status_viewed` | Page loads with current alive/deceased state |
| `theme_preference_selected` | Visitor picks Neutral / Happy Now / Happy Later |
| `faq_item_expanded` | FAQ accordion item opened |
| `news_link_clicked` | Outbound click on a curated news article |

## License

[MIT](./LICENSE) — Copyright (c) 2026 Lindale Digital, LLC

## Disclaimer

This is an **unofficial status tracker**. It is not medical information, not an official government source, and not affiliated with Senator Mitch McConnell, his office, any campaign, or any political party.

Built by **[Lindale Labs, LLC](https://lindale.tech)** · [Source on GitHub](https://github.com/chrisyerga/mitch-dot-live)
