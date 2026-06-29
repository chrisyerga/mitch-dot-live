import { useMutation, useQuery } from "convex/react";
import { useState, type FormEvent } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { formatCheckedAt } from "../lib/format";

type EditorialFormState = {
  title: string;
  slug: string;
  description: string;
  body: string;
  publishedAt: string;
  status: "draft" | "published";
  source: "ai" | "manual";
  tags: string;
};

const emptyForm: EditorialFormState = {
  title: "",
  slug: "",
  description: "",
  body: "",
  publishedAt: new Date().toISOString().slice(0, 10),
  status: "draft",
  source: "manual",
  tags: "",
};

function deployStatusLabel(status: string | null): string {
  switch (status) {
    case "pending":
      return "Deploy pending";
    case "triggered":
      return "Deploy triggered";
    case "failed":
      return "Deploy failed";
    default:
      return "No deploy queued";
  }
}

export function EditorialPanel({
  token,
  onError,
}: {
  token: string;
  onError: (message: string | null) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<EditorialFormState>(emptyForm);
  const [editingId, setEditingId] = useState<Id<"editorialPosts"> | null>(null);

  const posts = useQuery(api.editorial.listAll, { token });
  const createPost = useMutation(api.editorial.create);
  const updatePost = useMutation(api.editorial.update);
  const publishPost = useMutation(api.editorial.publish);
  const unpublishPost = useMutation(api.editorial.unpublish);
  const removePost = useMutation(api.editorial.remove);

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    onError(null);

    try {
      const tags = form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

      const payload = {
        token,
        title: form.title.trim(),
        slug: form.slug.trim(),
        description: form.description.trim(),
        body: form.body,
        publishedAt: Date.parse(form.publishedAt),
        status: form.status,
        source: form.source,
        tags: tags.length > 0 ? tags : undefined,
      };

      if (!payload.title || !payload.slug || !payload.description || !payload.body) {
        throw new Error("Title, slug, description, and body are required");
      }

      if (editingId) {
        await updatePost({ ...payload, id: editingId });
      } else {
        await createPost(payload);
      }

      setForm(emptyForm);
      setEditingId(null);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to save editorial post");
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (post: NonNullable<typeof posts>[number]) => {
    setEditingId(post._id);
    setForm({
      title: post.title,
      slug: post.slug,
      description: post.description,
      body: post.body,
      publishedAt: new Date(post.publishedAt).toISOString().slice(0, 10),
      status: post.status,
      source: post.source,
      tags: post.tags?.join(", ") ?? "",
    });
  };

  return (
    <>
      <section className="admin-card mt-8 rounded-2xl p-6">
        <h2 className="font-display text-2xl">
          {editingId ? "Edit editorial post" : "Add editorial post"}
        </h2>
        <p className="mt-2 opacity-80">
          Convex-backed posts compile to static HTML at deploy time. Publishing triggers a
          site rebuild through GitHub Actions.
        </p>
        <form onSubmit={handleSave} className="mt-4 grid gap-4">
          <label className="block">
            <span className="font-mono text-xs uppercase tracking-[0.2em] opacity-70">
              Title
            </span>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="admin-input mt-2 w-full rounded-lg px-3 py-2"
              required
            />
          </label>
          <label className="block">
            <span className="font-mono text-xs uppercase tracking-[0.2em] opacity-70">
              Slug
            </span>
            <input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="senate-vacancy-update"
              className="admin-input mt-2 w-full rounded-lg px-3 py-2"
              required
            />
          </label>
          <label className="block">
            <span className="font-mono text-xs uppercase tracking-[0.2em] opacity-70">
              Description
            </span>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="admin-input mt-2 w-full rounded-lg px-3 py-2"
              required
            />
          </label>
          <label className="block">
            <span className="font-mono text-xs uppercase tracking-[0.2em] opacity-70">
              Body (Markdown)
            </span>
            <textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              rows={12}
              className="admin-input mt-2 w-full rounded-lg px-3 py-2 font-mono text-sm"
              required
            />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="font-mono text-xs uppercase tracking-[0.2em] opacity-70">
                Published date
              </span>
              <input
                type="date"
                value={form.publishedAt}
                onChange={(e) => setForm({ ...form, publishedAt: e.target.value })}
                className="admin-input mt-2 w-full rounded-lg px-3 py-2"
                required
              />
            </label>
            <label className="block">
              <span className="font-mono text-xs uppercase tracking-[0.2em] opacity-70">
                Tags
              </span>
              <input
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="senate, tracker"
                className="admin-input mt-2 w-full rounded-lg px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="font-mono text-xs uppercase tracking-[0.2em] opacity-70">
                Status
              </span>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm({
                    ...form,
                    status: e.target.value as EditorialFormState["status"],
                  })
                }
                className="admin-input mt-2 w-full rounded-lg px-3 py-2"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </label>
            <label className="block">
              <span className="font-mono text-xs uppercase tracking-[0.2em] opacity-70">
                Source
              </span>
              <select
                value={form.source}
                onChange={(e) =>
                  setForm({
                    ...form,
                    source: e.target.value as EditorialFormState["source"],
                  })
                }
                className="admin-input mt-2 w-full rounded-lg px-3 py-2"
              >
                <option value="manual">Manual</option>
                <option value="ai">AI</option>
              </select>
            </label>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={busy} className="admin-btn rounded-lg px-4 py-2">
              {busy ? "Saving…" : editingId ? "Update post" : "Add post"}
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
        <h2 className="font-display text-2xl">Editorial posts</h2>
        {posts === undefined ? (
          <p className="mt-4 opacity-70">Loading…</p>
        ) : posts.length === 0 ? (
          <p className="mt-4 opacity-70">No editorial posts yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {posts.map((post) => (
              <li key={post._id} className="rounded-xl border border-white/10 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{post.title}</p>
                    <p className="mt-1 text-sm opacity-70">
                      /blog/{post.slug}/ · {post.status} · {post.source} ·{" "}
                      {formatCheckedAt(post.publishedAt)}
                    </p>
                    <p className="mt-1 text-sm opacity-70">
                      {deployStatusLabel(post.deployStatus)}
                      {post.deployRequestedAt
                        ? ` · requested ${formatCheckedAt(post.deployRequestedAt)}`
                        : ""}
                    </p>
                    {post.deployError && (
                      <p className="mt-1 text-sm text-red-400">{post.deployError}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {post.status === "draft" ? (
                      <button
                        type="button"
                        className="admin-btn rounded-lg px-3 py-1 text-sm"
                        disabled={busy}
                        onClick={async () => {
                          setBusy(true);
                          onError(null);
                          try {
                            await publishPost({ token, id: post._id });
                          } catch (err) {
                            onError(
                              err instanceof Error ? err.message : "Failed to publish post",
                            );
                          } finally {
                            setBusy(false);
                          }
                        }}
                      >
                        Publish
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="admin-btn rounded-lg px-3 py-1 text-sm"
                        disabled={busy}
                        onClick={async () => {
                          setBusy(true);
                          onError(null);
                          try {
                            await unpublishPost({ token, id: post._id });
                          } catch (err) {
                            onError(
                              err instanceof Error ? err.message : "Failed to unpublish post",
                            );
                          } finally {
                            setBusy(false);
                          }
                        }}
                      >
                        Unpublish
                      </button>
                    )}
                    <button
                      type="button"
                      className="admin-btn rounded-lg px-3 py-1 text-sm"
                      onClick={() => startEdit(post)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="admin-btn-danger rounded-lg px-3 py-1 text-sm"
                      onClick={async () => {
                        if (!window.confirm("Delete this editorial post?")) return;
                        setBusy(true);
                        onError(null);
                        try {
                          await removePost({ token, id: post._id });
                          if (editingId === post._id) {
                            setEditingId(null);
                            setForm(emptyForm);
                          }
                        } catch (err) {
                          onError(
                            err instanceof Error ? err.message : "Failed to delete post",
                          );
                        } finally {
                          setBusy(false);
                        }
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
    </>
  );
}
