import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSupabase } from "@/lib/supabase";
import { checkRateLimit, getClientAddress, isTrustedMutation, publicError } from "@/lib/security";

const schema = z.object({
  queueId: z.string().uuid(),
  name: z.string().trim().min(1).max(80),
  phone: z.string().trim().max(30).optional(),
  partySize: z.number().int().min(1).max(20)
});

export async function POST(request: Request) {
  try {
    if (!isTrustedMutation(request)) {
      return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
    }
    if (!checkRateLimit(`public-join:${getClientAddress(request)}`, 5, 60_000)) {
      return NextResponse.json(
        { error: "Too many join attempts. Please wait a minute and try again." },
        { status: 429 }
      );
    }
    const input = schema.parse(await request.json());
    const supabase = await getServerSupabase();
    const { data, error } = await supabase
      .rpc("join_queue", {
        target_queue_id: input.queueId,
        input_name: input.name,
        input_phone: input.phone ?? null,
        input_party_size: input.partySize
      })
      .single();
    if (error) {
      return NextResponse.json({ error: publicError(error, "Unable to join this queue.") }, { status: 400 });
    }
    return NextResponse.json({ ticket: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof z.ZodError ? "Please check the form and try again." : "Unable to join this queue." },
      { status: 400 }
    );
  }
}
