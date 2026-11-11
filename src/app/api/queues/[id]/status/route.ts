import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSupabase } from "@/lib/supabase";
import { changeQueueStatus } from "@/lib/services/queue";
import { isTrustedMutation, publicError } from "@/lib/security";

const schema = z.object({ status: z.enum(["ACTIVE", "PAUSED"]) });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    if (!isTrustedMutation(request)) {
      return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
    }
    const input = schema.parse(await request.json());
    const supabase = await getServerSupabase();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
    const queue = await changeQueueStatus(supabase, id, input.status);
    return NextResponse.json({ queue });
  } catch (error) {
    return NextResponse.json({ error: publicError(error, "Unable to update the queue status.") }, { status: 400 });
  }
}
