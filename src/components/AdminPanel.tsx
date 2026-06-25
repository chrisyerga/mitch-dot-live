import { useMutation, useQuery } from "convex/react";
import { useEffect, useState, type FormEvent } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

const SESSION_KEY = "adminSessionToken";

type NewsFormState = {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  isPublished: boolean;
  sortOrder: number;
};

const emptyForm: NewsFormState = {
  title: "",
  url: "",
  source: "",
  publishedAt: new Date().toISOString().slice(0, 10),
  isPublished: true,
  sortOrder: 0,
};

function getStoredToken(): string | null {
  return localStorage.getItem(SESSION_KEY);
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
