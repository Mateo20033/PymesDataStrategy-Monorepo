---
type: MOC
status: active
tags: [frontend, architecture]
updated: 2026-04-11
---

# Frontend MOC

> [!info] Stack Principal
> - **Framework**: Next.js 16.1.6 + React 19.2.3 (App Router)
> - **Auth**: NextAuth v5 (beta) — httpOnly cookies, JWT
> - **Estado servidor**: TanStack Query v5 (5-min staleTime)
> - **Estado cliente**: Zustand v5 + Immer
> - **Styling**: Tailwind CSS 4 — Neo-Brutalism: primary=#FF6B00, secondary=#0033A0, border-2 border-black
> - **Testing**: Vitest + Playwright E2E

## 📂 Estructura Principal

| Carpeta | Contenido |
|---------|-----------|
| `app/` | Rutas Next.js: `page.tsx` (landing), `dashboard/` (main UI), `api/auth/` (NextAuth) |
| `app/dashboard/` | `page.tsx` (datasets list), `datasets/[id]/` (detalle + anomalías) |
| `components/` | UI reutilizable: `AnomalyCard`, `DatasetCard`, `UploadDropzone`, `FilterBar`, etc. |
| `hooks/` | `useJobSSE` (SSE real-time), `useJobStatus`, custom hooks de datos |
| `services/` | Cliente HTTP hacia API (fetch wrappers) |
| `store/` | `useAppStore` (Zustand global), `useReviewStore` (decisiones HITL — ⚠️ localStorage) |
| `lib/` | Utilidades, schemas Zod v4, helpers |
| `types/` | Tipos TypeScript compartidos |
| `e2e/` | Tests Playwright (⚠️ 16/26 fallan por NextAuth) |

## 🔄 Flujo de datos

```
Usuario → Upload → POST /api/v1/datasets
→ Polling SSE (useJobSSE) → TanStack Query invalidation
→ Dashboard actualiza lista
→ Click dataset → /dashboard/datasets/[id]
→ Lista anomalías (AnomalyCard × N)
→ HITL: usuario revisa + NL Edit (textarea → IR)
→ Submit decisions → POST /api/v1/datasets/:id/decisions
```

## 🧩 Componentes clave

- `AnomalyCard` — muestra anomalía con `aiActionType` (FILL/DELETE/KEEP) + NL Edit textarea
- `UploadDropzone` — upload con progreso de job polling
- `FilterBar` — filtros de anomalías por tipo/columna
- `DatasetCard` — card de dataset en lista con status badge

## 🔌 Conexión con API

- Proxy Next.js rewrites: `/api/v1/*` → Backend Express (`next.config.ts`)
- SSE: `GET /api/v1/events` — broadcast de job status updates
- NextAuth callbacks → `/api/auth/[...nextauth]`

## 💡 Patrones establecidos

- **Neo-Brutalism**: `border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`
- **Strings en español** en toda la UI
- **Zod v4**: usar `z.string().min(1)` (no `.nonempty()`)
- **React Query**: mutations con `onSuccess` → `queryClient.invalidateQueries`
- **Toasts**: Sonner (`toast.success`, `toast.error`)

## ⚠️ Issues conocidos

> [!warning] Seguridad
> - `useReviewStore` persiste decisiones HITL en localStorage sin cifrar — riesgo en PCs compartidas

> [!warning] Tests
> - E2E Playwright: 16/26 fallan — NextAuth bloquea flows no autenticados
> - `frontend/e2e/dashboard.spec.ts` — TODOs en líneas 90, 105

## 📊 Cobertura de tests

- Vitest (unit/component): ~71 tests — 100% pasan
- Playwright E2E: 10/26 pasan

## 🔗 Relacionado

- [[00_Dashboard]]
- [[Backend-MOC]]
- [[STATE.md]]
- `.planning/codebase/STRUCTURE.md`
- `.planning/codebase/CONVENTIONS.md`
- `frontend/app/layout.tsx` — root layout (SessionProvider + QueryClientProvider)
- `frontend/app/dashboard/page.tsx` — entrada principal UI
- `frontend/next.config.ts` — CSP + rewrites + security headers
