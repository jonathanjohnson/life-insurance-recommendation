import {
  createBrowserClient as createSsrBrowserClient,
  createServerClient as createSsrServerClient,
  type CookieMethodsServer,
} from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

import type { Database } from "./types";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/**
 * Browser-side client used inside client components. Reads the publishable
 * anon key — never the service role.
 */
export function createBrowserClient() {
  return createSsrBrowserClient<Database>(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  );
}

/**
 * Service-role client for server-side API routes. Bypasses RLS, so it must
 * never be imported from client components. Cookies are intentionally
 * not persisted — every server request is independent.
 */
export function createServerClient() {
  return createClient<Database>(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}

/**
 * Cookie-bound server client for App Router server components / route
 * handlers that need to act as the signed-in user. Pass in the request's
 * cookie adapter (e.g. from `next/headers`).
 */
export function createUserServerClient(cookies: CookieMethodsServer) {
  return createSsrServerClient<Database>(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    { cookies },
  );
}
