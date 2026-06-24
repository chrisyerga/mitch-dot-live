# Porch Deployment

This service is managed by Porch on **milo** (`milo.newtricks.ai`).

- Service id: `mitch`
- Domain: `ismitchmcconnella.live`
- Container: `mitch-web`
- Internal port: `80`
- Deploy path: `/opt/mitch`

Agents should update app build/runtime details in this repo, then use the generated deploy workflow. Host routing, DNS, TLS, and Caddy reloads are owned by `npx @lindale/porch service register --json` on the VPS.

## GitHub Actions secrets

Configure these repository secrets before relying on automatic deploys:

- `PORCH_HOST` — `milo.newtricks.ai`
- `PORCH_USER` — SSH user (typically `root`)
- `PORCH_SSH_KEY` — private SSH key for the host
- `PUBLIC_CONVEX_URL` — e.g. `https://bright-eel-480.convex.cloud`
- `CONVEX_DEPLOY_KEY` — Convex production deploy key

The deploy workflow publishes `ghcr.io/chrisyerga/mitch-dot-live`. Make sure the package is public or the Porch host can pull it.

## Manual register (debug)

```bash
npx @lindale/porch service register \
  --service-id mitch \
  --domain ismitchmcconnella.live \
  --container mitch-web \
  --port 80 \
  --www-redirect \
  --image ghcr.io/chrisyerga/mitch-dot-live:TAG \
  --deploy-path /opt/mitch \
  --json
```

Then restart edge Caddy so the bind mount picks up the new Caddyfile:

```bash
cd /opt/porch && docker compose restart caddy
```
