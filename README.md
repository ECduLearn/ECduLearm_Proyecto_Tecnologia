# ECduLearn — Plataforma EdTech SaaS B2B (1ro a 3ro BGU · Ecuador)

Plataforma educativa web (HTTPS y PWA) diseñada para colegios del Ecuador (1ro a 3ro de Bachillerato General Unificado — BGU). Ayuda a los docentes a crear y adaptar ejercicios matemáticos de razonamiento lógico tipo **PISA** en segundos dentro de la estructura ministerial **ERCA** (Experiencia, Reflexión, Conceptualización y Aplicación), y ofrece a los estudiantes un **Tutor Socrático de IA** con candado anti-copia que guía paso a paso con preguntas y pistas graduales sin entregar jamás la respuesta final.

---

## 📌 El Problema Validado en Campo

* **Brecha de razonamiento (PISA):** El **80 %** de los estudiantes ecuatorianos se ubica bajo el Nivel 2 en Matemáticas en PISA y solo el **17,4 %** alcanza el desempeño básico.
* **Sobrecarga operativa docente:** Los profesores invierten hasta **10 horas semanales** fuera de horario buscando y adaptando material a mano para aulas de **35 a 40 estudiantes**.
* **Validación con docentes reales:** En nuestro estudio de campo con **28 de 30 docentes encuestados (93 % de cobertura)**, el **78,6 % (22/28)** adapta ejercicios con frecuencia y el **85,7 % (24/28)** calificó como útil o muy útil nuestra orientación tipo PISA.
* **Privacidad de menores (*Zero-PII*):** Los estudiantes ingresan únicamente con un código PIN de aula de 6 caracteres (ej. `PISA26`), sin crear cuenta ni entregar nombre, correo o teléfono.

---

## 👥 Equipo y Propiedad del Código

| Integrante | Rol | Responsabilidad Principal |
| :--- | :--- | :--- |
| **Ariel Fabricio Chacha Pilco** | Scrum Master, Tech Lead, Frontend e IA | `src/`, `public/`, `api/ai.ts`, `index.html`, configuración de Vite y Vercel |
| **Melissa Dayana Molina Sierra** | Product Owner, UX/UI | Sistema de diseño ([`docs/design.md`](docs/design.md)) y validación de usabilidad |
| **Joan Sebastian Santacruz Villamarin** | Backend y Base de Datos | [`supabase/schema.sql`](supabase/schema.sql) (PostgreSQL 3FN, RLS y funciones RPC) |

---

## 🏛️ Arquitectura Técnica (MVC + Serverless BFF + Supabase v2.0.0)

* **Capa de Modelos (`src/models/`):**
  * Tipos de dominio ([`types.ts`](src/models/types.ts)), datos semilla ([`seedData.ts`](src/models/seedData.ts)) y estado compartido de sesión docente ([`sesionDocente.ts`](src/models/sesionDocente.ts)).
* **Capa de Servicios y Controladores (`src/services/`):**
  * [`dbService.ts`](src/services/dbService.ts): Controladores conectados a Supabase PostgreSQL (`authController`, `ejerciciosController`, `planificacionesController`, `aulasController`, `estudianteSocraticoController`, `metricasController`, `reporteController`, `adminController`) con respaldo local determinista.
  * [`aiService.ts`](src/services/aiService.ts): Cliente hacia la función serverless `/api/ai` con *timeout* y *fallback* local determinista.
  * [`pinService.ts`](src/services/pinService.ts): Generación criptográfica (`crypto.getRandomValues`) y validación de códigos PIN de 6 caracteres.
* **Capa Serverless de IA (`api/ai.ts`):**
  * Único punto que se comunica con Google Gemini (`GEMINI_API_KEY` en el servidor), aloja los *system prompts* (incluido el candado pedagógico anti-copia), valida entradas, controla CORS y limita peticiones por IP.
* **Capa de Vistas (`src/views/` y `src/`):**
  * Carga diferida (`React.lazy` + `<Suspense>`) en [`App.tsx`](src/App.tsx) para [`AsistenteDocente.tsx`](src/views/AsistenteDocente.tsx), [`EditorGuia.tsx`](src/views/EditorGuia.tsx), [`RetoColegio.tsx`](src/views/RetoColegio.tsx), [`SimuladorAdmision.tsx`](src/views/SimuladorAdmision.tsx), [`ReporteInstitucional.tsx`](src/views/ReporteInstitucional.tsx), [`RestablecerClave.tsx`](src/views/RestablecerClave.tsx), [`Portal.tsx`](src/Portal.tsx), [`AdvancedModules.tsx`](src/AdvancedModules.tsx) y [`AdminDashboard.tsx`](src/AdminDashboard.tsx).

---

## 📚 Documentación Técnica Centralizada (`docs/`)

Toda la documentación de ingeniería, arquitectura, contratos y auditoría se encuentra centralizada en la carpeta [`docs/`](docs):

* [`docs/AUDITORIA.md`](docs/AUDITORIA.md) — Informe de Auditoría Técnica Integral No Destructiva (cumplimiento del 100 % de las 10 Historias de Usuario — 36/36 pts).
* [`docs/HOJA_DE_RUTA_INCREMENTAL.md`](docs/HOJA_DE_RUTA_INCREMENTAL.md) — Hoja de ruta de subsanación y evolución por fases verificadas.
* [`docs/BITACORA_DESARROLLO_Y_METRICAS.md`](docs/BITACORA_DESARROLLO_Y_METRICAS.md) — Bitácora de commits, métricas SRE (SLI/SLO/SLA) y declaración de uso de IA.
* [`docs/CONTRATO_OPENAPI_Y_RPC_V2.md`](docs/CONTRATO_OPENAPI_Y_RPC_V2.md) — Contrato formal OpenAPI 3.1.0 de `/api/ai` y especificación de las funciones RPC de PostgreSQL.
* [`docs/AUDITORIA_ESQUEMA_3FN_Y_RLS.md`](docs/AUDITORIA_ESQUEMA_3FN_Y_RLS.md) — Auditoría del esquema relacional en Tercera Forma Normal (3FN) y políticas RLS.
* [`docs/Documento_Tecnico_v0.1.md`](docs/Documento_Tecnico_v0.1.md) — Documento técnico base del proyecto.

---

## 🚀 Instalación y Comandos (`pnpm`)

### Prerrequisitos
* Node.js 20+ y **pnpm** (fijado en `pnpm-lock.yaml`).

```bash
pnpm install             # instalar dependencias respetando pnpm-lock.yaml
pnpm dev                 # servidor de desarrollo local (incluye /api/ai)
pnpm typecheck           # verificación estática de tipos (tsc --noEmit)
pnpm build               # compilación de producción (tsc --noEmit + vite build)
```

### Variables de Entorno (`.env`)
Copia `.env.example` en `.env`:
* `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`: URL y clave pública `anon` del proyecto Supabase.
* `GEMINI_API_KEY`: Clave privada de Google Gemini (leída únicamente en el servidor por `api/ai.ts`, **sin** prefijo `VITE_`).

---

## 🔑 Accesos del Modo Demo Evaluador

| Perfil | Mecanismo de Acceso | Credenciales de Prueba |
| :--- | :--- | :--- |
| **Docente Demo** | Login Institucional en `/acceso` | `docente@puce.edu.ec` / `demo123` |
| **Estudiante (Cero PII)** | Ingreso por PIN en `/` o `/acceso` | PIN: **`PISA26`** |
| **Administración Demo** | Login Institucional (Rol `admin`) | `admin@ecdulearn.edu.ec` / `admin123` |

---

## 📄 Licencia

Distribuido bajo la Licencia MIT. Consulta el archivo [`LICENSE`](LICENSE) para más detalles.
