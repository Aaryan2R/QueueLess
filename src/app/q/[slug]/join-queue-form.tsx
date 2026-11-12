"use client";

import { FormEvent, useState } from "react";

export default function JoinQueueForm({ queueId }: { queueId: string }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/public/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          queueId,
          name: form.get("name"),
          phone: form.get("phone"),
          partySize: Number(form.get("partySize"))
        })
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error ?? "Unable to join this queue.");
        return;
      }
      window.location.href = `/ticket/${body.ticket.access_token}`;
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="form" onSubmit={submit}>
      <h2>Join the queue</h2>
      {error && <div className="notice error">{error}</div>}
      <label>
        Your name
        <input name="name" required maxLength={80} />
      </label>
      <label>
        Phone (optional)
        <input name="phone" inputMode="tel" maxLength={30} />
      </label>
      <label>
        Party size
        <select name="partySize" defaultValue="1">
          {Array.from({ length: 20 }, (_, index) => index + 1).map((size) => (
            <option value={size} key={size}>
              {size}
            </option>
          ))}
        </select>
      </label>
      <button className="button" disabled={busy} type="submit">
        {busy ? "Joining..." : "Join queue"}
      </button>
      <p className="muted">You will receive a private link to check your status.</p>
    </form>
  );
}
