import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../../../convex/_generated/api";
import { DataSourcesPanel } from "./DataSourcesPanel";
import { SourceConsensusPanel } from "./SourceConsensusPanel";

export function AdminStatusPage({
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
  const [confirmFlip, setConfirmFlip] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [messageDirty, setMessageDirty] = useState(false);

  const setStatus = useMutation(api.status.set);
  const setMessage = useMutation(api.status.setMessage);
  const status = useQuery(api.status.get);

  useEffect(() => {
    if (status === undefined || messageDirty) return;
    setStatusMessage(status?.message ?? "");
  }, [status, messageDirty]);

  const handleFlipStatus = async () => {
    if (status === undefined || status === null) return;
    if (!confirmFlip) {
      setConfirmFlip(true);
      return;
    }

    setBusy(true);
    onError(null);
    try {
      await setStatus({
        token,
        isAlive: !status.isAlive,
        note: "Updated via admin panel",
        message: statusMessage.trim() || undefined,
      });
      setConfirmFlip(false);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setBusy(false);
    }
  };

  const handleSaveMessage = async () => {
    setBusy(true);
    onError(null);
    try {
      await setMessage({
        token,
        message: statusMessage.trim() || undefined,
      });
      setMessageDirty(false);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to save status message");
    } finally {
      setBusy(false);
    }
  };

  const isAlive = status?.isAlive ?? true;

  return (
    <div className="space-y-8">
      <section className="admin-card rounded-2xl p-6">
        <h2 className="font-display text-2xl">Status</h2>
        <p className="mt-2 opacity-80">
          Current public answer:{" "}
          <strong>{status === undefined ? "…" : status?.isAlive ? "YES" : "NO"}</strong>
        </p>
        <button
          type="button"
          disabled={busy || status === undefined || status === null}
          onClick={() => void handleFlipStatus()}
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
          onClick={() => void handleSaveMessage()}
          className="admin-btn mt-3 rounded-lg px-4 py-2"
        >
          {busy ? "Saving…" : "Save message"}
        </button>
      </section>

      <DataSourcesPanel token={token} onError={onError} />
      <SourceConsensusPanel isAlive={isAlive} />
    </div>
  );
}
