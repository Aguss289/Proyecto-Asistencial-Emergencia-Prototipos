# Proyecto Asistencial Emergencia — Prototipos

Prototipos funcionales para el sistema de comunicación de **La Asistencial Emergencia**.

---

## Prototipo 1: Chat en tiempo real

Chat 1:1 entre socio y médico, vinculado a una solicitud. Implementado con Node.js + Socket.io en el backend y React en el frontend.

### Requisitos

- Node.js v18 o superior → [nodejs.org](https://nodejs.org/)

### Instalación

Cloná el repositorio y luego instalá las dependencias de cada parte por separado.

**Backend:**
```bash
cd chat-prototype/backend
npm install
```

**Frontend:**
```bash
cd chat-prototype/frontend
npm install
```

### Cómo correrlo

Necesitás dos terminales abiertas al mismo tiempo.

**Terminal 1 — Backend** (puerto 3001):
```bash
cd chat-prototype/backend
node server.js
```

Deberías ver: `✅ Servidor corriendo en http://localhost:3001`

**Terminal 2 — Frontend** (puerto 5173):
```bash
cd chat-prototype/frontend
npm run dev
```

Deberías ver: `Local: http://localhost:5173`

### Cómo probarlo

1. Abrí `http://localhost:5173` en una pestaña del navegador
2. Ingresá un nombre, elegí el rol **Socio** y usá el Solicitud ID `001`
3. Abrí `http://localhost:5173` en otra pestaña (o ventana de incógnito)
4. Ingresá otro nombre, elegí el rol **Médico** y usá el mismo Solicitud ID `001`
5. Los mensajes aparecen en tiempo real entre las dos pestañas

Si uno de los dos se desconecta, al otro le aparece un aviso en pantalla.

### Estructura

```
chat-prototype/
├── backend/
│   ├── server.js          # Servidor Express + Socket.io
│   └── package.json
└── frontend/
    └── src/
        ├── App.jsx                # Pantalla de login y routing
        ├── components/
        │   └── Chat.jsx           # UI del chat
        └── hooks/
            └── useChat.js         # Conexión con Socket.io
```

### Eventos Socket.io

| Evento               | Dirección       | Descripción                                  |
|----------------------|-----------------|----------------------------------------------|
| `joinRoom`           | cliente→servidor | Unirse a la sala de una solicitud            |
| `sendMessage`        | cliente→servidor | Enviar un mensaje                            |
| `receiveMessage`     | servidor→cliente | Recibir mensaje en tiempo real              |
| `historial`          | servidor→cliente | Mensajes previos al conectarse              |
| `typing`             | cliente→servidor | Notificar que está escribiendo              |
| `stopTyping`         | cliente→servidor | Notificar que dejó de escribir              |
| `usuarioDesconectado`| servidor→cliente | Avisar que el otro usuario se desconectó   |

---

## Tecnologías

- **Backend:** Node.js, Express, Socket.io
- **Frontend:** React 18, Vite, socket.io-client
