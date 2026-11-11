"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LeaveTicketButton({ token }: { token: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function leaveQueue() {
    if (!window.confirm("Leave this queue? Your ticket will be cancelled.")) return;

    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/public/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error ?? "Unable to leave this queue.");
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
    <div className="stack">
      <button className="button secondary" disabled={busy} onClick={leaveQueue} type="button">
        {busy ? "Leaving..." : "Leave queue"}
      </button>
      {error && <div className="notice error">{error}</div>}
    </div>
  );
}
