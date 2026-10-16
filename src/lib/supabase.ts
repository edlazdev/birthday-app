import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = (typeof import.meta !== "undefined" && import.meta.env?.PUBLIC_SUPABASE_URL) || process.env.PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = (typeof import.meta !== "undefined" && import.meta.env?.PUBLIC_SUPABASE_ANON_KEY) || process.env.PUBLIC_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes("tu-proyecto") &&
  supabaseUrl.startsWith("https://")
);

export const supabase = isSupabaseConfigured
  ? createBrowserClient(supabaseUrl, supabaseAnonKey)
  : null;

/** Helper para obtener el cliente o advertir si no está configurado */
export function getSupabase() {
  if (!supabase) {
    console.warn(
      "[Supabase] Cliente no configurado. Asegúrate de configurar PUBLIC_SUPABASE_URL y PUBLIC_SUPABASE_ANON_KEY en tu .env"
    );
  }
  return supabase;
}
