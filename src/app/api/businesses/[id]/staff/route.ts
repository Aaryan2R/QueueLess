import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSupabase } from "@/lib/supabase";
import { isTrustedMutation, publicError } from "@/lib/security";

const addSchema = z.object({ email: z.string().trim().email().max(320) });
const removeSchema = z.object({ assignmentId: z.string().uuid() });

async function requireOwner(request: Request) {
  const supabase = await getServerSupabase();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be logged in.");
  return supabase;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!isTrustedMutation(request)) {
      return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
    }
    const { id } = await params;
    const { email } = addSchema.parse(await request.json());
    const supabase = await requireOwner(request);
    const { data, error } = await supabase.rpc("add_staff_member", {
      input_business_id: id,
      input_email: email
    });
    if (error) throw new Error(error.message);
    return NextResponse.json({ staff: data });
  } catch (error) {
    return NextResponse.json({ error: publicError(error, "Unable to add staff member.") }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!isTrustedMutation(request)) {
      return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
    }
    const { id } = await params;
    const { assignmentId } = removeSchema.parse(await request.json());
    const supabase = await requireOwner(request);
    const { error } = await supabase.rpc("remove_staff_member", { input_assignment_id: assignmentId });
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true, businessId: id });
  } catch (error) {
    return NextResponse.json({ error: publicError(error, "Unable to remove staff member.") }, { status: 400 });
  }
}
