import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSupabase } from "@/lib/supabase";
import { checkRateLimit, getClientAddress, isTrustedMutation, publicError } from "@/lib/security";

const schema = z.object({
  token: z.string().regex(/^[a-f0-9]{48}$/)
});

export async function POST(request: Request) {
  try {
    if (!isTrustedMutation(request)) {
      return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
    }

    if (!checkRateLimit(`public-leave:${getClientAddress(request)}`, 10, 60_000)) {
      return NextResponse.json({ error: "Too many requests. Please wait a minute and try again." }, { status: 429 });
    }

    const input = schema.parse(await request.json());
    const supabase = await getServerSupabase();
    const { data, error } = await supabase.rpc("leave_queue", { input_token: input.token });

    if (error) {
      return NextResponse.json({ error: publicError(error, "Unable to leave this queue.") }, { status: 400 });
    }

    return NextResponse.json({ ticket: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof z.ZodError ? "This ticket link is invalid." : "Unable to leave this queue." },
      { status: 400 }
    );
  }
}
