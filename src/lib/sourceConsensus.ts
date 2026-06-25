import type { ParsedStatus } from "./pollDisplay";

export type DataSourceReading = {
  name: string;
  confidence: number;
  currentStatus: ParsedStatus;
  lastCheckedAt: number | null;
  lastError: string | null;
  enabled: boolean;
};

export type SourceConsensus = {
  isMaybe: boolean;
  aliveScore: number;
  deceasedScore: number;
  leadingDeceasedSourceName: string | null;
};

export type SourceConsensusCheck = {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
};

export type SourceConsensusContribution = {
  name: string;
  currentStatus: ParsedStatus;
  confidence: number;
  scorable: boolean;
  skipReason: string | null;
  side: "alive" | "deceased" | "none";
  contribution: number;
};

export type SourceConsensusBreakdown = SourceConsensus & {
  deceasedShare: number;
  deceasedSharePercent: number;
  maxDeceasedScore: number;
  checks: SourceConsensusCheck[];
  sources: SourceConsensusContribution[];
  heroAnswer: "YES" | "NO" | "MAYBE";
  statusLine: string | null;
};

/** Minimum total deceased confidence before MAYBE can appear (excludes X-only noise). */
export const MIN_DECEASED_SCORE = 60;

/** Deceased weight must reach this share of alive+deceased to count as meaningful disagreement. */
export const MIN_DECEASED_SHARE = 0.15;

export const DEV_PREVIEW_MAYBE_KEY = "mitch-dev-preview-maybe";
export const DEV_PREVIEW_MAYBE_EVENT = "mitch-preview-maybe-changed";
export const DEV_PREVIEW_MAYBE_SOURCE = "Major wire headlines (preview)";

function getSkipReason(source: DataSourceReading): string | null {
  if (source.enabled === false) {
    return "disabled";
  }
  if (source.lastCheckedAt == null) {
    return "never polled";
  }
  if (source.currentStatus === "error") {
    return "last poll errored";
  }
  if (source.currentStatus === "unknown") {
    return "unknown (not scored)";
  }
  return null;
}

function isScorableSource(source: DataSourceReading): boolean {
  return getSkipReason(source) == null;
}

export function isDevPreviewMaybeEnabled(): boolean {
  if (!import.meta.env.DEV || typeof localStorage === "undefined") {
    return false;
  }
  return localStorage.getItem(DEV_PREVIEW_MAYBE_KEY) === "1";
}

export function setDevPreviewMaybeEnabled(enabled: boolean): void {
  if (!import.meta.env.DEV || typeof window === "undefined") {
    return;
  }
  if (enabled) {
    localStorage.setItem(DEV_PREVIEW_MAYBE_KEY, "1");
  } else {
    localStorage.removeItem(DEV_PREVIEW_MAYBE_KEY);
  }
  window.dispatchEvent(new Event(DEV_PREVIEW_MAYBE_EVENT));
}

export function analyzeSourceConsensusBreakdown(
  sources: DataSourceReading[] | undefined,
  options: { isAlive?: boolean; previewMaybe?: boolean } = {},
): SourceConsensusBreakdown {
  const { isAlive = true, previewMaybe = false } = options;
  const empty: SourceConsensusBreakdown = {
    isMaybe: false,
    aliveScore: 0,
    deceasedScore: 0,
    leadingDeceasedSourceName: null,
    deceasedShare: 0,
    deceasedSharePercent: 0,
    maxDeceasedScore: 0,
    checks: [],
    sources: [],
    heroAnswer: isAlive ? "YES" : "NO",
    statusLine: null,
  };

  if (!sources?.length) {
    empty.checks = buildChecks(empty);
    return empty;
  }

  let aliveScore = 0;
  let deceasedScore = 0;
  let leadingDeceasedSourceName: string | null = null;
  let leadingDeceasedConfidence = 0;
  const contributions: SourceConsensusContribution[] = [];

  for (const source of sources) {
    const skipReason = getSkipReason(source);
    const scorable = skipReason == null;
    let side: SourceConsensusContribution["side"] = "none";
    let contribution = 0;

    if (scorable && source.currentStatus === "alive") {
      side = "alive";
      contribution = source.confidence;
      aliveScore += source.confidence;
    } else if (scorable && source.currentStatus === "deceased") {
      side = "deceased";
      contribution = source.confidence;
      deceasedScore += source.confidence;
      if (source.confidence > leadingDeceasedConfidence) {
        leadingDeceasedConfidence = source.confidence;
        leadingDeceasedSourceName = source.name;
      }
    }

    contributions.push({
      name: source.name,
      currentStatus: source.currentStatus,
      confidence: source.confidence,
      scorable,
      skipReason,
      side,
      contribution,
    });
  }

  const totalScore = aliveScore + deceasedScore;
  const deceasedShare = totalScore > 0 ? deceasedScore / totalScore : 0;
  const maxDeceasedScore = aliveScore * 2;

  const base: SourceConsensus = {
    isMaybe:
      aliveScore > 0 &&
      deceasedScore >= MIN_DECEASED_SCORE &&
      deceasedShare >= MIN_DECEASED_SHARE &&
      deceasedScore < maxDeceasedScore,
    aliveScore,
    deceasedScore,
    leadingDeceasedSourceName,
  };

  const showMaybe =
    (base.isMaybe && isAlive) ||
    (previewMaybe && isAlive && import.meta.env.DEV);

  const deceasedSourceName = previewMaybe
    ? DEV_PREVIEW_MAYBE_SOURCE
    : leadingDeceasedSourceName;

  const breakdown: SourceConsensusBreakdown = {
    ...base,
    deceasedShare,
    deceasedSharePercent: deceasedShare * 100,
    maxDeceasedScore,
    checks: buildChecks(base),
    sources: contributions,
    heroAnswer: showMaybe ? "MAYBE" : isAlive ? "YES" : "NO",
    statusLine: showMaybe && deceasedSourceName
      ? maybeStatusLine(deceasedSourceName)
      : null,
  };

  return breakdown;
}

function buildChecks(consensus: SourceConsensus): SourceConsensusCheck[] {
  const totalScore = consensus.aliveScore + consensus.deceasedScore;
  const deceasedShare = totalScore > 0 ? consensus.deceasedScore / totalScore : 0;
  const maxDeceasedScore = consensus.aliveScore * 2;

  return [
    {
      id: "alive-score",
      label: "At least one alive source",
      passed: consensus.aliveScore > 0,
      detail: `aliveScore = ${consensus.aliveScore} (must be > 0)`,
    },
    {
      id: "deceased-score",
      label: "Credible deceased signal",
      passed: consensus.deceasedScore >= MIN_DECEASED_SCORE,
      detail: `deceasedScore = ${consensus.deceasedScore} (must be ≥ ${MIN_DECEASED_SCORE})`,
    },
    {
      id: "deceased-share",
      label: "Deceased share of scored weight",
      passed: deceasedShare >= MIN_DECEASED_SHARE,
      detail: `${(deceasedShare * 100).toFixed(1)}% (must be ≥ ${MIN_DECEASED_SHARE * 100}%)`,
    },
    {
      id: "not-overwhelming",
      label: "Deceased not overwhelming",
      passed: consensus.deceasedScore < maxDeceasedScore,
      detail: `${consensus.deceasedScore} < ${maxDeceasedScore} (2× aliveScore)`,
    },
    {
      id: "consensus-maybe",
      label: "Source consensus = MAYBE",
      passed: consensus.isMaybe,
      detail: "All four checks above must pass",
    },
  ];
}

export function analyzeSourceConsensus(
  sources: DataSourceReading[] | undefined,
  options: { isAlive?: boolean; previewMaybe?: boolean } = {},
): SourceConsensus {
  return analyzeSourceConsensusBreakdown(sources, options);
}

export function maybeStatusLine(deceasedSourceName: string): string {
  return `${deceasedSourceName} is reporting the Senator's death but sources are inconclusive. See details below.`;
}
