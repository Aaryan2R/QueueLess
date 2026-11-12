"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function StaffForm({ businessId }: { businessId: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/businesses/${businessId}/staff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const body = await response.json();
      if (!response.ok) {
        setMessage(body.error ?? "Unable to add staff member.");
        return;
      }
      setEmail("");
      setMessage("Staff member added.");
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
        Existing account email
        <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
      </label>
      <button className="button" disabled={busy} type="submit">
        {busy ? "Adding..." : "Add staff member"}
      </button>
      {message && <div className="notice">{message}</div>}
    </form>
  );
}
