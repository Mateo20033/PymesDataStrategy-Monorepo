-- ============================================================
-- Migración 001: agregar tipo_dataset a datasets
-- Ejecutar: psql -U postgres -d pymes_ai -f src/models/migrations/001_add_tipo_dataset.sql
-- ============================================================

ALTER TABLE datasets
  ADD COLUMN IF NOT EXISTS tipo_dataset VARCHAR(50) NOT NULL DEFAULT 'general';

COMMENT ON COLUMN datasets.tipo_dataset IS
  'Tipo de datos del dataset: general | financiero | inventario | rrhh | produccion | ventas | insumos';
