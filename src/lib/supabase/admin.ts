import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * Service-role Supabase client — bypasses RLS. SERVER-ONLY.
 * Never import this into a Client Component or expose the key to the browser.
 * Used by server actions and local DB scripts.
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}
