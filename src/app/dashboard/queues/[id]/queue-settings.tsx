"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function QueueSettings({
  queueId,
  name,
  maxSize,
  averageServiceMinutes
}: {
  queueId: string;
  name: string;
  maxSize: number;
  averageServiceMinutes: number;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(`/api/queues/${queueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          maxSize: Number(form.get("maxSize")),
          averageServiceMinutes: Number(form.get("averageServiceMinutes"))
        })
      });
      const body = await response.json();
      if (!response.ok) {
        setMessage(body.error ?? "Unable to update queue settings.");
        return;
      }
      setMessage("Queue settings saved.");
      router.refresh();
    } catch {
      setMessage("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="form" onSubmit={submit}>
      <label>
        Queue name
        <input defaultValue={name} name="name" required minLength={2} maxLength={80} />
      </label>
      <label>
        Maximum active tickets
        <input defaultValue={maxSize} min={1} max={10000} name="maxSize" required type="number" />
      </label>
      <label>
        Average service time (minutes)
        <input
          defaultValue={averageServiceMinutes}
          min={1}
          max={240}
          name="averageServiceMinutes"
          required
          type="number"
        />
      </label>
      <button className="button" disabled={busy} type="submit">
        {busy ? "Saving..." : "Save settings"}
      </button>
      {message && <div className="notice">{message}</div>}
    </form>
  );
}
