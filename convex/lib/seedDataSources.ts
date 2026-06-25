const DEFAULT_WIRE_DOMAINS = [
  "apnews.com",
  "reuters.com",
  "bbc.com",
  "nytimes.com",
  "washingtonpost.com",
];

export const seedDataSources = [
  {
    key: "wikidata",
    name: "Wikidata (Google Knowledge Panel source)",
    url: "https://www.google.com/search?kgmid=/m/01z6ls&hl=en-US",
    confidence: 90,
    currentStatus: "unknown" as const,
    enabled: true,
    config: {
      wikidataEntityId: "Q355522",
      googleKgmid: "/m/01z6ls",
      deathProperty: "P570",
    },
  },
  {
    key: "wikipedia",
    name: "Wikipedia (en)",
    url: "https://en.wikipedia.org/wiki/Mitch_McConnell",
    confidence: 88,
    currentStatus: "unknown" as const,
    enabled: true,
    config: {
      wikipediaPageTitle: "Mitch_McConnell",
    },
  },
  {
    key: "congressgov",
    name: "Congress.gov",
    url: "https://www.congress.gov/member/mitch-mcconnell/M000355",
    confidence: 92,
    currentStatus: "unknown" as const,
    enabled: true,
    config: {
      bioguideId: "M000355",
    },
  },
  {
    key: "google_news_wires",
    name: "Major wire headlines",
    url: "https://news.google.com/",
    confidence: 75,
    currentStatus: "unknown" as const,
    enabled: true,
    config: {
      searchQuery:
        'Mitch McConnell (died OR death OR obituary OR "passed away")',
      allowedDomains: DEFAULT_WIRE_DOMAINS,
      maxAgeHours: 72,
    },
  },
  {
    key: "x_trends",
    name: "X (Twitter) trends",
    url: "https://x.com/search?q=Mitch%20McConnell%20(died%20OR%20death)",
    confidence: 25,
    currentStatus: "unknown" as const,
    enabled: true,
    config: {
      xQuery: 'Mitch McConnell (died OR death OR obituary OR "passed away")',
      maxAgeHours: 24,
      rumorThreshold: 5,
    },
  },
];
