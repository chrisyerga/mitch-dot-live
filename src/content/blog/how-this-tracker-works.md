---
title: "What this Mitch McConnell status tracker checks"
description: "A plain-language guide to the data sources, confidence scores, and MAYBE state used on ismitchmcconnella.live."
pubDate: 2026-06-20
tags:
  - tracker
  - reliability
  - infomation-sources
---

This site exists because people repeatedly search a simple question: **Is Mitch McConnell alive?** The answer should be factual, fast, and transparent about where it comes from.

## The three public answers

- **YES** — structured records show no death date, and no credible recent obituary headline has been confirmed
- **MAYBE** — sources disagree, often because a wire headline reports death while biographical databases have not updated
- **NO** — human operators have confirmed death across multiple credible sources (this state is not triggered by automation alone)

## Sources and confidence scores

Each automated check carries a confidence weight from 0–100:

| Source | Typical confidence | What it checks |
| --- | --- | --- |
| Wikidata / Google Knowledge | 90 | Death date property on entity Q355522 |
| Wikipedia (en) | 88 | Death-related templates and categories |
| Congress.gov | 92 | Bioguide record M000355 |
| Major wire headlines | 75 | Recent AP/Reuters/BBC/NYT/WaPo-style obituary searches |

Wire sources can push toward death when a fresh headline exists, but **absence of a headline is not proof someone is alive** — that is why structured records carry more weight for the YES case.

## Polling schedule

Convex cron jobs poll enabled sources about every **15 minutes**. Results land in `pollSnapshots` and feed the public MAYBE breakdown on the homepage.

## Where to go next

- [Live YES/NO status](/)
- [Full polling history](/sources/)
- [Blog index](/blog/)
