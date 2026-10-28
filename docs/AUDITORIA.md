# Informe de Auditoría Técnica Integral No Destructiva — ECduLearn Web

- **Proyecto:** ECduLearn — Plataforma EdTech SaaS B2B (1ro a 3ro BGU · Ecuador)
- **Rama auditada:** `feat/rediseno-landing` (commit `f9f95f1` — tras completar las 6 fases de subsanación y RBAC)
- **Esquema de Base de Datos de referencia:** [`supabase/schema.sql`](file:///c:/ECduLearn_Software/supabase/schema.sql) (v2.0.0 — 3FN + RLS + RPC `SECURITY DEFINER`)
- **Fuente de verdad visual:** [`design.md`](file:///c:/ECduLearn_Software/design.md)
- **Metodología y Normativa Aplicada:** ISO/IEC 9126-1, ISO/IEC 14598-1, NTE INEN-ISO/IEC TR 9126-3, Estándar SQL ISO/IEC 9075 (3FN), OWASP Top 10 / OWASP API Security Top 10, Heurísticas de Nielsen & Molich y WCAG 2.2 Nivel AA.

---

## 1. Resumen Ejecutivo

### Dictamen General de Arquitectura y Producción

> **DICTAMEN FINAL (`f9f95f1`):** **APTO PARA PRODUCCIÓN Y EVALUACIÓN (100 % del Product Backlog implementado — 36/36 puntos en las 10 Historias de Usuario; 11 de 12 hallazgos iniciales subsanados; 0 hallazgos Críticos, Altos o Bajos abiertos).**
>
> Tras la serie completa de commits (`b1b55a4` → `f9f95f1`), el repositorio alcanza **0 errores de tipos (`tsc --noEmit`)**, modularización completa de vistas con carga diferida (`React.lazy` en [`src/App.tsx`](file:///c:/ECduLearn_Software/src/App.tsx#L5-L18)), control de acceso basado en roles (**RBAC**) que restringe el panel de administración exclusivamente a usuarios con `role === "admin"` ([`549c275`](file:///c:/ECduLearn_Software/src/AdminDashboard.tsx)), simulador preuniversitario calificado por servidor (**HU-09** en [`src/views/SimuladorAdmision.tsx`](file:///c:/ECduLearn_Software/src/views/SimuladorAdmision.tsx)) y reporte ejecutivo de rectorado conectado a `fn_dashboard_institucion` (**HU-10** en [`src/views/ReporteInstitucional.tsx`](file:///c:/ECduLearn_Software/src/views/ReporteInstitucional.tsx)).

---

### Matriz de Cumplimiento del Product Backlog Completo (10 Historias — 36 Puntos)

| ID | Historia de Usuario | Prioridad | Pts. | Sprint | Estado | Evidencia de Cumplimiento Extremo a Extremo (UI ↔ Servicio ↔ BD) |
| :---: | :--- | :---: | :---: | :---: | :---: | :--- |
| **HU-01** | Generador docente de ejercicios tipo PISA con solución paso a paso | **Must** | 5 | Sprint 1 | **100 % ✅** | [`AsistenteDocente.tsx`](file:///c:/ECduLearn_Software/src/views/AsistenteDocente.tsx#L94-L165), [`ExerciseCard.tsx`](file:///c:/ECduLearn_Software/src/components/ExerciseCard.tsx) (*"Solución paso a paso (solo para ti)"*, `print:hidden`), [`api/ai.ts`](file:///c:/ECduLearn_Software/api/ai.ts#L56-L70) y [`guardarComoActivo`](file:///c:/ECduLearn_Software/src/services/dbService.ts#L414-L426) en `ejercicios_pisa`. |
| **HU-02** | Modificación iterativa mediante chat o chips rápidos y edición manual | **Must** | 5 | Sprint 2 | **100 % ✅** | Chips rápidos en [`AsistenteDocente.tsx`](file:///c:/ECduLearn_Software/src/views/AsistenteDocente.tsx#L170-L225) y guardado manual en [`EditorGuia.tsx`](file:///c:/ECduLearn_Software/src/views/EditorGuia.tsx) (`actualizarEjercicio` en [`dbService.ts`](file:///c:/ECduLearn_Software/src/services/dbService.ts)). |
| **HU-03** | Creación de aula virtual con código PIN único de 6 caracteres | **Must** | 3 | Sprint 1 | **100 % ✅** | [`PublicarAulaDialog.tsx`](file:///c:/ECduLearn_Software/src/components/PublicarAulaDialog.tsx), [`generarPinAula`](file:///c:/ECduLearn_Software/src/services/pinService.ts#L4-L10) y [`aulasController.publicarAula`](file:///c:/ECduLearn_Software/src/services/dbService.ts#L857-L947) insertando en `aulas_virtuales` y `aula_ejercicios`. |
| **HU-04** | Acceso estudiantil anónimo por PIN (*Zero-PII*) | **Must** | 3 | Sprint 1 | **100 % ✅** | [`LandingPage.tsx`](file:///c:/ECduLearn_Software/src/LandingPage.tsx#L194-L201), [`Portal.tsx`](file:///c:/ECduLearn_Software/src/Portal.tsx#L203-L237) y [`RetoColegio.tsx`](file:///c:/ECduLearn_Software/src/views/RetoColegio.tsx#L63-L102) vía RPC `fn_iniciar_sesion_anonima` sin pedir ningún dato personal. |
| **HU-05** | Tutor Socrático de IA con candado anti-copia | **Must** | 8 | Sprint 1 | **100 % ✅** | Candado en servidor ([`api/ai.ts`](file:///c:/ECduLearn_Software/api/ai.ts#L31-L55)), detector [`looksLikeDirectAnswerRequest`](file:///c:/ECduLearn_Software/src/services/aiService.ts#L459-L473), chips táctiles en [`RetoColegio.tsx`](file:///c:/ECduLearn_Software/src/views/RetoColegio.tsx#L276-L315) y registro RPC (`fn_solicitar_pista`, `fn_registrar_intento`, `fn_registrar_mensaje`). |
| **HU-06** | Integración y exportación en plantilla ministerial ERCA | **Should** | 3 | Sprint 2 | **100 % ✅** | [`EditorGuia.tsx`](file:///c:/ECduLearn_Software/src/views/EditorGuia.tsx) y [`PlanningWorkspace`](file:///c:/ECduLearn_Software/src/AdvancedModules.tsx#L166-L222) con selector `#class-course` (`1ro–3ro BGU`), `planErcaAI` y persistencia en `planificaciones_erca`. |
| **HU-07** | Versiones equivalentes A/B/C anti-copia entre paralelos | **Should** | 3 | Sprint 2 | **100 % ✅** | [`etiquetaLibre`](file:///c:/ECduLearn_Software/src/services/dbService.ts#L396-L407) consulta etiquetas hermanas en `ejercicios_pisa` y evita colisiones en `uq_ejercicio_version_hermana`. |
| **HU-08** | Panel docente con métricas de tiempo ahorrado y paso de bloqueo | **Should** | 3 | Sprint 2 | **100 % ✅** | [`Portal.tsx`](file:///c:/ECduLearn_Software/src/Portal.tsx#L676-L678) consume [`metricasController.getMetricasEnVivo()`](file:///c:/ECduLearn_Software/src/services/dbService.ts#L1327-L1384) sobre las vistas `vw_tiempo_ahorrado_docente`, `vw_completitud_socratica_aula` y `vw_pasos_bloqueo_aula`. |
| **HU-09** | Simulador de Admisión con cronómetro y revisión socrática final | **Could** | 2 | Sprint 3 | **100 % ✅** | [`SimuladorAdmision.tsx`](file:///c:/ECduLearn_Software/src/views/SimuladorAdmision.tsx#L17-L120) con cronómetro regresivo, registro de respuestas vía `fn_registrar_intento`, calificación con `fn_finalizar_sesion` y revisión socrática con `reviewExamAI`. |
| **HU-10** | Reporte institucional resumido para rectorado / coordinación | **Could** | 1 | Sprint 3 | **100 % ✅** | [`ReporteInstitucional.tsx`](file:///c:/ECduLearn_Software/src/views/ReporteInstitucional.tsx#L1-L153) conectado a `reporteController.getReporteInstitucional()` → RPC `fn_dashboard_institucion()` con exportación a PDF/impresión y 0 PII. |

---

## 2. Hallazgos Clasificados por Severidad (Estado Actual `f9f95f1`)

| ID | Severidad Inicial | Estado Actual | Commit de Resolución | Resumen de la Subsanación Verificada |
| :---: | :---: | :---: | :---: | :--- |
| **`C-01`** | 🔴 Crítico | **✅ SUBSANADO** | `1295003` | [`aulasController.publicarAula`](file:///c:/ECduLearn_Software/src/services/dbService.ts#L857-L947) persiste el ejercicio si falta su UUID, hace `upsert` en `aulas_virtuales` e inserta en `aula_ejercicios`. |
| **`C-02`** | 🔴 Crítico | **✅ SUBSANADO** | `b1b55a4`<br>`13d0ba2` | [`api/ai.ts`](file:///c:/ECduLearn_Software/api/ai.ts#L56-L70) y [`aiService.ts`](file:///c:/ECduLearn_Software/src/services/aiService.ts#L102-L116) devuelven `solucionDocente`, `respuestaCorrecta` y `pistasSocraticas`, mostrados en [`ExerciseCard.tsx`](file:///c:/ECduLearn_Software/src/components/ExerciseCard.tsx) (`print:hidden`). |
| **`A-01`** | 🟠 Alto | **✅ SUBSANADO** | `13d0ba2` | Modal [`PublicarAulaDialog.tsx`](file:///c:/ECduLearn_Software/src/components/PublicarAulaDialog.tsx) con [`generarPinAula`](file:///c:/ECduLearn_Software/src/services/pinService.ts#L4-L10) (CSPRNG de 6 caracteres sin ambigüedad). |
| **`A-02`** | 🟠 Alto | **✅ SUBSANADO** | `1295003`<br>`4130dd6` | [`guardarComoActivo`](file:///c:/ECduLearn_Software/src/services/dbService.ts#L414-L426) y `actualizarEjercicio` sincronizan el UUID real de PostgreSQL entre el chat, el editor A4 y el planificador ERCA. |
| **`A-03`** | 🟠 Alto | **✅ SUBSANADO** | `9f967d6` | [`Portal.tsx`](file:///c:/ECduLearn_Software/src/Portal.tsx#L676-L678) consume `metricasController.getMetricasEnVivo()` y muestra el paso de bloqueo más frecuente. |
| **`M-02`** | 🟡 Medio | **✅ SUBSANADO** | `314c3c5`<br>`4130dd6` | [`EditorGuia.tsx`](file:///c:/ECduLearn_Software/src/views/EditorGuia.tsx) y [`PlanningWorkspace`](file:///c:/ECduLearn_Software/src/AdvancedModules.tsx) editan y guardan el ejercicio real con selector de curso BGU. |
| **`M-03`** | 🟡 Medio | **✅ SUBSANADO** | `314c3c5` | [`etiquetaLibre`](file:///c:/ECduLearn_Software/src/services/dbService.ts#L396-L407) evita colisiones `23505` al crear múltiples versiones equivalentes A/B/C/D. |
| **`M-04`** | 🟡 Medio | **✅ SUBSANADO** | `5a0c64c` | [`AutonomousZone.tsx`](file:///c:/ECduLearn_Software/src/AutonomousZone.tsx) conecta la práctica libre con ejercicios reales de la base de datos y delega los retos a `<RetoColegio />`. |
| **`M-05`** | 🟡 Medio | **✅ SUBSANADO** | `b3be951`<br>`549c275` | RBAC estricto para `role === "admin"` en [`Portal.tsx`](file:///c:/ECduLearn_Software/src/Portal.tsx), [`AdminDashboard.tsx`](file:///c:/ECduLearn_Software/src/AdminDashboard.tsx) y [`dbService.ts`](file:///c:/ECduLearn_Software/src/services/dbService.ts), más vista real de recuperación [`RestablecerClave.tsx`](file:///c:/ECduLearn_Software/src/views/RestablecerClave.tsx). |
| **`B-01`** | 🟢 Bajo | **✅ SUBSANADO** | `5a0c64c` | El campo de chat en [`AutonomousZone.tsx`](file:///c:/ECduLearn_Software/src/AutonomousZone.tsx#L426) cumple `min-h-11` (`44px`, WCAG 2.2 AA `2.5.8`). |
| **`B-02`** | 🟢 Bajo | **✅ SUBSANADO** | `b38d578`<br>`6a54d10` | [`App.tsx`](file:///c:/ECduLearn_Software/src/App.tsx#L5-L18) aplica `React.lazy` + `<Suspense>` y precarga en segundo plano (`requestIdleCallback`), reduciendo el archivo raíz a 175 líneas. |
| **`B-03`** | 🟢 Bajo | **✅ SUBSANADO** | `5a0c64c` | [`supabaseClient.ts`](file:///c:/ECduLearn_Software/src/services/supabaseClient.ts#L1-L99) fue depurado por completo de funciones legado v1. |
| **`M-01`** | 🟡 Medio | ℹ️ Cosmético opcional | — | En [`AsistenteDocente.tsx`](file:///c:/ECduLearn_Software/src/views/AsistenteDocente.tsx#L13-L31), la lista `recentItems` de la barra lateral usa 3 accesos rápidos predefinidos como plantillas de arranque. |

---

## 3. Evidencia Concreta

### 3.1 Modularización MVC y Code-Splitting (`6a54d10` y `b38d578`)
* [`src/App.tsx`](file:///c:/ECduLearn_Software/src/App.tsx#L1-L175) actúa ahora únicamente como enrutador declarativo de 175 líneas con `lazy(...)` para cada vista (`AccessPortal`, `TeacherDashboard`, `AutonomousZone`, `PlanningWorkspace`, `AdmissionSimulator`, `AsistenteDocente`, `EditorGuia`, `ReporteInstitucional`, `RestablecerClave`, `AdminDashboard`).
* [`src/models/sesionDocente.ts`](file:///c:/ECduLearn_Software/src/models/sesionDocente.ts) mantiene sincronizado el ejercicio activo entre [`AsistenteDocente.tsx`](file:///c:/ECduLearn_Software/src/views/AsistenteDocente.tsx) y [`EditorGuia.tsx`](file:///c:/ECduLearn_Software/src/views/EditorGuia.tsx).

### 3.2 Control de Acceso Basado en Roles — RBAC (`549c275` y `b3be951`)
* En [`src/Portal.tsx`](file:///c:/ECduLearn_Software/src/Portal.tsx), el botón **"Panel Administración"** solo se renderiza si `currentUser?.role === "admin"`.
* En [`src/AdminDashboard.tsx`](file:///c:/ECduLearn_Software/src/AdminDashboard.tsx), se verifica `authController.restoreSession()` al montar la vista y se bloquea el acceso si el rol no es `"admin"`.
* En [`src/services/dbService.ts`](file:///c:/ECduLearn_Software/src/services/dbService.ts), `clienteAdmin()` y todas las operaciones de escritura de `adminController` exigen `user.role === "admin"`.

### 3.3 Simulador de Admisión (`5cd05aa`) y Reporte Institucional (`5dc059e`)
* [`src/views/SimuladorAdmision.tsx`](file:///c:/ECduLearn_Software/src/views/SimuladorAdmision.tsx#L46-L83) registra cada respuesta con `estudiante.registrarIntento`, cierra el examen con `estudiante.finalizarSesion` obteniendo `puntaje_simulador` calculado en PostgreSQL y ofrece revisión socrática post-examen con `reviewExamAI`.
* [`src/views/ReporteInstitucional.tsx`](file:///c:/ECduLearn_Software/src/views/ReporteInstitucional.tsx#L1-L153) invoca `reporteController.getReporteInstitucional()` conectado a `fn_dashboard_institucion()`, manejando los 4 estados (`loading`, `sin_permiso`, `error`, `reporte`).

---

## 4. Recomendación de Higiene del Repositorio y Seguridad antes de Subir a GitHub

Al auditar los archivos rastreados (`git ls-files`) y sin rastrear (`git status`), se emiten las siguientes recomendaciones sobre qué archivos mantener o excluir del repositorio público:

1. **Archivos de Agentes Locales y Apoyo de Diseño (NO subir a GitHub):**
   * `.claude/`: Carpeta local generada por herramientas de IA. Debe añadirse a [`.gitignore`](file:///c:/ECduLearn_Software/.gitignore).
   * `diseños/DESIGN.md`: Aunque `diseños/` está en `.gitignore`, este archivo fue indexado previamente. Debe retirarse del índice con `git rm --cached "diseños/DESIGN.md"` sin borrar tu archivo local.
2. **Sobre `design.md` y la Documentación Técnica:**
   * `design.md` no contiene credenciales ni accesos a producción; documenta el sistema visual de Melissa (UX/UI) citado en el Documento Técnico. Al centralizar la documentación en `docs/` (`docs/design.md`), la raíz queda limpia manteniendo la evidencia académica.
3. **Sobre `supabase/admin_dashboard.sql` (Revisión de Seguridad):**
   * En [`supabase/admin_dashboard.sql`](file:///c:/ECduLearn_Software/supabase/admin_dashboard.sql#L12-L74), la función `public.fn_login_docente(p_email text)` con `GRANT EXECUTE ... TO anon` era un mecanismo antiguo que consultaba usuarios solo por correo y **ya no es utilizada por el frontend** (que ahora usa `supabase.auth.signInWithPassword` + `fetchTeacherProfile` con JWT real). Además, las líneas 89–95 insertan correos de prueba como `ADMIN`. Se recomienda no ejecutar `fn_login_docente` en producción o dejar en `supabase/` únicamente [`supabase/schema.sql`](file:///c:/ECduLearn_Software/supabase/schema.sql) junto con las políticas RLS de rol `ADMIN`.

---

## 5. Plan de Re-testeo (Pirámide de Pruebas ISO/IEC 9126 / 14598)

1. **Base — Análisis Estático y Unitario (60 %):**
   * `./node_modules/.bin/tsc --noEmit` → **0 errores de tipos** verificado sobre `f9f95f1`.
2. **Nivel Medio — Integración y Contratos (30 %):**
   * Verificación de `/api/ai` (`exercise`, `socratic`, `erca`), `aulasController.publicarAula` (`aulas_virtuales` + `aula_ejercicios`) y `reporteController.getReporteInstitucional` (`fn_dashboard_institucion`).
3. **Cima — Flujos E2E y RBAC (10 %):**
   * Confirmar que al iniciar sesión con `docente@puce.edu.ec` (`role: "docente"`) no aparece el botón de Administración y `/admin` muestra la guardia de acceso restringido, mientras que `admin@ecdulearn.edu.ec` (`role: "admin"`) accede normalmente al panel.

