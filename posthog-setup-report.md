<wizard-report>
# PostHog post-wizard report

The wizard has completed a PostHog analytics integration for **mitch.live** (Is Mitch McConnell Alive?). PostHog is initialized via an inline snippet in a reusable `posthog.astro` component, included in `BaseLayout.astro` so every page gets tracking. Four user interaction events are instrumented across the site's React components, covering the key engagement touchpoints.

| Event | Description | File |
|---|---|---|
| `theme_preference_selected` | User selects a disposition/theme preference (neutral, happy if alive, happy if dies) | `src/components/ThemePickerIsland.tsx` |
| `notify_signup_submitted` | User submits the email notification signup form | `src/components/NotifySection.tsx` |
| `faq_item_expanded` | User expands an FAQ accordion item to read the answer | `src/components/FaqSection.tsx` |
| `news_link_clicked` | User clicks a curated news article link (includes title, source, url properties) | `src/components/NewsSection.tsx` |

## Next steps

We've built some insights and a dashboard to keep an eye on user behavior:

- **Dashboard**: [Analytics basics (wizard)](https://us.posthog.com/project/485141/dashboard/1758114)
- [User engagement overview](https://us.posthog.com/project/485141/insights/y2AO7Sop) — all 4 events on one line graph over 30 days
- [Notify signups total](https://us.posthog.com/project/485141/insights/fC4aBAIQ) — bold number for total signups
- [Theme preference distribution](https://us.posthog.com/project/485141/insights/sucxChDH) — pie chart of visitor dispositions
- [Most clicked news articles](https://us.posthog.com/project/485141/insights/0dJKJ2Xo) — bar chart of outbound news clicks by article title
- [FAQ engagement by question](https://us.posthog.com/project/485141/insights/IAwJstji) — bar chart of FAQ expansions by question text

## Verify before merging

- [ ] Run a full production build (`npm run build`) and fix any lint or type errors introduced by the generated code.
- [ ] Run the test suite — call sites that were rewritten or instrumented may need updated mocks or fixtures.
- [ ] Add `PUBLIC_POSTHOG_PROJECT_TOKEN` and `PUBLIC_POSTHOG_HOST` to `.env.example` and any bootstrap scripts so collaborators know what to set.
- [ ] Wire source-map upload (`posthog-cli sourcemap` or your bundler's upload step) into CI so production stack traces de-minify.

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-astro-static/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
