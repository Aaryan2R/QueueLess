"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ArrivalWindow({ token, deadline }: { token: string; deadline: string }) {
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState(() =>
    Math.max(0, Math.ceil((Date.parse(deadline) - Date.now()) / 1000))
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((Date.parse(deadline) - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining === 0) {
        window.clearInterval(timer);
        void fetch("/api/public/ticket/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token })
        }).finally(() => router.refresh());
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [deadline, router, token]);

  async function confirmArrival() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/public/ticket/arrive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error ?? "Unable to confirm arrival.");
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
      <div className="notice">
        Arrival window: <strong>{secondsLeft}s</strong>
      </div>
      <button className="button" disabled={busy || secondsLeft === 0} onClick={confirmArrival} type="button">
        {busy ? "Confirming..." : "I'm here"}
      </button>
      {error && <div className="notice error">{error}</div>}
    </div>
  );
}
