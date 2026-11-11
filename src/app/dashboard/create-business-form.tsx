"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateBusinessForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/businesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.get("name"), slug: form.get("slug") })
      });
      if (!response.ok) {
        setError((await response.json()).error ?? "Unable to create business.");
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
    <div className="card">
      <h2>Create a business</h2>
      <p className="muted">Start with the name customers will see.</p>
      {error && <div className="notice error">{error}</div>}
      <form className="form" onSubmit={submit}>
        <label>
          Business name
          <input name="name" required minLength={2} maxLength={80} />
        </label>
        <label>
          Public slug
          <input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="bluebird-cafe" />
        </label>
        <button className="button" disabled={busy} type="submit">
          {busy ? "Creating..." : "Create business"}
        </button>
      </form>
    </div>
  );
}
