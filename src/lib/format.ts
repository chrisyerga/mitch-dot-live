/** Format a timestamp for `<input type="datetime-local">` (local time, no seconds). */
export function toDatetimeLocalValue(timestamp: number): string {
  const date = new Date(timestamp);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Parse an `<input type="datetime-local">` value to a timestamp (local time). */
export function fromDatetimeLocalValue(value: string): number {
  return new Date(value).getTime();
}

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

export function formatRelativeCheckedAt(
  timestamp: number | null | undefined,
  now: number = Date.now(),
): string {
  if (timestamp == null) {
    return "Never";
  }

  const diffMs = Math.max(0, now - timestamp);
  const seconds = Math.floor(diffMs / 1000);

  if (seconds < 60) {
    return seconds === 1 ? "1 second ago" : `${seconds} seconds ago`;
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return days === 1 ? "1 day ago" : `${days} days ago`;
  }

  return formatCheckedAt(timestamp);
}
