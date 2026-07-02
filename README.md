# Is Mitch McConnell Alive?
<img src="https://lindale.atl1.cdn.digitaloceanspaces.com/mitch-neutral.png" width="350px"/>

**Live site:** [ismitchmcconnella.live](https://ismitchmcconnella.live)

An unofficial, non-partisan status tracker that answers one question in giant letters: **YES**, **NO**, or **MAYBE**.

## Goals

### Maximum Value from a $6/mo VPS and the Convex Free Tier

Built as an exercise to try out Astro which I haven't used in years. Astro 7 was just released with Vite 8 so I used both for this. No Astro 7 functionality is used, just the speedy new Astro Build and the perf improvements in the already-zippy Vite. The idea was a website that would get either a few hits per day or a thousand per second, and could sustain that while still doing interesting work. I'm hosting this on a $6/mo shared VPS on Digital Ocean and a Convex free-tier backend. It typically serves the main site page in under 100ms. I serve the fonts from my VPS as well to avoid another SSL TLS handshake for the googlefonts domain and posthog analytics events are also served from a reverse proxy on a custom c.ismitchmcconnella.live domain as well.
Lighthouse shows the site loading on a simulated shitty mobile network with 150ms RTT in under 1.0 seconds. Real-word is ~300ms first time and 50ms page loads after that. Naive load testing from my laptop shows the p90 response time stays under 1 second up to about 250rps. The same setup can sustain 1000rps indefinitely if you don't mind waiting 5 or so seconds for a page load, which is faster than half the sites I use on a daily basis 😂

All those users **will** call the Convex backend queries as this is currently built. That is the next bottleneck. My aim is to push the Convex Free Tier as far as I can go. Each Convex browser client maintains a Websocket for live DB updates and there's a hard cap at 1,000 concurrent, as well as a limit of 1,000,000 queries. There's 3 queries in the current home page (Status, Sources and News Feed) so those could be collapsed into a single query but that's not a big win. I plan to use a better load-tester that runs "real" browser clients and Javascript to explore how things behave at the limit. One thing I'm definitely *not* concerned with is the [ismitchmcconnella.live/sources/](https://ismitchmcconnella.live/sources/) page. I expect very little traffic there and would want to keep that live and simple. I _think_ that's fine.

I have also forked the Convex backend and have been exploring how it works. I've stepped through a decent bit of their Tokio-based Rust backend and have started to get my head around Isolate, which is their V8 edge sandbox that runs the Javascript queries/functions. I might also try out hosting a local self-hosted Convex backend tuned specifically for this use-case to see if having greater control over their runtime gives me more options..

> ### 😬😬😬 It's never the bit you think it is
> 
> I was worried about the Convex concurrent connection limit, but before I got a chance to load test it the morning after writing the above I got a notice
> from Convex that I'd exceeded my free-tier limits. I had exceeded my DB read limit of 1GB with 3.5GB of reads overnight. It was all fetching the historical
> output of the data source pollers. The [/sources](https://ismitchmcconnella.live/sources) page shows a list of recent data from the data sources. It's reactive
> and Convexy like I wanted and the astute reader may recall I specifically said I wasn't worried about it just 2 paragraphs above. The query function did paging
> but read 100 rows at once. That query gets invalidated every time a data source writes to the pollSnapshots table. Every 15 minutes we kick off all 5 of them
> so there's 5 updates in a row all within a second or two. Not great, but still that shouldn't be *that* bad.
>
> It turned out I store the response from each API/data source in the snapshot. No biggie. Well the congressional API response is decently big around 15K. But the
> winner is wikidata with 150K (😳) of super-enterprisey XML nonsense. There's a lot of good structured data in there, but each property is wrapeed in thousands of bytes
> of exactly-the-same boilerplate XML. So that's around a hundred queries overnight for an open browser on that page and I had a few of them, each one pulling down
> something like 5-10 megabytes of historical data that's never looked at nor rendered in the browser. And the table grows with each poll so it's exponential
>
> So my point above was yet another data point on why premature optimization *never* works out. You don't actually know what's using you're resources. Don't worry.
> It happens to a lot of guys.
>
> Recent commits only store the wikidata payload parts that are relevant. I also batched up the mutations to store all the data source reads at once but that was 
> before I knew the real problem

## SEO Experience

This was also an exercise in SEO and web app analytics, which is why it has Posthog integrated. Astro is an excellent choice for that as well and this repo does its best (as far as my naïve knowledge goes) to optimize not only page load and app responsiveness, but also SEO metas, OpenGraph metadata, etc. I've already ran into a few obvious issues. For example, the initial version of this failed to provide an actual answer to crawlers because the SSR simply said "Loading..." unless Javascript was running on the client. This is now handled in src/pages/index.astro which performs the Convex query at ```npx astro build``` time and bakes ```initialStatus``` into the static Atro/VITE build of the site. For a situation such as this where there is but a single transition from YES->NO that's reasonable. Arguably that could just be set to a const of YES but this approach felt more correct.

### Google Search Ranking

<img src="https://lindale.atl1.cdn.digitaloceanspaces.com/google-search-position.jpg" width="80%">

The SEO results have been surprisingly good. We are hovering around #8 in the relevant Google search results. If you specifically search for "Is Mitch McConnell alive website" (you need the word website it there) this site appears as the #2 result right under his own congressional website. When the details of the 911 call from the Senator's residence came out, my AI content generation buddy put up a quick blog post to capture some keyword searchs and we were #1 on Google for "mitch mcconnell 911 call" later that day. I've done nothing to build backlinks beyond my own site and haven't done any research with Ahrefs or other tools so I'm sure there's plenty more that could be optimized.

Regarding backlinks, there is a blog section that Astro builds from .MD files in the repo. There is also a section in the Admin panel to add a new blog entry which are persisted to Convex. At Astro build time, those are loaded with a separate Astro content loader and built to static HTML for performance. Whenever the table with these dynamic blog entries changes, a Github action kicks off a new Astro build and deploy to achieve this. 

The next feature I'm building is auto-generated blog posts to capture traffic on search keywords we're not yet hitting. I can see them in the Google Search Console, and have added some blog posts manually to capture traffic for things like "death certificate" etc. that aren't mentioned on the home page. The idea
is to detect these automatically and generate search marketing content to capture traffic and perhaps also
some SERP landscape.

Interestingly, I chose what others considered the "misspelled" domain with the "a" in there before the .live TLD as the canonical URL that is crawled by search engines. It would be interesting to try another site for another celebrity with the alternative domain. I have 3 .live domains (for a grand total of $9) to catch what people would most likey type but the isXXXa.live URL is my preference.

I'm an engineer, not a content marketer. But I do know that "answer" sites like this are an interesting SEO challenge/opportunity. This particular one is unique in a few ways:

* There is absolutely no chance of me grabbing the SERP for "is mitch mcconnell alive" as far as I know. Presumably, Google uses Wikidata as the authoritative source for a public figure such as the Senator.
  
* Its value and interest is entirely time-bounded. This site will disappear into obscurity after the Senator's passing. For the record, I am a Political moderate and have no interest in this particular politician one way or another. He was chosen solely because of his visibility and interest in his health and this all came together because a friend of mine asked the question...[ismitchmcconnella.live](https://ismitchmcconnella.live)

While the particular topic of Senator Mitch McConnell is not of any particular interest to me, this
repo is intended to build up a library of useful code to automate content generation and SEO for sites like this.

### Data Sources

Nothing novel here. I use WikiData and Wikipedia APIs. I also used the US Congress Data API. Did you know that you can sign up for an API Key for Congressional data and receive it instantly? This being the government, they email it to you in plaintext 🤣

When deciding what status to show, there is a consensus calculation that uses the results for each data source and an overall confidence multiplier assigned to it. Look at lib/sourceConsensus.ts for the details. It's more elaborate than it needs to be but I wanted knobs to tune.

There is also a data source that uses the X.com API to track trending topics. Polling it every 15 minutes would cost ~$60/mo (~~rocket fuel~~ orbital data centers ain't cheap, homie) so I have it turned off but it was interesting to look at. I generously gave this data source a confidence score of 25% in the consensus calculation, so was never planning to lean on it much anyway. You can trigger it at-will on the /admin page if you want a quick thrill and are willing to spend two cents to do so.

## Features

### The Theme Gimmick
<img src="https://lindale.atl1.cdn.digitaloceanspaces.com/mitch-happy.png" height="350px"/>
<img src="https://lindale.atl1.cdn.digitaloceanspaces.com/mitch-sad.png" height="350px"/>

Under the answer, users can select their Disposition towards the Senator to receive either a Happy or Sad theme based on his current state of life. This is stored solely in browser localStorage and is never passed to the backend. There are Posthog events whenever a user clicks on an option here just for the sake of seeing if this is even discoverable or interesting to people. The FAQs cover my feelings about this and if you read them you can read about that and even receieve an insult or two.

Obviously, no Visual Designers were involved at all. It's pure AI coding agent slop design. If you feel the need to criticize the design, open a PR or STFU.

### MAYBE

<img src="https://lindale.atl1.cdn.digitaloceanspaces.com/mitch-maybe.png" width="450px">


There will be an interesting point in time when the various data sources *disagree* on the Senator's status. When this occurs, the site displays MAYBE and shows the results from each dataSource. I made the decision that NO should only ever display as a result of a human admin approving the transition. This deicision keeps the site fresh without jumping the gun. Dewey beats Truman and all that.

### Site Features

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

PostHog tracks these custom events via [`captureEvent()`](./src/lib/analytics.ts):

| Event | Trigger | Properties |
|---|---|---|
| `status_viewed` | Homepage loads or live status changes | `isAlive` (boolean) |
| `theme_preference_selected` | Visitor picks a theme preference | `preference` (`neutral`, `happyNow`, or `happyLater`) |
| `faq_item_expanded` | FAQ accordion item opened | `question` (string) |
| `news_link_clicked` | Outbound click on a curated news article | `title`, `source`, `url` |
| `footer_link_clicked` | Footer link clicked (Blog, Lindale Labs, GitHub) | `link` (`blog`, `lindale_labs`, or `github`), `url` |
| `admin_honeypot_viewed` | Decoy admin honeypot page viewed | `image` (random honeypot image path) |

## License

[MIT](./LICENSE) — Copyright (c) 2026 Lindale Digital, LLC

## Disclaimer

This is an **unofficial status tracker**. It is not medical information, not an official government source, and not affiliated with Senator Mitch McConnell, his office, any campaign, or any political party.

