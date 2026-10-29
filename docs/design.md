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

Tinta azul, papel blanco y un único acento cálido para las pistas. Los valores salen de `src/index.css` (`@theme`); si cambian allí, se actualizan aquí.

### A. Paleta «Cuaderno de Campo» (Tokens Core)
1. **Tinta azul (`--color-ink`):** Marca, navegación, botones de acción primaria y estados activos.
   - `ink-50`: `#f1f6fe` (fondos sutiles activos, opción elegida)
   - `ink-100`: `#e0eafc` (anillos de foco, preguntas respondidas)
   - `ink-500`: `#3576e0` (cuadrícula de la landing, indicadores)
   - `ink-700`: `#1a4aa6` (bordes de selección)
   - `ink-800`: `#153d8a` (hover de botones primarios, burbujas del estudiante)
   - `ink-900`: `#10306f`
   - `ink-950`: `#0b2559` (color primario institucional, botones principales)

2. **Pista / Alerta Cálida (`--color-hint`):** Reservado para pistas socráticas, foco, llamadas de atención y advertencias pedagógicas.
   - `hint-50`: `#fbf3ec` (fondo de tarjetas de pistas)
   - `hint-300`: `#ebb896` (resaltador `.marker` de la landing)
   - `hint-400`: `#dd8e5c` (bordes de destaque)
   - `hint-500`: `#c9692f` (acento socrático)
   - `hint-600`: `#b4470f`
   - `hint-900`: `#6e2a08`

3. **Papel (`--color-sand`):** Blancos y grises fríos con un matiz azul. Fondos de página, lienzos A4 de planeación, tarjetas y texto. El nombre del token se mantiene por compatibilidad, aunque ya no es arena cálida.
   - `sand-50`: `#f7f9fc` (fondo general)
   - `sand-100`: `#eff3f8` (tarjetas y contenedores)
   - `sand-200`: `#e1e7ef` (bordes neutros)
   - `sand-400`: `#66728a` (texto secundario; desde 400 cumple contraste AA > 4.5:1 sobre blanco)
   - `sand-900`: `#151a24` (texto primario de alta lectura)
   - `sand-950`: `#0c1018` (superficies oscuras)

### B. Superficies especiales
- **Landing:** fondo blanco `#ffffff` con cuadrícula de papel (`.paper-grid`, líneas `ink-500` al 8 %) y resaltador `hint-300` en palabras clave. Ya no usa modo oscuro.
- **Barra del evaluador:** fondo oscuro `sand-950/95`, bordes `sand-800`, acentos `hint-300` y `ink-300`.
- **Sombras «pop»:** `.btn-pop-ink` (sombra `ink-950`), `.btn-pop-hint` (sombra `hint-800`) y `.card-pop` (`ink-950` al 8 %).

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

---

## 5. Declaración de uso de IA en este documento y en la interfaz

**Herramienta:** Claude Code (modelo Claude Opus 5.5, de Anthropic), usado como asistente de programación el 28 de octubre de 2026. Cada cambio fue revisado, probado en local (`pnpm dev` y `pnpm typecheck`) y aprobado por el equipo antes de hacer el commit. La IA no hizo commits ni subió cambios por su cuenta.

**Lo que hizo la IA:**
- **Paleta (sección 2):** comparó este documento con `src/index.css` y actualizó los tokens `ink`, `hint` y `sand` a la paleta azul y blanco vigente. También reemplazó la antigua sección «Dark Mode» por las superficies que existen en la app.
- **Enlaces:** corrigió las referencias a este archivo en `docs/AUDITORIA.md` y `docs/BITACORA_DESARROLLO_Y_METRICAS.md` tras moverlo a `docs/`.
- **Textos de la interfaz:** revisó y ajustó el aviso de acceso restringido, el simulador de admisión y los mensajes de error (redacción, mayúsculas, comillas «» y lenguaje sin género).
- **Barra del evaluador:** hizo que las barras laterales del panel docente y del asistente empiecen debajo de la barra del evaluador, en lugar de taparla.
- **Scroll:** desactivó el rebote y el gesto de «estirar para recargar» al llegar al borde de la página (`overscroll-behavior: none`).

Las decisiones de diseño (paleta, tipografía y estructura) son del equipo. La IA solo documentó y aplicó lo que el equipo ya había definido. Ver también [`USO_IA.md`](../USO_IA.md).
