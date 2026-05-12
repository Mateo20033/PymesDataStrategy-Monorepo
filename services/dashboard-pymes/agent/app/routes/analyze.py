"""
analyze.py
Endpoint POST /analyze — análisis estadístico avanzado + interpretación Gemini.
"""
import json
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.services.analytics_service import ejecutar_analisis
from app.services.gemini_service import consultar_gemini

logger = logging.getLogger(__name__)
router = APIRouter()


class AnalyzeRequest(BaseModel):
    dataset_id: int
    tipo_analisis: str          # regresion | anomalias | clustering | correlacion | series_tiempo | completo
    empresa_id: Optional[int] = None


class AnalyzeResponse(BaseModel):
    resultados: dict
    interpretacion: str
    modelo: str


def _resumir_para_gemini(r: dict, tipo: str) -> str:
    """Serializa los resultados omitiendo listas largas de puntos."""
    copia = dict(r)
    # Truncar arrays grandes que no aportan a Gemini
    for key in ("scatter", "anomalias", "valores", "labels", "linea_tend",
                "media_movil", "crecimiento", "proj_vals", "proj_labels"):
        if key in copia and isinstance(copia[key], list):
            copia[key] = copia[key][:8]   # solo primeros 8 para dar contexto
    return json.dumps(copia, ensure_ascii=False, indent=2)


_PROMPTS = {
    "regresion":    "Analiza esta regresión lineal y explica: la tendencia detectada, qué tan confiable es el modelo (R²), cuánto se proyecta el próximo trimestre y qué decisiones empresariales sugiere.",
    "anomalias":    "Analiza estas anomalías estadísticas detectadas y explica: cuáles son los más preocupantes, posibles causas, y qué acciones correctivas recomiendas.",
    "clustering":   "Analiza estos clusters de datos y explica: qué caracteriza a cada grupo, cómo difieren entre sí, y qué estrategia empresarial conviene para cada segmento.",
    "correlacion":  "Analiza estas correlaciones de Pearson y explica: cuáles son las más significativas, qué relaciones causa-efecto podrían existir, y qué implicaciones tiene para el negocio.",
    "series_tiempo":"Analiza esta serie de tiempo y explica: la tendencia general, los meses de mayor y menor actividad, si hay estacionalidad, y qué proyectas para los próximos meses.",
    "completo":     "Analiza estos resultados de análisis estadístico completo y proporciona un resumen ejecutivo de los hallazgos más importantes para la toma de decisiones empresariales.",
}


@router.post("/analyze", response_model=AnalyzeResponse, summary="Análisis estadístico avanzado")
async def analyze(request: AnalyzeRequest):
    logger.info("Análisis avanzado | dataset_id=%s tipo=%s", request.dataset_id, request.tipo_analisis)

    resultados = ejecutar_analisis(request.dataset_id, request.tipo_analisis)

    if "error" in resultados and len(resultados) == 1:
        raise HTTPException(status_code=422, detail=resultados["error"])

    # Interpretación Gemini
    prompt   = _PROMPTS.get(request.tipo_analisis, "Interpreta estos resultados estadísticos y explica su significado para el negocio.")
    contexto = _resumir_para_gemini(resultados, request.tipo_analisis)

    try:
        gemini  = consultar_gemini(pregunta=prompt, contexto_datos=contexto)
        interp  = gemini["respuesta"]
        modelo  = gemini.get("modelo", "gemini")
    except Exception as e:
        logger.warning("Gemini no disponible en /analyze: %s", e)
        interp = "Interpretación no disponible en este momento."
        modelo = "N/A"

    return AnalyzeResponse(resultados=resultados, interpretacion=interp, modelo=modelo)
