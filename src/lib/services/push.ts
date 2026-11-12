import * as webpush from "web-push";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

type PushSubscriptionRow = Database["public"]["Tables"]["push_subscriptions"]["Row"];
type TicketAlertLevel = Database["public"]["Enums"]["ticket_alert_level"];

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return null;
  return createClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

async function sendTicketAlert(
  admin: ReturnType<typeof createClient<Database>>,
  ticketId: string,
  ticketUrl: string,
  alertLevel: TicketAlertLevel,
  title: string,
  body: string
) {
  const { data: claimedAlert, error: claimError } = await admin
    .from("ticket_alerts")
    .insert({ ticket_id: ticketId, alert_level: alertLevel })
    .select("id")
    .maybeSingle();

  if (claimError?.code === "23505") return;
  if (claimError) throw new Error(claimError.message);
  if (!claimedAlert) return;

  const { data: subscriptions, error } = await admin
    .from("push_subscriptions")
    .select("id,endpoint,p256dh,auth")
    .eq("ticket_id", ticketId);

  if (error) throw new Error(error.message);
  if (!subscriptions.length) {
    await admin.from("ticket_alerts").delete().eq("id", claimedAlert.id);
    return;
  }

  try {
    await Promise.all(
      (subscriptions as Pick<PushSubscriptionRow, "id" | "endpoint" | "p256dh" | "auth">[]).map(
        async (subscription) => {
          try {
            await webpush.sendNotification(
              {
                endpoint: subscription.endpoint,
                keys: { p256dh: subscription.p256dh, auth: subscription.auth }
              },
              JSON.stringify({
                title,
                body,
                tag: `ticket-${ticketId}-${alertLevel}`,
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
        }
      )
    );
  } catch (error) {
    await admin.from("ticket_alerts").delete().eq("id", claimedAlert.id);
    throw error;
  }
}

function getPushConfig() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  const admin = getAdminClient();

  if (!publicKey || !privateKey || !subject || !admin) return null;

  webpush.setVapidDetails(subject, publicKey, privateKey);
  return admin;
}

export async function notifyTicketCalled(ticketId: string, ticketUrl: string) {
  const admin = getPushConfig();
  if (!admin) {
    console.warn("Push notification skipped: VAPID or service-role configuration is missing.");
    return;
  }

  await sendTicketAlert(
    admin,
    ticketId,
    ticketUrl,
    "CALLED",
    "Your turn is here",
    "Please return to the establishment. Your 120-second arrival window has started."
  );
}

export async function notifyQueueProximity(queueId: string, appUrl: string) {
  const admin = getPushConfig();
  if (!admin) return;

  const { data: tickets, error } = await admin
    .from("tickets")
    .select("id,access_token,sequence_number,status")
    .eq("queue_id", queueId)
    .eq("status", "WAITING")
    .order("sequence_number");

  if (error) throw new Error(error.message);

  for (const [index, ticket] of tickets.entries()) {
    const ahead = index;
    if (ahead < 1 || ahead > 3) continue;

    const alertLevel = `AHEAD_${ahead}` as TicketAlertLevel;
    await sendTicketAlert(
      admin,
      ticket.id,
      `${appUrl}/ticket/${ticket.access_token}`,
      alertLevel,
      "Your turn is getting closer",
      `${ahead} ${ahead === 1 ? "group is" : "groups are"} ahead of you. Please start returning to the establishment.`
    );
  }
}
