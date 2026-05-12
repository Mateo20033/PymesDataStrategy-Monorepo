# PymesDataStrategy (Integrated Version)

Plataforma SaaS unificada de extremo a extremo para la **limpieza, transformación y análisis inteligente de datos empresariales** dirigida a PYMEs.

Esta solución integra dos potentes herramientas:
1. **Pipeline ETL (PymesDataStrategy):** Limpieza automática de anomalías mediante IA y validación humana (HITL).
2. **Dashboard Analytics (DashboardPYMES):** Visualización automática, detección de tendencias multi-año y chat interactivo con Gemini AI.

---

## 🚀 Flujo de Trabajo

El sistema funciona como un engranaje continuo:
1. **Carga:** Subes un archivo CSV/Excel "sucio".
2. **Limpieza:** El **Worker en Python** detecta duplicados, valores nulos, outliers y errores de formato.
3. **Revisión:** Tú validas las correcciones en la interfaz (Humano en el Bucle).
4. **Sincronización:** Al marcar el dataset como **READY**, el sistema envía automáticamente los datos limpios al motor de analíticas mediante un puente API interno (S2S).
5. **Insights:** Obtienes instantáneamente gráficas inteligentes, KPIs y un asistente IA para consultar tus datos.

---

## 🏗️ Arquitectura de Microservicios

El proyecto está orquestado mediante Docker Compose y se divide en 3 capas principales:

### 1. Núcleo PDS (PymesDataStrategy)
- **Frontend (3001):** Aplicación Next.js 15+ que centraliza toda la experiencia de usuario.
- **API Gateway (3000):** Backend en Node.js que gestiona la autenticación y orquestación de jobs.
- **Worker ETL (8000):** Motor de procesamiento en Python y Polars para limpieza masiva de datos.

### 2. Capa de Visualización (DashboardPYMES)
- **Analytics Backend (3002):** Servicio en Node.js que recibe los datos limpios y genera las métricas.
- **AI Agent (8001):** Microservicio en FastAPI que maneja los análisis estadísticos avanzados y el chat con Gemini.
- **Dedicated DB:** Instancia de PostgreSQL aislada para el almacenamiento de datasets listos para visualización.

### 3. Infraestructura de Soporte
- **PostgreSQL:** Base de datos principal para el flujo de limpieza.
- **Redis:** Cola de mensajes para la comunicación asíncrona del Worker (BullMQ).
- **MinIO:** Almacenamiento persistente de archivos S3-compatible.

---

## 🔑 Configuración Obligatoria (API Keys)

> **IMPORTANTE:** El proyecto NO funcionará correctamente sin configurar las siguientes claves en el archivo `.env`.

### 1. Google Gemini API Key
Necesaria tanto para la detección de anomalías como para el asistente de chat del dashboard.
- Obtenla en: [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

### 2. NextAuth Secret
Clave para la seguridad de la sesión. Puedes generarla con:
```bash
openssl rand -base64 32
```

---

## 🛠️ Guía de Inicio Rápido

Sigue estos pasos para levantar el ecosistema completo en tu máquina local:

### 1. Clonar el proyecto
```bash
git clone https://github.com/jcgmU/PymesDataStrategy-Root.git
cd PymesDataStrategy-Root
```

### 2. Configurar variables de entorno
Crea un archivo `.env` en la carpeta `backend/` basado en `.env.example` y asegúrate de incluir tu `GEMINI_API_KEY`.

### 3. Levantar con Docker
Desde la carpeta raíz o `backend/`, ejecuta:
```bash
docker compose up --build -d
```
*Nota: La primera construcción puede tardar unos minutos debido a la instalación de dependencias de Python y Node.*

### 4. Acceder al sistema
- **URL Principal:** [http://localhost:3001](http://localhost:3001)

---

## 📁 Estructura del Repositorio

- `/frontend`: Código fuente de la interfaz Next.js.
- `/backend`: API Gateway, Worker ETL y configuración de Docker.
- `/services/dashboard-pymes`: Módulos de visualización e IA de la segunda parte.
- `/docs`: Documentación técnica detallada y logs de desarrollo.

---

## 👥 Créditos e Integración

Este proyecto es una integración modular del trabajo original de:
- **PymesDataStrategy:** Sistema de limpieza HITL.
- **DashboardPYMES:** Motor de analíticas e IA ([Fork del repo de Mateo20033](https://github.com/jcgmU/DashboardPYMES)).

---
*Desarrollado como una plataforma SaaS integral para la democratización del análisis de datos en PyMES.*
