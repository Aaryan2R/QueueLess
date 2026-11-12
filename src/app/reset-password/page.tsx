"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase-browser";

export default function ResetPasswordPage() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password"));
    const confirmation = String(form.get("confirmation"));
    if (password !== confirmation) {
      setMessage("Passwords do not match.");
      setBusy(false);
      return;
    }

    try {
      const { error } = await getBrowserSupabase().auth.updateUser({ password });
      if (error) throw error;
      setMessage("Password updated. You can now log in with your new password.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update your password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page">
      <div className="card form">
        <Link className="logo" href="/">
          QueueLess
        </Link>
        <h1>Choose a new password.</h1>
        {message && <div className="notice">{message}</div>}
        <form className="form" onSubmit={submit}>
          <label>
            New password
            <input name="password" type="password" minLength={8} required />
          </label>
          <label>
            Confirm password
            <input name="confirmation" type="password" minLength={8} required />
          </label>
          <button className="button" disabled={busy} type="submit">
            {busy ? "Updating..." : "Update password"}
          </button>
        </form>
        <Link className="muted" href="/login">
          Return to login
        </Link>
      </div>
    </main>
  );
}
