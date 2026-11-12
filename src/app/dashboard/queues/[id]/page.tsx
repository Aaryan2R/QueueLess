import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import QRCode from "qrcode";
import { getServerSupabase } from "@/lib/supabase";
import QueueControls from "./queue-controls";
import TicketActions from "./ticket-actions";
import QueueSettings from "./queue-settings";
import LiveRefresh from "@/app/live-refresh";

export const dynamic = "force-dynamic";

export default async function QueuePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await getServerSupabase();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: queue } = await supabase
    .from("queues")
    .select("id,name,status,slug,business_id,average_service_minutes,max_size")
    .eq("id", id)
    .single();
  if (!queue) notFound();
  const { data: business } = await supabase.from("businesses").select("owner_id").eq("id", queue.business_id).single();
  const { data: tickets } = await supabase
    .from("tickets")
    .select("id,token,customer_name,party_size,status,joined_at")
    .eq("queue_id", id)
    .in("status", ["WAITING", "CALLED", "READY"])
    .order("sequence_number");
  const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/q/${queue.slug}`;
  const qrCode = await QRCode.toDataURL(publicUrl, { width: 280, margin: 2 });

  return (
    <main className="page">
      <LiveRefresh queueId={queue.id} />
      <Link href="/dashboard">← Dashboard</Link>
      <div className="actions" style={{ justifyContent: "space-between" }}>
        <div>
          <div className="eyebrow">Queue control</div>
          <h1 style={{ fontSize: "3rem" }}>{queue.name}</h1>
          <p className="muted">
            Customer link: <a href={publicUrl}>{publicUrl}</a>
          </p>
        </div>
        <QueueControls queueId={queue.id} status={queue.status} canManageQueue={business?.owner_id === user.id} />
      </div>
      <div className="grid">
        <div className="card">
          <h2>Share this queue</h2>
          <Image alt={`QR code for ${queue.name}`} height={280} src={qrCode} unoptimized width={280} />
          <a className="button secondary" download={`${queue.slug}-qr.png`} href={qrCode}>
            Download QR code
          </a>
        </div>
        {business?.owner_id === user.id && (
          <div className="card">
            <h2>Queue settings</h2>
            <QueueSettings
              queueId={queue.id}
              name={queue.name}
              maxSize={queue.max_size}
              averageServiceMinutes={queue.average_service_minutes}
            />
          </div>
        )}
        <div className="card">
          <div className="actions" style={{ justifyContent: "space-between", alignItems: "center", marginTop: 0 }}>
            <h2 style={{ margin: 0 }}>Live queue</h2>
            <Link className="button secondary" href={`/dashboard/queues/${queue.id}/analytics`}>
              View history & analytics
            </Link>
          </div>
          {(tickets ?? []).length === 0 ? (
            <p className="muted" style={{ marginTop: 16 }}>No customers are waiting.</p>
          ) : (
            (tickets ?? []).map((ticket) => (
              <div className="queue-row" key={ticket.id}>
                <div>
                  <strong>
                    {ticket.token} · {ticket.customer_name}
                  </strong>
                  <div className="muted">
                    Party of {ticket.party_size} · {ticket.status}
                  </div>
                </div>
                <TicketActions ticketId={ticket.id} status={ticket.status as "WAITING" | "CALLED" | "READY"} />
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
