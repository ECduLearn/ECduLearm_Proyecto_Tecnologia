# DESIGN SYSTEM — ECDULEARN WEB («CUADERNO DE CAMPO»)

Única Fuente de Verdad Visual para el equipo de desarrollo y diseño UI/UX (Melissa Molina / Ariel Chacha / Joan Santacruz).

---

## 1. Fundamentos Tipográficos
El sistema prioriza la máxima legibilidad para lectura matemática, numérica y contextual tipo PISA:
- **Tipografía Principal (Sans & Serif):** `"Atkinson Hyperlegible Next"`, ui-sans-serif, system-ui, sans-serif.
  - Diseñada especialmente por el Braille Institute para evitar confusiones de caracteres críticos en matemáticas (como `0` vs `O`, `1` vs `l` vs `I`).
- **Tipografía Numérica y Código (Mono):** `"Atkinson Hyperlegible Mono"`, ui-monospace, monospace.
  - Utilizada para códigos PIN (ej. `PISA26`), fórmulas matemáticas, tablas de datos y ecuaciones.

---

## 2. Paleta Cromática y Tokens de Color

### A. Paleta «Cuaderno de Campo» (Tokens Core)
1. **Tinta (`--color-ink`):** Marca, navegación, botones de acción primaria y estados activos.
   - `ink-50`: `#f0f5f2` (fondos sutiles activos)
   - `ink-100`: `#e3efe8`
   - `ink-500`: `#3f7a62`
   - `ink-700`: `#1e5040`
   - `ink-900`: `#113d2f`
   - `ink-950`: `#0f3b2e` (color primario institucional)

2. **Pista / Alerta Cálida (`--color-hint`):** Reservado para pistas socráticas, foco, llamadas de atención y advertencias pedagógicas.
   - `hint-50`: `#fbf3ec` (fondo de tarjetas de pistas)
   - `hint-400`: `#dd8e5c` (bordes de destaque)
   - `hint-500`: `#c9692f` (acento socrático)
   - `hint-600`: `#b4470f`
   - `hint-900`: `#6e2a08`

3. **Arena / Papel Cálido (`--color-sand`):** Fondos de página, lienzos A4 de planeación y tarjetas de contenido.
   - `sand-50`: `#f7f4ec` (fondo general cálido)
   - `sand-100`: `#f2eee3` (tarjetas y contenedores)
   - `sand-200`: `#e6e0d2` (bordes neutros)
   - `sand-400`: `#77705f` (texto secundario con contraste AA > 4.5:1)
   - `sand-900`: `#1c1a17` (texto primario de alta lectura)

### B. Paleta Dark Mode / Landing & Evaluator
- Fondo principal: `bg-slate-950` (`#020617`) con acentos `bg-slate-900/90`.
- Bordes: `border-slate-800`.
- Acentos interactivos: `teal-400` (`#2dd4bf`), `blue-600` (`#2563eb`), `amber-400` (`#fbbf24`).

---

## 3. Accesibilidad e Interacción Humano-Computador (IHC - WCAG 2.2 AA)
- **Zonas Táctiles Mínimas:** Todos los botones, chips interactivos e inputs deben tener una altura mínima de `44px` (`min-h-[44px]`).
- **Contraste de Color:** Mínimo `4.5:1` en texto normal y `3:1` en componentes de interfaz gráfica.
- **Divulgación Progresiva:** La información no abruma al estudiante; las pistas se descubren una a la vez bajo demanda mediante andamiaje.
- **Retroalimentación Empática:** Se prohíben alertas en rojo estridente que generen frustración ante errores; se utilizan tonos ámbar y preguntas guía.
- **Estados del Sistema:** Indicadores visuales y *skeletons* durante la generación con IA.

---

## 4. Estructura y Layouts Responsivos
- **Mobile First:** En smartphones, navegación vertical con tarjetas apiladas e inputs de teclado numérico para PIN.
- **Split-Screen Docente (Escritorio ≥ 1024px):**
  - **40% Panel Izquierdo:** Chat conversacional de IA + Chips rápidos de adaptación curricular.
  - **60% Panel Derecho:** Live Preview editable de la guía ministerial ERCA lista para exportar/imprimir o publicar por PIN.
- **Navegación Friendly URLs:**
  - `/` &rarr; Landing Page
  - `/portal` &rarr; Acceso por PIN / Credenciales
  - `/estudiante` &rarr; Aula Virtual y Tutor Socrático
  - `/docente` &rarr; Panel de Gestión y Control de Aulas
  - `/chat` &rarr; Generador y Adaptador PISA
  - `/planificador` &rarr; Planificador Curricular ERCA
  - `/simulador` &rarr; Simulador de Admisión
  - `/editor` &rarr; Edición de Ejercicios
