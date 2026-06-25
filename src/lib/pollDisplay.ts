export type ParsedStatus = "alive" | "deceased" | "unknown" | "error";

export function formatParsedStatusAnswer(status: ParsedStatus): string {
  switch (status) {
    case "alive":
      return "Alive";
    case "deceased":
      return "Deceased";
    case "unknown":
      return "Unknown";
    case "error":
      return "Error";
  }
}

export function parsedStatusTone(
  status: ParsedStatus,
): "positive" | "negative" | "neutral" | "error" {
  switch (status) {
    case "alive":
      return "positive";
    case "deceased":
      return "negative";
    case "error":
      return "error";
    default:
      return "neutral";
  }
}

export function formatAnswerDetail(
  status: ParsedStatus,
  detail: string | null | undefined,
): string {
  const label = formatParsedStatusAnswer(status);
  if (!detail || status === "error") {
    return label;
  }
  return `${label} · ${detail}`;
}

export function formatConfidence(confidence: number): string {
  if (confidence >= 85) return `High (${confidence})`;
  if (confidence >= 60) return `Medium (${confidence})`;
  return `Low (${confidence})`;
}

export function confidenceTone(
  confidence: number,
): "high" | "medium" | "low" {
  if (confidence >= 85) return "high";
  if (confidence >= 60) return "medium";
  return "low";
}
