import { useMutation, useQuery } from "convex/react";
import { useEffect, useState, type FormEvent } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import {
  analyzeSourceConsensusBreakdown,
  DEV_PREVIEW_MAYBE_EVENT,
  isDevPreviewMaybeEnabled,
  setDevPreviewMaybeEnabled,
} from "../lib/sourceConsensus";
import { formatParsedStatusAnswer } from "../lib/pollDisplay";
import { formatCheckedAt } from "../lib/format";

const SESSION_KEY = "adminSessionToken";

type NewsFormState = {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  isPublished: boolean;
  sortOrder: number;
  imageUrl: string;
};

const emptyForm: NewsFormState = {
  title: "",
  url: "",
  source: "",
  publishedAt: new Date().toISOString().slice(0, 10),
  isPublished: true,
  sortOrder: 0,
  imageUrl: "",
};

function getStoredToken(): string | null {
  return localStorage.getItem(SESSION_KEY);
}

function DataSourcesPanel({
  token,
  onError,
}: {
  token: string;
  onError: (message: string | null) => void;
}) {
  const dataSources = useQuery(api.dataSources.list);
  const setEnabled = useMutation(api.dataSources.setEnabled);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);

  const sortedSources = dataSources
    ? [...dataSources].sort((a, b) => b.confidence - a.confidence)
    : dataSources;

  const handleToggle = async (key: string, enabled: boolean) => {
    setTogglingKey(key);
    onError(null);
    try {
      await setEnabled({ token, key, enabled });
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to update data source");
    } finally {
      setTogglingKey(null);
    }
  };

  return (
    <section className="admin-card mt-8 rounded-2xl p-6">
      <h2 className="font-display text-2xl">Data sources</h2>
      <p className="mt-2 opacity-80">
        Enable or disable automated polling. Disabled sources are hidden on the
        public homepage and excluded from consensus scoring.
      </p>

      {sortedSources === undefined ? (
        <p className="mt-4 opacity-70">Loading data sources…</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left">
                <th className="px-3 py-2 font-mono text-xs uppercase tracking-[0.12em] opacity-70">
                  Enabled
                </th>
                <th className="px-3 py-2 font-mono text-xs uppercase tracking-[0.12em] opacity-70">
                  Source
                </th>
                <th className="px-3 py-2 font-mono text-xs uppercase tracking-[0.12em] opacity-70">
                  Answer
                </th>
                <th className="px-3 py-2 font-mono text-xs uppercase tracking-[0.12em] opacity-70">
                  Confidence
                </th>
                <th className="px-3 py-2 font-mono text-xs uppercase tracking-[0.12em] opacity-70">
                  Last checked
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedSources.map((source) => (
                <tr key={source.key} className="border-b border-white/10">
                  <td className="px-3 py-2 align-top">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={source.enabled}
                        disabled={togglingKey === source.key}
                        onChange={(e) =>
                          void handleToggle(source.key, e.target.checked)
                        }
                      />
                      <span className="sr-only">
                        {source.enabled ? "Disable" : "Enable"} {source.name}
                      </span>
                    </label>
                  </td>
                  <td className="px-3 py-2 align-top">
                    <p className="font-semibold">{source.name}</p>
                    <p className="mt-1 font-mono text-xs opacity-60">{source.key}</p>
                    {source.key === "x_trends" && (
                      <p className="mt-1 text-xs text-amber-200/80">
                        X search polling is costly (~$2/day at 15-minute intervals).
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-2 align-top">
                    {formatParsedStatusAnswer(source.currentStatus)}
                    {source.currentStatusDetail && (
                      <p className="mt-1 text-xs opacity-70">
                        {source.currentStatusDetail}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-2 align-top">{source.confidence}</td>
                  <td className="px-3 py-2 align-top font-mono text-xs opacity-70">
                    {formatCheckedAt(source.lastCheckedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function SourceConsensusPanel({
  isAlive,
}: {
  isAlive: boolean;
}) {
  const dataSources = useQuery(api.dataSources.list);
  const [previewMaybe, setPreviewMaybe] = useState(false);

  useEffect(() => {
    const syncPreview = () => setPreviewMaybe(isDevPreviewMaybeEnabled());
    syncPreview();
    window.addEventListener(DEV_PREVIEW_MAYBE_EVENT, syncPreview);
    return () => window.removeEventListener(DEV_PREVIEW_MAYBE_EVENT, syncPreview);
  }, []);

  const breakdown = analyzeSourceConsensusBreakdown(dataSources, {
    isAlive,
    previewMaybe,
  });

  return (
    <section className="admin-card mt-8 rounded-2xl p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl">Source consensus</h2>
          <p className="mt-2 opacity-80">
            Weighted disagreement drives the public MAYBE state while admin status
            remains YES.
          </p>
        </div>
        {import.meta.env.DEV && (
          <button
            type="button"
            className={`admin-btn rounded-lg px-4 py-2 ${previewMaybe ? "admin-btn-danger" : ""}`}
            onClick={() => setDevPreviewMaybeEnabled(!previewMaybe)}
          >
            {previewMaybe ? "Disable MAYBE preview" : "Preview MAYBE on homepage"}
          </button>
        )}
      </div>

      {import.meta.env.DEV && previewMaybe && (
        <p className="mt-4 rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          Dev preview is active. Open the homepage in another tab to see MAYBE
          without changing data sources.
        </p>
      )}

      {dataSources === undefined ? (
        <p className="mt-4 opacity-70">Loading data sources…</p>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-white/10 p-4">
              <p className="font-mono text-xs uppercase tracking-[0.15em] opacity-70">
                Hero answer
              </p>
              <p className="mt-2 text-2xl font-bold">{breakdown.heroAnswer}</p>
            </div>
            <div className="rounded-xl border border-white/10 p-4">
              <p className="font-mono text-xs uppercase tracking-[0.15em] opacity-70">
                Alive score
              </p>
              <p className="mt-2 text-2xl font-bold">{breakdown.aliveScore}</p>
            </div>
            <div className="rounded-xl border border-white/10 p-4">
              <p className="font-mono text-xs uppercase tracking-[0.15em] opacity-70">
                Deceased score
              </p>
              <p className="mt-2 text-2xl font-bold">{breakdown.deceasedScore}</p>
            </div>
            <div className="rounded-xl border border-white/10 p-4">
              <p className="font-mono text-xs uppercase tracking-[0.15em] opacity-70">
                Deceased share
              </p>
              <p className="mt-2 text-2xl font-bold">
                {breakdown.deceasedSharePercent.toFixed(1)}%
              </p>
            </div>
          </div>

          {breakdown.statusLine && (
            <p className="mt-4 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm">
              <span className="font-mono text-xs uppercase tracking-[0.15em] opacity-70">
                Status line
              </span>
              <span className="mt-2 block">{breakdown.statusLine}</span>
            </p>
          )}

          <div className="mt-6">
            <h3 className="font-display text-lg">Checks</h3>
            <ul className="mt-3 space-y-2">
              {breakdown.checks.map((check) => (
                <li
                  key={check.id}
                  className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-white/10 px-4 py-3"
                >
                  <div>
                    <p className="font-semibold">
                      {check.passed ? "✓" : "✗"} {check.label}
                    </p>
                    <p className="mt-1 font-mono text-xs opacity-70">{check.detail}</p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${
                      check.passed
                        ? "bg-emerald-500/15 text-emerald-300"
                        : "bg-red-500/15 text-red-300"
                    }`}
                  >
                    {check.passed ? "pass" : "fail"}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 overflow-x-auto">
            <h3 className="font-display text-lg">Source contributions</h3>
            <table className="mt-3 w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left">
                  <th className="px-3 py-2 font-mono text-xs uppercase tracking-[0.12em] opacity-70">
                    Source
                  </th>
                  <th className="px-3 py-2 font-mono text-xs uppercase tracking-[0.12em] opacity-70">
                    Status
                  </th>
                  <th className="px-3 py-2 font-mono text-xs uppercase tracking-[0.12em] opacity-70">
                    Confidence
                  </th>
                  <th className="px-3 py-2 font-mono text-xs uppercase tracking-[0.12em] opacity-70">
                    Scored
                  </th>
                  <th className="px-3 py-2 font-mono text-xs uppercase tracking-[0.12em] opacity-70">
                    Contribution
                  </th>
                </tr>
              </thead>
              <tbody>
                {breakdown.sources.map((source) => (
                  <tr key={source.name} className="border-b border-white/10">
                    <td className="px-3 py-2">{source.name}</td>
                    <td className="px-3 py-2">
                      {formatParsedStatusAnswer(source.currentStatus)}
                    </td>
                    <td className="px-3 py-2">{source.confidence}</td>
                    <td className="px-3 py-2">
                      {source.scorable ? "yes" : source.skipReason ?? "no"}
                    </td>
                    <td className="px-3 py-2 font-mono">
                      {source.contribution > 0
                        ? `${source.side} +${source.contribution}`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}

export function AdminPanel() {
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmFlip, setConfirmFlip] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [messageDirty, setMessageDirty] = useState(false);
  const [form, setForm] = useState<NewsFormState>(emptyForm);
  const [editingId, setEditingId] = useState<Id<"newsItems"> | null>(null);

  const login = useMutation(api.admin.login);
  const logout = useMutation(api.admin.logout);
  const validateSession = useMutation(api.admin.validateSession);
  const setStatus = useMutation(api.status.set);
  const setMessage = useMutation(api.status.setMessage);
  const createNews = useMutation(api.news.create);
  const updateNews = useMutation(api.news.update);
  const removeNews = useMutation(api.news.remove);

  const status = useQuery(api.status.get);
  const news = useQuery(api.news.listAll, token ? { token } : "skip");

  useEffect(() => {
    const stored = getStoredToken();
    if (!stored) return;

    void validateSession({ token: stored }).then((valid) => {
      if (valid) {
        setToken(stored);
      } else {
        localStorage.removeItem(SESSION_KEY);
      }
    });
  }, [validateSession]);

  useEffect(() => {
    if (status === undefined || messageDirty) return;
    setStatusMessage(status?.message ?? "");
  }, [status, messageDirty]);

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const session = await login({ password });
      localStorage.setItem(SESSION_KEY, session.token);
      setToken(session.token);
      setPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    if (token) {
      await logout({ token });
    }
    localStorage.removeItem(SESSION_KEY);
    setToken(null);
  };

  const handleFlipStatus = async () => {
    if (!token || status === undefined || status === null) return;
    if (!confirmFlip) {
      setConfirmFlip(true);
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await setStatus({
        token,
        isAlive: !status.isAlive,
        note: "Updated via admin panel",
        message: statusMessage.trim() || undefined,
      });
      setConfirmFlip(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setBusy(false);
    }
  };

  const handleSaveMessage = async () => {
    if (!token) return;

    setBusy(true);
    setError(null);
    try {
      await setMessage({
        token,
        message: statusMessage.trim() || undefined,
      });
      setMessageDirty(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save status message");
    } finally {
      setBusy(false);
    }
  };

  const handleSaveNews = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;

    setBusy(true);
    setError(null);
    try {
      const payload = {
        token,
        title: form.title.trim(),
        url: form.url.trim(),
        source: form.source.trim(),
        publishedAt: Date.parse(form.publishedAt),
        isPublished: form.isPublished,
        sortOrder: form.sortOrder,
        imageUrl: form.imageUrl.trim() || undefined,
      };

      if (!payload.title || !payload.url || !payload.source) {
        throw new Error("Title, URL, and source are required");
      }

      if (editingId) {
        await updateNews({ ...payload, id: editingId });
      } else {
        await createNews(payload);
      }

      setForm(emptyForm);
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save news item");
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (item: NonNullable<typeof news>[number]) => {
    setEditingId(item._id);
    setForm({
      title: item.title,
      url: item.url,
      source: item.source,
      publishedAt: new Date(item.publishedAt).toISOString().slice(0, 10),
      isPublished: item.isPublished,
      sortOrder: item.sortOrder,
      imageUrl: item.imageUrl ?? "",
    });
  };

  if (!token) {
    return (
      <div className="admin-shell mx-auto w-full max-w-md px-6 py-20">
        <h1 className="font-display text-4xl">Admin</h1>
        <p className="mt-3 opacity-80">Sign in to manage status and news links.</p>
        <form onSubmit={handleLogin} className="admin-card mt-8 space-y-4 rounded-2xl p-6">
          <label className="block">
            <span className="font-mono text-xs uppercase tracking-[0.2em] opacity-70">
              Password
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="admin-input mt-2 w-full rounded-lg px-3 py-2"
              autoComplete="current-password"
              required
            />
          </label>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button type="submit" disabled={busy} className="admin-btn w-full rounded-lg px-4 py-2">
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    );
  }

  const isAlive = status?.isAlive ?? true;

  return (
    <div className="admin-shell mx-auto w-full max-w-4xl px-6 py-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">Admin</h1>
          <p className="mt-2 opacity-80">Manage live status and curated news links.</p>
        </div>
        <button type="button" onClick={handleLogout} className="admin-btn rounded-lg px-4 py-2">
          Sign out
        </button>
      </div>

      {error && <p className="mt-6 text-sm text-red-400">{error}</p>}

      <section className="admin-card mt-10 rounded-2xl p-6">
        <h2 className="font-display text-2xl">Status</h2>
        <p className="mt-2 opacity-80">
          Current public answer:{" "}
          <strong>{status === undefined ? "…" : status?.isAlive ? "YES" : "NO"}</strong>
        </p>
        <button
          type="button"
          disabled={busy || status === undefined || status === null}
          onClick={handleFlipStatus}
          className={`admin-btn mt-4 rounded-lg px-4 py-2 ${confirmFlip ? "admin-btn-danger" : ""}`}
        >
          {confirmFlip
            ? "Confirm flip status"
            : status?.isAlive
              ? "Mark as NO (not alive)"
              : "Mark as YES (alive)"}
        </button>
        {confirmFlip && (
          <button
            type="button"
            className="ml-3 text-sm underline opacity-70"
            onClick={() => setConfirmFlip(false)}
          >
            Cancel
          </button>
        )}

        <label className="mt-6 block">
          <span className="font-mono text-xs uppercase tracking-[0.2em] opacity-70">
            Status message
          </span>
          <p className="mt-1 text-sm opacity-70">
            Shown under the YES/NO answer on the homepage. Leave blank to use the default line.
          </p>
          <textarea
            value={statusMessage}
            onChange={(e) => {
              setStatusMessage(e.target.value);
              setMessageDirty(true);
            }}
            rows={3}
            placeholder="Alive and in office."
            className="admin-input mt-2 w-full rounded-lg px-3 py-2"
          />
        </label>
        <button
          type="button"
          disabled={busy || status === undefined || status === null}
          onClick={handleSaveMessage}
          className="admin-btn mt-3 rounded-lg px-4 py-2"
        >
          {busy ? "Saving…" : "Save message"}
        </button>
      </section>

      <DataSourcesPanel token={token} onError={setError} />

      <SourceConsensusPanel isAlive={isAlive} />

      <section className="admin-card mt-8 rounded-2xl p-6">
        <h2 className="font-display text-2xl">{editingId ? "Edit news link" : "Add news link"}</h2>
        <form onSubmit={handleSaveNews} className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="block md:col-span-2">
            <span className="font-mono text-xs uppercase tracking-[0.2em] opacity-70">Title</span>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="admin-input mt-2 w-full rounded-lg px-3 py-2"
              required
            />
          </label>
          <label className="block md:col-span-2">
            <span className="font-mono text-xs uppercase tracking-[0.2em] opacity-70">URL</span>
            <input
              type="url"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              className="admin-input mt-2 w-full rounded-lg px-3 py-2"
              required
            />
          </label>
          <label className="block md:col-span-2">
            <span className="font-mono text-xs uppercase tracking-[0.2em] opacity-70">Image URL</span>
            <input
              type="url"
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              placeholder="https://example.com/photo.jpg"
              className="admin-input mt-2 w-full rounded-lg px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="font-mono text-xs uppercase tracking-[0.2em] opacity-70">Source</span>
            <input
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
              className="admin-input mt-2 w-full rounded-lg px-3 py-2"
              required
            />
          </label>
          <label className="block">
            <span className="font-mono text-xs uppercase tracking-[0.2em] opacity-70">Published</span>
            <input
              type="date"
              value={form.publishedAt}
              onChange={(e) => setForm({ ...form, publishedAt: e.target.value })}
              className="admin-input mt-2 w-full rounded-lg px-3 py-2"
              required
            />
          </label>
          <label className="block">
            <span className="font-mono text-xs uppercase tracking-[0.2em] opacity-70">Sort order</span>
            <input
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
              className="admin-input mt-2 w-full rounded-lg px-3 py-2"
            />
          </label>
          <label className="flex items-center gap-2 self-end">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
            />
            <span>Published</span>
          </label>
          <div className="flex gap-3 md:col-span-2">
            <button type="submit" disabled={busy} className="admin-btn rounded-lg px-4 py-2">
              {busy ? "Saving…" : editingId ? "Update link" : "Add link"}
            </button>
            {editingId && (
              <button
                type="button"
                className="rounded-lg px-4 py-2 opacity-80 underline"
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyForm);
                }}
              >
                Cancel edit
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="admin-card mt-8 rounded-2xl p-6">
        <h2 className="font-display text-2xl">News links</h2>
        {news === undefined ? (
          <p className="mt-4 opacity-70">Loading…</p>
        ) : news.length === 0 ? (
          <p className="mt-4 opacity-70">No news links yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {news.map((item) => (
              <li key={item._id} className="rounded-xl border border-white/10 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{item.title}</p>
                    <p className="mt-1 text-sm opacity-70">
                      {item.source} · sort {item.sortOrder} ·{" "}
                      {item.isPublished ? "published" : "draft"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="admin-btn rounded-lg px-3 py-1 text-sm"
                      onClick={() => startEdit(item)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="admin-btn-danger rounded-lg px-3 py-1 text-sm"
                      onClick={async () => {
                        if (!token) return;
                        if (!window.confirm("Delete this news link?")) return;
                        await removeNews({ token, id: item._id });
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
