"use client";

import { useState } from "react";

function decodeKey(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(window.atob(base64), (character) => character.charCodeAt(0));
}

export default function PushNotificationButton({ token }: { token: string }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function enableNotifications() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      setMessage("Push notifications are not supported by this browser.");
      return;
    }

    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) {
      setMessage("Push notifications are not configured yet.");
      return;
    }

    setBusy(true);
    setMessage("");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setMessage("Notifications were not allowed.");
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: decodeKey(vapidKey)
        }));

      const response = await fetch("/api/public/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, subscription: subscription.toJSON() })
      });
      const body = await response.json();
      if (!response.ok) {
        setMessage(body.error ?? "Unable to enable notifications.");
        return;
      }

      setMessage("Notifications enabled.");
    } catch {
      setMessage("Unable to enable notifications. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack">
      <button className="button secondary" disabled={busy} onClick={enableNotifications} type="button">
        {busy ? "Enabling..." : "Enable turn alerts"}
      </button>
      {message && <div className="notice">{message}</div>}
    </div>
  );
}
