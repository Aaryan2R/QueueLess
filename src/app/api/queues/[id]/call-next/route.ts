import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { callNext } from "@/lib/services/queue";
import { isTrustedMutation, publicError } from "@/lib/security";
import { notifyQueueProximity, notifyTicketCalled } from "@/lib/services/push";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isTrustedMutation(request)) {
    return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
  }
  const { id } = await params;
  const supabase = await getServerSupabase();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  try {
    const ticket = await callNext(supabase, id);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
    try {
      await notifyTicketCalled(ticket.id, `${appUrl}/ticket/${ticket.access_token}`);
      await notifyQueueProximity(id, appUrl);
    } catch (error) {
      console.error("Unable to send ticket notification:", error);
    }
    const { access_token: _accessToken, ...safeTicket } = ticket;
    return NextResponse.json({ ticket: safeTicket });
  } catch (error) {
    return NextResponse.json({ error: publicError(error, "Unable to call the next ticket.") }, { status: 400 });
  }
}
