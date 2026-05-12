# PymesDataStrategyFrontEnd

> **Proyecto de Grado GIIS SW-005 — Fundación Universitaria Compensar**
> Plataforma ETL con IA y Human-in-the-Loop para PYMES en Bogotá, Colombia.

![Estado](https://img.shields.io/badge/Fase%201-MVP%20COMPLETADO-brightgreen)
![Tests](https://img.shields.io/badge/tests-197%20pasando-brightgreen)
![E2E](https://img.shields.io/badge/E2E-4%20specs%20Playwright-blue)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)
![Licencia](https://img.shields.io/badge/licencia-MIT-blue)

---

## 📋 Descripción

**PymesDataStrategyFrontEnd** es la interfaz web de la plataforma **PymesDataStrategy**, un sistema ETL (Extract, Transform, Load) potenciado con Inteligencia Artificial y un proceso de validación **Human-in-the-Loop (HITL)** diseñado específicamente para pequeñas y medianas empresas (PYMES) de Bogotá.

La plataforma permite a las PYMES cargar, transformar y analizar sus datos empresariales de forma guiada, con sugerencias de IA que un analista humano revisa y aprueba antes de aplicar, garantizando calidad y trazabilidad en cada transformación.

### 🔗 Repositorios

| Repositorio | Enlace |
|---|---|
| **Frontend** (este repo) | https://github.com/jcgmU/PymesDataStrategyFrontEnd.git |
| **Backend** | https://github.com/jcgmU/PymesDataStrategyBackEnd.git |

---

## 🏗️ Arquitectura de Componentes

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js App Router                   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │               app/layout.tsx                    │    │
│  │         (Root Layout + Providers)               │    │
│  └──────────────────────┬──────────────────────────┘    │
│                         │                               │
│          ┌──────────────┴──────────────┐                │
│          ▼                             ▼                │
│  ┌───────────────┐           ┌─────────────────────┐    │
│  │  app/page.tsx │           │ app/dashboard/      │    │
│  │  Landing Page │           │ layout.tsx (Sidebar)│    │
│  │  12 secciones │           └──────────┬──────────┘    │
│  └───────┬───────┘                      │               │
│          │                    ┌─────────┼──────────┐    │
│          │                    ▼         ▼          ▼    │
│  ┌───────▼──────────┐  ┌──────────┐ ┌──────────┐ ┌───┐ │
│  │ components/      │  │dashboard/│ │datasets/ │ │re-│ │
│  │ features/landing │  │ page.tsx │ │ page.tsx │ │vi-│ │
│  │  (12 componentes)│  └──────────┘ │ upload/  │ │ew/│ │
│  └──────────────────┘               │ page.tsx │ │[id│ │
│                                     └──────────┘ └───┘ │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │              Estado Global                      │    │
│  │   Zustand v5 (stores/)  +  React Query v5       │    │
│  │              (hooks/api/)                       │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

---

## 🛠️ Stack Tecnológico

| Tecnología | Versión | Uso |
|---|---|---|
| **Next.js** | 15 (App Router) | Framework React con App Router |
| **React** | 19 | UI Library |
| **TypeScript** | Estricto | Tipado estático |
| **Tailwind CSS** | v4 | Estilos CSS-first (sin `tailwind.config.ts`) |
| **Zustand** | v5 | Estado global |
| **React Query** | v5 | Data fetching y caché del servidor |
| **NextAuth** | v5 (beta) | Autenticación — credentials provider |
| **Zod** | v4 | Validación de esquemas (frontend) |
| **recharts** | v3 | Gráficos del dashboard de analítica |
| **sonner** | v2 | Toast notifications |
| **lucide-react** | Latest | Sistema de iconos |
| **Vitest** | v4 | Unit testing (197 tests) |
| **Playwright** | Latest | E2E testing (4 specs) |
| **pnpm** | — | Gestor de paquetes |

---

## 🎨 Sistema de Diseño Neo-Brutalism

La interfaz implementa un sistema de diseño **Neo-Brutalismo** con identidad visual de la Fundación Universitaria Compensar.

### Paleta de Colores

| Token | Valor HEX | Uso |
|---|---|---|
| `primary` | `#FF6B00` | Naranja — acciones principales, CTA |
| `secondary` | `#0033A0` | Azul institucional Compensar |
| `background` | `#F4F4F5` | Fondo general de la aplicación |
| `text` | `#18181B` | Texto principal |

### Componentes Primitivos

- **`BrutalButton`** — Botón con borde negro sólido, sombra offset de `4px` y efecto de presión al hacer clic.
- **`BrutalCard`** — Tarjeta con borde negro sólido y sombra offset de `6px`.

Los estilos base están definidos en `app/globals.css` usando las variables CSS nativas de Tailwind v4.

---

## 📁 Estructura del Proyecto

```
frontend/
├── app/
│   ├── page.tsx                      # Landing page (12 componentes)
│   ├── layout.tsx                    # Root layout (suppressHydrationWarning)
│   ├── globals.css                   # Design system Tailwind v4
│   ├── providers.tsx                 # React Query + Zustand providers
│   └── dashboard/
│       ├── layout.tsx                # Dashboard con Sidebar
│       ├── page.tsx                  # Home dashboard
│       ├── datasets/
│       │   ├── page.tsx              # Lista de datasets
│       │   └── upload/page.tsx       # Subir dataset
│       └── review/
│           └── [id]/page.tsx         # Revisión Human-in-the-Loop
├── components/
│   ├── features/
│   │   └── landing/                  # 12 componentes de la landing
│   │       ├── LandingHeader.tsx
│   │       ├── HeroSection.tsx
│   │       ├── MetricsBand.tsx
│   │       ├── ProblemSolution.tsx
│   │       ├── HowItWorks.tsx
│   │       ├── HITLSection.tsx
│   │       ├── UseCases.tsx
│   │       ├── SecurityBadge.tsx
│   │       ├── AIStack.tsx
│   │       ├── FAQAccordion.tsx
│   │       ├── FinalCTA.tsx
│   │       └── LandingFooter.tsx
│   └── ui/                           # Componentes reutilizables (BrutalButton, BrutalCard…)
├── hooks/
│   └── api/                          # React Query hooks (useDatasets, useAnomalies, etc.)
├── stores/                           # Zustand stores
├── types/                            # TypeScript types compartidos
├── __tests__/                        # Unit tests (Vitest)
├── e2e/                              # E2E tests (Playwright)
└── public/
    └── compensar-logo.png            # Logo institucional
```

---

## ✅ Funcionalidades Implementadas

Todas las funcionalidades de la Fase 1 están completadas:

| # | Funcionalidad | Estado |
|---|---|---|
| 1 | Login con NextAuth credentials provider | ✅ |
| 2 | Dashboard con lista de datasets y carga de archivos | ✅ |
| 3 | Gestión de jobs con actualizaciones en tiempo real (SSE) | ✅ |
| 4 | Revisión Human-in-the-Loop (anomalía → aprobar/corregir/descartar) | ✅ |
| 5 | Dashboard de analítica con gráficos (recharts) | ✅ |
| 6 | Página de configuración (Settings) | ✅ |
| 7 | Toast notifications (sonner) | ✅ |

### Landing Page
Landing pública con 12 secciones que comunican la propuesta de valor de la plataforma:

| # | Componente | Descripción |
|---|---|---|
| 1 | `LandingHeader` | Navegación fija con logo y CTA |
| 2 | `HeroSection` | Hero principal con headline y call-to-action |
| 3 | `MetricsBand` | Banda de métricas clave de impacto |
| 4 | `ProblemSolution` | Problema del mercado vs. solución propuesta |
| 5 | `HowItWorks` | Flujo de trabajo en 3 pasos (ETL + IA) |
| 6 | `HITLSection` | Explicación del proceso Human-in-the-Loop |
| 7 | `UseCases` | Casos de uso para PYMES (retail, logística, etc.) |
| 8 | `SecurityBadge` | Seguridad y cumplimiento *(próximamente)* |
| 9 | `AIStack` | Stack de IA utilizado *(próximamente)* |
| 10 | `FAQAccordion` | Preguntas frecuentes con acordeón |
| 11 | `FinalCTA` | Llamada a la acción final |
| 12 | `LandingFooter` | Footer con links e información institucional |

### Dashboard
- **Layout con Sidebar** — Navegación lateral persistente entre secciones.
- **Home Dashboard** — Vista general con métricas del sistema.
- **Gestión de Datasets** — Lista de datasets cargados y subida de nuevos archivos.
- **Job Management** — Gestión de trabajos ETL con estado en tiempo real vía SSE.
- **Revisión Human-in-the-Loop** — Revisión de anomalías detectadas por la IA: el analista aprueba, corrige o descarta cada sugerencia antes de aplicarla.
- **Analytics Dashboard** — Gráficos de métricas e indicadores clave (recharts).
- **Settings** — Página de configuración de la plataforma.

---

## 🚀 Inicio Rápido

### Prerrequisitos

- **Node.js** >= 18
- **pnpm** >= 8
- Backend corriendo en `http://localhost:3000` (ver [repositorio backend](https://github.com/jcgmU/PymesDataStrategyBackEnd.git))

### Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/jcgmU/PymesDataStrategyFrontEnd.git
cd PymesDataStrategyFrontEnd

# 2. Instalar dependencias
pnpm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con los valores correspondientes

# 4. Iniciar en modo desarrollo
pnpm dev
```

La aplicación estará disponible en **http://localhost:3001**.

### Comandos Disponibles

| Comando | Descripción |
|---|---|
| `pnpm dev` | Inicia el servidor de desarrollo en el puerto 3001 |
| `pnpm build` | Genera el build de producción |
| `pnpm start` | Inicia el servidor en modo producción |
| `pnpm test` | Ejecuta los 197 unit tests con Vitest |
| `pnpm test:coverage` | Unit tests con reporte de cobertura |
| `pnpm test:e2e` | Playwright E2E (requiere stack corriendo) |
| `pnpm test:e2e:ui` | Playwright con interfaz gráfica |
| `pnpm lint` | Verifica el código con ESLint |

---

## 🔧 Variables de Entorno

Crear un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=<secret-generado>
NEXT_PUBLIC_API_URL=http://localhost:3000
INTERNAL_API_URL=http://pymes-api:3000   # Red interna Docker
```

| Variable | Descripción |
|---|---|
| `NEXTAUTH_URL` | URL pública del frontend (NextAuth callback) |
| `NEXTAUTH_SECRET` | Secreto para firmar sesiones de NextAuth |
| `NEXT_PUBLIC_API_URL` | URL del backend REST API (accesible desde el browser) |
| `INTERNAL_API_URL` | URL del backend en la red Docker (Server Components / SSR) |

---

## 🧪 Tests

### Unit Tests (Vitest + React Testing Library)

El proyecto cuenta con **197 unit tests** que cubren los componentes y stores principales.

```bash
# Ejecutar todos los unit tests
pnpm test

# Ejecutar en modo watch
pnpm test:watch

# Ver cobertura
pnpm test:coverage
```

Los tests están en `__tests__/` y utilizan **Vitest** con **React Testing Library**.

### E2E Tests (Playwright)

4 specs de integración end-to-end ubicadas en `e2e/`:

| Spec | Descripción |
|---|---|
| `landing.spec.ts` | Landing page pública |
| `dashboard.spec.ts` | Dashboard principal |
| `review.spec.ts` | Revisión Human-in-the-Loop |
| `security.spec.ts` | Seguridad y autenticación |

```bash
# Requiere stack completo corriendo (make up desde backend/)
pnpm test:e2e

# Con interfaz gráfica
pnpm test:e2e:ui

# Modo debug
pnpm test:e2e:debug
```

---

## 🔌 Conexión con el Backend

El frontend consume la API REST del backend mediante **React Query v5**.

| Detalle | Valor |
|---|---|
| **Backend URL** | `http://localhost:3000` |
| **Frontend URL** | `http://localhost:3001` |
| **Protocolo** | REST / JSON + SSE (Server-Sent Events para estado de jobs) |
| **Auth** | NextAuth v5 — credentials provider |

Los hooks de API están organizados en `hooks/api/` como custom hooks de React Query. Cada hook lee el token de autenticación directamente desde `useSession()` de NextAuth, por lo que los componentes los invocan sin pasar parámetros de token:

```typescript
// ✅ Correcto — el hook obtiene el token internamente
const { data: datasets } = useDatasets()

// ❌ Incorrecto — no es necesario pasar el token externamente
const { data: datasets } = useDatasets(token)
```

**Repositorio del backend:** https://github.com/jcgmU/PymesDataStrategyBackEnd.git

---

## 🐳 Docker

El stack completo se levanta desde el directorio `backend/` (raíz del monorepo donde vive el `docker-compose.yml`):

```bash
# Desde backend/ — levanta los 7 servicios incluyendo frontend en :3001
make up

# Ver logs del frontend
make logs-frontend
```

Los 7 servicios incluyen: API Gateway Express, frontend Next.js, Worker ETL Python, PostgreSQL, Redis, MinIO y minio-init.

---

## 🗺️ Próximos Pasos — Fase 2

- [ ] **Roles y permisos** — Diferenciación entre administrador, analista y visualizador.
- [ ] **Modo oscuro** — Soporte para tema claro/oscuro en el sistema de diseño.
- [ ] **Internacionalización (i18n)** — Soporte inicial en español; extensible a inglés.
- [ ] **Exportación de datos** — Descarga de reportes en múltiples formatos.

---

## 📄 Licencia

Este proyecto está licenciado bajo la **Licencia MIT**.

```
MIT License

Copyright (c) 2025 GIIS SW-005 — Fundación Universitaria Compensar

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
```

---

<div align="center">

**Proyecto de Grado GIIS SW-005**
Fundación Universitaria Compensar — Bogotá, Colombia

</div>
