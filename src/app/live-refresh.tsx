"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase-browser";

export default function LiveRefresh({ queueId }: { queueId?: string }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = getBrowserSupabase();
    const channel = supabase
      .channel(`queue-updates-${queueId ?? "public"}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tickets",
          ...(queueId ? { filter: `queue_id=eq.${queueId}` } : {})
        },
        () => router.refresh()
      )
      .subscribe();
    const timer = window.setInterval(() => router.refresh(), 30000);
    return () => {
      window.clearInterval(timer);
      void supabase.removeChannel(channel);
    };
  }, [queueId, router]);
  return null;
}
