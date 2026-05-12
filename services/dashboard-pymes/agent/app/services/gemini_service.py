"""
gemini_service.py
Construye el prompt y llama a la API de Gemini con el contexto de datos.
Usa el SDK oficial google-genai (v1+).
"""
from google import genai
from google.genai import types
from app.config import settings

# ── Cliente global ─────────────────────────────────────────────────────────────
_client: genai.Client | None = None


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        if not settings.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY no está configurada en el archivo .env")
        _client = genai.Client(api_key=settings.GEMINI_API_KEY)
    return _client


# ── Instrucción del sistema ────────────────────────────────────────────────────
SYSTEM_INSTRUCTION = (
    "Eres un asistente de análisis de datos para pequeñas y medianas empresas (PYMES). "
    "Puedes analizar cualquier tipo de datos empresariales: financieros, inventario, "
    "recursos humanos, producción, ventas, insumos, o cualquier otro indicador medible. "
    "Tu rol es ayudar a empresarios a entender sus datos y tomar decisiones informadas. "
    "Reglas: "
    "1. Responde SIEMPRE en español. "
    "2. Sé claro, conciso y orientado a resultados prácticos para el tipo de dato analizado. "
    "3. Interpreta los números en contexto: stock bajo, alta rotación, nómina elevada, etc. "
    "4. Adapta tu lenguaje al dominio: usa términos de inventario para stock, "
    "   términos de RRHH para empleados, términos financieros para ventas/gastos, etc. "
    "5. Si los datos no son suficientes para responder con certeza, indícalo claramente. "
    "6. No inventes datos que no estén en el contexto proporcionado. "
    "7. Usa formato Markdown ligero (negritas, listas) cuando mejore la legibilidad."
)


# ── Función principal ──────────────────────────────────────────────────────────

def consultar_gemini(pregunta: str, contexto_datos: str) -> dict:
    """
    Envía la pregunta y el contexto de datos a Gemini y retorna la respuesta.

    Returns:
        {
            "respuesta": str,
            "tokens_usados": int | None,
            "modelo": str,
        }
    """
    client = _get_client()

    # ── Construir el prompt ────────────────────────────────────────────────────
    if contexto_datos and contexto_datos.strip():
        prompt = (
            f"A continuación tienes los datos de la empresa que debes analizar:\n\n"
            f"==================== DATOS ====================\n"
            f"{contexto_datos}\n"
            f"===============================================\n\n"
            f"Pregunta del usuario: {pregunta}"
        )
    else:
        prompt = (
            f"No se proporcionaron datos específicos de la empresa.\n\n"
            f"Responde la siguiente pregunta de forma general sobre análisis "
            f"de negocios para PYMES:\n\nPregunta: {pregunta}"
        )

    # ── Llamada a la API ───────────────────────────────────────────────────────
    response = client.models.generate_content(
        model=settings.GEMINI_MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_INSTRUCTION,
            temperature=0.3,
        ),
    )

    # Extraer texto — recorrer candidates si .text viene None (modelos de pensamiento)
    if response.text:
        respuesta_texto = response.text
    elif response.candidates:
        respuesta_texto = "".join(
            part.text
            for part in response.candidates[0].content.parts
            if hasattr(part, "text") and part.text
        )
    else:
        respuesta_texto = "No se pudo obtener una respuesta del modelo."

    # Extraer tokens usados
    tokens_usados = None
    if hasattr(response, "usage_metadata") and response.usage_metadata:
        tokens_usados = getattr(response.usage_metadata, "total_token_count", None)

    return {
        "respuesta": respuesta_texto,
        "tokens_usados": tokens_usados,
        "modelo": settings.GEMINI_MODEL,
    }
