# Deployment

## Overview

- **Frontend:** Static Astro 7 build served by Caddy inside the `mitch-web` Docker container (port 80).
- **Backend:** Convex Cloud (`mellifluous-rutabaga-420` production deployment).
- **Edge:** Porch-managed Caddy on **milo** (`milo`), `porch` Docker network.

### Domains

Three domains are routed to the same `mitch-web` container:

| Domain | Role |
|---|---|
| `ismitchmcconnella.live` | **Canonical** — served directly; all canonical tags, OG URLs, and the sitemap point here. |
| `ismitchmcconnell.live` | Alias — 301-redirected to the canonical domain. |
| `mitchmcconnell.live` | Alias — 301-redirected to the canonical domain. |

The Porch edge terminates TLS for all three and proxies to the container. The
container's `Caddyfile` issues the 301 from the alias hosts to the canonical
host so search engines consolidate ranking on one domain. To change the
canonical domain, update both `Caddyfile` and `site` in `astro.config.mjs`
(plus `SITE.url` in `src/lib/site.ts`).

See [PORCH.md](./PORCH.md) for service registration details.

## Host state (milo)

Porch is already bootstrapped on milo:

- `porch-caddy` — edge TLS on ports 80/443
- `porch` Docker network — shared by app containers
- `/opt/porch/` — generated Caddyfile + edge compose
- `/opt/<service>/` — per-app compose (e.g. `/opt/abbot`, `/opt/mitch`)

Verify anytime:

```bash
ssh milo 'bash -lc "source ~/.nvm/nvm.sh && npx @lindale/porch host doctor"'
```

## Convex setup

Production deployment: `https://mellifluous-rutabaga-420.convex.cloud`

1. Set `ADMIN_PASSWORD` in the [Convex dashboard](https://dashboard.convex.dev/t/chris-d0ae1/mitch-dot-live) (Production env vars).

2. Deploy functions:
   ```bash
   npx convex deploy --yes
   ```

3. Seed once (production):
   ```bash
   npx convex run init:seed --prod
   ```

4. Frontend build needs:
   ```
   PUBLIC_CONVEX_URL=https://mellifluous-rutabaga-420.convex.cloud
   PUBLIC_POSTHOG_PROJECT_TOKEN=<from PostHog project settings>
   PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
   ```

   PostHog uses one project for all environments (local and production). The token is baked into the static build at deploy time — no separate prod project is required. In PostHog, filter by `$host` or `$current_url` if you want to split local vs production traffic.

## Local development

```bash
cp .env.example .env.local
npm install
npx convex dev   # terminal 1
npm run dev      # terminal 2
```

## GitHub Actions secrets

| Secret | Purpose |
|---|---|
| `PORCH_HOST` | `milo` (or use existing `DO_HOST`) |
| `PORCH_USER` | `root` (or use existing `DO_USER`) |
| `PORCH_SSH_KEY` | SSH private key (or use existing `DO_SSH_KEY`) |
| `PUBLIC_CONVEX_URL` | `https://mellifluous-rutabaga-420.convex.cloud` |
| `PUBLIC_POSTHOG_PROJECT_TOKEN` | PostHog project API key (Project settings → Project API key) |
| `PUBLIC_POSTHOG_HOST` | `https://us.i.posthog.com` |
| `CONVEX_DEPLOY_KEY` | Convex production deploy key |

The host also needs `DIGITALOCEAN_TOKEN` in the SSH user's environment (already configured for abbot deploys).

## Manual deploy (without CI)

```bash
export PUBLIC_CONVEX_URL=https://mellifluous-rutabaga-420.convex.cloud
export PUBLIC_POSTHOG_PROJECT_TOKEN=phc_...
export PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
npm run build
docker build \
  --build-arg PUBLIC_CONVEX_URL="$PUBLIC_CONVEX_URL" \
  --build-arg PUBLIC_POSTHOG_PROJECT_TOKEN="$PUBLIC_POSTHOG_PROJECT_TOKEN" \
  --build-arg PUBLIC_POSTHOG_HOST="$PUBLIC_POSTHOG_HOST" \
  -t ghcr.io/chrisyerga/mitch-dot-live:manual .
docker push ghcr.io/chrisyerga/mitch-dot-live:manual

ssh milo 'bash -lc "
  source ~/.nvm/nvm.sh
  npx --yes @lindale/porch service register \
    --service-id mitch \
    --domain ismitchmcconnella.live ismitchmcconnell.live mitchmcconnell.live \
    --container mitch-web \
    --port 80 \
    --www-redirect \
    --image ghcr.io/chrisyerga/mitch-dot-live:manual \
    --deploy-path /opt/mitch \
    --json
  cd /opt/porch && docker compose restart caddy
"'
```

## Phase 2: external polling

Convex scheduled `internalAction`s write to `pollSnapshots`. Status will **not** auto-flip without admin approval.

Optional Convex environment variables for data source pollers:

- `CONGRESS_GOV_API_KEY` — [Congress.gov API](https://api.congress.gov/) key for the Congress.gov source

The X (Twitter) trends source is disabled (`enabled: false` in seed) to avoid pay-per-use search costs. Re-run `npx convex run init:seed --prod` after deploy to sync the flag in production.

### One-time: trim old Wikidata snapshot payloads

After deploying compact Wikidata payloads, shrink existing `pollSnapshots` rows (skips `deceased` rows that keep full claims):

```bash
npx convex run migrations/trimWikidataPayloads:runAll
npx convex run migrations/trimWikidataPayloads:runAll --prod
```

This schedules batched patches (50 rows at a time). Watch the Convex dashboard logs until batches finish.
