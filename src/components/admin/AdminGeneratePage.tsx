import { useAction, useQuery } from "convex/react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { formatCheckedAt } from "../../lib/format";

type SyncResult = {
  status: "queued" | "running" | "complete" | "failed";
  currentStage: string | null;
  iteration: number | null;
  maxIterations: number | null;
  errorMessage: string | null;
  editorialPostId: Id<"editorialPosts"> | null;
  resultTitle: string | null;
  resultSlug: string | null;
};

function statusLabel(status: SyncResult["status"]): string {
  switch (status) {
    case "queued":
      return "Queued";
    case "running":
      return "Running";
    case "complete":
      return "Complete";
    case "failed":
      return "Failed";
  }
}

function stageLabel(stage: string | null): string {
  if (!stage) return "Waiting to start";
  return stage.replace(/_/g, " ");
}

export function AdminGeneratePage({
  token,
  onError,
}: {
  token: string;
  onError: (message: string | null) => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [activeJobId, setActiveJobId] = useState<Id<"forgeGenerationJobs"> | null>(
    null,
  );
  const [syncState, setSyncState] = useState<SyncResult | null>(null);

  const startGeneration = useAction(api.forgeActions.startGeneration);
  const syncGeneration = useAction(api.forgeActions.syncGeneration);
  const recentJobs = useQuery(api.forge.listRecentJobs, { token });
  const activeJob = useQuery(
    api.forge.getJob,
    activeJobId ? { token, jobId: activeJobId } : "skip",
  );

  const runSync = useCallback(async () => {
    if (!activeJobId) return;

    try {
      const result = await syncGeneration({ token, jobId: activeJobId });
      setSyncState(result);
      if (result.status === "failed") {
        onError(result.errorMessage ?? "Generation failed");
      } else {
        onError(null);
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to sync generation");
    }
  }, [activeJobId, onError, syncGeneration, token]);

  useEffect(() => {
    if (!activeJobId) return;

    const status = syncState?.status ?? activeJob?.status;
    if (status === "complete" || status === "failed") {
      return;
    }

    void runSync();
    const interval = window.setInterval(() => {
      void runSync();
    }, 3000);

    return () => window.clearInterval(interval);
  }, [activeJob, activeJobId, runSync, syncState?.status]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = prompt.trim();
    if (!trimmed) {
      onError("Enter a prompt describing the blog post topic or keywords");
      return;
    }

    setBusy(true);
    onError(null);
    setSyncState(null);

    try {
      const jobId = await startGeneration({ token, prompt: trimmed });
      setActiveJobId(jobId);
      setSyncState({
        status: "queued",
        currentStage: null,
        iteration: null,
        maxIterations: null,
        errorMessage: null,
        editorialPostId: null,
        resultTitle: null,
        resultSlug: null,
      });
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to start generation");
    } finally {
      setBusy(false);
    }
  };

  const displayStatus = syncState?.status ?? activeJob?.status;
  const displayStage = syncState?.currentStage ?? activeJob?.currentStage ?? null;
  const displayIteration = syncState?.iteration ?? activeJob?.iteration ?? null;
  const displayMaxIterations =
    syncState?.maxIterations ?? activeJob?.maxIterations ?? null;
  const displayError = syncState?.errorMessage ?? activeJob?.errorMessage ?? null;
  const displayTitle = syncState?.resultTitle ?? activeJob?.resultTitle ?? null;
  const displaySlug = syncState?.resultSlug ?? activeJob?.resultSlug ?? null;
  const isRunning =
    displayStatus === "queued" || displayStatus === "running";

  return (
    <div className="space-y-8">
      <section className="admin-card">
        <h2 className="font-display text-2xl text-white">Generate blog post</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Enter a topic or target keywords. Forge will research, draft, and evaluate
          an SEO article, then save it as a draft in Editorial.
        </p>

        <form className="mt-6 space-y-4" onSubmit={(event) => void handleSubmit(event)}>
          <div>
            <label
              htmlFor="generate-prompt"
              className="mb-2 block font-mono text-xs uppercase tracking-[0.2em] text-zinc-500"
            >
              Prompt
            </label>
            <textarea
              id="generate-prompt"
              className="admin-input min-h-32 w-full resize-y"
              placeholder="e.g. mitch mcconnell 911 call"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              disabled={busy || isRunning}
            />
          </div>

          <button
            type="submit"
            className="admin-btn"
            disabled={busy || isRunning || !prompt.trim()}
          >
            {isRunning ? "Generating…" : "Generate draft"}
          </button>
        </form>
      </section>

      {activeJobId && displayStatus && (
        <section className="admin-card">
          <h3 className="font-display text-xl text-white">Progress</h3>
          <dl className="mt-4 space-y-3 font-mono text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Status</dt>
              <dd className="text-zinc-200">{statusLabel(displayStatus)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Stage</dt>
              <dd className="text-right text-zinc-200">{stageLabel(displayStage)}</dd>
            </div>
            {displayIteration !== null && displayMaxIterations !== null && (
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Iteration</dt>
                <dd className="text-zinc-200">
                  {displayIteration} / {displayMaxIterations}
                </dd>
              </div>
            )}
          </dl>

          {isRunning && (
            <p className="mt-4 text-sm text-zinc-400" aria-live="polite">
              Forge is working — this usually takes a few minutes.
            </p>
          )}

          {displayStatus === "failed" && displayError && (
            <p className="mt-4 text-sm text-red-400" role="alert">
              {displayError}
            </p>
          )}

          {displayStatus === "complete" && displayTitle && (
            <div className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
              <p className="font-display text-lg text-emerald-100">{displayTitle}</p>
              {displaySlug && (
                <p className="mt-1 font-mono text-xs text-emerald-200/80">
                  /blog/{displaySlug}/
                </p>
              )}
              <a
                href="/admin/editorial/"
                className="admin-btn mt-4 inline-block"
              >
                Review in Editorial
              </a>
            </div>
          )}
        </section>
      )}

      {recentJobs && recentJobs.length > 0 && (
        <section className="admin-card">
          <h3 className="font-display text-xl text-white">Recent generations</h3>
          <ul className="mt-4 divide-y divide-zinc-800">
            {recentJobs.map((job) => (
              <li key={job._id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm text-zinc-200">{job.prompt}</p>
                  <p className="font-mono text-xs text-zinc-500">
                    {formatCheckedAt(job.createdAt)}
                    {job.resultSlug ? ` · /blog/${job.resultSlug}/` : ""}
                  </p>
                </div>
                <span
                  className={`font-mono text-xs uppercase tracking-wider ${
                    job.status === "complete"
                      ? "text-emerald-400"
                      : job.status === "failed"
                        ? "text-red-400"
                        : "text-amber-400"
                  }`}
                >
                  {statusLabel(job.status)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
