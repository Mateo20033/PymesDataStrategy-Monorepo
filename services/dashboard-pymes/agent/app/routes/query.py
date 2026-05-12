"""
query.py
Endpoint POST /query — orquesta data_service → gemini_service y retorna la respuesta.
"""
import time
import logging
from fastapi import APIRouter, HTTPException, status
from app.models.schemas import QueryRequest, QueryResponse
from app.services.data_service import construir_contexto
from app.services.gemini_service import consultar_gemini

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post(
    "/query",
    response_model=QueryResponse,
    summary="Consultar al agente IA",
    description="Recibe una pregunta en lenguaje natural, obtiene el contexto de datos de la empresa y retorna la respuesta de Gemini.",
)
async def query(request: QueryRequest):
    inicio = time.monotonic()

    logger.info(
        "Nueva consulta | empresa_id=%s dataset_id=%s pregunta='%s'",
        request.empresa_id,
        request.dataset_id,
        request.pregunta[:80],
    )

    # ── 1. Obtener contexto de datos desde PostgreSQL ──────────────────────────
    try:
        contexto, n_datasets = construir_contexto(
            empresa_id=request.empresa_id,
            dataset_id=request.dataset_id,
        )
    except ConnectionError as e:
        logger.error("Error de BD: %s", e)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"No se pudo conectar a la base de datos: {e}",
        )
    except Exception as e:
        logger.error("Error inesperado en data_service: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener los datos de la empresa.",
        )

    # ── 2. Consultar Gemini con el contexto ────────────────────────────────────
    try:
        resultado = consultar_gemini(
            pregunta=request.pregunta,
            contexto_datos=contexto,
        )
    except ValueError as e:
        # API key no configurada
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e),
        )
    except Exception as e:
        logger.error("Error en Gemini API: %s", e)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Error al consultar el modelo de IA: {e}",
        )

    duracion_ms = int((time.monotonic() - inicio) * 1000)

    logger.info(
        "Consulta completada | tokens=%s duracion=%dms datasets=%d",
        resultado.get("tokens_usados"),
        duracion_ms,
        n_datasets,
    )

    return QueryResponse(
        respuesta=resultado["respuesta"],
        tokens_usados=resultado.get("tokens_usados"),
        duracion_ms=duracion_ms,
        datasets_consultados=n_datasets,
        modelo=resultado.get("modelo", "gemini-1.5-flash"),
    )
