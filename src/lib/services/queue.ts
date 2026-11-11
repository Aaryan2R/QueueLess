import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import type { QueueStatus, TicketStatus } from "@/lib/types";

type AppSupabaseClient = SupabaseClient<Database>;

export async function callNext(supabase: AppSupabaseClient, queueId: string) {
  const { data, error } = await supabase.rpc("call_next", { target_queue_id: queueId });
  if (error) throw new Error(error.message);
  return data;
}

export async function changeQueueStatus(
  supabase: AppSupabaseClient,
  queueId: string,
  status: Extract<QueueStatus, "ACTIVE" | "PAUSED">
) {
  const { data, error } = await supabase
    .from("queues")
    .update({ status })
    .eq("id", queueId)
    .select("id,status")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function changeTicketStatus(supabase: AppSupabaseClient, ticketId: string, status: TicketStatus) {
  const { data, error } = await supabase.rpc("change_ticket_status", {
    target_ticket_id: ticketId,
    next_status: status
  });

  if (error) throw new Error(error.message);
  return data;
}
