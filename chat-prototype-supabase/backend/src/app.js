import "dotenv/config";
import express from "express";
import cors from "cors";
import routes from "./routes/index.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

// Todas las rutas bajo /api
app.use("/api", routes);

// Health check
app.get("/", (_, res) => res.json({ ok: true, servicio: "Chat Asistencial – Supabase" }));

app.listen(PORT, () => {
  console.log(`✅ Backend corriendo en http://localhost:${PORT}`);
  console.log(`   Supabase URL: ${process.env.SUPABASE_URL}`);
});
