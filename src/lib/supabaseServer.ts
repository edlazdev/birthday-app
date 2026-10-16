import { createServerClient, parseCookieHeader } from "@supabase/ssr";
import type { APIContext } from "astro";

const supabaseUrl = (typeof import.meta !== "undefined" && import.meta.env?.PUBLIC_SUPABASE_URL) || process.env.PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = (typeof import.meta !== "undefined" && import.meta.env?.PUBLIC_SUPABASE_ANON_KEY) || process.env.PUBLIC_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes("tu-proyecto") &&
  supabaseUrl.startsWith("https://")
);

export function createSupabaseServerClient(context: {
  cookies: APIContext["cookies"];
  request: Request;
}) {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return parseCookieHeader(context.request.headers.get("Cookie") ?? "");
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          context.cookies.set(name, value, options);
        });
      },
    },
  });
}
