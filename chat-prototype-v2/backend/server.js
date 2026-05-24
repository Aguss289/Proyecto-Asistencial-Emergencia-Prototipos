require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// ── Cloudinary ────────────────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: "asistencial-chat",
    resource_type: "auto", // detecta imagen o video automáticamente
  }),
});

const upload = multer({ storage });

// ── Express ───────────────────────────────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// ── Helpers ───────────────────────────────────────────────────────────────────
async function upsertSolicitud(id) {
  return prisma.solicitud.upsert({
    where: { id },
    update: {},
    create: { id },
  });
}

// ── REST ──────────────────────────────────────────────────────────────────────

// Subir foto o video
app.post("/upload", upload.single("archivo"), async (req, res) => {
  try {
    const { solicitudId, autor, rol } = req.body;

    if (!solicitudId || !autor || !rol) {
      return res.status(400).json({ error: "Faltan campos: solicitudId, autor, rol" });
    }

    const url = req.file.path;
    const tipo = req.file.mimetype?.startsWith("video") ? "video" : "imagen";

    await upsertSolicitud(solicitudId);

    const mensaje = await prisma.mensaje.create({
      data: { solicitudId, autor, rol, tipo, contenido: url },
    });

    // Broadcast al room
    io.to(`solicitud_${solicitudId}`).emit("receiveMessage", mensaje);

    res.json(mensaje);
  } catch (err) {
    console.error("[UPLOAD ERROR]", err);
    res.status(500).json({ error: "Error al subir archivo" });
  }
});

// Historial de una solicitud
app.get("/solicitudes/:id/mensajes", async (req, res) => {
  const mensajes = await prisma.mensaje.findMany({
    where: { solicitudId: req.params.id },
    orderBy: { creadoEn: "asc" },
  });
  res.json(mensajes);
});

// ── WebSocket ─────────────────────────────────────────────────────────────────
io.on("connection", (socket) => {
  console.log(`[WS] Conectado: ${socket.id}`);

  socket.on("joinRoom", async ({ solicitudId, usuario, rol }) => {
    socket.join(`solicitud_${solicitudId}`);
    socket.data = { solicitudId, usuario, rol };

    await upsertSolicitud(solicitudId);

    // Cargar historial desde BD
    const historial = await prisma.mensaje.findMany({
      where: { solicitudId },
      orderBy: { creadoEn: "asc" },
    });
    socket.emit("historial", historial);

    socket.to(`solicitud_${solicitudId}`).emit("usuarioUnido", { usuario, rol });
    console.log(`[WS] ${usuario} (${rol}) → solicitud_${solicitudId}`);
  });

  socket.on("sendMessage", async ({ solicitudId, contenido }) => {
    const { usuario: autor, rol } = socket.data;

    const mensaje = await prisma.mensaje.create({
      data: { solicitudId, autor, rol, tipo: "texto", contenido },
    });

    io.to(`solicitud_${solicitudId}`).emit("receiveMessage", mensaje);
    console.log(`[WS] Mensaje de ${autor}: "${contenido}"`);
  });

  socket.on("typing", ({ solicitudId }) => {
    const { usuario, rol } = socket.data;
    socket.to(`solicitud_${solicitudId}`).emit("typing", { usuario, rol });
  });

  socket.on("stopTyping", ({ solicitudId }) => {
    socket.to(`solicitud_${solicitudId}`).emit("stopTyping");
  });

  socket.on("disconnect", () => {
    const { solicitudId, usuario, rol } = socket.data || {};
    if (solicitudId && usuario) {
      socket.to(`solicitud_${solicitudId}`).emit("usuarioDesconectado", { usuario, rol });
      console.log(`[WS] ${usuario} desconectado`);
    }
  });
});

// ── Arrancar ──────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`✅ Servidor v2 corriendo en http://localhost:${PORT}`);
});
