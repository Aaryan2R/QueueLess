import { notFound } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase";
import JoinQueueForm from "./join-queue-form";

export const dynamic = "force-dynamic";

export default async function PublicQueuePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await getServerSupabase();
  const { data: queue } = await supabase
    .from("queues")
    .select(
      "id,name,description,status,average_service_minutes,max_size,businesses(name,logo_url,primary_color,welcome_message)"
    )
    .eq("slug", slug)
    .eq("status", "ACTIVE")
    .maybeSingle();
  if (!queue) notFound();
  const business = Array.isArray(queue.businesses) ? queue.businesses[0] : queue.businesses;
  return (
    <main className="page">
      <div
        className="card"
        style={{ maxWidth: 620, margin: "0 auto", borderTop: `8px solid ${business?.primary_color ?? "#3967e8"}` }}
      >
        <div className="eyebrow">{business?.name ?? "QueueLess business"}</div>
        <h1 style={{ fontSize: "3.5rem" }}>{queue.name}</h1>
        <p className="lead">{business?.welcome_message}</p>
        {queue.description && <p className="muted">{queue.description}</p>}
        {queue.status !== "ACTIVE" ? (
          <div className="notice error">
            This queue is {queue.status.toLowerCase()} and is not accepting new customers.
          </div>
        ) : (
          <JoinQueueForm queueId={queue.id} />
        )}
      </div>
    </main>
  );
}
