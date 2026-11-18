"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import { getAppUrl } from "@/lib/app-url";

export default function SignupPage() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      const { error } = await getBrowserSupabase().auth.signUp({
        email: String(form.get("email")),
        password: String(form.get("password")),
        options: {
          emailRedirectTo: `${getAppUrl(window.location.origin)}/auth/callback?next=/dashboard`
        }
      });
      if (error) throw error;
      setMessage("Account created. Check your email if confirmation is enabled, then log in.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create your account.");
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
        <h1>Start simply.</h1>
        <p className="muted">Create an owner account and set up your first queue.</p>
        {message && <div className="notice success">{message}</div>}
        <form className="form" onSubmit={submit}>
          <label>
            Email
            <input name="email" type="email" required />
          </label>
          <label>
            Password
            <input name="password" type="password" minLength={8} required />
          </label>
          <button className="button" disabled={busy} type="submit">
            {busy ? "Creating account..." : "Create account"}
          </button>
        </form>
        <p className="muted">
          Already have an account? <Link href="/login">Log in</Link>
        </p>
      </div>
    </main>
  );
}
