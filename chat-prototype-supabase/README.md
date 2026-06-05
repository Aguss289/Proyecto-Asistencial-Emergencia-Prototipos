# Chat Asistencial – Prototipo Supabase

Prototipo funcional de chat médico con arquitectura en capas, autenticación JWT, tiempo real y soporte de archivos.

---

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + Vite 5 |
| Backend | Node.js + Express (ESM) |
| Base de datos | Supabase (PostgreSQL) |
| Tiempo real | Supabase Realtime + polling |
| Auth | JWT propio (bcrypt + jsonwebtoken) |
| Archivos | Supabase Storage |

---

## Estructura del proyecto

```
chat-prototype-supabase/
│
├── backend/
│   ├── src/
│   │   ├── domain/              Entidades puras de negocio
│   │   │   ├── Usuario.js       Roles, validaciones de email/rol
│   │   │   ├── Canal.js         Sala de chat, miembros
│   │   │   └── Mensaje.js       Tipos: texto | imagen | video
│   │   │
│   │   ├── services/            Lógica de negocio + acceso a Supabase
│   │   │   ├── UsuarioService.js  Registro, login, JWT
│   │   │   ├── CanalService.js    Crear canal, agregar miembros
│   │   │   └── MensajeService.js  Enviar texto, subir archivos
│   │   │
│   │   ├── controllers/         Manejo de request/response HTTP
│   │   │   ├── usuarioController.js
│   │   │   ├── canalController.js
│   │   │   └── mensajeController.js
│   │   │
│   │   ├── middleware/
│   │   │   ├── authJWT.js       Verifica Bearer token
│   │   │   └── validarRol.js    Control de acceso por rol
│   │   │
│   │   ├── routes/
│   │   │   └── index.js         Todas las rutas REST bajo /api
│   │   │
│   │   ├── config/
│   │   │   └── supabase.js      Cliente Supabase con service key
│   │   │
│   │   └── app.js               Entry point del servidor Express
│   │
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.jsx        Pantalla de login y registro
│   │   │   ├── CanalesList.jsx  Lista de chats del usuario
│   │   │   └── Chat.jsx         Pantalla de mensajes
│   │   │
│   │   ├── hooks/
│   │   │   ├── useAuth.js       Maneja sesión en memoria
│   │   │   └── useChat.js       Realtime + polling de mensajes
│   │   │
│   │   ├── services/
│   │   │   └── api.js           Llamadas REST al backend
│   │   │
│   │   ├── lib/
│   │   │   └── supabase.js      Cliente Supabase con anon key (solo Realtime)
│   │   │
│   │   ├── App.jsx              Enrutador: Login → Canales → Chat
│   │   └── main.jsx
│   │
│   ├── .env.example
│   └── package.json
│
└── supabase/
    ├── schema.sql               Tablas, Realtime, Storage (ejecutar primero)
    └── migration_realtime.sql   Migración para Realtime completo (ejecutar segundo)
```

---

## Roles

| Rol | Permisos |
|---|---|
| `socio` | Ver y responder chats que le fueron asignados |
| `medico` | Crear chats eligiendo un socio, ver sus propios chats |
| `operador` | Ver todos los canales, agregar miembros |

---

## Paso 1 — Crear proyecto en Supabase

1. Ir a [supabase.com](https://supabase.com) → **New project**
2. Esperar a que el proyecto termine de inicializarse (~1 min)
3. Ir a **Settings → Data API** y copiar:

| Variable | Dónde encontrarla | Para qué |
|---|---|---|
| Project URL | "Project URL" | Backend y frontend |
| Publishable key (`sb_publishable_...`) | "Project API keys" | Frontend (anon key) |
| Secret key (`sb_secret_...`) | "Project API keys" | Backend (service key) |

---

## Paso 2 — Crear las tablas en Supabase

1. Ir a **SQL Editor → New query** en el dashboard de Supabase
2. Pegar el contenido de `supabase/schema.sql` y ejecutar (**Run**)
3. Volver a **SQL Editor → New query**
4. Pegar el contenido de `supabase/migration_realtime.sql` y ejecutar

Esto crea las tablas `usuarios`, `canales`, `canal_miembros` y `mensajes`, activa Realtime en ambas y configura el bucket de Storage para archivos.

---

## Paso 3 — Configurar el backend

```bash
cd backend
copy .env.example .env
```

Editar `.env` con los valores de Supabase:

```env
PORT=3001
JWT_SECRET=cualquier_cadena_larga_y_secreta

SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_KEY=sb_secret_...
```

Instalar dependencias y arrancar:

```bash
npm install
npm run dev
```

El backend queda corriendo en `http://localhost:3001`.

---

## Paso 4 — Configurar el frontend

```bash
cd frontend
copy .env.example .env
```

Editar `.env`:

```env
VITE_API_URL=http://localhost:3001/api
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

Instalar dependencias y arrancar:

```bash
npm install
npm run dev
```

La app queda disponible en `http://localhost:5173`.

---

## Cómo probar el chat

1. Abrir `http://localhost:5173` → registrar un usuario con rol **Socio**
2. Abrir otra pestaña → registrar un usuario con rol **Médico**
3. Desde la pestaña del **Médico**: click en **Crear chat** → seleccionar el socio
4. El canal "Caso - Nombre" se crea automáticamente y ambos quedan como miembros
5. El **Socio** ve el chat aparecer en su lista en segundos (sin recargar)
6. Desde cualquier pestaña, los mensajes llegan en tiempo real a la otra

---

## Flujo de mensajes en tiempo real

```
[Usuario escribe y presiona Enviar]
        │
        ▼
POST /api/canales/:id/mensajes   ← backend Express
        │
        ▼
Supabase INSERT (mensajes)
        │
        ├── Supabase Realtime WebSocket ──▶ otro usuario (instantáneo)
        └── Polling cada 4 seg          ──▶ fallback garantizado
```

---

## Endpoints principales

```
POST   /api/auth/registrar
POST   /api/auth/login
GET    /api/auth/me

GET    /api/canales              (todos — solo operador)
GET    /api/canales/mios         (los del usuario autenticado)
POST   /api/canales              (crea canal + agrega miembro extra)
GET    /api/canales/:id/miembros
POST   /api/canales/:id/miembros (agrega miembro — médico/operador)

GET    /api/canales/:id/mensajes
POST   /api/canales/:id/mensajes
POST   /api/canales/:id/mensajes/archivo
```
