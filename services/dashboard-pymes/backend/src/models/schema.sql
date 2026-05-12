-- ============================================================
-- Dashboard PYMES-AI — Esquema de base de datos
-- Ejecutar: psql -U postgres -d pymes_ai -f src/models/schema.sql
-- ============================================================

-- ── Extensión para UUIDs ───────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Tabla: users ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL        PRIMARY KEY,
  nombre        VARCHAR(120)  NOT NULL,
  email         VARCHAR(255)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  rol           VARCHAR(20)   NOT NULL DEFAULT 'admin',   -- admin | viewer
  activo        BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── Tabla: empresas ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS empresas (
  id          SERIAL        PRIMARY KEY,
  nombre      VARCHAR(255)  NOT NULL,
  nit         VARCHAR(30)   UNIQUE,
  sector      VARCHAR(100),
  descripcion TEXT,
  user_id     INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── Tabla: datasets ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS datasets (
  id              SERIAL        PRIMARY KEY,
  nombre          VARCHAR(255)  NOT NULL,
  descripcion     TEXT,
  nombre_archivo  VARCHAR(255)  NOT NULL,
  total_filas     INTEGER       NOT NULL DEFAULT 0,
  columnas        JSONB,                          -- array con nombres de columnas
  tipo_dataset    VARCHAR(50)   NOT NULL DEFAULT 'general', -- general | financiero | inventario | rrhh | produccion | ventas | insumos
  empresa_id      INTEGER       NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  user_id         INTEGER       NOT NULL REFERENCES users(id),
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── Tabla: registros_datos ────────────────────────────────────────────────────
-- Cada fila del CSV se almacena como un objeto JSONB
CREATE TABLE IF NOT EXISTS registros_datos (
  id          BIGSERIAL   PRIMARY KEY,
  dataset_id  INTEGER     NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  fila_numero INTEGER     NOT NULL,
  datos       JSONB       NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_registros_dataset
  ON registros_datos (dataset_id);

CREATE INDEX IF NOT EXISTS idx_registros_datos_gin
  ON registros_datos USING gin (datos);

-- ── Tabla: chatbot_logs ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chatbot_logs (
  id          SERIAL        PRIMARY KEY,
  user_id     INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dataset_id  INTEGER       REFERENCES datasets(id) ON DELETE SET NULL,
  pregunta    TEXT          NOT NULL,
  respuesta   TEXT,
  tokens_usados INTEGER,
  duracion_ms INTEGER,
  estado      VARCHAR(20)   NOT NULL DEFAULT 'ok',   -- ok | error
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chatbot_user
  ON chatbot_logs (user_id);

-- ── Datos por defecto para integraciones S2S ──────────────────────────────────
INSERT INTO users (id, nombre, email, password_hash, rol) 
VALUES (1, 'System Admin', 'system@pymes.internal', 'no-login-allowed', 'admin')
ON CONFLICT (email) DO NOTHING;

INSERT INTO empresas (id, nombre, user_id)
VALUES (1, 'PymesDataStrategy Default Company', 1)
ON CONFLICT (id) DO NOTHING;

