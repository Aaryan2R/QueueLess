import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSupabase } from "@/lib/supabase";
import { checkRateLimit, getClientAddress, isTrustedMutation, publicError, ticketTokenSchema } from "@/lib/security";

const schema = z.object({ token: ticketTokenSchema });

export async function POST(request: Request) {
  try {
    if (!isTrustedMutation(request)) {
      return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
    }

    if (!checkRateLimit(`ticket-arrive:${getClientAddress(request)}`, 10, 60_000)) {
      return NextResponse.json({ error: "Too many requests. Please wait a minute and try again." }, { status: 429 });
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
