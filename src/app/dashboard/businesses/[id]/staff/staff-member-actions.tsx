"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function StaffMemberActions({ businessId, assignmentId }: { businessId: string; assignmentId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function remove() {
    if (!window.confirm("Remove this staff member?")) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/businesses/${businessId}/staff`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId })
      });
      if (!response.ok) {
        const body = await response.json();
        setError(body.error ?? "Unable to remove staff member.");
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
    <div className="stack" style={{ justifyItems: "end" }}>
      <button className="button secondary" disabled={busy} onClick={remove} type="button">
        {busy ? "Removing..." : "Remove"}
      </button>
      {error && <div className="notice error">{error}</div>}
    </div>
  );
}
