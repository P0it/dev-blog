import { createClient } from "@supabase/supabase-js";

// Service-role client. SERVER ONLY. Bypasses RLS. Use sparingly — currently
// just the seed script and any narrow admin task that genuinely needs it.
export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. The service role key is required for admin operations and must never be exposed to the browser.",
    );
  }
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
