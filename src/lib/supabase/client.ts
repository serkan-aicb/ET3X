import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { useRealSupabase, makeFakeSupabaseClient } from './fake-client'

/**
 * Browser Supabase client. In the frozen build we return a no-op client so the
 * app runs with no backend (see ./fake-client.ts); the real client is used only
 * when NEXT_PUBLIC_USE_SUPABASE=true is set with the URL + anon key. Typed as the
 * loose `SupabaseClient` (default generics) so legacy callers keep their prior
 * `any`-flavoured query results.
 */
export function createClient(): SupabaseClient {
  if (!useRealSupabase) {
    return makeFakeSupabaseClient() as unknown as SupabaseClient
  }
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
