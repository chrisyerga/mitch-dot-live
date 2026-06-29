import { useMutation, useQuery } from "convex/react";
import { useState, type FormEvent } from "react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

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

export function AdminNewsPage({
  token,
  busy,
  setBusy,
  onError,
}: {
  token: string;
  busy: boolean;
  setBusy: (busy: boolean) => void;
  onError: (message: string | null) => void;
}) {
  const [form, setForm] = useState<NewsFormState>(emptyForm);
  const [editingId, setEditingId] = useState<Id<"newsItems"> | null>(null);

  const createNews = useMutation(api.news.create);
  const updateNews = useMutation(api.news.update);
  const removeNews = useMutation(api.news.remove);
  const news = useQuery(api.news.listAll, { token });

  const handleSaveNews = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    onError(null);
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
      onError(err instanceof Error ? err.message : "Failed to save news item");
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

  return (
    <div className="space-y-8">
      <section className="admin-card rounded-2xl p-6">
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

      <section className="admin-card rounded-2xl p-6">
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
