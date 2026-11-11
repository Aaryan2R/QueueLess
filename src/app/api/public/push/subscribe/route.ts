import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSupabase } from "@/lib/supabase";
import { checkRateLimit, getClientAddress, isTrustedMutation, publicError } from "@/lib/security";

const schema = z.object({
  token: z.string().regex(/^[a-f0-9]{48}$/),
  subscription: z.object({
    endpoint: z.string().url().max(2048),
    keys: z.object({
      p256dh: z.string().min(1).max(512),
      auth: z.string().min(1).max(512)
    })
  })
});

export async function POST(request: Request) {
  try {
    if (!isTrustedMutation(request)) {
      return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
    }
    if (!checkRateLimit(`push-subscribe:${getClientAddress(request)}`, 20, 60_000)) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }

    const input = schema.parse(await request.json());
    const supabase = await getServerSupabase();
    const { error } = await supabase.rpc("save_push_subscription", {
      input_token: input.token,
      input_endpoint: input.subscription.endpoint,
      input_p256dh: input.subscription.keys.p256dh,
      input_auth: input.subscription.keys.auth
    });

    if (error) {
      return NextResponse.json({ error: publicError(error, "Unable to enable notifications.") }, { status: 400 });
    }

    return NextResponse.json({ subscribed: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof z.ZodError ? "Invalid push subscription." : "Unable to enable notifications." },
      { status: 400 }
    );
  }
}
