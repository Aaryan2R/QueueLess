import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSupabase } from "@/lib/supabase";
import { isTrustedMutation, publicError } from "@/lib/security";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  maxSize: z.number().int().min(1).max(10_000),
  averageServiceMinutes: z.number().int().min(1).max(240)
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!isTrustedMutation(request)) {
      return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
    }

    const { id } = await params;
    const input = schema.parse(await request.json());
    const supabase = await getServerSupabase();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });

    const { data: queue, error } = await supabase
      .from("queues")
      .update({
        name: input.name,
        max_size: input.maxSize,
        average_service_minutes: input.averageServiceMinutes
      })
      .eq("id", id)
      .select("id,name,max_size,average_service_minutes")
      .single();

    if (error) throw new Error(error.message);
    return NextResponse.json({ queue });
  } catch (error) {
    return NextResponse.json({ error: publicError(error, "Unable to update queue settings.") }, { status: 400 });
  }
}
