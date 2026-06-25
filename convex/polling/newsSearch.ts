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
  const matches = items.filter(
    (item) =>
      isRecent(item.pubDate, maxAgeHours) &&
      isAllowedDomain(item.sourceUrl ?? item.link, allowedDomains),
  );

  if (matches.length > 0) {
    const top = matches[0];
    const domain = domainFromUrl(top.sourceUrl ?? top.link) ?? "wire";
    return {
      parsedStatus: "deceased",
      detail: `${domain}: ${top.title}`,
      payloadSummary: `Wire headline match: ${top.title}`,
      rawPayload: JSON.stringify({ matches: matches.slice(0, 5) }),
    };
  }

  return {
    parsedStatus: "unknown",
    detail: `no wire death headlines in last ${maxAgeHours}h`,
    payloadSummary: `No matching wire headlines in the last ${maxAgeHours} hours`,
    rawPayload: JSON.stringify({ checkedItems: items.length, matches: [] }),
  };
}
