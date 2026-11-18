"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import { getAppUrl } from "@/lib/app-url";

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const { error } = await getBrowserSupabase().auth.resetPasswordForEmail(String(form.get("email")), {
        redirectTo: `${getAppUrl(window.location.origin)}/auth/callback?next=/reset-password`
      });
      if (error) throw error;
      setMessage("If an account exists for that email, a password reset link has been sent.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to request a password reset.");
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
        <h1>Reset your password.</h1>
        <p className="muted">Enter your account email and we will send a secure reset link.</p>
        {message && <div className="notice">{message}</div>}
        <form className="form" onSubmit={submit}>
          <label>
            Email
            <input name="email" type="email" required />
          </label>
          <button className="button" disabled={busy} type="submit">
            {busy ? "Sending..." : "Send reset link"}
          </button>
        </form>
        <Link className="muted" href="/login">
          Return to login
        </Link>
      </div>
    </main>
  );
}
