import type { ParsedStatus } from "../lib/pollStatus";

const CONGRESS_API = "https://api.congress.gov/v3";

export type CongressPollResult = {
  parsedStatus: ParsedStatus;
  detail: string;
  payloadSummary: string;
  rawPayload: string;
};

type CongressMemberResponse = {
  member?: {
    deathYear?: string | number;
    currentMember?: boolean | string;
    name?: string;
  };
};

function isCurrentMember(value: boolean | string | undefined): boolean {
  if (value === true) return true;
  if (value === false) return false;
  return String(value).toLowerCase() === "true";
}

export function parseCongressMember(
  member: CongressMemberResponse["member"],
): Pick<CongressPollResult, "parsedStatus" | "detail" | "payloadSummary"> {
  if (!member) {
    throw new Error("Congress.gov member payload missing");
  }

  if (member.deathYear != null && String(member.deathYear).trim() !== "") {
    return {
      parsedStatus: "deceased",
      detail: `deathYear: ${member.deathYear}`,
      payloadSummary: `Congress.gov deathYear: ${member.deathYear}`,
    };
  }

  if (isCurrentMember(member.currentMember)) {
    return {
      parsedStatus: "alive",
      detail: "currentMember: true, no deathYear",
      payloadSummary: "Congress.gov lists member as current with no death year",
    };
  }

  return {
    parsedStatus: "unknown",
    detail: "not current member and no deathYear",
    payloadSummary: "Congress.gov member status unclear",
  };
}

export async function fetchCongressMember(
  bioguideId: string,
): Promise<CongressPollResult> {
  const apiKey = process.env.CONGRESS_GOV_API_KEY;
  if (!apiKey) {
    throw new Error("CONGRESS_GOV_API_KEY is not configured in Convex environment");
  }

  const params = new URLSearchParams({
    format: "json",
    api_key: apiKey,
  });

  const response = await fetch(
    `${CONGRESS_API}/member/${bioguideId}?${params.toString()}`,
    {
      headers: {
        Accept: "application/json",
        "User-Agent": "mitch-dot-live/1.0 (https://ismitchmcconnella.live)",
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `Congress.gov API returned ${response.status} ${response.statusText}`,
    );
  }

  const data = (await response.json()) as CongressMemberResponse;
  const parsed = parseCongressMember(data.member);

  return {
    ...parsed,
    rawPayload: JSON.stringify({ bioguideId, member: data.member ?? null }),
  };
}
