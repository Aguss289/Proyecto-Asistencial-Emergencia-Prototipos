const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Mensajes en memoria: { [solicitudId]: [{ id, autor, rol, contenido, timestamp }] }
const mensajesPorSolicitud = {};

// REST: obtener historial de mensajes de una solicitud
app.get("/solicitudes/:id/mensajes", (req, res) => {
  const { id } = req.params;
  const mensajes = mensajesPorSolicitud[id] || [];
  res.json(mensajes);
});

// REST: listar solicitudes activas (para el panel médico)
app.get("/solicitudes", (req, res) => {
  const solicitudes = Object.keys(mensajesPorSolicitud).map((id) => ({
    id,
    cantidadMensajes: mensajesPorSolicitud[id].length,
    ultimoMensaje: mensajesPorSolicitud[id].at(-1) || null,
  }));
  res.json(solicitudes);
});

// WebSocket
io.on("connection", (socket) => {
  console.log(`[WS] Cliente conectado: ${socket.id}`);

  // Unirse a una sala (solicitud)
  socket.on("joinRoom", ({ solicitudId, usuario, rol }) => {
    socket.join(`solicitud_${solicitudId}`);
    socket.data = { solicitudId, usuario, rol };

    // Inicializar sala si no existe
    if (!mensajesPorSolicitud[solicitudId]) {
      mensajesPorSolicitud[solicitudId] = [];
    }

    // Enviar historial al cliente que se une
    socket.emit("historial", mensajesPorSolicitud[solicitudId]);

    // Notificar al room que alguien entró
    socket.to(`solicitud_${solicitudId}`).emit("usuarioUnido", {
      usuario,
      rol,
    });

    console.log(`[WS] ${usuario} (${rol}) se unió a solicitud_${solicitudId}`);
  });

  // Enviar mensaje
  socket.on("sendMessage", ({ solicitudId, contenido }) => {
    const { usuario, rol } = socket.data;

    const mensaje = {
      id: Date.now().toString(),
      autor: usuario,
      rol,
      contenido,
      timestamp: new Date().toISOString(),
    };

    // Guardar en memoria
    if (!mensajesPorSolicitud[solicitudId]) {
      mensajesPorSolicitud[solicitudId] = [];
    }
    mensajesPorSolicitud[solicitudId].push(mensaje);

    // Broadcast a todos en el room (incluyendo el emisor)
    io.to(`solicitud_${solicitudId}`).emit("receiveMessage", mensaje);

    console.log(`[WS] Mensaje de ${usuario}: "${contenido}"`);
  });

  // Indicador "escribiendo..."
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
      socket.to(`solicitud_${solicitudId}`).emit("usuarioDesconectado", {
        usuario,
        rol,
      });
      console.log(`[WS] ${usuario} (${rol}) se desconectó de solicitud_${solicitudId}`);
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
