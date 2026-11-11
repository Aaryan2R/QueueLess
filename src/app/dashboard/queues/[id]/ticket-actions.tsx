"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type TicketStatus = "WAITING" | "CALLED" | "READY";
type NextStatus = "CALLED" | "READY" | "SERVED" | "NO_SHOW" | "CANCELLED";

const actions: Record<TicketStatus, Array<{ label: string; status: NextStatus }>> = {
  WAITING: [
    { label: "Call", status: "CALLED" },
    { label: "Cancel", status: "CANCELLED" }
  ],
  CALLED: [
    { label: "Ready", status: "READY" },
    { label: "Served", status: "SERVED" },
    { label: "No-show", status: "NO_SHOW" }
  ],
  READY: [
    { label: "Served", status: "SERVED" },
    { label: "No-show", status: "NO_SHOW" }
  ]
};

export default function TicketActions({ ticketId, status }: { ticketId: string; status: TicketStatus }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function updateStatus(nextStatus: NextStatus) {
    setBusy(true);
    setError("");

    try {
      const response = await fetch(`/api/tickets/${ticketId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus })
      });
      const body = await response.json();

      if (!response.ok) {
        setError(body.error ?? "Unable to update ticket.");
        return;
      }

      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack" style={{ justifyItems: "end" }}>
      <div className="actions">
        {actions[status].map((action) => (
          <button
            className="button secondary"
            disabled={busy}
            key={action.status}
            onClick={() => updateStatus(action.status)}
            type="button"
          >
            {busy ? "Updating..." : action.label}
          </button>
        ))}
      </div>
      {error && <div className="notice error">{error}</div>}
    </div>
  );
}
