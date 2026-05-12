#!/bin/bash
# =============================================================================
# deploy.sh — PymesDataStrategy Production Deploy Script
# Ejecutar como root en el servidor: bash deploy.sh
# =============================================================================
set -e

REPO_URL="https://github.com/jcgmU/PymesDataStrategy-Monorepo.git"
APP_DIR="/opt/pymes"

echo "=========================================="
echo "  PymesDataStrategy — Deploy a Producción"
echo "=========================================="

# ── 1. Docker ─────────────────────────────────────────────────────────────────
if ! command -v docker &>/dev/null; then
  echo "[1/6] Instalando Docker..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
else
  echo "[1/6] Docker ya instalado: $(docker --version)"
fi

# ── 2. Clonar/actualizar repo ─────────────────────────────────────────────────
echo "[2/6] Clonando repositorio..."
if [ -d "$APP_DIR" ]; then
  cd "$APP_DIR" && git pull
else
  git clone "$REPO_URL" "$APP_DIR"
  cd "$APP_DIR"
fi

# ── 3. Archivo .env ───────────────────────────────────────────────────────────
if [ ! -f "$APP_DIR/backend/.env.prod" ]; then
  echo ""
  echo "⚠️  No se encontró backend/.env.prod"
  echo "   Copia backend/.env.prod.example → backend/.env.prod y edítalo:"
  echo "   cp $APP_DIR/backend/.env.prod.example $APP_DIR/backend/.env.prod"
  echo "   nano $APP_DIR/backend/.env.prod"
  echo ""
  echo "   Luego ejecuta de nuevo: bash $APP_DIR/deploy.sh"
  exit 1
fi

# ── 4. Caddyfile con el dominio real ──────────────────────────────────────────
DOMAIN=$(grep '^DOMAIN=' "$APP_DIR/backend/.env.prod" | cut -d'=' -f2)
if [ -z "$DOMAIN" ]; then
  echo "❌ DOMAIN no está definido en .env.prod"
  exit 1
fi

echo "[3/6] Configurando Caddy para dominio: $DOMAIN"
sed -i "s/TU_DOMINIO.COM/$DOMAIN/g" "$APP_DIR/backend/Caddyfile"

# ── 5. Build y arranque ───────────────────────────────────────────────────────
echo "[4/6] Construyendo imágenes (puede tardar 5-10 min)..."
cd "$APP_DIR/backend"
docker compose -f docker-compose.prod.yml --env-file .env.prod build --parallel

echo "[5/6] Levantando servicios..."
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d

# ── 6. Estado final ───────────────────────────────────────────────────────────
echo "[6/6] Estado de los contenedores:"
docker compose -f docker-compose.prod.yml ps

echo ""
echo "✅ Deploy completado"
echo "   URL: https://$DOMAIN"
echo ""
echo "Comandos útiles:"
echo "  Ver logs:    docker compose -f $APP_DIR/backend/docker-compose.prod.yml logs -f"
echo "  Reiniciar:   docker compose -f $APP_DIR/backend/docker-compose.prod.yml restart"
echo "  Actualizar:  cd $APP_DIR && git pull && bash deploy.sh"
