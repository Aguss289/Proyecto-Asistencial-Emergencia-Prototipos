-- ============================================================
-- Migration: soporte Realtime completo
-- Ejecutar en Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Agregar autor_nombre y autor_rol a mensajes
--    (desnormalizado para que el payload de Realtime traiga todo sin JOIN)
ALTER TABLE mensajes ADD COLUMN IF NOT EXISTS autor_nombre TEXT;
ALTER TABLE mensajes ADD COLUMN IF NOT EXISTS autor_rol   TEXT;

-- Llenar mensajes existentes
UPDATE mensajes m
SET autor_nombre = u.nombre, autor_rol = u.rol
FROM usuarios u
WHERE m.autor_id = u.id;

-- 2. Activar Realtime en canal_miembros
--    (para que el socio vea el canal aparecer sin recargar)
ALTER PUBLICATION supabase_realtime ADD TABLE canal_miembros;
