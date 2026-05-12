# Dashboard PYMES-AI

Plataforma web de análisis de datos con inteligencia artificial para pequeñas y medianas empresas (PYMES). Permite cargar archivos CSV, visualizar métricas automáticas con gráficas inteligentes, ejecutar análisis estadístico avanzado y consultar un agente de IA en lenguaje natural.

Desarrollado como proyecto de grado — **Universidad Compensar (UCompensar)**.

---

## Stack tecnológico

| Capa | Tecnología | Versión |
|---|---|---|
| **Frontend** | React | 18.x |
| | Chart.js + react-chartjs-2 | 4.x |
| | React Router | v6 |
| | Axios | 1.x |
| | jsPDF + html2canvas | 4.x / 1.4.x |
| **Backend** | Node.js + Express | 18.x / 4.x |
| | PostgreSQL (driver `pg`) | 15.x |
| | JWT (jsonwebtoken) | 9.x |
| | Multer (subida de archivos) | 1.x |
| | csv-parse | 5.x |
| **Agente IA** | Python | 3.11.x |
| | FastAPI + Uvicorn | 0.115.x / 0.30.x |
| | Pydantic v2 | 2.9.x |
| | Google Gemini (`google-genai`) | 1.x (gemini-2.5-flash) |
| | scikit-learn | 1.4.x |
| | pandas + numpy + scipy | 2.2.x / 1.26.x / 1.13.x |
| **Base de datos** | PostgreSQL | 15.x |

---

## Arquitectura

```
ProyectoGrado/
├── backend/          → API REST Node.js (puerto 3001)
├── frontend/         → SPA React     (puerto 3000)
└── agent/            → Agente IA FastAPI (puerto 8000)
```

Los tres servicios son independientes y se comunican por HTTP. El frontend habla con el backend para autenticación y gestión de datos, y con el agente directamente para consultas de IA y análisis estadístico.

```
[Usuario]
   │
   ├── HTTP 3000 ──→ [React Frontend]
   │                      │
   │              ┌───────┴────────┐
   │         HTTP 3001         HTTP 8000
   │              │                │
   │         [Backend            [Agente IA
   │          Node.js]           FastAPI]
   │              │                │  │
   │         [PostgreSQL]    [Gemini API]
   │                         [scikit-learn]
```

---

## Funcionalidades

### Motor de análisis automático (Backend)
- **Detección de tipo de dataset**: Salud, Deportes, Financiero, Inventario, RRHH, Producción, Ventas, Insumos, General — detectado automáticamente por nombres de columna
- **Clasificación de columnas**: temporal, categórica, numérica acumulable, numérica estadística, identificador
- **KPIs adaptativos**: prioriza columnas con mayor valor semántico (goles, total, valor, salario…) y aplica SUM vs AVG según el tipo de columna
- **Generación inteligente de gráficas**: solo genera charts con sentido analítico
  - `line` / `area` → columna fecha + numérica (≥2 periodos reales)
  - `bar_h` → ranking por categoría
  - `pie` / `donut` → distribución (≤5 / >5 categorías)
  - `polar` → distribución con 3-8 categorías
  - `bar` agrupado → comparativo multi-métrica (escalas compatibles <50×)
  - `radar` normalizado → perfil por categoría (3+ métricas, 3-15 grupos, valores % del máximo)
  - `scatter` → correlación entre dos columnas numéricas (escalas incompatibles o ambas estadísticas)
  - Frecuencia → para columnas de texto categóricas (posicion, resultado, ciudad…)
- **Formato automático por columna**: `moneda` ($), `porcentaje` (%), `entero`, `número`
- **Insights automáticos**: categoría dominante, mes pico, outliers IQR, alta variabilidad, top performer, tasa victorias/derrotas
- **Validaciones**: no genera líneas con un solo punto, no aplica tendencias temporales a variables fijas (edad, antigüedad…), no mezcla escalas incompatibles

### Módulo de análisis estadístico avanzado (Agente IA)
Endpoint `POST /analyze` — ejecuta análisis con scikit-learn sobre los registros del dataset:

| Análisis | Algoritmo | Salida |
|---|---|---|
| Regresión lineal | `LinearRegression` | pendiente, R², tendencia, proyección 3 meses |
| Detección de anomalías | IQR (Q1−1.5×IQR, Q3+1.5×IQR) | outliers con valor, tipo y contexto |
| Clustering | `KMeans` + `StandardScaler` | k=3 grupos, scatter data, stats por cluster |
| Correlación | Pearson (`DataFrame.corr`) | matriz completa, pares significativos |r|>0.5 |
| Series de tiempo | Media móvil, pct_change | MM3, tasas de crecimiento, meses pico/valle |

Cada análisis retorna resultados estructurados + interpretación generada por Gemini 2.5 Flash con prompt especializado por tipo.

### Contexto enriquecido para el agente
El agente construye un contexto analítico completo antes de consultar a Gemini:
- Estadísticas numéricas (min/max/avg/sum) sobre todos los registros
- **Distribuciones** (count + %) para columnas categóricas con ≤20 valores únicos
- **Cruce categórica × numérica**: tabla con registros, avg y sum por cada grupo (permite responder "¿diferencia de costos entre géneros?")
- **Ranking top 5** por promedio para cada par categoría × métrica
- Resumen mensual con promedios

### Exportación a PDF
Genera un reporte PDF completo usando jsPDF + html2canvas:
1. Portada con nombre del dataset, fecha, empresario y tipo de análisis
2. Tabla de métricas principales
3. Insights detectados (coloreados por tipo)
4. Captura real de cada gráfica visible (html2canvas)
5. Análisis IA por gráfica (si fue analizada antes de exportar)
6. Conclusión auto-generada
7. Footer con número de página en todas las hojas

### Análisis IA por gráfica individual
Botón "Analizar IA" en cada gráfica del dashboard:
- Serializa los datos de la gráfica como texto
- Envía a Gemini preguntando por tendencias, datos destacados y decisiones empresariales
- Muestra respuesta en panel índigo debajo de la gráfica
- El análisis se incluye automáticamente en el PDF exportado

---

## Requisitos previos

| Herramienta | Versión mínima |
|---|---|
| Node.js | 18.x |
| npm | 9.x |
| Python | 3.11.x |
| PostgreSQL | 15.x |
| Cuenta Google Cloud (API Key Gemini) | — |

---

## Instalación y configuración

### 1. Base de datos

```sql
CREATE DATABASE pymes_dashboard;
```

El backend ejecuta el schema automáticamente al arrancar (`backend/src/models/schema.sql`).

---

### 2. Backend — Node.js + Express

```bash
cd backend
cp .env.example .env
npm install
npm run dev        # recarga automática con nodemon
```

Disponible en `http://localhost:3001`

#### Variables de entorno `.env`

```env
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pymes_dashboard
DB_USER=postgres
DB_PASSWORD=tu_password
JWT_SECRET=tu_clave_secreta_larga
JWT_EXPIRES_IN=7d
AGENT_URL=http://localhost:8000
```

---

### 3. Agente IA — Python + FastAPI + Gemini + scikit-learn

```bash
cd agent
cp .env.example .env        # agregar GEMINI_API_KEY
python -m venv venv
source venv/bin/activate    # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload --reload-dir app
```

Disponible en `http://localhost:8000`  
Documentación interactiva: `http://localhost:8000/docs`

#### Variables de entorno `.env`

```env
GEMINI_API_KEY=tu_api_key_de_google
GEMINI_MODEL=gemini-2.5-flash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pymes_dashboard
DB_USER=postgres
DB_PASSWORD=tu_password
BACKEND_URL=http://localhost:3001
MAX_DATASETS=5
MAX_FILAS=60
MAX_CTX_CHARS=120000
```

> **Obtener API Key**: [Google AI Studio](https://aistudio.google.com/app/apikey)

---

### 4. Frontend — React

```bash
cd frontend
cp .env.example .env
npm install
npm start
```

Disponible en `http://localhost:3000`

#### Variables de entorno `.env`

```env
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_AGENT_URL=http://localhost:8000
```

---

## Orden de inicio

```bash
# 1. PostgreSQL debe estar corriendo

# 2. Backend
cd backend && npm run dev

# 3. Agente IA
cd agent
source venv/bin/activate    # Windows: venv\Scripts\activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload-dir app

# 4. Frontend
cd frontend && npm start
```

---

## Estructura del proyecto

```
backend/
├── src/
│   ├── config/
│   │   └── database.js          → Pool de conexiones PostgreSQL
│   ├── controllers/
│   │   ├── authController.js    → Registro, login, JWT
│   │   ├── uploadController.js  → Carga y parseo de CSV
│   │   └── statsController.js   → Motor de análisis: KPIs, gráficas, insights
│   ├── middleware/
│   │   ├── auth.js              → Verificación JWT
│   │   └── errorHandler.js
│   ├── models/
│   │   └── schema.sql           → Schema PostgreSQL (tablas + índices)
│   └── routes/
│       ├── auth.js
│       ├── upload.js
│       └── stats.js
└── package.json

frontend/
└── src/
    ├── components/
    │   ├── AnalisisAvanzadoModal.js  → Modal de análisis con scikit-learn
    │   ├── MetricCard.js             → Tarjeta de KPI reutilizable
    │   ├── Sidebar.js                → Navegación lateral
    │   └── PrivateRoute.js           → Protección de rutas
    ├── context/
    │   └── AuthContext.js            → Estado global de autenticación
    ├── pages/
    │   ├── Dashboard.js              → Tablero principal (charts + insights + PDF)
    │   ├── Upload.js                 → Carga de archivos CSV
    │   ├── Chatbot.js                → Chat con el agente IA
    │   └── Login.js / Register.js
    ├── services/
    │   ├── api.js                    → Cliente axios con interceptor JWT
    │   ├── chatService.js            → Consultas al agente IA
    │   ├── statsService.js           → Estadísticas del dashboard
    │   └── uploadService.js          → Subida y gestión de datasets
    └── utils/
        └── pdfExport.js              → Generación de PDF (jsPDF + html2canvas)

agent/
├── app/
│   ├── config.py                → Pydantic Settings
│   ├── models/
│   │   └── schemas.py           → Modelos de entrada/salida
│   ├── routes/
│   │   ├── query.py             → POST /query (chat IA)
│   │   └── analyze.py           → POST /analyze (análisis avanzado)
│   └── services/
│       ├── data_service.py      → Contexto analítico para Gemini
│       ├── gemini_service.py    → Cliente Google Gemini
│       └── analytics_service.py → Motor estadístico (scikit-learn)
├── main.py                      → FastAPI app + CORS + routers
└── requirements.txt
```

---

## API — Endpoints principales

### Backend (`:3001/api`)

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/auth/register` | Registro de usuario |
| `POST` | `/auth/login` | Login — retorna JWT |
| `POST` | `/upload/csv` | Subir y procesar CSV |
| `GET` | `/upload/datasets` | Listar datasets del usuario |
| `DELETE` | `/upload/datasets/:id` | Eliminar dataset |
| `GET` | `/stats/dashboard` | KPIs + gráficas + insights |

### Agente IA (`:8000`)

| Método | Ruta | Cuerpo | Descripción |
|---|---|---|---|
| `POST` | `/query` | `{pregunta, dataset_id?, empresa_id?}` | Chat con Gemini |
| `POST` | `/analyze` | `{dataset_id, tipo_analisis}` | Análisis estadístico avanzado |
| `GET` | `/health` | — | Estado del servicio |

`tipo_analisis`: `regresion` | `anomalias` | `clustering` | `correlacion` | `series_tiempo` | `completo`

---

## Tipos de datasets soportados

El sistema detecta automáticamente el tipo de dataset por los nombres de columna y adapta el análisis:

| Tipo | Columnas clave detectadas | Badge |
|---|---|---|
| Salud | diagnostico, medico, especialidad, paciente, eps, hospital | 🏥 Salud |
| Deportes | goles, jugador, partido, rival, torneo, liga, resultado | ⚽ Deportes |
| Financiero | venta, ingreso, gasto, factura, utilidad, balance | 💰 Financiero |
| Inventario | stock, almacen, bodega, sku, existencias | 📦 Inventario |
| RRHH | empleado, salario, cargo, departamento, nomina | 👥 RRHH |
| Producción | produccion, turno, maquina, lote, fabricacion | ⚙️ Producción |
| Ventas | cliente, pedido, cotizacion, descuento | 🛒 Ventas |
| Insumos | insumo, proveedor, materia_prima, compra | 🔧 Insumos |
| General | cualquier otro caso | 📊 General |

---

## Variables de entorno — resumen

### backend/.env.example
```env
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pymes_dashboard
DB_USER=postgres
DB_PASSWORD=
JWT_SECRET=
JWT_EXPIRES_IN=7d
AGENT_URL=http://localhost:8000
```

### agent/.env.example
```env
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pymes_dashboard
DB_USER=postgres
DB_PASSWORD=
BACKEND_URL=http://localhost:3001
MAX_DATASETS=5
MAX_FILAS=60
MAX_CTX_CHARS=120000
```

### frontend/.env.example
```env
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_AGENT_URL=http://localhost:8000
```

---

## Tecnologías de visualización

- **Chart.js 4** con react-chartjs-2: `Line`, `Bar` (horizontal y vertical), `Pie`, `Doughnut`, `PolarArea`, `Radar`, `Scatter`
- Gráficas generadas dinámicamente por el backend según la estructura real del CSV
- Normalización automática de radar a % del máximo para comparabilidad entre métricas
- Análisis individual por gráfica usando Gemini vía botón "Analizar IA"
- Exportación a PDF con captura real de gráficas (html2canvas)

---

## Licencia

Proyecto académico — Universidad Compensar (UCompensar) · 2025
