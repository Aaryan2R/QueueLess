"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase-browser";

export default function LoginPage() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      const { error } = await getBrowserSupabase().auth.signInWithPassword({
        email: String(form.get("email")),
        password: String(form.get("password"))
      });
      if (error) throw error;
      window.location.href = "/dashboard";
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to log in.");
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
        <h1>Welcome back.</h1>
        <p className="muted">Log in to manage your queues.</p>
        {message && <div className="notice error">{message}</div>}
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
            {busy ? "Logging in..." : "Log in"}
          </button>
        </form>
        <p className="muted">
          New here? <Link href="/signup">Create an account</Link>
        </p>
      </div>
    </main>
  );
}
