---
type: MOC
status: active
tags: [backend, architecture, api, worker]
updated: 2026-04-11
---

# Backend MOC

> [!tip] Arquitectura Hexagonal (Ports & Adapters)
> El backend sigue Clean Architecture estricta en ambos servicios:
> - **API (Node.js/TS)** — Domain → Application (UseCases) → Infrastructure
> - **Worker (Python)** — Domain → Application → Infrastructure (mismo patrón)

## 📂 Componentes

- `backend/api/src/` — Express 4 + TypeScript 5.7, Node 20
- `backend/worker/src/` — FastAPI + Python 3.12 + Polars
- `backend/prisma/schema.prisma` — Schema PostgreSQL compartido (Prisma 6)
- `docker-compose.yml` — PostgreSQL 16 + Redis 7.4 + MinIO

## 🏗️ Capas del API (Node.js)

| Capa | Ruta | Responsabilidad |
|------|------|----------------|
| Domain | `api/src/domain/` | Entidades, Ports, Value Objects, Errores |
| Application | `api/src/application/` | UseCases, DTOs, Commands/Queries |
| Infrastructure | `api/src/infrastructure/` | HTTP, Prisma repos, MinIO, BullMQ, JWT |

### Entidades principales
- `Dataset` — `domain/entities/Dataset.ts` — status: PENDING→PROCESSING→READY/ERROR/ARCHIVED
- `User` — `domain/entities/User.ts` — roles: ADMIN, USER, VIEWER
- `Anomaly` — anomalías detectadas con tipo, columna, fila
- `Decision` — decisión HITL del usuario + NL Edit (IR estructurado)

### UseCases clave
- `CreateDatasetUseCase` — upload → MinIO + DB + BullMQ enqueue
- `TransformDatasetUseCase` — dispara job ETL en Worker
- `GetAnomaliesUseCase` — lista anomalías (⚠️ eager-load `decision` — ver CONCERNS)
- `SubmitDecisionsUseCase` — persiste decisiones HITL
- `ParseNLInstructionUseCase` — NL Edit: texto → IR estructurado vía Gemini
- `SaveAiSuggestionsUseCase` — persiste sugerencias AI desde n8n webhook

## 🏗️ Capas del Worker (Python)

| Capa | Ruta | Responsabilidad |
|------|------|----------------|
| Domain | `worker/src/domain/` | Entidades Python, Ports |
| Application | `worker/src/application/` | ProcessDatasetUseCase, ETLJobProcessor |
| Infrastructure | `worker/src/infrastructure/` | BullMQ consumer, Prisma client, MinIO boto3 |

### Flujo ETL
1. BullMQ consume job `etl-transformations`
2. `ETLJobProcessor.process()` → `ProcessDatasetUseCase`
3. Descarga archivo de MinIO → Polars parse (Excel/CSV)
4. `_detect_anomalies()` — detectores: MISSING_VALUE ✅, OUTLIER(Z-score) ✅, DUPLICATE ❌, FORMAT_ERROR ❌, INCONSISTENCY ❌
5. Persiste anomalías en PostgreSQL via asyncpg
6. Sube resultado procesado a MinIO
7. Actualiza job status → SSE broadcast al Frontend

## 🔌 Integraciones externas

| Servicio | Puerto | Uso |
|---------|--------|-----|
| PostgreSQL | 5432 | Prisma ORM (API) + asyncpg (Worker) |
| Redis | 6379 | BullMQ job queue (API + Worker) |
| MinIO | 9000 | Storage S3-compat (archivos + resultados) |
| Gemini API | HTTPS | NL Edit parsing + AI suggestions |
| n8n | Webhook | `POST /api/webhook/ai-suggestions` |

## 💡 Decisiones Críticas

- [[STATE.md#Decisión Pendiente: Opción C — Worker llama Gemini directo]] — Worker Python → Gemini directo (próximo milestone)
- NL Edit implementado (Plan A+B+C) — pendiente de commit
- Contrato AI Suggestion: `aiSuggestion` almacena JSON `{actionType, value, reason}`

## ⚠️ Issues conocidos (ver `.planning/codebase/CONCERNS.md`)

> [!warning] Críticos
> - `.env` con credenciales reales — verificar si está en git
> - Webhook secret validado en UseCase, no en middleware HTTP

> [!todo] Deuda técnica
> - `saveMany()` hace N transacciones en loop → cambiar a `$transaction` batch
> - `GetAnomaliesUseCase` eager-load `decision` en cada anomalía → paginar + lazy
> - Detectores faltantes: DUPLICATE, FORMAT_ERROR, INCONSISTENCY (dev-log 2026-04-11)

## 📊 Cobertura de tests

- API (vitest): ~216 tests
- Worker (pytest): ~400 tests
- E2E (Playwright): 10/26 pasan (falla por NextAuth)

## 🔗 Relacionado

- [[00_Dashboard]]
- [[Frontend-MOC]]
- [[STATE.md]]
- `.planning/codebase/ARCHITECTURE.md`
- `.planning/codebase/CONCERNS.md`
- `backend/api/src/index.ts` — entry point API
- `backend/worker/src/main.py` — entry point Worker
