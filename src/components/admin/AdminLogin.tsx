import { useState, type FormEvent } from "react";

export function AdminLogin({
  error,
  busy,
  onLogin,
}: {
  error: string | null;
  busy: boolean;
  onLogin: (event: FormEvent, password: string) => Promise<void>;
}) {
  const [password, setPassword] = useState("");

  return (
    <div className="admin-shell min-h-screen">
      <div className="mx-auto w-full max-w-md px-6 py-20">
      <h1 className="font-display text-4xl">Admin</h1>
      <p className="mt-3 opacity-80">Sign in to manage status, news links, and editorial posts.</p>
      <form
        onSubmit={(event) => void onLogin(event, password)}
        className="admin-card mt-8 space-y-4 rounded-2xl p-6"
      >
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
    </div>
  );
}
