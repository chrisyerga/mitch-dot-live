## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->

## Cursor Cloud specific instructions

This is an Astro 7 static site (React islands + Tailwind 4) with a Convex backend. Local dev needs **two long-running processes**: the Convex backend and the Astro dev server. Standard commands live in `README.md`/`package.json`; the notes below are only the non-obvious cloud caveats.

- **Convex runs locally with no account.** This environment is non-interactive, so every Convex CLI command must be prefixed with `CONVEX_AGENT_MODE=anonymous` (e.g. `CONVEX_AGENT_MODE=anonymous npx convex dev`, `... npx convex env set ...`, `... npm run seed`). Without it the CLI tries to prompt for login and fails. The anonymous deployment is served at `http://127.0.0.1:3210` and its config is saved in `.env.local` (gitignored, `CONVEX_DEPLOYMENT=anonymous:anonymous-agent`).
- **Two processes:** run `CONVEX_AGENT_MODE=anonymous npx convex dev` and `npm run dev` (Astro on `http://localhost:4321`) in separate persistent shells/tmux. Seed the DB once with `CONVEX_AGENT_MODE=anonymous npm run seed`.
- **Admin password is a Convex env var, not the frontend `.env`.** Set it with `CONVEX_AGENT_MODE=anonymous npx convex env set ADMIN_PASSWORD <pw>`. **Honeypot gotcha:** the `.env.example` value `Sup3rS3cr3tP4ssw0rd!` is an intentional decoy (see `src/lib/adminHoneypot.ts`); typing it on `/admin` shows a fake honeypot page instead of logging in. Use any *other* password. This env is currently set to `RealAdm1nP@ssw0rd2026` for the local deployment.
- **`npm run build` needs Convex running.** `src/pages/index.astro` prefetches the status from Convex at build time to bake the YES/NO answer into static HTML for SEO.
- **No lint or test scripts exist.** CI (`.github/workflows/deploy.yml`) only runs `npm run build`. There are no unit tests; `load-test.*`/artillery is for load testing a live URL, not part of local verification.
- **Vite/Rolldown optimize-deps cache can go stale** (symptoms: black screen, `404` for `/node_modules/.vite/deps/*.js`, "Failed to fetch dynamically imported module" hydration errors). Fix: stop the Astro dev server, `rm -rf node_modules/.vite`, then restart `npm run dev`.
- **Forge blog generation (`/admin/generate/`)** calls [forge.lindale.tech](https://forge.lindale.tech) from Convex actions. Set these Convex env vars: `FORGE_API_KEY` (Bearer API key from Forge → API Keys), `FORGE_PROJECT_ID` (Forge project ID), and optionally `FORGE_BASE_URL` (defaults to `https://forge.lindale.tech`). Example: `CONVEX_AGENT_MODE=anonymous npx convex env set FORGE_API_KEY forge_...`
