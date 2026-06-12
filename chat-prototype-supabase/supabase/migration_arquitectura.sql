-- =============================================================
-- MIGRACIÓN: Entidades faltantes de la arquitectura completa
-- Ejecutar en Supabase SQL Editor (Dashboard → SQL Editor)
-- =============================================================

-- ────────────────────────────────────────────────────────────
-- CASOS  (entidad central del sistema)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS casos (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canal        TEXT NOT NULL DEFAULT 'MOBILE_APP'
                  CHECK (canal IN ('MOBILE_APP', 'PHONE_CALL')),
  estado       TEXT NOT NULL DEFAULT 'abierto'
                  CHECK (estado IN ('abierto', 'en_atencion', 'cerrado')),
  prioridad    TEXT CHECK (prioridad IN ('clave_1', 'clave_2', 'clave_3', 'clave_4')),
  paciente_id  UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  operador_id  UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  creado_en    TIMESTAMPTZ DEFAULT NOW(),
  cerrado_en   TIMESTAMPTZ
);

-- Vincular canales de chat existentes a su caso
ALTER TABLE canales ADD COLUMN IF NOT EXISTS caso_id UUID REFERENCES casos(id) ON DELETE SET NULL;

-- ────────────────────────────────────────────────────────────
-- CHAT REQUESTS  (médico/operador invita al socio)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_requests (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caso_id        UUID REFERENCES casos(id) ON DELETE CASCADE,
  remitente_id   UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  receptor_id    UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  estado         TEXT NOT NULL DEFAULT 'pendiente'
                    CHECK (estado IN ('pendiente', 'aceptado', 'rechazado')),
  nombre_cabina  TEXT,
  creado_en      TIMESTAMPTZ DEFAULT NOW(),
  respondido_en  TIMESTAMPTZ
);

-- ────────────────────────────────────────────────────────────
-- CUESTIONARIOS  (triaje clínico dinámico)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cuestionarios (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caso_id              UUID REFERENCES casos(id) ON DELETE CASCADE,
  estado               TEXT NOT NULL DEFAULT 'en_progreso'
                           CHECK (estado IN ('en_progreso', 'completado')),
  prioridad_tentativa  TEXT CHECK (prioridad_tentativa IN ('clave_1','clave_2','clave_3','clave_4')),
  creado_en            TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversation_turns (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cuestionario_id  UUID REFERENCES cuestionarios(id) ON DELETE CASCADE,
  pregunta         TEXT NOT NULL,
  respuesta        TEXT,
  orden            INT NOT NULL,
  creado_en        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS summaries (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cuestionario_id  UUID UNIQUE REFERENCES cuestionarios(id) ON DELETE CASCADE,
  contenido        TEXT NOT NULL,
  creado_en        TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- NOTIFICACIONES
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notificaciones (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id  UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo        TEXT NOT NULL,   -- 'chat_request' | 'chat_aceptado' | 'caso_actualizado' | etc.
  leida       BOOLEAN DEFAULT FALSE,
  datos       JSONB DEFAULT '{}',
  creado_en   TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- DIRECCIONES  (domicilios frecuentes del socio)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS direcciones (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id   UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  nombre       TEXT DEFAULT 'Casa',
  direccion    TEXT NOT NULL,
  lat          DECIMAL(9,6),
  lng          DECIMAL(9,6),
  es_principal BOOLEAN DEFAULT FALSE,
  creado_en    TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- UBICACION UNIDAD  (tracking en tiempo real, Clave 1)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ubicacion_unidad (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caso_id       UUID REFERENCES casos(id) ON DELETE CASCADE,
  lat           DECIMAL(9,6) NOT NULL,
  lng           DECIMAL(9,6) NOT NULL,
  registrado_en TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- MENSAJES: agregar receptor_id (para DMs directos)
-- ────────────────────────────────────────────────────────────
ALTER TABLE mensajes
  ADD COLUMN IF NOT EXISTS receptor_id UUID REFERENCES usuarios(id) ON DELETE SET NULL;

-- ────────────────────────────────────────────────────────────
-- ÍNDICES
-- ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_casos_paciente      ON casos(paciente_id);
CREATE INDEX IF NOT EXISTS idx_casos_operador      ON casos(operador_id);
CREATE INDEX IF NOT EXISTS idx_casos_estado        ON casos(estado);
CREATE INDEX IF NOT EXISTS idx_chat_req_receptor   ON chat_requests(receptor_id, estado);
CREATE INDEX IF NOT EXISTS idx_notif_usuario       ON notificaciones(usuario_id, leida);
CREATE INDEX IF NOT EXISTS idx_conv_turns_order    ON conversation_turns(cuestionario_id, orden);
CREATE INDEX IF NOT EXISTS idx_ubicacion_caso      ON ubicacion_unidad(caso_id, registrado_en DESC);

-- ────────────────────────────────────────────────────────────
-- RLS  (Realtime Realtime Security básico)
-- ────────────────────────────────────────────────────────────
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notif_propias" ON notificaciones;
CREATE POLICY "notif_propias"
  ON notificaciones FOR ALL
  USING (auth.uid() = usuario_id);

ALTER TABLE chat_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chatreq_participantes" ON chat_requests;
CREATE POLICY "chatreq_participantes"
  ON chat_requests FOR ALL
  USING (auth.uid() = remitente_id OR auth.uid() = receptor_id);
