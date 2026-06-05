import { createClient } from "@supabase/supabase-js";
import "dotenv/config";
import ws from "ws";

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  throw new Error("Faltan SUPABASE_URL o SUPABASE_SERVICE_KEY en el .env");
}

// Service key: puede leer/escribir todo sin restricciones de RLS.
// Sólo se usa en el backend — nunca se expone al frontend.
// ws: necesario en Node.js < 22 que no tiene WebSocket nativo.
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { realtime: { transport: ws } }
);
