import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase";
import StaffForm from "./staff-form";
import StaffMemberActions from "./staff-member-actions";

export const dynamic = "force-dynamic";

export default async function StaffPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await getServerSupabase();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: business } = await supabase.from("businesses").select("id,name,owner_id").eq("id", id).single();
  if (!business || business.owner_id !== user.id) notFound();

  const { data: staff, error } = await supabase.rpc("list_business_staff", { input_business_id: id });
  if (error) throw new Error("Unable to load staff members.");

  return (
    <main className="page">
      <Link href="/dashboard">← Dashboard</Link>
      <div className="eyebrow">Staff management</div>
      <h1>{business.name}</h1>
      <p className="muted">Staff members can operate the live queue but cannot change business settings.</p>
      <div className="grid">
        <div className="card">
          <h2>Add staff</h2>
          <StaffForm businessId={id} />
        </div>
        <div className="card">
          <h2>Current staff</h2>
          {(staff ?? []).length === 0 ? (
            <p className="muted">No staff members assigned.</p>
          ) : (
            <div className="stack">
              {(staff ?? []).map((member) => (
                <div className="queue-row" key={member.id}>
                  <span>{member.email}</span>
                  <StaffMemberActions businessId={id} assignmentId={member.id} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
