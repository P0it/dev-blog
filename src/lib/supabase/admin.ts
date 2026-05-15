import { createClient } from "@supabase/supabase-js";

// Service-role client. SERVER ONLY. Bypasses RLS. Use sparingly — currently
// just the seed script and any narrow admin task that genuinely needs it.
export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secretKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY. The secret key is required for admin operations and must never be exposed to the browser.",
    );
  }
  return createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
