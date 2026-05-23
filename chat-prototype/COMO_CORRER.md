# Chat Prototipo — Cómo correrlo

## Requisitos
- Node.js v18 o superior instalado

## Paso 1: Levantar el backend

Abrí una terminal y ejecutá:

```bash
cd chat-prototype/backend
npm install
node server.js
```

Deberías ver: `✅ Servidor corriendo en http://localhost:3001`

## Paso 2: Levantar el frontend

Abrí OTRA terminal y ejecutá:

```bash
cd chat-prototype/frontend
npm install
npm run dev
```

Deberías ver: `Local: http://localhost:5173`

## Paso 3: Probar el chat en tiempo real

1. Abrí `http://localhost:5173` en una pestaña
2. Ingresá tu nombre y elegí rol **Socio**, entrá con Solicitud ID `001`
3. Abrí `http://localhost:5173` en OTRA pestaña (o ventana incógnito)
4. Ingresá otro nombre y elegí rol **Médico**, usá el mismo Solicitud ID `001`
5. ¡Los mensajes aparecen en tiempo real entre las dos pestañas!

## Estructura del prototipo

```
chat-prototype/
  backend/
    server.js       ← Express + Socket.io (mensajes en memoria)
    package.json
  frontend/
    src/
      App.jsx                   ← Login y routing
      components/Chat.jsx       ← UI del chat
      hooks/useChat.js          ← Conexión con Socket.io
    package.json
```

## Eventos de Socket.io

| Evento         | Dirección      | Descripción                          |
|----------------|----------------|--------------------------------------|
| `joinRoom`     | cliente→server | Unirse a una sala de solicitud       |
| `sendMessage`  | cliente→server | Enviar un mensaje                    |
| `receiveMessage` | server→cliente | Recibir mensaje en tiempo real     |
| `historial`    | server→cliente | Mensajes previos al conectarse       |
| `typing`       | cliente→server | Notificar que está escribiendo       |
| `stopTyping`   | cliente→server | Notificar que dejó de escribir       |
