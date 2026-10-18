# ECduLearm (Web App EdTech)

Plataforma SaaS B2B con arquitectura web moderna (HTTPS y PWA) diseñada para instituciones educativas en Ecuador, orientada a transformar el aprendizaje pasivo en una experiencia de razonamiento lógico y pensamiento crítico tipo PISA.

---

## 📌 El Problema

Los docentes de matemáticas de bachillerato en Ecuador pierden **hasta 10 horas semanales fuera de su jornada laboral** adaptando ejercicios a metodologías de razonamiento lógico contextualizadas tipo PISA. Simultáneamente:
* En aulas masivas de **30 a 40 alumnos**, resulta inviable brindar retroalimentación socrática e individualizada a cada estudiante.
* **Más del 50% de los estudiantes recurre a IAs generativas genéricas** para copiar respuestas finales de deberes sin desarrollar procesos cognitivos ni entender el procedimiento.
* Las plataformas tradicionales recolectan datos personales sensibles de menores de edad, generando fricción de registro y riesgos de privacidad.

ECduLearm soluciona esta brecha mediante un **Generador y Adaptador Pedagógico ERCA para Docentes** y un **Tutor Socrático Anti-Copia para Estudiantes** con acceso anónimo por código PIN.

---

## 👥 Equipo y Roles Scrum

* **Joan Sebastian Santacruz Villamarin** — *Product Owner & Full-Stack Architect*
* **Ariel Fabricio Chacha Pilco** — *Scrum Master & Backend / Security Lead*
* **Michael (Melissa Dayana) Molina Sierra** — *Lead UX/UI Designer & QA Specialist*

---

## 🏛️ Tecnología y Arquitectura (MVC)

El sistema opera bajo un patrón **Modelo-Vista-Controlador (MVC)** desacoplado en el cliente web:

* **Modelo (`/src/models`):** 
  * Tipos de dominio ([`types.ts`](src/models/types.ts)): `Exercise`, `PinSession`, `ChatMessage`, `ErcaPhase`.
  * Estado reactivo y persistencia local ([`store.tsx`](src/models/store.tsx)): sincronización bidireccional con `localStorage` para sesiones de aula y versionado de ejercicios.
* **Controlador / Servicios (`/src/services`):**
  * Servicio de Inteligencia Artificial ([`aiService.ts`](src/services/aiService.ts)): arquitectura **Multi-Modelo con Balanceo de Cuota** conectada a la API de Google Gemini (`VITE_GEMINI_API_KEY`), priorizando modelos Flash-Lite (`gemini-3.5-flash-lite`, `gemini-flash-lite-latest`) para máximo ahorro de tokens y alta disponibilidad, con limitador de salida (`maxOutputTokens: 1200`) para evitar bloqueos por cuota (Rate Limit 429), y un **Modo Fallback Offline Inquebrantable** de respaldo automático ante pérdida de conexión o ausencia de API key.
  * Servicio de PIN y Seguridad ([`pinService.ts`](src/services/pinService.ts)): generación y validación de códigos de sesión de 6 caracteres sin solicitud de datos personales de menores.
* **Vista (`/src`):**
  * Componentes visuales responsivos construidos con **React 19 + Tailwind CSS**, diseñados bajo las pautas de accesibilidad **WCAG 2.2 Nivel AA** (objetivos táctiles ≥ 44px, contraste cromático y visibilidad del estado del sistema según Jakob Nielsen).

---

## 🚀 Instrucciones de Instalación y Despliegue Web (HTTPS)

### Prerrequisitos
* Node.js v18+ o v20+
* npm o pnpm

### 1. Clonación e Instalación
```bash
git clone https://github.com/tu-organizacion/ECduLearn_Software.git
cd ECduLearn_Software
npm install
```

### 2. Configuración de Variables de Entorno
Copia la plantilla `.env.example` a un archivo `.env`:
```bash
cp .env.example .env
```
Edita `.env` y agrega tu clave de Gemini API (opcional, el sistema cuenta con balanceo multimodelo y fallback offline integrado):
```env
VITE_GEMINI_API_KEY=tu_api_key_aqui
```

### 3. Ejecución en Desarrollo Local
```bash
npm run dev
```
La aplicación estará disponible en `http://localhost:5173` (o el puerto asignado por Vite).

### 4. Compilación para Producción (Vercel / Hostinger)
```bash
npm run build
```
Genera la carpeta optimizada `/dist` lista para ser servida bajo HTTPS en **Vercel**, Netlify o cualquier servidor web estático (Apache/Nginx en Hostinger). Para probar la versión de producción localmente:
```bash
npm run preview
```

---

## 🔑 Credenciales de Prueba para el Evaluador / Jurado

Para facilitar la revisión completa e interactiva de la plataforma:

| Perfil | Mecanismo de Acceso | Credenciales / Código |
|---|---|---|
| **Docente Demo** | Modal de Login Institucional | Correo: `docente@ecdulearn.edu.ec`<br>Contraseña: `admin123`<br>*(O clic directo en el botón `🔑 Autocompletar como Evaluador`)* |
| **Estudiante Demo** | Portal de Acceso por PIN | **`PISA26`** *(fricción cero, sin registro de datos personales)* |
| **Barra Superior de Evaluador** | Barra superior discreta + Botón flotante | Alterna en 1 clic entre **`Vista Docente`** y **`Vista Estudiante (PIN: PISA26)`** sin recargar la página |

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo [`LICENSE`](LICENSE) para más detalles.
