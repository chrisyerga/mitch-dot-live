export function formatDateEt(
  timestamp: number,
  options: Intl.DateTimeFormatOptions = {},
): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    ...options,
  }).format(new Date(timestamp));
}

export function formatHeroDate(timestamp: number): string {
  return formatDateEt(timestamp, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatCheckedAt(timestamp: number | null | undefined): string {
  if (timestamp == null) {
    return "Never";
  }

  return formatDateEt(timestamp, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "shortGeneric",
  });
}
