type PostHogClient = {
  capture?: (event: string, properties?: Record<string, unknown>) => void;
};

export function captureEvent(
  event: string,
  properties?: Record<string, unknown>,
): void {
  if (typeof window === "undefined") return;

  const posthog = window.posthog as PostHogClient | undefined;
  if (!posthog || typeof posthog.capture !== "function") return;

  posthog.capture(event, properties);
}
