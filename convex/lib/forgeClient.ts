export type ForgeDeliverable = {
  title: string;
  slug: string;
  metaDescription: string;
  openGraph: {
    title: string;
    description: string;
    type: string;
  };
  bodyMarkdown: string;
  tags: string[];
  excerpt: string;
};

export type ForgeTaskResponse = {
  taskId: string;
  status: string;
  recipe: string;
  currentStage: string | null;
  iteration: number;
  maxIterations: number;
  pendingInput: Array<{ key: string; question: string; why?: string }> | null;
  errorMessage: string | null;
  createdAt: number;
  finishedAt: number | null;
  deliverable: ForgeDeliverable | null;
};

export function getForgeConfig(): {
  apiKey: string;
  projectId: string;
  baseUrl: string;
} {
  const apiKey = process.env.FORGE_API_KEY;
  const projectId = process.env.FORGE_PROJECT_ID;
  const baseUrl = process.env.FORGE_BASE_URL ?? "https://forge.lindale.tech";

  if (!apiKey) {
    throw new Error("FORGE_API_KEY is not configured in Convex environment");
  }
  if (!projectId) {
    throw new Error("FORGE_PROJECT_ID is not configured in Convex environment");
  }

  return { apiKey, projectId, baseUrl };
}

function authHeaders(apiKey: string): HeadersInit {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

export function buildSeoBrief(prompt: string): Record<string, unknown> {
  const trimmed = prompt.trim();
  return {
    keywords: [trimmed],
    notes: trimmed,
    audience:
      "People searching for news about Senator Mitch McConnell's health and related topics",
  };
}

export async function createForgeTask(
  prompt: string,
): Promise<{ taskId: string }> {
  const { apiKey, projectId, baseUrl } = getForgeConfig();

  const response = await fetch(`${baseUrl}/v1/tasks`, {
    method: "POST",
    headers: authHeaders(apiKey),
    body: JSON.stringify({
      projectId,
      recipe: "seo_article",
      brief: buildSeoBrief(prompt),
      maxIterations: 2,
    }),
  });

  const body = (await response.json()) as {
    taskId?: string;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(
      body.error ?? `Forge task creation failed (${response.status})`,
    );
  }

  if (!body.taskId) {
    throw new Error("Forge did not return a taskId");
  }

  return { taskId: body.taskId };
}

export async function getForgeTask(taskId: string): Promise<ForgeTaskResponse> {
  const { apiKey, baseUrl } = getForgeConfig();

  const response = await fetch(
    `${baseUrl}/v1/tasks/${encodeURIComponent(taskId)}`,
    {
      headers: authHeaders(apiKey),
    },
  );

  const body = (await response.json()) as ForgeTaskResponse & {
    error?: string;
  };

  if (!response.ok) {
    throw new Error(body.error ?? `Forge task fetch failed (${response.status})`);
  }

  return body;
}

export function mapForgeStatus(
  forgeStatus: string,
): "queued" | "running" | "complete" | "failed" {
  switch (forgeStatus) {
    case "queued":
      return "queued";
    case "running":
    case "needs_input":
      return "running";
    case "complete":
      return "complete";
    case "failed":
    case "canceled":
      return "failed";
    default:
      return "running";
  }
}

export function parseDeliverable(
  deliverable: unknown,
): ForgeDeliverable | null {
  if (!deliverable || typeof deliverable !== "object") {
    return null;
  }

  const record = deliverable as Record<string, unknown>;
  if (
    typeof record.title !== "string" ||
    typeof record.slug !== "string" ||
    typeof record.metaDescription !== "string" ||
    typeof record.bodyMarkdown !== "string" ||
    !Array.isArray(record.tags)
  ) {
    return null;
  }

  return {
    title: record.title,
    slug: record.slug,
    metaDescription: record.metaDescription,
    openGraph:
      record.openGraph && typeof record.openGraph === "object"
        ? (record.openGraph as ForgeDeliverable["openGraph"])
        : { title: record.title, description: record.metaDescription, type: "article" },
    bodyMarkdown: record.bodyMarkdown,
    tags: record.tags.filter((tag): tag is string => typeof tag === "string"),
    excerpt: typeof record.excerpt === "string" ? record.excerpt : "",
  };
}
