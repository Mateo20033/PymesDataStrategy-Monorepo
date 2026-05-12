import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    # Gemini
    GEMINI_API_KEY: str  = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str    = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

    # PostgreSQL
    DB_HOST: str         = os.getenv("DB_HOST", "localhost")
    DB_PORT: int         = int(os.getenv("DB_PORT", "5432"))
    DB_NAME: str         = os.getenv("DB_NAME", "pymes_dashboard")
    DB_USER: str         = os.getenv("DB_USER", "postgres")
    DB_PASSWORD: str     = os.getenv("DB_PASSWORD", "")

    # Límites para el contexto enviado a Gemini
    MAX_DATASETS: int    = 3     # máximo de datasets a incluir por consulta
    MAX_FILAS: int       = 60    # máximo de filas de muestra por dataset
    MAX_CTX_CHARS: int   = 8000  # caracteres máximos del bloque de datos

    # Servidor
    HOST: str            = os.getenv("HOST", "0.0.0.0")
    PORT: int            = int(os.getenv("PORT", "8000"))
    BACKEND_URL: str     = os.getenv("BACKEND_URL", "http://localhost:3001")


settings = Settings()
