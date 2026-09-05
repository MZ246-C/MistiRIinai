import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { env } from "./env";

// This client uses the SERVICE ROLE key and therefore bypasses Row Level
// Security entirely. It must NEVER be imported by anything under src/
// (the frontend bundle). It only ever runs inside a Netlify Function,
// i.e. server-side, in response to a request we've already authenticated.
let client: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  if (!client) {
    client = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}
