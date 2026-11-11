import * as webpush from "web-push";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

type PushSubscriptionRow = Database["public"]["Tables"]["push_subscriptions"]["Row"];

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return null;
  return createClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

export async function notifyTicketCalled(ticketId: string, ticketUrl: string) {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  const admin = getAdminClient();

  if (!publicKey || !privateKey || !subject || !admin) {
    console.warn("Push notification skipped: VAPID or service-role configuration is missing.");
    return;
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  const { data: subscriptions, error } = await admin
    .from("push_subscriptions")
    .select("id,endpoint,p256dh,auth")
    .eq("ticket_id", ticketId);

  if (error) throw new Error(error.message);

  await Promise.all(
    (subscriptions as Pick<PushSubscriptionRow, "id" | "endpoint" | "p256dh" | "auth">[]).map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth }
          },
          JSON.stringify({
            title: "Your turn is coming",
            body: "Please return to the establishment. You have been called.",
            tag: `ticket-${ticketId}`,
            url: ticketUrl
          })
        );
      } catch (error) {
        if (error && typeof error === "object" && "statusCode" in error && error.statusCode === 404) {
          await admin.from("push_subscriptions").delete().eq("id", subscription.id);
          return;
        }
        throw error;
      }
    })
  );
}
