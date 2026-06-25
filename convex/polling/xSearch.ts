import type { DataSourceConfig, ParsedStatus } from "../lib/pollStatus";

export type XPollResult = {
  parsedStatus: ParsedStatus;
  detail: string;
  payloadSummary: string;
  rawPayload: string;
};

type XTweet = {
  id: string;
  text: string;
};

type XSearchResponse = {
  data?: XTweet[];
  meta?: {
    result_count?: number;
  };
  errors?: Array<{ message?: string }>;
};

const DEATH_KEYWORDS =
  /\b(died|death|dead|obituary|passed away|has died|rip)\b/i;

export async function fetchXSignal(config: DataSourceConfig): Promise<XPollResult> {
  const bearerToken = process.env.X_BEARER_TOKEN;
  if (!bearerToken) {
    throw new Error("X_BEARER_TOKEN is not configured in Convex environment");
  }

  const query =
    config.xQuery ??
    'Mitch McConnell (died OR death OR obituary OR "passed away")';
  const rumorThreshold = config.rumorThreshold ?? 5;

  const params = new URLSearchParams({
    query,
    max_results: "10",
    "tweet.fields": "created_at,lang",
  });

  const response = await fetch(
    `https://api.twitter.com/2/tweets/search/recent?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${bearerToken}`,
        Accept: "application/json",
        "User-Agent": "mitch-dot-live/1.0 (https://ismitchmcconnella.live)",
      },
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`X API returned ${response.status}: ${body.slice(0, 200)}`);
  }

  const data = (await response.json()) as XSearchResponse;
  if (data.errors?.length) {
    throw new Error(data.errors[0]?.message ?? "X API error");
  }

  const tweets = data.data ?? [];
  const deathMentions = tweets.filter((tweet) => DEATH_KEYWORDS.test(tweet.text));
  const count = deathMentions.length;

  if (count >= rumorThreshold) {
    return {
      parsedStatus: "unknown",
      detail: `elevated rumor activity on X (${count} recent posts)`,
      payloadSummary: `X search found ${count} recent death-related posts (not treated as confirmation)`,
      rawPayload: JSON.stringify({
        resultCount: data.meta?.result_count ?? tweets.length,
        deathMentions: deathMentions.slice(0, 5),
      }),
    };
  }

  return {
    parsedStatus: "unknown",
    detail: `no significant rumor spike on X (${count} recent posts)`,
    payloadSummary: `X search found ${count} recent death-related posts below threshold`,
    rawPayload: JSON.stringify({
      resultCount: data.meta?.result_count ?? tweets.length,
      deathMentions: deathMentions.slice(0, 5),
    }),
  };
}
