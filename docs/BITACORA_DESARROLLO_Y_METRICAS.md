# Bitácora de Desarrollo, Gobernanza SRE y Métricas — ECduLearn

- **Proyecto:** ECduLearn — Plataforma EdTech SaaS B2B (1ro a 3ro BGU · Ecuador)
- **Rama Activa:** `feat/rediseno-landing` (commit `f9f95f1`)
- **Propósito del Documento:** Registrar la evolución controlada del sistema, los acuerdos de nivel de servicio (**SLI / SLO / SLA**), presupuestos de error (**Error Budgets**), métricas operativas de IA/BD y la declaración de uso de IA conforme a los estándares de ingeniería de software y entregables académicos.

---

## 1. Registro Cronológico de Evolución del Sistema (Bitácora de Commits)

| Fecha / Fase | Commit | Tipo | Descripción Técnica y Artefactos Impactados | Estado de Verificación |
| :--- | :---: | :---: | :--- | :---: |
| Sprint 1 · Base | `a6d83aa` | `feat` | Integración inicial de cliente Supabase, esquema base y adaptador de persistencia híbrida (`localStorage` + PostgreSQL). | ✅ Verificado |
| Sprint 1 · IA Server | `fa3f461` | `feat(ia)` | Creación de la función serverless [`api/ai.ts`](file:///c:/ECduLearn_Software/api/ai.ts) en Vercel y plugin `vercelApiDev` en [`vite.config.ts`](file:///c:/ECduLearn_Software/vite.config.ts) para aislar `GEMINI_API_KEY` y los *system prompts* en el servidor. | ✅ Verificado |
| Sprint 1 · Seguridad | `92b9f29` | `fix(seguridad)` | Autenticación real de docentes contra Supabase Auth (`signInWithPassword`), validación de sesión en [`authController.restoreSession`](file:///c:/ECduLearn_Software/src/services/dbService.ts#L354-L365) y eliminación de lista blanca de correos en cliente. | ✅ Verificado |
| Sprint 1 · BD v2.0.0 | `28191e4` | `feat(datos)` | Sincronización de [`src/services/dbService.ts`](file:///c:/ECduLearn_Software/src/services/dbService.ts) con [`supabase/schema.sql`](file:///c:/ECduLearn_Software/supabase/schema.sql) v2.0.0 (tablas en 3FN, RLS por `auth.uid()` y 6 funciones RPC `SECURITY DEFINER` para sesiones estudiantiles anónimas). | ✅ Verificado |
| Sprint 1 · UX/UI | `a2ef2d6` | `feat(vistas)` | Incorporación de vista estudiantil dedicada [`src/views/RetoColegio.tsx`](file:///c:/ECduLearn_Software/src/views/RetoColegio.tsx) y rutas limpias en [`src/router.ts`](file:///c:/ECduLearn_Software/src/router.ts). | ✅ Verificado |
| Sprint 1 · Build/CI | `573551c` | `chore(deps)` | Sincronización de [`pnpm-lock.yaml`](file:///c:/ECduLearn_Software/pnpm-lock.yaml) con `package.json` (`@supabase/supabase-js ^2.103.0`). | ✅ Verificado |
| **Fase 2 (`C-02`)** | `b1b55a4` | `feat(ia)` | Solución paso a paso, respuesta final y pistas socráticas en [`api/ai.ts`](file:///c:/ECduLearn_Software/api/ai.ts) y [`src/services/aiService.ts`](file:///c:/ECduLearn_Software/src/services/aiService.ts). | ✅ Verificado (`0 errores TS`) |
| **Fase 1 (`C-01`, `A-02`)** | `1295003` | `fix(datos)` | Publicación de aulas con inserción en `aula_ejercicios` y validación de PIN por RPC en [`src/services/dbService.ts`](file:///c:/ECduLearn_Software/src/services/dbService.ts). | ✅ Verificado (`0 errores TS`) |
| **Fase 3 (`A-01`, `A-02`)** | `13d0ba2` | `feat(docente)` | Modal [`src/components/PublicarAulaDialog.tsx`](file:///c:/ECduLearn_Software/src/components/PublicarAulaDialog.tsx), generador [`generarPinAula`](file:///c:/ECduLearn_Software/src/services/pinService.ts) y visualización de solución docente (`print:hidden`). | ✅ Verificado (`0 errores TS`) |
| **Fase 4 (`A-03`)** | `9f967d6` | `fix(métricas)` | Conexión de [`src/Portal.tsx`](file:///c:/ECduLearn_Software/src/Portal.tsx) con `metricasController.getMetricasEnVivo()` y paso de bloqueo frecuente. | ✅ Verificado (`0 errores TS`) |
| **Fase 5 (`M-02`, `M-03`)** | `314c3c5` | `feat(docente)` | Editor A4 y planificador ERCA con el ejercicio real y resolución de colisiones de versiones A/B/C (`etiquetaLibre`). | ✅ Verificado (`0 errores TS`) |
| **Diseño Visual** | `467e425` | `feat(diseño)` | Paleta azul y blanco y transiciones fluidas en la aplicación. | ✅ Verificado (`0 errores TS`) |
| **Fase 6 (`B-02`)** | `b38d578` | `perf(carga)` | Carga diferida (`React.lazy`) y precarga en segundo plano (`requestIdleCallback`) en [`src/App.tsx`](file:///c:/ECduLearn_Software/src/App.tsx). | ✅ Verificado (`0 errores TS`) |
| **Fase 6 (`M-04`, `B-01`, `B-03`)** | `5a0c64c` | `feat(estudiante)` | Práctica libre con ejercicios reales en [`src/AutonomousZone.tsx`](file:///c:/ECduLearn_Software/src/AutonomousZone.tsx), input táctil `min-h-11` (`44px`) y limpieza de funciones legado v1 en [`src/services/supabaseClient.ts`](file:///c:/ECduLearn_Software/src/services/supabaseClient.ts). | ✅ Verificado (`0 errores TS`) |
| **Fase 6 (`M-05`)** | `b3be951` | `fix(admin)` | Escrituras verificadas en `adminController` y vista real de restablecimiento de contraseña [`src/views/RestablecerClave.tsx`](file:///c:/ECduLearn_Software/src/views/RestablecerClave.tsx). | ✅ Verificado (`0 errores TS`) |
| **Sprint 3 (`HU-10`)** | `5dc059e` | `feat(coordinación)` | Vista [`src/views/ReporteInstitucional.tsx`](file:///c:/ECduLearn_Software/src/views/ReporteInstitucional.tsx) conectada a `fn_dashboard_institucion`. | ✅ Verificado (`0 errores TS`) |
| **Sprint 3 (`HU-09`)** | `5cd05aa` | `feat(estudiante)` | Vista [`src/views/SimuladorAdmision.tsx`](file:///c:/ECduLearn_Software/src/views/SimuladorAdmision.tsx) con calificación en servidor y revisión socrática. | ✅ Verificado (`0 errores TS`) |
| **Modularización MVC** | `6a54d10` | `refactor(app)` | Extracción de [`AsistenteDocente.tsx`](file:///c:/ECduLearn_Software/src/views/AsistenteDocente.tsx), [`EditorGuia.tsx`](file:///c:/ECduLearn_Software/src/views/EditorGuia.tsx) y [`BarraEvaluador.tsx`](file:///c:/ECduLearn_Software/src/components/BarraEvaluador.tsx) fuera de `App.tsx`. | ✅ Verificado (`0 errores TS`) |
| **Edición Docente** | `4130dd6` | `feat(docente)` | Persistencia de ediciones manuales del editor A4 y del planificador ERCA. | ✅ Verificado (`0 errores TS`) |
| **Seguridad RBAC** | `549c275`<br>`f9f95f1` | `feat(admin)` | Restricción del panel de administración exclusivamente al rol `admin` (RBAC en `Portal.tsx`, `AdminDashboard.tsx`, `dbService.ts`, `BarraEvaluador.tsx` y `LandingPage.tsx`). | ✅ Verificado (`0 errores TS`) |

---

## 2. Métricas Técnicas y Parámetros Operativos Actuales (`f9f95f1`)

| Parámetro / Métrica | Valor Configurado | Ubicación en Código | Comportamiento de Resiliencia |
| :--- | :--- | :--- | :--- |
| **Timeout en Cliente (`REQUEST_TIMEOUT_MS`)** | `18 000 ms` (`18 s`) | [`src/services/aiService.ts`](file:///c:/ECduLearn_Software/src/services/aiService.ts#L22) | `AbortController` cancela la petición HTTP y activa el fallback determinista local sin bloquear la interfaz. |
| **Timeout por Modelo en Servidor (`PER_MODEL_TIMEOUT_MS`)** | `10 000 ms` (`10 s`) | [`api/ai.ts`](file:///c:/ECduLearn_Software/api/ai.ts#L18) | Si el modelo primario excede `10 s`, aborta e intenta el siguiente modelo de la cascada. |
| **Presupuesto Total Serverless (`TOTAL_BUDGET_MS`)** | `16 000 ms` (`16 s`) | [`api/ai.ts`](file:///c:/ECduLearn_Software/api/ai.ts#L21) | Garantiza responder antes de que venza el timeout de `18 s` del navegador. |
| **Cascada de Modelos (*Fallback Chain*)** | `gemini-2.5-flash` → `gemini-2.5-flash-lite` → `gemini-3.5-flash-lite` → `gemini-2.0-flash` | [`api/ai.ts`](file:///c:/ECduLearn_Software/api/ai.ts#L10-L15) | Conmutación automática ante errores HTTP `429`, `500`, `503` o bloqueos de respuesta vacía. |
| **Tokens de Salida (`maxOutputTokens`)** | • `exercise`: `2 200` tokens<br>• `socratic`: `400` tokens<br>• `erca`: `1 200` tokens | [`api/ai.ts`](file:///c:/ECduLearn_Software/api/ai.ts#L69-L71) | Dimensionado para alojar enunciado, solución paso a paso y 3 pistas socráticas sin truncar el JSON. |
| **Rate Limiting por IP (`RATE_LIMIT`)** | `20 peticiones / 60 s` | [`api/ai.ts`](file:///c:/ECduLearn_Software/api/ai.ts#L22) | Devuelve HTTP `429` (`rate_limited`) protegiendo la cuota de Gemini en aulas escolares con IP compartida. |
| **Tamaño Máximo de Payload (`MAX_BODY_BYTES`)** | `24 576 bytes` (`24 KB`) | [`api/ai.ts`](file:///c:/ECduLearn_Software/api/ai.ts#L23) | Rechaza con HTTP `413` (`payload_too_large`) peticiones sobredimensionadas. |

---

## 3. Gobernanza y Observabilidad SRE (SLI, SLO, SLA y Error Budget)

| Servicio / Flujo Crítico | SLI (Indicador) | SLO (Objetivo Interno) | SLA (Acuerdo Institucional B2B) |
| :--- | :--- | :--- | :--- |
| **Generación Docente PISA + Solución (`POST /api/ai`)** | Latencia `p95` de respuesta válida (IA o Fallback determinista) y tasa de éxito HTTP `200`. | • Latencia `p95 <= 10.0 s`<br>• Disponibilidad efectiva (con Fallback) `>= 99.9 %` | Disponibilidad mensual `>= 99.5 %` en horario lectivo (`06:30–18:30 ECT`). |
| **Ingreso Estudiantil Anónimo (`fn_iniciar_sesion_anonima`)** | Tiempo de resolución RPC y entrega de ejercicios (`fn_contenido_sesion`). | • Latencia `p95 <= 800 ms`<br>• Tasa de error `5xx < 0.1 %` | Disponibilidad mensual `>= 99.5 %` para aulas activas de hasta 45 estudiantes simultáneos. |
| **Tutor Socrático Anti-Copia (`askSocraticTutor`)** | 1. Latencia `p95` de respuesta.<br>2. Tasa de cumplimiento del candado pedagógico (0 % filtración de respuestas). | • Latencia `p95 <= 6.0 s`<br>• Cumplimiento del candado anti-copia `= 100 %` | Cero entrega de respuestas directas garantizada por prompt de servidor + validador determinista. |

---

## 4. Declaración de Uso de Inteligencia Artificial (Entregable Académico)

| Fase del Proyecto | Herramienta / Modelo de IA Utilizado | Propósito y Alcance del Uso | Validación y Supervisión Humana |
| :--- | :--- | :--- | :--- |
| **Motor Pedagógico en Producción (Runtime)** | Google Gemini (`gemini-2.5-flash` / `gemini-2.5-flash-lite` / `gemini-3.5-flash-lite`) vía [`api/ai.ts`](file:///c:/ECduLearn_Software/api/ai.ts) | 1. Generación y adaptación de problemas matemáticos contextualizados tipo PISA con solución paso a paso para el docente.<br>2. Tutoría Socrática guiada por preguntas con candado anti-copia.<br>3. Estructuración de secuencias microcurriculares ERCA. | El equipo diseñó los *system prompts* restrictivos en el servidor, el parser de validación JSON y los *fallbacks* deterministas locales para garantizar seguridad pedagógica y operación sin red. |
| **Auditoría Técnica, Contratos y Documentación de Arquitectura** | Agente de Ingeniería de Requerimientos, Arquitectura y Auditoría (Antigravity) | Inspección estática no destructiva del repositorio, contraste 1:1 contra [`supabase/schema.sql`](file:///c:/ECduLearn_Software/supabase/schema.sql) y [`design.md`](file:///c:/ECduLearn_Software/design.md), redacción de contratos OpenAPI/RPC y verificación de las subsanaciones `b1b55a4..f9f95f1`. | Revisión y aprobación por el equipo responsable: **Ariel Fabricio Chacha Pilco**, **Melissa Dayana Molina Sierra** y **Joan Sebastian Santacruz Villamarin**. |

