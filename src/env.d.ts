/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_CONVEX_URL: string;
  readonly PUBLIC_POSTHOG_PROJECT_TOKEN?: string;
  readonly PUBLIC_POSTHOG_HOST?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  __posthog_initialized?: boolean;
  posthog?: {
    capture: (event: string, properties?: Record<string, unknown>) => void;
    identify: (distinctId: string, properties?: Record<string, unknown>) => void;
    reset: () => void;
    captureException: (error: unknown) => void;
  };
}
