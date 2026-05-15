"use client";

import { createBrowserClient } from "@supabase/ssr";
import { requireSupabaseEnv } from "./env";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  if (browserClient) return browserClient;
  const { url, publishableKey } = requireSupabaseEnv();
  browserClient = createBrowserClient(url, publishableKey);
  return browserClient;
}
