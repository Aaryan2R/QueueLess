import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

type AppSupabaseClient = SupabaseClient<Database>;

export async function createBusiness(
  supabase: AppSupabaseClient,
  userId: string,
  input: { name: string; slug: string }
) {
  if (!userId) throw new Error("You must be logged in.");

  const { data: business, error } = await supabase.rpc("create_business_with_queue", {
    input_name: input.name,
    input_slug: input.slug
  });

  if (error) throw new Error(error.message);

  return { id: business.id, name: business.name, slug: business.slug };
}
