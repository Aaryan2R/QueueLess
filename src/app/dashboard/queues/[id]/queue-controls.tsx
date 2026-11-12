"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function QueueControls({
  queueId,
  status,
  canManageQueue
}: {
  queueId: string;
  status: string;
  canManageQueue: boolean;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function callNext() {
    setMessage("");
    setBusy(true);
    try {
      const response = await fetch(`/api/queues/${queueId}/call-next`, { method: "POST" });
      const body = await response.json();
      setMessage(response.ok ? `Called ${body.ticket.token}.` : body.error);
      if (response.ok) router.refresh();
    } catch {
      setMessage("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  async function setStatus(nextStatus: "ACTIVE" | "PAUSED") {
    setBusy(true);
    try {
      const response = await fetch(`/api/queues/${queueId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus })
      });
      if (!response.ok) setMessage((await response.json()).error);
      else router.refresh();
    } catch {
      setMessage("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="stack" style={{ justifyItems: "end" }}>
      {message && <div className="notice">{message}</div>}
      <div className="actions">
        <button className="button" disabled={busy} onClick={callNext} type="button">
          {busy ? "Updating..." : "Call next"}
        </button>
        {canManageQueue &&
          (status === "ACTIVE" ? (
            <button className="button secondary" disabled={busy} onClick={() => setStatus("PAUSED")} type="button">
              Pause
            </button>
          ) : (
            <button className="button secondary" disabled={busy} onClick={() => setStatus("ACTIVE")} type="button">
              Resume
            </button>
          ))}
      </div>
    </div>
  );
}
