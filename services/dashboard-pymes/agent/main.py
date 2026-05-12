"""
main.py — Servidor FastAPI del agente PYMES-AI
"""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.query   import router as query_router
from app.routes.analyze import router as analyze_router
from app.config import settings

# ── Logging ────────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


# ── Startup / Shutdown ─────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Agente PYMES-AI iniciando...")
    if not settings.GEMINI_API_KEY:
        logger.warning("⚠  GEMINI_API_KEY no configurada — las consultas fallarán")
    else:
        logger.info("✓  GEMINI_API_KEY detectada (modelo: %s)", settings.GEMINI_MODEL)
    logger.info("✓  PostgreSQL configurado en %s:%s/%s", settings.DB_HOST, settings.DB_PORT, settings.DB_NAME)
    yield
    logger.info("Agente PYMES-AI detenido.")


# ── App ────────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="PYMES-AI Agent",
    description="Agente de IA que analiza datos empresariales usando Google Gemini.",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ───────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",   # React frontend
        "http://localhost:3001",   # Node backend
        settings.BACKEND_URL,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Rutas ──────────────────────────────────────────────────────────────────────
app.include_router(query_router,   tags=["Consultas"])
app.include_router(analyze_router, tags=["Análisis Avanzado"])


@app.get("/health", tags=["Sistema"])
def health():
    return {
        "status": "ok",
        "modelo": settings.GEMINI_MODEL,
        "db_host": settings.DB_HOST,
        "gemini_configurado": bool(settings.GEMINI_API_KEY),
    }
