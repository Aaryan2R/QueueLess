"use client";

import { getBrowserSupabase } from "@/lib/supabase-browser";

export default function SignOutButton() {
  return (
    <button
      className="button secondary"
      onClick={async () => {
        await getBrowserSupabase().auth.signOut();
        window.location.href = "/";
      }}
    >
      Log out
    </button>
  );
}
