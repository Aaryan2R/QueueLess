import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSupabase } from "@/lib/supabase";
import { createBusiness } from "@/lib/services/business";
import { isTrustedMutation, publicError } from "@/lib/security";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
});

export async function POST(request: Request) {
  try {
    if (!isTrustedMutation(request)) {
      return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
    }
    const supabase = await getServerSupabase();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
    const input = schema.parse(await request.json());
    const business = await createBusiness(supabase, user.id, input);
    return NextResponse.json({ business }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof z.ZodError
            ? "Please enter a valid business name and URL slug."
            : publicError(error, "Unable to create the business.")
      },
      { status: 400 }
    );
  }
}
