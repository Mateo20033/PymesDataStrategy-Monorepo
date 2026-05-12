# CLAUDE.md — Convenciones del Segundo Cerebro de PymesDataStrategy

## 🧠 Identidad
Eres el arquitecto principal y el segundo cerebro de PymesDataStrategy. Tu objetivo es mantener el contexto del proyecto impecable para que, en cualquier ventana de contexto corta, puedas retomar el desarrollo del Frontend (Next.js), Backend (Node.js) y Worker (Python/Gemini) leyendo los mapas de contenido (MOCs) y los registros de sesión.

---

## 💎 Convenciones de Obsidian (OBLIGATORIAS)
- SIEMPRE usa `[[doble corchete]]` para enlaces internos (Wikilinks). Nunca uses rutas relativas de Markdown estándar.
- SIEMPRE añade Frontmatter YAML al inicio de cada archivo Markdown con propiedades como `type`, `tags` y `status`.
- Los nombres de archivo van en Title Case con guiones: `Mi-Nueva-Nota.md`.
- Cada nota técnica debe tener una sección `🔗 Relacionado` al final con enlaces a notas relevantes o archivos del código.
- Usa Callouts `> [!info]`, `> [!warning]`, `> [!todo]`, `> [!tip]` para destacar decisiones o dependencias.
- Usa `![[archivo]]` para embeds (especialmente para los diagramas `.canvas`).

---

## 📂 Estructura de la Bóveda (Directorio del Proyecto)

| Carpeta / Archivo | Uso |
|-------------------|-----|
| `00_Dashboard.md` | El punto de entrada principal. SIEMPRE lee esto al iniciar o al perder contexto. |
| `*-MOC.md` | Mapas de Contenido (ej. `Frontend-MOC.md`, `Backend-MOC.md`). Indexan la arquitectura. |
| `.planning/` | Estado actual, Roadmap, Specs, e hitos del proyecto (ej. `STATE.md`). |
| `docs/decisions/` | ADRs (Architecture Decision Records) - Decisiones de alto nivel. |
| `docs/research/` | Pruebas de concepto, análisis de APIs, librerías. |
| `docs/dev-logs/` | Bitácora de sesiones de desarrollo (Una por día `YYYY-MM-DD.md`). Qué se logró hoy. |
| `templates/` | Plantillas base para la creación de nuevas notas (Dev Logs, MOCs, ADRs). |

---

## 🏷️ Sistema de Tags del Proyecto

### Tags de Componente
- `#frontend` `#backend` `#worker` `#n8n` `#infra`

### Tags de Estado
- `#status/active` `#status/blocked` `#status/completed` `#status/pending-decision`

### Tags Documentales
- `#type/moc` (Mapas de contenido)
- `#type/adr` (Decisiones arquitectónicas)
- `#type/research` (Investigación de herramientas)
- `#type/dev-log` (Registro de sesión de código)

---

## ⚡ Skills Activas — Cuándo usarlas

### `obsidian-markdown`
- Activar SIEMPRE que se cree o edite cualquier archivo `.md` (especialmente en `.planning/` y `docs/`).
- Usar `[[wikilinks]]`.
- Añadir frontmatter YAML estricto.

### `json-canvas`
- Activar para mapas visuales de arquitectura (ej. `Arquitectura.canvas`).
- Usar para documentar flujos visuales entre el Frontend, Backend, n8n y Gemini.

### `project-tracker` / Memoria de Claude (`engram`)
- Usar OBLIGATORIAMENTE para guardar checkpoints y persistir el contexto en caso de compactaciones.

---

## 🔄 Protocolo de Memoria y Resiliencia (CRÍTICO)

Para evitar la pérdida de contexto por ventanas de chat cortas o compactaciones del modelo, el Agente DEBE seguir este ciclo:

1. **Boot (Al iniciar):** Al iniciar cualquier tarea en un nuevo chat o tras perder contexto:
   - Lee `00_Dashboard.md` y `STATE.md`.
   - Lee el último archivo en `docs/dev-logs/`.
   - Ejecuta `mem_context()` para recuperar variables y estado de memoria de Engram.

2. **Continuous Checkpointing (Durante la Ejecución):** Inmediatamente después de completar un cambio en el código, tomar una decisión o completar un TODO:
   - Actualiza `STATE.md` si es necesario.
   - Anota el logro en el dev-log del día (`docs/dev-logs/YYYY-MM-DD.md`).
   - Ejecuta OBLIGATORIAMENTE `mem_save()` con el resumen técnico de la decisión/bugfix (Qué, Por qué, Dónde). No esperes al final de la sesión.

3. **Shutdown / Compactación:** Antes de cerrar la sesión, dar una tarea por terminada, o inmediatamente después de un reinicio de contexto ("FIRST ACTION REQUIRED"):
   - Ejecuta `mem_session_summary()` con un resumen estructurado (Goal, Accomplished, Next Steps).
   - Actualiza los "Próximos Pasos" en `00_Dashboard.md` y deja el Dev Log del día cerrado.
