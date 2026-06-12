-- ============================================================
-- Migration: cambio de email → cedula en tabla usuarios
-- Ejecutar en Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Renombrar la columna
ALTER TABLE usuarios RENAME COLUMN email TO cedula;

-- 2. Quitar la validación de formato email (ya no aplica)
ALTER TABLE usuarios ALTER COLUMN cedula TYPE TEXT;

-- 3. Agregar constraint: solo dígitos, entre 6 y 10 caracteres
ALTER TABLE usuarios
  ADD CONSTRAINT usuarios_cedula_formato
  CHECK (cedula ~ '^\d{6,10}$');

-- 4. Mantener el índice de unicidad (se hereda del UNIQUE anterior,
--    pero lo recreamos por nombre limpio)
ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_email_key;
ALTER TABLE usuarios ADD CONSTRAINT usuarios_cedula_key UNIQUE (cedula);
