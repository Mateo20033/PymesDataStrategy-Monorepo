from pydantic import BaseModel, Field
from typing import Optional


class QueryRequest(BaseModel):
    pregunta: str = Field(..., min_length=3, max_length=2000, description="Pregunta del usuario")
    empresa_id: Optional[int] = Field(None, description="ID de la empresa en PostgreSQL")
    dataset_id: Optional[int] = Field(None, description="ID de un dataset específico (opcional)")


class QueryResponse(BaseModel):
    respuesta: str
    tokens_usados: Optional[int] = None
    duracion_ms: Optional[int] = None
    datasets_consultados: int = 0
    modelo: str = "gemini-1.5-flash"
