import type { ParsedStatus } from "../lib/pollStatus";

const WIKIPEDIA_API = "https://en.wikipedia.org/w/api.php";
const USER_AGENT = "mitch-dot-live/1.0 (https://ismitchmcconnella.live)";

export type WikipediaPollResult = {
  parsedStatus: ParsedStatus;
  detail: string;
  payloadSummary: string;
  rawPayload: string;
};

const DEATH_PATTERNS = [
  /\|\s*death_date\s*=\s*([^\n|{}]+)/i,
  /\|\s*death date\s*=\s*([^\n|{}]+)/i,
  /\{\{Death date and age\|([^|}\n]+)/i,
  /\{\{Death date\|([^|}\n]+)/i,
];

function cleanDeathValue(value: string): string {
  return value.replace(/\[\[([^|\]]+\|)?([^\]]+)\]\]/g, "$2").trim();
}

export function parseWikipediaDeath(wikitext: string): Pick<
  WikipediaPollResult,
  "parsedStatus" | "detail" | "payloadSummary"
> {
  const infoboxMatch = wikitext.match(
    /\{\{Infobox[\s\S]*?\n\}\}/i,
  );
  const searchText = infoboxMatch?.[0] ?? wikitext.slice(0, 8000);

  for (const pattern of DEATH_PATTERNS) {
    const match = searchText.match(pattern);
    if (match?.[1]) {
      const deathValue = cleanDeathValue(match[1]);
      if (deathValue && !/^\s*$/.test(deathValue)) {
        return {
          parsedStatus: "deceased",
          detail: `death date: ${deathValue}`,
          payloadSummary: `Wikipedia infobox death date: ${deathValue}`,
        };
      }
    }
  }

  return {
    parsedStatus: "alive",
    detail: "no infobox death date",
    payloadSummary: "No death date found in Wikipedia infobox",
  };
}

export async function fetchWikipediaPage(
  pageTitle: string,
): Promise<WikipediaPollResult> {
  const params = new URLSearchParams({
    action: "parse",
    page: pageTitle,
    prop: "wikitext",
    format: "json",
    formatversion: "2",
  });

  const response = await fetch(`${WIKIPEDIA_API}?${params.toString()}`, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Wikipedia API returned ${response.status} ${response.statusText}`,
    );
  }

  const data = (await response.json()) as {
    parse?: { wikitext?: string };
    error?: { info?: string };
  };

  if (data.error?.info) {
    throw new Error(`Wikipedia API error: ${data.error.info}`);
  }

  const wikitext = data.parse?.wikitext;
  if (!wikitext) {
    throw new Error(`Wikipedia page ${pageTitle} not found in response`);
  }

  const parsed = parseWikipediaDeath(wikitext);
  return {
    ...parsed,
    rawPayload: JSON.stringify({ pageTitle, snippet: wikitext.slice(0, 2000) }),
  };
}
