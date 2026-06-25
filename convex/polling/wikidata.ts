import type { ParsedStatus } from "../lib/pollStatus";

const WIKIDATA_API = "https://www.wikidata.org/w/api.php";
const USER_AGENT = "mitch-dot-live/1.0 (https://ismitchmcconnella.live)";

type WikidataTimeValue = {
  time?: string;
  precision?: number;
};

type WikidataDataValue = {
  type?: string;
  value?: WikidataTimeValue | string;
};

type WikidataSnak = {
  datavalue?: WikidataDataValue;
};

type WikidataClaim = {
  mainsnak?: WikidataSnak;
};

type WikidataClaims = Record<string, WikidataClaim[] | undefined>;

type WikidataEntityResponse = {
  entities?: Record<
    string,
    {
      claims?: WikidataClaims;
    }
  >;
};

export type WikidataPollResult = {
  parsedStatus: ParsedStatus;
  detail: string;
  payloadSummary: string;
  rawPayload: string;
};

function formatWikidataTime(time: string): string {
  const match = /^([+-]?\d{4})-(\d{2})-(\d{2})/.exec(time);
  if (!match) {
    return time;
  }
  return `${match[1].replace(/^\+/, "")}-${match[2]}-${match[3]}`;
}

export function parseDeathStatus(
  claims: WikidataClaims | undefined,
  deathProperty = "P570",
): Pick<WikidataPollResult, "parsedStatus" | "detail" | "payloadSummary"> {
  const deathClaims = claims?.[deathProperty];
  if (!deathClaims || deathClaims.length === 0) {
    return {
      parsedStatus: "alive",
      detail: "no P570 claim",
      payloadSummary: "No date of death (P570) claim found",
    };
  }

  const firstClaim = deathClaims[0];
  const timeValue = firstClaim?.mainsnak?.datavalue?.value;
  if (
    timeValue &&
    typeof timeValue === "object" &&
    typeof timeValue.time === "string"
  ) {
    const formatted = formatWikidataTime(timeValue.time);
    return {
      parsedStatus: "deceased",
      detail: `P570: ${formatted}`,
      payloadSummary: `Date of death (P570): ${formatted}`,
    };
  }

  return {
    parsedStatus: "deceased",
    detail: "P570 present (unparsed value)",
    payloadSummary: "Date of death (P570) claim present",
  };
}

export async function fetchWikidataEntity(
  entityId: string,
): Promise<WikidataPollResult> {
  const params = new URLSearchParams({
    action: "wbgetentities",
    ids: entityId,
    props: "claims",
    format: "json",
  });

  const response = await fetch(`${WIKIDATA_API}?${params.toString()}`, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Wikidata API returned ${response.status} ${response.statusText}`,
    );
  }

  const data = (await response.json()) as WikidataEntityResponse;
  const entity = data.entities?.[entityId];
  if (!entity) {
    throw new Error(`Wikidata entity ${entityId} not found in response`);
  }

  const parsed = parseDeathStatus(entity.claims);
  const rawPayload = JSON.stringify({ entityId, claims: entity.claims ?? {} });

  return {
    ...parsed,
    rawPayload,
  };
}
