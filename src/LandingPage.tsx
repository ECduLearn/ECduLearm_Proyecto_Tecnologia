import { useState } from "react";

export interface LandingPageProps {
  onEnterApp: () => void;
  onStudentEnter?: (pin?: string) => void;
  onNavigate?: (view: string) => void;
}

export function LandingPage({ onEnterApp, onStudentEnter, onNavigate }: LandingPageProps) {
  // Estado del modal de Política de Privacidad
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-sand-50 font-sans text-sand-900 selection:bg-hint-200 selection:text-sand-950">
      {/* 1. Header / Navbar Público con estética Náutica-Paper adaptada */}
      <header className="sticky top-0 z-40 border-b border-sand-200 bg-sand-50/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-ink-950 text-white shadow-sm">
              <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
                <path d="m9 9 3 3 5-5" />
              </svg>
            </span>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-tight text-sand-950">
                EC<span className="text-hint-600">du</span>Learm
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-sand-500">
                EdTech B2B · Ecuador
              </span>
            </div>
          </div>

          <nav className="hidden items-center gap-7 md:flex" aria-label="Navegación principal">
            <a href="#problema" className="text-sm font-semibold text-sand-600 transition hover:text-ink-950">
              El Problema
            </a>
            <a href="#solucion" className="text-sm font-semibold text-sand-600 transition hover:text-ink-950">
              Solución
            </a>
            <a href="#como-funciona" className="text-sm font-semibold text-sand-600 transition hover:text-ink-950">
              Cómo Funciona
            </a>
            <a href="#impacto-b2b" className="text-sm font-semibold text-sand-600 transition hover:text-ink-950">
              Alternativas
            </a>
            <a href="#privacidad" className="text-sm font-semibold text-sand-600 transition hover:text-ink-950">
              Privacidad & Ética
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onEnterApp}
              className="btn-pop-ink flex min-h-[44px] items-center gap-2 rounded-full bg-ink-950 px-6 text-sm font-bold text-white focus:outline-none focus:ring-4 focus:ring-ink-200"
            >
              <span>Ingresar a la Plataforma</span>
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section: Lienzo Crema, Tipografía Contundente y Botones con Pop-Shadow */}
      <main>
        <section className="relative overflow-hidden border-b border-sand-200 bg-sand-50 py-16 sm:py-24 lg:py-28">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
            <div className="max-w-2xl">
              {/* Trust Badge Pill (Píldora con avatar dot) */}
              <div className="inline-flex items-center gap-2.5 rounded-full border border-sand-300 bg-white px-4 py-2 text-xs font-bold text-ink-900 shadow-sm">
                <span className="size-2 rounded-full bg-ink-600 animate-pulse" />
                <span>Estándares PISA y Metodología ERCA · Bachillerato Ecuador</span>
              </div>

              <h1 className="mt-7 text-4xl font-extrabold leading-[1.12] tracking-tight text-sand-950 sm:text-5xl lg:text-6xl">
                Aprender es resolver, probar y{" "}
                <span className="text-ink-800">volver a pensar.</span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-relaxed text-sand-700 sm:text-lg">
                <strong>ECduLearm</strong> automatiza la creación de problemas contextualizados tipo PISA para docentes de bachillerato y acompaña a cada estudiante con un <strong>Tutor Socrático de IA</strong> que brinda pistas graduales sin regalar la respuesta final.
              </p>

              {/* Botones de Acción con Pill Radius y Pop Shadow */}
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={onEnterApp}
                  className="btn-pop-ink flex min-h-[48px] items-center gap-2.5 rounded-full bg-ink-950 px-7 text-base font-bold text-white focus:outline-none focus:ring-4 focus:ring-ink-200"
                >
                  <span>Ingresar a la Plataforma Web</span>
                  <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => (onStudentEnter ? onStudentEnter("PISA26") : onEnterApp())}
                  className="flex min-h-[48px] items-center gap-2 rounded-full border-2 border-sand-300 bg-white px-6 text-sm font-bold text-sand-800 transition hover:border-ink-800 hover:bg-sand-100 focus:outline-none focus:ring-4 focus:ring-ink-100"
                >
                  <span>Acceso Estudiante (PIN: PISA26)</span>
                </button>
              </div>

              {/* Métricas destacadas en el Hero */}
              <div className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-sand-300 pt-6">
                <div>
                  <span className="block text-3xl font-extrabold tracking-tight text-sand-950">&lt; 10s</span>
                  <span className="mt-1 block text-xs font-medium text-sand-600">Generación de guías</span>
                </div>
                <div>
                  <span className="block text-3xl font-extrabold tracking-tight text-hint-700">100%</span>
                  <span className="mt-1 block text-xs font-medium text-sand-600">Tutoría Anti-Copia</span>
                </div>
                <div>
                  <span className="block text-3xl font-extrabold tracking-tight text-ink-800">0 PII</span>
                  <span className="mt-1 block text-xs font-medium text-sand-600">Cero datos de menores</span>
                </div>
              </div>
            </div>

            {/* Ilustración / Tarjeta Preview estilo Cuaderno de Campo */}
            <div className="relative mx-auto w-full max-w-lg">
              {/* Halos suaves en tonos de la paleta institucional */}
              <div className="absolute -left-5 top-10 size-32 rounded-full bg-hint-200/50 blur-xl" />
              <div className="absolute -bottom-8 right-2 size-40 rounded-full bg-ink-200/50 blur-xl" />

              <div className="relative rotate-1 rounded-3xl border border-sand-300 bg-white p-6 card-pop sm:p-8">
                <div className="flex items-center justify-between border-b border-sand-200 pb-4">
                  <div>
                    <span className="inline-block rounded-full bg-ink-100 px-2.5 py-0.5 text-[11px] font-bold text-ink-900">
                      Reto Contextualizado Semanal
                    </span>
                    <h3 className="mt-1 text-lg font-bold text-sand-950">Estabilidad en el Puente del Chiche</h3>
                  </div>
                  <span className="grid size-10 place-items-center rounded-2xl bg-hint-100 text-hint-800">
                    <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 19h18M5 19V9l7-5 7 5v10M8 19v-6h8v6M5 10h14" />
                    </svg>
                  </span>
                </div>

                <div className="mt-5 rounded-2xl bg-sand-50 p-4 border border-sand-200/70">
                  <p className="text-xs leading-relaxed text-sand-700">
                    «Una cercha triangular isósceles tiene base de 12m y un ángulo de inclinación de 35°. Por normativa sísmica, ¿cuál es la altura del vértice y los metros lineales de acero requeridos?»
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-2.5 text-center">
                    <div className="rounded-xl border border-sand-200 bg-white p-2.5">
                      <span className="block text-[11px] font-bold text-sand-500 uppercase">Base / 2</span>
                      <span className="text-lg font-extrabold text-ink-900">6.00 m</span>
                    </div>
                    <div className="rounded-xl border border-sand-200 bg-white p-2.5">
                      <span className="block text-[11px] font-bold text-sand-500 uppercase">Altura h</span>
                      <span className="text-lg font-extrabold text-hint-700">4.20 m</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-start gap-3 rounded-2xl border-l-4 border-hint-500 bg-hint-50/70 p-3.5 text-xs text-hint-950">
                  <span className="font-bold text-hint-800">💡 Pista Socrática:</span>
                  <p className="leading-relaxed">
                    Al dividir el triángulo isósceles por su eje vertical, ¿qué razón trigonométrica relaciona el cateto adyacente (6m) con la altura?
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-sand-200 pt-3.5 text-[11px] text-sand-500">
                  <span>Matemática · 2do BGU</span>
                  <span className="font-bold text-ink-800">Fase ERCA: Aplicación</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Stat Headline Band (Banda contundente según el patrón de DESIGN.md) */}
        <section className="border-b border-sand-200 bg-sand-100 py-16 text-center">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <span className="text-xs font-bold uppercase tracking-widest text-ink-800">
              Evidencia de Campo · Diagnóstico Oficial
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-sand-950 sm:text-5xl">
              <span className="text-hint-700">80% de estudiantes</span> en Ecuador están bajo el Nivel 2 en PISA
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-sand-700">
              Solo el 17,4% alcanza el desempeño matemático básico. ECduLearm transforma la copia pasiva en destreza reflexiva dentro del aula escolar.
            </p>
          </div>
        </section>

        {/* 4. Sección: El Problema Validado en Campo */}
        <section id="problema" className="py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <span className="text-xs font-bold uppercase tracking-widest text-ink-800">
                Diagnóstico en Colegios de Quito
              </span>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-sand-950 sm:text-4xl">
                El bloqueo del alumno es real, y también el agotamiento docente
              </h2>
              <p className="mt-4 text-base text-sand-700 leading-relaxed">
                Nuestras entrevistas y encuestas con docentes de matemáticas de bachillerato en colegios públicos y particulares revelaron tres cuellos de botella estructurales:
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {/* Tarjeta 1 */}
              <div className="rounded-3xl border border-sand-200 bg-white p-8 card-pop transition hover:border-hint-400">
                <div className="grid size-12 place-items-center rounded-2xl bg-hint-100 text-hint-800 mb-6">
                  <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <span className="text-4xl font-black tracking-tight text-sand-950">4 a 10 h</span>
                <h3 className="mt-2 text-lg font-bold text-hint-900">Semanales perdidas por docente</h3>
                <p className="mt-3 text-sm leading-relaxed text-sand-600">
                  Los profesores dedican horas fuera de su jornada adaptando manualmente ejercicios mecánicos a situaciones cotidianas tipo PISA y redactando solucionarios paso a paso.
                </p>
              </div>

              {/* Tarjeta 2 */}
              <div className="rounded-3xl border border-sand-200 bg-white p-8 card-pop transition hover:border-hint-400">
                <div className="grid size-12 place-items-center rounded-2xl bg-hint-100 text-hint-800 mb-6">
                  <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v1" />
                    <path d="M18 8h4a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-4" />
                    <circle cx="8" cy="12" r="2" />
                  </svg>
                </div>
                <span className="text-4xl font-black tracking-tight text-sand-950">+50%</span>
                <h3 className="mt-2 text-lg font-bold text-hint-900">Copia pasiva con IA genérica</h3>
                <p className="mt-3 text-sm leading-relaxed text-sand-600">
                  Ante problemas de texto largo, más de la mitad de los estudiantes recurre a chatbots comerciales para obtener la respuesta final, anulando el esfuerzo reflexivo y la destreza lógica.
                </p>
              </div>

              {/* Tarjeta 3 */}
              <div className="rounded-3xl border border-sand-200 bg-white p-8 card-pop transition hover:border-ink-400">
                <div className="grid size-12 place-items-center rounded-2xl bg-ink-100 text-ink-900 mb-6">
                  <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <span className="text-4xl font-black tracking-tight text-sand-950">35 a 40</span>
                <h3 className="mt-2 text-lg font-bold text-ink-800">Estudiantes por paralelo</h3>
                <p className="mt-3 text-sm leading-relaxed text-sand-600">
                  En aulas masivas es inviable atender individualmente las dudas de cada alumno sin atrasar la planificación anual del Ministerio de Educación.
                </p>
              </div>
            </div>

            {/* Datos estadísticos complementarios */}
            <div className="mt-10 rounded-3xl border border-sand-300 bg-white p-6 card-pop sm:p-8">
              <div className="grid grid-cols-2 gap-y-6 sm:grid-cols-4 sm:divide-x sm:divide-sand-200">
                <div className="sm:px-6 sm:first:pl-0">
                  <span className="block text-3xl font-black text-ink-900">17,4%</span>
                  <span className="mt-1 block text-xs leading-relaxed text-sand-600">Desempeño básico PISA en Ecuador</span>
                </div>
                <div className="sm:px-6">
                  <span className="block text-3xl font-black text-ink-900">22 de 28</span>
                  <span className="mt-1 block text-xs leading-relaxed text-sand-600">Docentes encuestados adaptan material</span>
                </div>
                <div className="sm:px-6">
                  <span className="block text-3xl font-black text-hint-700">0 PII</span>
                  <span className="mt-1 block text-xs leading-relaxed text-sand-600">Cero recolección de datos de menores</span>
                </div>
                <div className="sm:px-6 sm:last:pr-0">
                  <span className="block text-3xl font-black text-ink-900">4 Fases</span>
                  <span className="mt-1 block text-xs leading-relaxed text-sand-600">Estructura oficial ERCA ministerial</span>
                </div>
              </div>
              <p className="mt-6 border-t border-sand-200 pt-4 text-center text-[11px] text-sand-500">
                Fuentes: Informes oficiales PISA, 28 encuestas directas a docentes de bachillerato y 12 entrevistas de profundidad del equipo Scrum.
              </p>
            </div>
          </div>
        </section>

        {/* 5. Sección: Ecosistema Dual de ECduLearm (Alto contraste: Dark Navy Anchor en Tarjeta Docente) */}
        <section id="solucion" className="border-t border-sand-200 bg-sand-100 py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <span className="text-xs font-bold uppercase tracking-widest text-ink-800">
                Ecosistema B2B Integrado
              </span>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-sand-950 sm:text-4xl">
                Una herramienta para el docente, un entrenador para el estudiante
              </h2>
              <p className="mt-4 text-base text-sand-700">
                Conectamos la planificación curricular ministerial con el aprendizaje reflexivo autónomo en un solo flujo.
              </p>
            </div>

            <div className="mt-14 grid gap-8 lg:grid-cols-3">
              {/* Tarjeta 1: Docente (Bloque Oscuro Deep Ink Anchor según DESIGN.md) */}
              <div className="flex flex-col justify-between rounded-3xl bg-ink-950 p-8 text-white card-pop shadow-xl">
                <div>
                  <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-ink-800 text-white mb-6">
                    <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
                    </svg>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-hint-400">El Orquestador Curricular</span>
                  <h3 className="mt-1 text-2xl font-bold text-white">Para el Docente</h3>
                  <ul className="mt-6 space-y-3.5 text-sm text-sand-200 leading-relaxed">
                    <li className="flex items-start gap-2.5">
                      <span className="text-hint-400 font-bold">✓</span>
                      <span><strong>Chatbot Curricular PISA:</strong> Genera ejercicios contextualizados (Metro de Quito, Galápagos, finanzas) en 10 segundos.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-hint-400 font-bold">✓</span>
                      <span><strong>Chips de Ajuste Rápido:</strong> Adapta dificultad (*más fácil*, *más difícil*, *cambiar contexto*) sin editar a mano.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-hint-400 font-bold">✓</span>
                      <span><strong>Plantilla Oficial ERCA:</strong> Inyecta el problema en la fase de Aplicación lista para imprimir o exportar.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-hint-400 font-bold">✓</span>
                      <span><strong>Generación de PIN:</strong> Crea aulas virtuales en 1 clic para compartir con los 40 alumnos.</span>
                    </li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => (onNavigate ? onNavigate("dashboard") : onEnterApp())}
                  className="btn-pop-hint mt-8 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-hint-500 px-5 text-sm font-bold text-white transition focus:outline-none focus:ring-4 focus:ring-hint-300"
                >
                  Abrir Entorno Docente en la App
                </button>
              </div>

              {/* Tarjeta 2: Estudiante (Snow Card) */}
              <div className="flex flex-col justify-between rounded-3xl border-2 border-sand-300 bg-white p-8 text-sand-950 card-pop">
                <div>
                  <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-hint-100 text-hint-800 mb-6">
                    <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                      <path d="M6 12v5c3 3 9 3 12 0v-5" />
                    </svg>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-hint-700">El Ejecutor Autónomo</span>
                  <h3 className="mt-1 text-2xl font-bold text-sand-950">Para el Estudiante</h3>
                  <ul className="mt-6 space-y-3.5 text-sm text-sand-700 leading-relaxed">
                    <li className="flex items-start gap-2.5">
                      <span className="text-ink-800 font-bold">✓</span>
                      <span><strong>Tutor Socrático Anti-Copia:</strong> Prohibición estricta de entregar respuestas directas; ofrece pistas y preguntas guía.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-ink-800 font-bold">✓</span>
                      <span><strong>Acceso por PIN Fricción Cero:</strong> Entrada instantánea sin cuentas, correos ni datos personales.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-ink-800 font-bold">✓</span>
                      <span><strong>Simulador de Admisión:</strong> Práctica cronometrada con retroalimentación socrática en cada fallo.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-ink-800 font-bold">✓</span>
                      <span><strong>Mobile-First Accesible:</strong> Optimizado para teléfonos inteligentes con botones táctiles ≥ 44px.</span>
                    </li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => (onStudentEnter ? onStudentEnter("PISA26") : onEnterApp())}
                  className="btn-pop-ink mt-8 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-ink-950 px-5 text-sm font-bold text-white transition focus:outline-none focus:ring-4 focus:ring-ink-200"
                >
                  Abrir Zona de Estudiantes
                </button>
              </div>

              {/* Tarjeta 3: Colegio / B2B (Snow Card) */}
              <div className="flex flex-col justify-between rounded-3xl border-2 border-sand-300 bg-white p-8 text-sand-950 card-pop">
                <div>
                  <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-sand-200 text-ink-900 mb-6">
                    <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-ink-800">El Decisor B2B</span>
                  <h3 className="mt-1 text-2xl font-bold text-sand-950">Para el Colegio</h3>
                  <ul className="mt-6 space-y-3.5 text-sm text-sand-700 leading-relaxed">
                    <li className="flex items-start gap-2.5">
                      <span className="text-ink-800 font-bold">✓</span>
                      <span><strong>Licenciamiento B2B Anual:</strong> Suscripción institucional asequible por paralelo o plantel completo.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-ink-800 font-bold">✓</span>
                      <span><strong>Panel de Métricas Agregadas:</strong> Reportes de dónde se bloquean los alumnos sin violar su privacidad.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-ink-800 font-bold">✓</span>
                      <span><strong>Retención de Matrículas:</strong> Incremento en tasas de aprobación y preparación universitaria.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-ink-800 font-bold">✓</span>
                      <span><strong>Cumplimiento Normativo:</strong> Alineado con los requerimientos curriculares del Ministerio de Educación.</span>
                    </li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={onEnterApp}
                  className="mt-8 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full border-2 border-ink-800 bg-white px-5 text-sm font-bold text-ink-950 transition hover:bg-ink-50 focus:outline-none focus:ring-4 focus:ring-ink-100"
                >
                  Probar Plataforma Institucional
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Sección: Cómo Funciona en Tu Clase */}
        <section id="como-funciona" className="py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto">
              <span className="text-xs font-bold uppercase tracking-widest text-ink-800">Flujo Operativo Simple</span>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-sand-950 sm:text-4xl">
                Cómo funciona en una clase de 45 minutos
              </h2>
            </div>

            <div className="mt-14 grid gap-8 md:grid-cols-3">
              <div className="relative rounded-3xl border border-sand-200 bg-white p-8 card-pop">
                <span className="grid size-11 place-items-center rounded-full bg-ink-950 text-white font-black text-lg mb-6">
                  1
                </span>
                <h3 className="text-xl font-bold text-sand-950">El Docente Genera el Reto</h3>
                <p className="mt-3 text-sm text-sand-600 leading-relaxed">
                  Indica el tema (ej. <em>trigonometría</em>), nivel (<em>2do BGU</em>) y contexto (<em>Puente del Chiche</em>). La IA estructura la guía PISA con rúbrica ministerial en 10 segundos.
                </p>
              </div>

              <div className="relative rounded-3xl border border-sand-200 bg-white p-8 card-pop">
                <span className="grid size-11 place-items-center rounded-full bg-ink-950 text-white font-black text-lg mb-6">
                  2
                </span>
                <h3 className="text-xl font-bold text-sand-950">Proyecta el Código PIN</h3>
                <p className="mt-3 text-sm text-sand-600 leading-relaxed">
                  El profesor publica el aula y proyecta el PIN (ej. <strong>PISA26</strong>). Los 40 estudiantes abren el enlace desde su celular sin registros ni descargas.
                </p>
              </div>

              <div className="relative rounded-3xl border border-sand-200 bg-white p-8 card-pop">
                <span className="grid size-11 place-items-center rounded-full bg-ink-950 text-white font-black text-lg mb-6">
                  3
                </span>
                <h3 className="text-xl font-bold text-sand-950">Tutoría y Nivelación Real</h3>
                <p className="mt-3 text-sm text-sand-600 leading-relaxed">
                  El Tutor Socrático destraba a los alumnos con pistas graduales sin dar la respuesta. El profesor ve en su panel los pasos críticos donde se bloquean y refuerza ese punto exacto.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 7. Sección: Comparativa B2B e Impacto */}
        <section id="impacto-b2b" className="border-t border-sand-200 bg-sand-100 py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <span className="text-xs font-bold uppercase tracking-widest text-ink-800">
                Propuesta de Valor B2B
              </span>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-sand-950 sm:text-4xl">
                Lo que usan los colegios hoy y por qué falla
              </h2>
              <p className="mt-4 text-base text-sand-700">
                Comparamos el enfoque de ECduLearm frente a las alternativas tradicionales que generan frustración docente y plagio estudiantil.
              </p>
            </div>

            <div className="mt-12 overflow-x-auto rounded-3xl border border-sand-300 bg-white card-pop">
              <table className="w-full min-w-[760px] text-left text-sm text-sand-700">
                <thead className="border-b border-sand-200 bg-sand-100/70 text-xs font-bold uppercase text-sand-600">
                  <tr>
                    <th scope="col" className="px-6 py-4">Alternativa Actual</th>
                    <th scope="col" className="px-6 py-4">Dónde se queda corta</th>
                    <th scope="col" className="px-6 py-4 text-ink-900 font-extrabold">Con ECduLearm</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-200 font-normal">
                  <tr>
                    <td className="px-6 py-5 font-bold text-sand-950">Bancos de preguntas y simuladores</td>
                    <td className="px-6 py-5 text-sand-600">Ejercicios repetitivos, descontextualizados y sin retroalimentación paso a paso.</td>
                    <td className="bg-ink-50/70 px-6 py-5 font-semibold text-ink-950">Problemas nuevos contextualizados en Ecuador y tutor socrático en vivo.</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-5 font-bold text-sand-950">Búsquedas en Google y YouTube</td>
                    <td className="px-6 py-5 text-sand-600">El docente pierde horas filtrando y adaptando manualmente enunciados.</td>
                    <td className="bg-ink-50/70 px-6 py-5 font-semibold text-ink-950">Generación y adaptación en 10 segundos en formato ministerial ERCA.</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-5 font-bold text-sand-950">IA Genérica (ChatGPT / Gemini libre)</td>
                    <td className="px-6 py-5 text-sand-600">El estudiante copia la respuesta final sin razonar ni aprender el procedimiento.</td>
                    <td className="bg-ink-50/70 px-6 py-5 font-semibold text-ink-950">Guardrail Anti-Copia estricto: prohibido dar la respuesta final servida.</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-5 font-bold text-sand-950">Preuniversitarios Privados</td>
                    <td className="px-6 py-5 text-sand-600">Costos elevados ($300 a $800) inaccesibles para la mayoría de familias.</td>
                    <td className="bg-ink-50/70 px-6 py-5 font-semibold text-ink-950">Entrenamiento democratizado dentro de la propia institución escolar.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* 8. Sección: Política de Privacidad, Ética y Licencia */}
        <section id="privacidad" className="py-20 sm:py-24 border-t border-sand-200">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <span className="text-xs font-bold uppercase tracking-widest text-ink-800">
                Compromiso Ético · Control 1 Sprint 0
              </span>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-sand-950 sm:text-4xl">
                Privacidad desde el Diseño y Uso Ético de Inteligencia Artificial
              </h2>
              <p className="mt-4 text-base text-sand-700 leading-relaxed">
                Cumplimos rigurosamente con la <strong>Ley Orgánica de Protección de Datos Personales (LOPDP) de Ecuador</strong> y las directrices internacionales de la UNESCO sobre IA en educación.
              </p>
            </div>

            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-3xl border border-sand-200 bg-white p-7 card-pop">
                <span className="text-2xl mb-3 block">🛡️</span>
                <h3 className="text-base font-bold text-sand-950">Protección a Menores</h3>
                <p className="mt-2 text-xs text-sand-600 leading-relaxed">
                  Cero recolección de PII. Los estudiantes acceden únicamente con un PIN temporal de 6 caracteres. No pedimos nombres, correos ni teléfonos.
                </p>
              </div>

              <div className="rounded-3xl border border-sand-200 bg-white p-7 card-pop">
                <span className="text-2xl mb-3 block">🏫</span>
                <h3 className="text-base font-bold text-sand-950">Cuentas Institucionales</h3>
                <p className="mt-2 text-xs text-sand-600 leading-relaxed">
                  Solo los docentes autorizados por la unidad educativa acceden con su correo institucional verificado (`@colegio.edu.ec`).
                </p>
              </div>

              <div className="rounded-3xl border border-sand-200 bg-white p-7 card-pop">
                <span className="text-2xl mb-3 block">🤖</span>
                <h3 className="text-base font-bold text-sand-950">Transparencia Algorítmica</h3>
                <p className="mt-2 text-xs text-sand-600 leading-relaxed">
                  El modelo opera bajo contratos de prompts socráticos que impiden sesgos, alucinaciones y entrega de soluciones automáticas.
                </p>
              </div>

              <div className="rounded-3xl border border-sand-200 bg-white p-7 card-pop">
                <span className="text-2xl mb-3 block">⚖️</span>
                <h3 className="text-base font-bold text-sand-950">Licencia Abierta MIT</h3>
                <p className="mt-2 text-xs text-sand-600 leading-relaxed">
                  Software transparente auditado y registrado bajo licencia permisiva MIT (Copyright © 2026 Equipo ECduLearm - PUCE).
                </p>
              </div>
            </div>

            <div className="mt-10 flex justify-center">
              <button
                type="button"
                onClick={() => setPrivacyModalOpen(true)}
                className="flex min-h-[44px] items-center gap-2 rounded-full border border-ink-300 bg-ink-50 px-6 text-xs font-bold text-ink-900 transition hover:bg-ink-100"
              >
                <span>📜 Ver Declaración Completa de Privacidad y Ética</span>
              </button>
            </div>
          </div>
        </section>

        {/* 9. Banner CTA Final (Deep Ink Anchor) */}
        <section className="border-t border-ink-950 bg-ink-950 py-16 text-center text-white">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl tracking-tight">
              ¿Listo para ver ECduLearm en acción en tu colegio?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-sand-200">
              Prueba la plataforma web directamente desde el navegador de tu computadora o celular.
            </p>
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={onEnterApp}
                className="btn-pop-hint flex min-h-[48px] items-center gap-2 rounded-full bg-hint-500 px-8 font-bold text-white transition focus:outline-none focus:ring-4 focus:ring-hint-300"
              >
                <span>Ingresar a la Plataforma Web</span>
                <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* 10. Footer */}
      <footer className="border-t border-sand-300 bg-sand-100 py-12 text-xs text-sand-600">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sand-950">ECduLearm</span>
              <span>·</span>
              <span>Proyecto de Emprendimiento Tecnológico</span>
              <span>·</span>
              <span className="text-ink-800 font-semibold">Pontificia Universidad Católica del Ecuador (PUCE)</span>
            </div>

            <div className="flex items-center gap-5">
              <button
                type="button"
                onClick={() => setPrivacyModalOpen(true)}
                className="hover:text-sand-950 font-medium underline"
              >
                Política de Privacidad
              </button>
              <a
                href="https://github.com/eisefaaabri/ECduLearm_Proyecto_Tecnologia"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 font-medium text-sand-700 hover:text-sand-950"
              >
                <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                </svg>
                <span>GitHub Repo</span>
              </a>
            </div>
          </div>

          <div className="mt-6 border-t border-sand-300 pt-6 text-center text-[11px] text-sand-500">
            <p>
              Equipo Scrum: <strong>Ariel Fabricio Chacha Pilco</strong> (Tech Lead & Scrum Master) ·{" "}
              <strong>Michael (Melissa Dayana) Molina Sierra</strong> (Product Owner & UX/UI) ·{" "}
              <strong>Joan Sebastian Santacruz Villamarin</strong> (Frontend Developer & QA).
            </p>
            <p className="mt-1">
              Licencia MIT · Ingeniería de Sistemas de Información (PUCE) · Control 1 (Sprint 0 - RDA 2) · Ecuador, 2026.
            </p>
          </div>
        </div>
      </footer>

      {/* MODAL: Política de Privacidad y Ética Integral */}
      {privacyModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-sand-950/60 p-4 backdrop-blur-md">
          <div
            className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl border border-sand-300 bg-white p-6 text-sand-950 shadow-2xl sm:p-8"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start justify-between border-b border-sand-200 pb-4">
              <div>
                <h3 className="text-lg font-bold text-ink-950 flex items-center gap-2">
                  <span>📜 Política de Privacidad y Marco Ético de IA</span>
                </h3>
                <p className="mt-1 text-xs text-sand-500">
                  Cumplimiento con LOPDP Ecuador y Estándares WCAG 2.2 / UNESCO
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPrivacyModalOpen(false)}
                className="grid size-9 place-items-center rounded-full text-sand-500 hover:bg-sand-100 hover:text-sand-950 text-base"
                aria-label="Cerrar modal"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 space-y-4 text-xs leading-relaxed text-sand-700">
              <section>
                <h4 className="font-bold text-sand-950 text-sm">1. Principio de Privacidad desde el Diseño (Menores de Edad)</h4>
                <p className="mt-1">
                  En concordancia con el Código de la Niñez y Adolescencia y la Ley Orgánica de Protección de Datos Personales (LOPDP) de Ecuador, <strong>ECduLearm no solicita, almacena ni procesa información personal identificable (PII) de los estudiantes</strong>. El acceso a las actividades y al tutor socrático se efectúa exclusivamente mediante un código PIN efímero de 6 caracteres (ej. <code>PISA26</code>).
                </p>
              </section>

              <section>
                <h4 className="font-bold text-sand-950 text-sm">2. Gestión de Cuentas Docentes e Institucionales</h4>
                <p className="mt-1">
                  Las credenciales del personal docente se limitan al correo institucional provisto por el colegio y contraseñas cifradas en tránsito (HTTPS/TLS) y en reposo (hashing con salt). La información de los paralelos no incluye listas nominales de alumnos, sino métricas agregadas del grupo (tasa de resolución, pasos con mayor número de pistas solicitadas).
                </p>
              </section>

              <section>
                <h4 className="font-bold text-sand-950 text-sm">3. Candado Pedagógico Anti-Copia (Guardrails de IA)</h4>
                <p className="mt-1">
                  El Tutor Socrático opera bajo una arquitectura de prompts estricta que prohíbe entregar respuestas numéricas o ecuaciones resueltas. El agente actúa como andamiaje cognitivo formulando preguntas orientadas a la identificación de variables y el razonamiento autónomo.
                </p>
              </section>

              <section>
                <h4 className="font-bold text-sand-950 text-sm">4. Licencia y Transparencia del Código</h4>
                <p className="mt-1">
                  ECduLearm se distribuye bajo los términos de la <strong>MIT License</strong>, garantizando la auditoría de seguridad, trazabilidad de código y transparencia algorítmica para las instituciones educativas licenciadas.
                </p>
              </section>
            </div>

            <div className="mt-6 border-t border-sand-200 pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setPrivacyModalOpen(false)}
                className="btn-pop-ink rounded-full bg-ink-950 px-6 py-2.5 text-xs font-bold text-white focus:outline-none focus:ring-4 focus:ring-ink-200"
              >
                Entendido y de acuerdo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
