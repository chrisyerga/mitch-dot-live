type DataSourceLike = {
  lastCheckedAt: number | null;
  enabled?: boolean;
};

export function latestDataSourceCheckAt(
  sources: DataSourceLike[] | undefined,
  options: { enabledOnly?: boolean } = {},
): number | null {
  if (!sources?.length) {
    return null;
  }

  const { enabledOnly = true } = options;
  let latest: number | null = null;

  for (const source of sources) {
    if (enabledOnly && source.enabled === false) {
      continue;
    }
    if (
      source.lastCheckedAt != null &&
      (latest == null || source.lastCheckedAt > latest)
    ) {
      latest = source.lastCheckedAt;
    }
  }

  return latest;
}
