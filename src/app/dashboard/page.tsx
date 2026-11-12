import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase";
import SignOutButton from "./sign-out-button";
import CreateBusinessForm from "./create-business-form";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await getServerSupabase();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: ownedBusinesses } = await supabase
    .from("businesses")
    .select("id,name,slug,owner_id")
    .eq("owner_id", user.id)
    .order("created_at");
  const { data: assignments } = await supabase.from("staff_assignments").select("business_id").eq("user_id", user.id);
  const businessIds = Array.from(
    new Set([
      ...(ownedBusinesses ?? []).map((business) => business.id),
      ...(assignments ?? []).map((item) => item.business_id)
    ])
  );
  const { data: businesses } = businessIds.length
    ? await supabase.from("businesses").select("id,name,slug,owner_id").in("id", businessIds).order("created_at")
    : { data: [] };
  const { data: queues } = businessIds.length
    ? await supabase
        .from("queues")
        .select("id,business_id,name,slug,status")
        .in("business_id", businessIds)
        .order("created_at")
    : { data: [] };
  const { data: tickets } = businessIds.length
    ? await supabase
        .from("tickets")
        .select("id,queue_id,token,customer_name,status")
        .in(
          "queue_id",
          (queues ?? []).map((queue) => queue.id)
        )
        .in("status", ["WAITING", "CALLED", "READY"])
        .order("joined_at")
    : { data: [] };
  return (
    <main className="page">
      <div className="nav" style={{ margin: "-42px -24px 32px" }}>
        <Link className="logo" href="/">
          QueueLess
        </Link>
        <div className="nav-links">
          <span>{user.email}</span>
          <SignOutButton />
        </div>
      </div>
      <div className="actions" style={{ justifyContent: "space-between" }}>
        <div>
          <div className="eyebrow">Your workspace</div>
          <h1 style={{ fontSize: "3rem" }}>Keep things moving.</h1>
          <p className="muted">Create a queue, share its QR link, and let your team call customers in order.</p>
        </div>
      </div>
      <div className="grid">
        <div className="card">
          <div className="muted">Businesses</div>
          <div className="stat">{businesses?.length ?? 0}</div>
        </div>
        <div className="card">
          <div className="muted">Active queues</div>
          <div className="stat">{(queues ?? []).filter((q) => q.status === "ACTIVE").length}</div>
        </div>
        <div className="card">
          <div className="muted">Waiting now</div>
          <div className="stat">{tickets?.filter((t) => t.status === "WAITING").length ?? 0}</div>
        </div>
      </div>
      <div className="stack" style={{ marginTop: 24 }}>
        {(businesses ?? []).map((business) => (
          <div className="card" key={business.id}>
            <h2>{business.name}</h2>
            {business.owner_id === user.id && (
              <Link className="muted" href={`/dashboard/businesses/${business.id}/staff`}>
                Manage staff
              </Link>
            )}
            {(queues ?? [])
              .filter((q) => q.business_id === business.id)
              .map((queue) => (
                <div className="queue-row" key={queue.id}>
                  <div>
                    <strong>{queue.name}</strong>
                    <div className="muted">
                      {queue.status} · {(tickets ?? []).filter((ticket) => ticket.queue_id === queue.id).length} active
                      tickets
                    </div>
                    <Link className="muted" href={`/q/${queue.slug}`}>
                      Public queue ↗
                    </Link>
                  </div>
                  <Link className="button secondary" href={`/dashboard/queues/${queue.id}`}>
                    Manage
                  </Link>
                </div>
              ))}
          </div>
        ))}
        <CreateBusinessForm />
      </div>
    </main>
  );
}
