"use client";

import { useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase-browser";

export default function SignOutButton() {
  const [error, setError] = useState("");

  return (
    <div>
      <button
        className="button secondary"
        onClick={async () => {
          setError("");
          const { error: signOutError } = await getBrowserSupabase().auth.signOut();
          if (signOutError) {
            setError("Unable to log out. Please try again.");
            return;
          }
          window.location.replace("/login");
        }}
      >
        Log out
      </button>
      {error && <div className="notice error">{error}</div>}
    </div>
  );
}
