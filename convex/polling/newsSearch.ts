import type { DataSourceConfig, ParsedStatus } from "../lib/pollStatus";

const USER_AGENT = "mitch-dot-live/1.0 (https://ismitchmcconnella.live)";

const DEFAULT_DOMAINS = [
  "apnews.com",
  "reuters.com",
  "bbc.com",
  "nytimes.com",
  "washingtonpost.com",
];

export type WirePollResult = {
  parsedStatus: ParsedStatus;
  detail: string;
  payloadSummary: string;
  rawPayload: string;
};

type RssItem = {
  title: string;
  link: string;
  pubDate: string;
  sourceUrl?: string;
};

function decodeXml(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function parseRssItems(xml: string): RssItem[] {
  const items: RssItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title = block.match(/<title>([\s\S]*?)<\/title>/i)?.[1];
    const link = block.match(/<link>([\s\S]*?)<\/link>/i)?.[1];
    const pubDate = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1];
    const sourceUrl = block.match(/<source[^>]*url="([^"]+)"/i)?.[1];

    if (title && link && pubDate) {
      items.push({
        title: decodeXml(title.trim()),
        link: decodeXml(link.trim()),
        pubDate: decodeXml(pubDate.trim()),
        sourceUrl: sourceUrl ? decodeXml(sourceUrl.trim()) : undefined,
      });
    }
  }

  return items;
}

function domainFromUrl(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function isAllowedDomain(url: string, allowedDomains: string[]): boolean {
  const domain = domainFromUrl(url);
  if (!domain) return false;
  return allowedDomains.some(
    (allowed) => domain === allowed || domain.endsWith(`.${allowed}`),
  );
}

function isRecent(pubDate: string, maxAgeHours: number): boolean {
  const timestamp = Date.parse(pubDate);
  if (Number.isNaN(timestamp)) return false;
  return Date.now() - timestamp <= maxAgeHours * 60 * 60 * 1000;
}

/** Headlines that mention death only in rumor/recovery/health-update context. */
const RUMOR_OR_RECOVERY_PATTERNS = [
  /\b(recover(y|ing)|continuing (his |her )?recovery)\b/i,
  /\b(rumor|rumours|debunk|hoax|fact.?check)\b/i,
  /\b(health status|what we know|what is)\b/i,
  /\b(amid|about)\b[^.]{0,40}\b(rumor|rumours|death rumor)/i,
  /\b(won't say|refuses? to|won't confirm|won't answer)\b/i,
  /\b(hospital stay|in hospital|cardiac arrest|unconscious)\b/i,
  /\b(life support|brain dead)\b/i,
  /\bupdate on\b/i,
  /\bscarce\b/i,
];

/** Headlines that actually report death, not merely discuss it. */
const DEATH_REPORT_PATTERNS = [
  /\b(died|dies)\b/i,
  /\bhas died\b/i,
  /\bobituar/i,
  /\bpassed away\b/i,
  /\bpasses away\b/i,
  /\bdeath of\b/i,
  /\bmourn(s|ing)?\b/i,
  /\bfuneral\b/i,
];

export function isDeathReportHeadline(title: string): boolean {
  if (RUMOR_OR_RECOVERY_PATTERNS.some((pattern) => pattern.test(title))) {
    return false;
  }
  return DEATH_REPORT_PATTERNS.some((pattern) => pattern.test(title));
}

export async function fetchWireHeadlines(
  config: DataSourceConfig,
): Promise<WirePollResult> {
  const searchQuery =
    config.searchQuery ??
    'Mitch McConnell (died OR death OR obituary OR "passed away")';
  const allowedDomains = config.allowedDomains ?? DEFAULT_DOMAINS;
  const maxAgeHours = config.maxAgeHours ?? 72;

  const params = new URLSearchParams({
    q: searchQuery,
    hl: "en-US",
    gl: "US",
    ceid: "US:en",
  });

  const response = await fetch(
    `https://news.google.com/rss/search?${params.toString()}`,
    {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/rss+xml, application/xml, text/xml",
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `Google News RSS returned ${response.status} ${response.statusText}`,
    );
  }

  const xml = await response.text();
  const items = parseRssItems(xml);
  const wireItems = items.filter(
    (item) =>
      isRecent(item.pubDate, maxAgeHours) &&
      isAllowedDomain(item.sourceUrl ?? item.link, allowedDomains),
  );

  const deathReports = wireItems.filter((item) => isDeathReportHeadline(item.title));
  const rumorMatches = wireItems.filter(
    (item) => !isDeathReportHeadline(item.title),
  );

  if (deathReports.length > 0) {
    const top = deathReports[0];
    const domain = domainFromUrl(top.sourceUrl ?? top.link) ?? "wire";
    return {
      parsedStatus: "deceased",
      detail: `${domain}: ${top.title}`,
      payloadSummary: `Wire headline match: ${top.title}`,
      rawPayload: JSON.stringify({
        matches: deathReports.slice(0, 5),
        rumorMatches: rumorMatches.slice(0, 3),
      }),
    };
  }

  const rumorNote =
    rumorMatches.length > 0
      ? ` (${rumorMatches.length} rumor/recovery headline${rumorMatches.length === 1 ? "" : "s"} ignored)`
      : "";

  return {
    parsedStatus: "unknown",
    detail: `no wire death headlines in last ${maxAgeHours}h${rumorNote}`,
    payloadSummary: `No death-reporting wire headlines in the last ${maxAgeHours} hours`,
    rawPayload: JSON.stringify({
      checkedItems: items.length,
      matches: [],
      rumorMatches: rumorMatches.slice(0, 5),
    }),
  };
}
