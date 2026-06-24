# Deployment

## Overview

- **Frontend:** Static Astro 7 build served by Caddy inside the `mitch-web` Docker container (port 80).
- **Backend:** Convex Cloud (status, news, admin auth).
- **Edge:** Shared VPS Caddy reverse proxy on the `porch` Docker network.

## Prerequisites

- Node.js ≥ 22.12.0
- Convex project (`npx convex login` then `npx convex dev`)
- DNS `A` record for `ismitchmcconnella.live` pointing at the VPS
- Docker on the VPS with external network `porch`

## Convex setup

1. Create/link a Convex project:
   ```bash
   npx convex dev
   ```

2. Set production env vars in the Convex dashboard:
   - `ADMIN_PASSWORD` — admin login password (required)

3. Seed initial data (once per deployment):
   ```bash
   npx convex run init:seed
   ```

4. Deploy Convex functions:
   ```bash
   npx convex deploy
   ```

5. Copy the production Convex URL for the frontend build:
   - `PUBLIC_CONVEX_URL=https://YOUR-DEPLOYMENT.convex.cloud`

## Local development

```bash
cp .env.example .env.local
# Edit ADMIN_PASSWORD and PUBLIC_CONVEX_URL as needed
npm install
npx convex dev   # terminal 1
npm run dev      # terminal 2
```

Admin panel: http://localhost:4321/admin

## Docker build (local)

```bash
docker build \
  --build-arg PUBLIC_CONVEX_URL=https://YOUR-DEPLOYMENT.convex.cloud \
  -t mitch-dot-live .
```

## VPS manual steps (one-time)

1. Ensure the app directory exists:
   ```bash
   sudo mkdir -p /opt/mitch
   ```

2. Add a vhost to the edge Caddyfile (e.g. `/opt/edge/Caddyfile` or `/opt/porch/Caddyfile`):

   ```caddyfile
   ismitchmcconnella.live {
       import common
       reverse_proxy mitch-web:80
   }

   www.ismitchmcconnella.live {
       redir https://ismitchmcconnella.live{uri} permanent
   }
   ```

3. Reload Caddy:
   ```bash
   docker exec porch-caddy caddy reload --config /etc/caddy/Caddyfile
   ```

## GitHub Actions secrets

| Secret | Purpose |
|---|---|
| `PUBLIC_CONVEX_URL` | Convex client URL baked into Astro build |
| `CONVEX_DEPLOY_KEY` | Deploy Convex functions from CI |
| `DO_HOST` | VPS hostname or IP |
| `DO_USER` | SSH user |
| `DO_SSH_KEY` | Private SSH key for deploy |

## Phase 2: external polling

Polling (Google Knowledge Graph, news RSS, etc.) will be added as Convex scheduled `internalAction`s writing to `pollSnapshots`. Status will **not** auto-flip without admin approval.
