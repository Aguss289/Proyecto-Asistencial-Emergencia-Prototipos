-- ============================================================
-- Chat Asistencial – Supabase Schema
-- Ejecutar en: Supabase Dashboard > SQL Editor > New query
-- ============================================================

-- Tabla: usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre        TEXT        NOT NULL,
  email         TEXT        UNIQUE NOT NULL,
  password_hash TEXT        NOT NULL,
  rol           TEXT        NOT NULL CHECK (rol IN ('socio', 'medico', 'operador')),
  creado_en     TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: canales (salas de chat)
CREATE TABLE IF NOT EXISTS canales (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre      TEXT        NOT NULL,
  descripcion TEXT,
  creado_por  UUID        REFERENCES usuarios(id) ON DELETE SET NULL,
  creado_en   TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: canal_miembros  (relación N:N usuarios ↔ canales)
CREATE TABLE IF NOT EXISTS canal_miembros (
  canal_id   UUID REFERENCES canales(id)  ON DELETE CASCADE,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  unido_en   TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (canal_id, usuario_id)
);

-- Tabla: mensajes
CREATE TABLE IF NOT EXISTS mensajes (
  id        UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  canal_id  UUID        NOT NULL REFERENCES canales(id) ON DELETE CASCADE,
  autor_id  UUID        REFERENCES usuarios(id) ON DELETE SET NULL,
  tipo      TEXT        NOT NULL DEFAULT 'texto'
              CHECK (tipo IN ('texto', 'imagen', 'video', 'archivo')),
  contenido TEXT        NOT NULL,
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para acelerar consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_mensajes_canal_id ON mensajes (canal_id, creado_en);
CREATE INDEX IF NOT EXISTS idx_canal_miembros_usuario ON canal_miembros (usuario_id);

-- ============================================================
-- Activar Supabase Realtime para la tabla mensajes
-- (permite que el frontend reciba INSERTs en tiempo real)
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE mensajes;

-- ============================================================
-- Storage: crear bucket para archivos del chat
-- (también se puede crear desde el Dashboard > Storage)
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-archivos', 'chat-archivos', true)
ON CONFLICT (id) DO NOTHING;

-- Política: cualquier usuario autenticado puede subir al bucket
CREATE POLICY "Autenticados pueden subir" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'chat-archivos');

-- Política: cualquiera puede ver los archivos (URLs públicas)
CREATE POLICY "Acceso público de lectura" ON storage.objects
  FOR SELECT USING (bucket_id = 'chat-archivos');
