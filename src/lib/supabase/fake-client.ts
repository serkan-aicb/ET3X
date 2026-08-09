/**
 * Frozen-build Supabase shim.
 *
 * The v1.7/v6 product is localStorage-only (see `src/lib/local-draft.ts` and
 * `src/lib/auth/local-session.ts`). The legacy pre-v1.6 pages still import the
 * Supabase browser client; rather than rewrite them all, `createClient()` hands
 * back this no-op when the Supabase env vars are ABSENT — so the app boots and
 * deploys with zero secrets and legacy pages render empty instead of throwing
 * "supabaseUrl is required" at startup.
 *
 * This is purely an absence-of-config fallback: if the env vars ARE present the
 * real client is returned unchanged. Nothing here is destructive.
 */

export const hasSupabaseEnv =
  typeof process !== "undefined" &&
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

type QueryResult = { data: unknown[]; error: null };

/** A chainable, awaitable no-op query builder (`.from(...).select().eq()...`). */
function makeQueryBuilder(): unknown {
  const result: QueryResult = { data: [], error: null };
  const target: Record<string, unknown> = {
    // Thenable so `await supabase.from(...).select(...)` resolves to empty data.
    then: (onfulfilled: (v: QueryResult) => unknown) =>
      Promise.resolve(result).then(onfulfilled),
    catch: () => builder,
    finally: (cb?: () => void) => {
      cb?.();
      return builder;
    },
  };
  const builder: unknown = new Proxy(target, {
    get(t, prop) {
      if (prop in t) return t[prop as string];
      // select/insert/update/delete/eq/order/single/maybeSingle/… keep chaining.
      return () => builder;
    },
  });
  return builder;
}

const auth = {
  getUser: async () => ({ data: { user: null }, error: null }),
  getSession: async () => ({ data: { session: null }, error: null }),
  signInWithPassword: async () => ({
    data: { user: null, session: null },
    error: null,
  }),
  signUp: async () => ({ data: { user: null, session: null }, error: null }),
  signOut: async () => ({ error: null }),
  exchangeCodeForSession: async () => ({
    data: { session: null },
    error: null,
  }),
  resetPasswordForEmail: async () => ({ data: {}, error: null }),
  updateUser: async () => ({ data: { user: null }, error: null }),
  onAuthStateChange: () => ({
    data: { subscription: { unsubscribe() {} } },
  }),
};

const storageBucket = {
  upload: async () => ({ data: null, error: null }),
  download: async () => ({ data: null, error: null }),
  remove: async () => ({ data: null, error: null }),
  createSignedUrl: async () => ({ data: null, error: null }),
  getPublicUrl: () => ({ data: { publicUrl: "" } }),
};

/** A no-op stand-in for a Supabase client — enough surface for legacy pages. */
export function makeFakeSupabaseClient() {
  return {
    from: () => makeQueryBuilder(),
    rpc: () => makeQueryBuilder(),
    auth,
    storage: { from: () => storageBucket },
  };
}
