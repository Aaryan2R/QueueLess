import { notFound } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase";
import LiveRefresh from "@/app/live-refresh";
import LeaveTicketButton from "./leave-ticket-button";
import PushNotificationButton from "./push-notification-button";
import ArrivalWindow from "./arrival-window";

type PublicTicket = {
  token: string;
  business_name: string;
  queue_name: string;
  queue_id: string;
  status: string;
  ahead: number;
  average_service_minutes: number;
  arrival_deadline_at: string | null;
  missed_turn_count: number;
};

export const dynamic = "force-dynamic";

export default async function TicketPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await getServerSupabase();
  const { data } = await supabase.rpc("get_public_ticket", { input_token: token }).maybeSingle();
  const ticket = data as PublicTicket | null;
  if (!ticket) notFound();
  return (
    <main className="page">
      {["WAITING", "CALLED", "READY"].includes(ticket.status) && <LiveRefresh queueId={ticket.queue_id} />}
      <div className="card" style={{ maxWidth: 620, margin: "0 auto", textAlign: "center" }}>
        <div className="eyebrow">
          {ticket.business_name ?? "QueueLess"} · {ticket.queue_name}
        </div>
        <h1 style={{ fontSize: "4.5rem", marginBottom: 8 }}>{ticket.token}</h1>
        <div
          className={`notice ${
            ticket.status === "SERVED" || ticket.status === "READY"
              ? "success"
              : ticket.status === "NO_SHOW" || ticket.status === "CANCELLED"
                ? "error"
                : ""
          }`}
        >
          {ticket.status}
        </div>
        {ticket.status === "WAITING" && (
          <>
            <p className="lead">{ticket.ahead ?? 0} groups ahead</p>
            <p className="muted">
              Estimated wait: about {(ticket.ahead ?? 0) * (ticket.average_service_minutes ?? 10)} minutes
            </p>
          </>
        )}
        {ticket.status === "CALLED" && ticket.arrival_deadline_at && (
          <ArrivalWindow token={token} deadline={ticket.arrival_deadline_at} />
        )}
        {ticket.status === "WAITING" && ticket.missed_turn_count > 0 && (
          <p className="muted">This is your final missed-turn allowance.</p>
        )}
        {["WAITING", "CALLED", "READY"].includes(ticket.status) && <LeaveTicketButton token={token} />}
        {["WAITING", "CALLED", "READY"].includes(ticket.status) && <PushNotificationButton token={token} />}
        <p className="muted">Keep this private link open. Refresh if your connection is interrupted.</p>
      </div>
    </main>
  );
}
