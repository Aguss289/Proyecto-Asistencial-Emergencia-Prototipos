import { createClient } from "@supabase/supabase-js";

// Cliente con anon key — sólo para Realtime (lectura en tiempo real).
// Las escrituras van siempre por el backend con la service key.
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
