import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSupabase } from "@/lib/supabase";
import { isTrustedMutation, publicError } from "@/lib/security";

const schema = z.object({ token: z.string().min(1).max(128) });

export async function POST(request: Request) {
  try {
    if (!isTrustedMutation(request)) {
      return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
    }

    const { token } = schema.parse(await request.json());
    const supabase = await getServerSupabase();
    const { data: ticket, error } = await supabase.rpc("confirm_ticket_arrival", { input_token: token });
    if (error) throw new Error(error.message);
    return NextResponse.json({ ticket });
  } catch (error) {
    return NextResponse.json({ error: publicError(error, "Unable to confirm arrival.") }, { status: 400 });
  }
}
