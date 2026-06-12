-- ============================================================
-- Migration: soporte Videollamadas
-- Ejecutar en Supabase Dashboard > SQL Editor
-- ============================================================

-- Tabla: videollamadas
CREATE TABLE IF NOT EXISTS videollamadas (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  canal_id      UUID        NOT NULL REFERENCES canales(id) ON DELETE CASCADE,
  iniciado_por  UUID        REFERENCES usuarios(id) ON DELETE SET NULL,
  estado        TEXT        NOT NULL DEFAULT 'activa'
                  CHECK (estado IN ('activa', 'finalizada', 'rechazada')),
  iniciada_en   TIMESTAMPTZ DEFAULT NOW(),
  finalizada_en TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_videollamadas_canal ON videollamadas (canal_id, estado);
