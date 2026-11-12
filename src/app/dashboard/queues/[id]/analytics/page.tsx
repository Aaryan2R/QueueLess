import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function minutesBetween(start: string, end: string | null) {
  if (!end) return null;
  return Math.max(0, (Date.parse(end) - Date.parse(start)) / 60_000);
}

export default async function QueueAnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await getServerSupabase();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: queue } = await supabase.from("queues").select("id,name").eq("id", id).single();
  if (!queue) notFound();

  const { data: tickets, error } = await supabase
    .from("tickets")
    .select("id,token,customer_name,status,joined_at,called_at,completed_at")
    .eq("queue_id", id)
    .order("joined_at", { ascending: false });
  if (error) throw new Error("Unable to load queue history.");

  const rows = tickets ?? [];
  const served = rows.filter((ticket) => ticket.status === "SERVED");
  const noShows = rows.filter((ticket) => ticket.status === "NO_SHOW");
  const completed = rows.filter((ticket) => ["SERVED", "NO_SHOW", "CANCELLED"].includes(ticket.status));
  const waits = rows
    .map((ticket) => minutesBetween(ticket.joined_at, ticket.called_at))
    .filter((value): value is number => value !== null);
  const averageWait = waits.length
    ? Math.round((waits.reduce((sum, value) => sum + value, 0) / waits.length) * 10) / 10
    : 0;

  return (
    <main className="page">
      <Link href={`/dashboard/queues/${id}`}>← Queue control</Link>
      <div className="eyebrow">Queue history</div>
      <h1>{queue.name}</h1>
      <div className="grid">
        <div className="card">
          <div className="muted">Total tickets</div>
          <div className="stat">{rows.length}</div>
        </div>
        <div className="card">
          <div className="muted">Served</div>
          <div className="stat">{served.length}</div>
        </div>
        <div className="card">
          <div className="muted">No-show</div>
          <div className="stat">{noShows.length}</div>
        </div>
        <div className="card">
          <div className="muted">Average wait</div>
          <div className="stat">{averageWait} min</div>
        </div>
        <div className="card">
          <div className="muted">Completed</div>
          <div className="stat">{completed.length}</div>
        </div>
      </div>
      <div className="card" style={{ marginTop: 24 }}>
        <h2>Recent tickets</h2>
        {rows.length === 0 ? (
          <p className="muted">No ticket history yet.</p>
        ) : (
          rows.slice(0, 100).map((ticket) => (
            <div className="queue-row" key={ticket.id}>
              <div>
                <strong>
                  {ticket.token} · {ticket.customer_name}
                </strong>
                <div className="muted">
                  Joined {new Date(ticket.joined_at).toLocaleString()} · {ticket.status}
                </div>
              </div>
              <span className="muted">
                {minutesBetween(ticket.joined_at, ticket.called_at) === null
                  ? "Not called"
                  : `${Math.round((minutesBetween(ticket.joined_at, ticket.called_at) ?? 0) * 10) / 10} min wait`}
              </span>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
