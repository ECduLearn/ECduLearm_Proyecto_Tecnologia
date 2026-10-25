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
      {/* 1. Header / Navbar Público */}
      <header className="sticky top-0 z-40 border-b border-sand-200 bg-sand-50/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-ink-800 text-white shadow-sm">
              <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
                <path d="m9 9 3 3 5-5" />
              </svg>
            </span>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-tight text-sand-900">
                EC<span className="text-hint-600">du</span>Learm
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-sand-500">
                Aprendizaje con sentido · Ecuador
              </span>
            </div>
          </div>

          <nav className="hidden items-center gap-6 md:flex" aria-label="Navegación principal">
            <a href="#problema" className="text-sm font-medium text-sand-600 transition hover:text-sand-950">
              El Problema
            </a>
            <a href="#solucion" className="text-sm font-medium text-sand-600 transition hover:text-sand-950">
              Solución
            </a>
            <a href="#como-funciona" className="text-sm font-medium text-sand-600 transition hover:text-sand-950">
              Cómo Funciona
            </a>
            <a href="#impacto-b2b" className="text-sm font-medium text-sand-600 transition hover:text-sand-950">
              Alternativas
            </a>
            <a href="#privacidad" className="text-sm font-medium text-sand-600 transition hover:text-sand-950">
              Privacidad & Ética
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onEnterApp}
              className="flex min-h-[44px] items-center gap-2 rounded-lg bg-ink-800 px-5 text-sm font-bold text-white transition hover:bg-ink-900 focus:outline-none focus:ring-4 focus:ring-ink-200"
            >
              <span>Ingresar a la Plataforma</span>
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <main>
        <section className="border-b border-sand-200 bg-sand-50 py-14 sm:py-20 lg:py-24">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-ink-900">
                <span className="inline-block size-2 rounded-full bg-ink-700" />
                Estándares PISA y metodología ERCA
              </div>
              <h1 className="mt-7 text-4xl font-semibold leading-tight tracking-tight text-sand-950 sm:text-5xl lg:text-6xl">
                Aprender es resolver, probar y{" "}
                <span className="text-ink-800">volver a pensar.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-8 text-sand-600 sm:text-lg">
                ECduLearm ayuda a docentes a crear retos contextualizados y acompaña a cada estudiante con pistas que
                construyen razonamiento, no respuestas copiadas.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={onEnterApp}
                  className="flex min-h-12 items-center gap-2 rounded-lg bg-ink-800 px-5 font-bold text-white transition hover:bg-ink-900 focus:outline-none focus:ring-4 focus:ring-ink-200"
                >
                  Soy docente
                  <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => (onStudentEnter ? onStudentEnter() : onEnterApp())}
                  className="flex min-h-12 items-center gap-2 rounded-lg border border-sand-300 bg-white px-5 font-bold text-sand-800 transition hover:border-ink-700 hover:bg-ink-50 focus:outline-none focus:ring-4 focus:ring-ink-100"
                >
                  Tengo un PIN
                </button>
              </div>
              <div className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-sand-300 pt-5">
                <div>
                  <span className="block text-2xl font-semibold text-sand-950">&lt; 10s</span>
                  <span className="mt-1 block text-xs leading-relaxed text-sand-600">Para generar una guía</span>
                </div>
                <div>
                  <span className="block text-2xl font-semibold text-sand-950">Pistas</span>
                  <span className="mt-1 block text-xs leading-relaxed text-sand-600">En vez de respuestas</span>
                </div>
                <div>
                  <span className="block text-2xl font-semibold text-sand-950">Sin perfil</span>
                  <span className="mt-1 block text-xs leading-relaxed text-sand-600">Acceso estudiantil</span>
                </div>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-xl">
              <div className="absolute -left-4 top-8 size-24 rounded-full bg-hint-200/70 sm:-left-8 sm:size-32" />
              <div className="absolute -bottom-5 right-3 size-28 rounded-full bg-ink-200/70 sm:size-40" />
              <div className="relative rotate-1 border border-sand-200 bg-white p-5 shadow-xl shadow-sand-900/10 sm:p-8">
                <div className="flex items-center justify-between border-b border-sand-200 pb-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-ink-800">Reto de la semana</p>
                    <p className="mt-1 text-lg font-semibold text-sand-900">Un puente para la comunidad</p>
                  </div>
                  <span className="grid size-10 place-items-center rounded-full bg-hint-100 text-hint-800" aria-hidden="true">
                    <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M3 19h18M5 19V9l7-5 7 5v10M8 19v-6h8v6M5 10h14" />
                    </svg>
                  </span>
                </div>
                <div className="mt-6 rounded-sm bg-sand-50 p-5">
                  <p className="text-sm leading-7 text-sand-700">
                    El municipio compara dos diseños de una estructura. ¿Cuál distribuye mejor el material disponible?
                  </p>
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="border border-sand-200 bg-white p-3">
                      <span className="text-xs font-bold uppercase tracking-wide text-sand-500">Diseño A</span>
                      <span className="mt-1 block text-2xl font-semibold text-sand-900">12 × 28</span>
                      <span className="text-xs text-sand-500">módulos · kg</span>
                    </div>
                    <div className="border border-sand-200 bg-white p-3">
                      <span className="text-xs font-bold uppercase tracking-wide text-sand-500">Diseño B</span>
                      <span className="mt-1 block text-2xl font-semibold text-sand-900">10 × 34</span>
                      <span className="text-xs text-sand-500">módulos · kg</span>
                    </div>
                  </div>
                </div>
                <div className="mt-5 flex items-start gap-3 border-l-2 border-hint-500 pl-4">
                  <span className="mt-0.5 text-sm font-bold text-hint-800">Pista</span>
                  <p className="text-sm leading-relaxed text-sand-600">
                    Antes de elegir, ¿qué cantidad total de material utiliza cada propuesta?
                  </p>
                </div>
                <div className="mt-6 flex items-center justify-between border-t border-sand-200 pt-4 text-xs text-sand-500">
                  <span>Matemática · 2do BGU</span>
                  <span className="font-semibold text-ink-800">ERCA · Aplicación</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Sección: El Problema Validado en Campo */}
        <section id="problema" className="border-t border-sand-200 bg-sand-100 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <span className="text-xs font-bold uppercase tracking-widest text-ink-800">
                Diagnóstico de Campo en Ecuador
              </span>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-sand-950 sm:text-4xl">
                El bloqueo del alumno es real, y también el agotamiento docente
              </h2>
              <p className="mt-4 text-base text-sand-600 leading-relaxed">
                Nuestras entrevistas y encuestas con docentes de matemáticas de bachillerato en colegios públicos y particulares de Quito revelaron tres cuellos de botella estructurales:
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {/* Tarjeta 1 */}
              <div className="rounded-xl border border-sand-200 bg-white p-7 shadow-sm transition hover:border-hint-300">
                <div className="grid size-12 place-items-center rounded-xl bg-hint-100 text-hint-800 mb-5">
                  <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <span className="text-4xl font-semibold tracking-tight text-sand-950">4 a 10 h</span>
                <h3 className="mt-2 text-lg font-bold text-hint-900">Semanales perdidas por docente</h3>
                <p className="mt-3 text-sm leading-relaxed text-sand-600">
                  Los profesores dedican horas fuera de su jornada laboral adaptando manualmente ejercicios mecánicos a situaciones cotidianas tipo PISA y redactando solucionarios paso a paso.
                </p>
              </div>

              {/* Tarjeta 2 */}
              <div className="rounded-xl border border-sand-200 bg-white p-7 shadow-sm transition hover:border-hint-300">
                <div className="grid size-12 place-items-center rounded-xl bg-hint-100 text-hint-800 mb-5">
                  <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v1" />
                    <path d="M18 8h4a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-4" />
                    <circle cx="8" cy="12" r="2" />
                  </svg>
                </div>
                <span className="text-4xl font-semibold tracking-tight text-sand-950">+50%</span>
                <h3 className="mt-2 text-lg font-bold text-hint-900">Copia pasiva con IA genérica</h3>
                <p className="mt-3 text-sm leading-relaxed text-sand-600">
                  Ante problemas de texto largo, más de la mitad de los estudiantes recurre a chatbots comerciales para obtener la respuesta final, anulando el esfuerzo reflexivo y la destreza lógica.
                </p>
              </div>

              {/* Tarjeta 3 */}
              <div className="rounded-xl border border-sand-200 bg-white p-7 shadow-sm transition hover:border-ink-300">
                <div className="grid size-12 place-items-center rounded-xl bg-ink-100 text-ink-900 mb-5">
                  <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <span className="text-4xl font-semibold tracking-tight text-sand-950">35 a 40</span>
                <h3 className="mt-2 text-lg font-bold text-ink-800">Estudiantes por paralelo</h3>
                <p className="mt-3 text-sm leading-relaxed text-sand-600">
                  En aulas masivas es matemáticamente inviable que un solo docente atienda individualmente las dudas de cada alumno sin atrasar la planificación anual del Ministerio de Educación.
                </p>
              </div>
            </div>

            {/* Datos estadísticos complementarios */}
            <div className="mt-8 border-y border-sand-300 bg-white/70 px-5 py-6 sm:px-8">
              <div className="grid grid-cols-2 gap-y-6 sm:grid-cols-4 sm:divide-x sm:divide-sand-300">
                <div className="sm:px-5 sm:first:pl-0">
                  <span className="block text-3xl font-semibold text-ink-900">17,4%</span>
                  <span className="mt-1 block text-xs leading-relaxed text-sand-600">Estudiantes en Ecuador alcanzan el desempeño básico PISA</span>
                </div>
                <div className="sm:px-5">
                  <span className="block text-3xl font-semibold text-ink-900">22 de 28</span>
                  <span className="mt-1 block text-xs leading-relaxed text-sand-600">Docentes encuestados adaptan problemas</span>
                </div>
                <div className="sm:px-5">
                  <span className="block text-3xl font-semibold text-hint-900">0 PII</span>
                  <span className="mt-1 block text-xs leading-relaxed text-sand-600">Cero datos de menores recolectados</span>
                </div>
                <div className="sm:px-5 sm:last:pr-0">
                  <span className="block text-3xl font-semibold text-ink-900">4 Fases</span>
                  <span className="mt-1 block text-xs leading-relaxed text-sand-600">Formato oficial ERCA integrado</span>
                </div>
              </div>
              <p className="mt-5 border-t border-sand-200 pt-4 text-center text-[11px] text-sand-500">
                Fuentes: Informes oficiales PISA, 28 encuestas directas a docentes de matemáticas de bachillerato y 12 entrevistas de profundidad del equipo Scrum.
              </p>
            </div>
          </div>
        </section>

        {/* 4. Sección: Ecosistema Dual de ECduLearm */}
        <section id="solucion" className="py-20 border-t border-sand-200">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <span className="text-xs font-bold uppercase tracking-widest text-ink-800">
                Arquitectura de Solución
              </span>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-sand-950 sm:text-4xl">
                Una herramienta para el docente, un entrenador para el estudiante
              </h2>
              <p className="mt-4 text-sm text-sand-600 sm:text-base">
                ECduLearm no es otro banco estático de preguntas. Es un sistema integral que conecta la planificación curricular con el aprendizaje reflexivo autónomo.
              </p>
            </div>

            <div className="mt-14 grid gap-6 lg:grid-cols-3">
              {/* Tarjeta 1: Docente */}
              <div className="flex flex-col justify-between rounded-xl border border-t-4 border-ink-200 border-t-ink-800 bg-white p-7 shadow-sm">
                <div>
                  <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-ink-800 text-white shadow-lg shadow-ink-500/20 mb-6">
                    <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
                    </svg>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-ink-800">  El Orquestador</span>
                  <h3 className="mt-1 text-xl font-bold text-sand-950">Para el Docente</h3>
                  <ul className="mt-5 space-y-3 text-sm text-sand-600 leading-relaxed">
                    <li className="flex items-start gap-2.5">
                      <span className="text-ink-800 font-bold">✓</span>
                      <span><strong>Chatbot Curricular PISA:</strong> Genera ejercicios contextualizados (Metro de Quito, Galápagos, finanzas) en 10 segundos.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-ink-800 font-bold">✓</span>
                      <span><strong>Chips de Ajuste Rápido:</strong> Adapta dificultad (*más fácil*, *más difícil*, *cambiar a arquitectura*) sin editar a mano.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-ink-800 font-bold">✓</span>
                      <span><strong>Plantilla Oficial ERCA:</strong> Inyecta el problema en la fase de Aplicación de clase lista para imprimir.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-ink-800 font-bold">✓</span>
                      <span><strong>Generación de PIN:</strong> Crea aulas virtuales en 1 clic para compartir con los 40 alumnos.</span>
                    </li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => (onNavigate ? onNavigate("dashboard") : onEnterApp())}
                  className="mt-8 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-ink-800 px-4 text-xs font-bold text-white transition hover:bg-ink-900"
                >
                  Abrir Entorno Docente en la App
                </button>
              </div>

              {/* Tarjeta 2: Estudiante */}
              <div className="flex flex-col justify-between rounded-xl border border-t-4 border-ink-200 border-t-ink-600 bg-white p-7 shadow-sm">
                <div>
                  <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-ink-800 text-white shadow-lg shadow-ink-500/20 mb-6">
                    <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                      <path d="M6 12v5c3 3 9 3 12 0v-5" />
                    </svg>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-ink-800">  El Ejecutor Autónomo</span>
                  <h3 className="mt-1 text-xl font-bold text-sand-950">Para el Estudiante</h3>
                  <ul className="mt-5 space-y-3 text-sm text-sand-600 leading-relaxed">
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
                      <span><strong>Simulador de Admisión Universitaria:</strong> Práctica cronometrada con retroalimentación socrática en cada error.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-ink-800 font-bold">✓</span>
                      <span><strong>Mobile-First Accesible:</strong> Optimizado para teléfonos inteligentes con botones táctiles ≥ 44px.</span>
                    </li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => onStudentEnter ? onStudentEnter("PISA26") : onEnterApp()}
                  className="mt-8 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-ink-800 px-4 text-xs font-bold text-white transition hover:bg-ink-900"
                >
                  Abrir Zona de Estudiantes
                </button>
              </div>

              {/* Tarjeta 3: Colegio / B2B */}
              <div className="flex flex-col justify-between rounded-xl border border-t-4 border-hint-200 border-t-hint-700 bg-white p-7 shadow-sm">
                <div>
                  <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-hint-700 text-white shadow-lg shadow-hint-900/10 mb-6">
                    <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-hint-800">  El Decisor B2B</span>
                  <h3 className="mt-1 text-xl font-bold text-sand-950">Para el Colegio</h3>
                  <ul className="mt-5 space-y-3 text-sm text-sand-600 leading-relaxed">
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
                      <span><strong>Retención de Matrículas:</strong> Incremento en tasas de aprobación y preparación universitaria de bachilleres.</span>
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
                  className="mt-8 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-hint-300 bg-hint-50 px-4 text-xs font-bold text-hint-900 transition hover:bg-hint-100"
                >
                  Probar Plataforma Institucional
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Sección: Cómo Funciona en Tu Clase */}
        <section id="como-funciona" className="py-20 border-t border-sand-200 bg-sand-100">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto">
              <span className="text-xs font-bold uppercase tracking-widest text-ink-800">Flujo Operativo Simple</span>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-sand-950 sm:text-3xl">
                Cómo funciona en una clase de 45 minutos
              </h2>
            </div>

            <div className="relative mt-12 grid gap-10 md:grid-cols-3 md:gap-8 md:before:absolute md:before:left-[16.66%] md:before:right-[16.66%] md:before:top-5 md:before:h-px md:before:bg-ink-300 md:before:content-['']">
              <div className="relative mt-5 rounded-xl border border-sand-200 bg-white p-7 pt-8 shadow-sm">
                <span className="absolute -top-5 left-7 z-10 grid size-10 place-items-center rounded-full border-4 border-sand-100 bg-ink-800 text-white font-black text-lg">
                  1
                </span>
                <h3 className="text-lg font-bold text-sand-950">El Docente Pide el Reto</h3>
                <p className="mt-2 text-sm text-sand-600 leading-relaxed">
                  Indica el tema (ej. <em>funciones cuadráticas</em>), nivel (<em>2do BGU</em>) y contexto (<em>Metro de Quito</em>). La IA estructura la guía PISA con rúbrica ministerial en segundos.
                </p>
              </div>

              <div className="relative mt-5 rounded-xl border border-sand-200 bg-white p-7 pt-8 shadow-sm">
                <span className="absolute -top-5 left-7 z-10 grid size-10 place-items-center rounded-full border-4 border-sand-100 bg-ink-800 text-white font-black text-lg">
                  2
                </span>
                <h3 className="text-lg font-bold text-sand-950">Proyecta el Código PIN</h3>
                <p className="mt-2 text-sm text-sand-600 leading-relaxed">
                  El profesor publica el aula y proyecta el PIN (ej. <strong>PISA26</strong>). Los 40 estudiantes abren el enlace desde su celular sin registros ni descargas.
                </p>
              </div>

              <div className="relative mt-5 rounded-xl border border-sand-200 bg-white p-7 pt-8 shadow-sm">
                <span className="absolute -top-5 left-7 z-10 grid size-10 place-items-center rounded-full border-4 border-sand-100 bg-ink-800 text-white font-black text-lg">
                  3
                </span>
                <h3 className="text-lg font-bold text-sand-950">Tutoría y Nivelación Real</h3>
                <p className="mt-2 text-sm text-sand-600 leading-relaxed">
                  El Tutor Socrático destraba a los alumnos con pistas graduales sin dar la respuesta. El profesor ve en su panel los pasos críticos donde se bloquean y refuerza ese punto exacto.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Sección: Comparativa B2B e Impacto */}
        <section id="impacto-b2b" className="py-20 border-t border-sand-200">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <span className="text-xs font-bold uppercase tracking-widest text-ink-800">
                Propuesta de Valor B2B
              </span>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-sand-950 sm:text-4xl">
                Lo que usan los colegios hoy y por qué falla
              </h2>
              <p className="mt-4 text-sm text-sand-600 sm:text-base">
                Comparamos el enfoque de ECduLearm frente a las alternativas tradicionales que generan frustración docente y plagio estudiantil.
              </p>
            </div>

            <div className="mt-12 overflow-x-auto border border-sand-200 bg-white shadow-sm">
              <table className="w-full min-w-[760px] text-left text-sm text-sand-600">
                <thead className="border-b border-sand-200 bg-sand-100 text-xs font-bold uppercase text-sand-600">
                  <tr>
                    <th scope="col" className="px-6 py-4">Alternativa Actual</th>
                    <th scope="col" className="px-6 py-4">Dónde se queda corta</th>
                    <th scope="col" className="px-6 py-4 text-ink-800">Con ECduLearm</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-200 font-normal">
                  <tr>
                    <td className="px-6 py-4 font-bold text-sand-950">Bancos de preguntas y simuladores</td>
                    <td className="px-6 py-4 text-sand-500">Ejercicios repetitivos, descontextualizados y sin retroalimentación paso a paso.</td>
                    <td className="bg-ink-50/70 px-6 py-4 font-semibold text-ink-900">Problemas nuevos contextualizados en Ecuador y tutor socrático en vivo.</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-bold text-sand-950">Búsquedas en Google y YouTube</td>
                    <td className="px-6 py-4 text-sand-500">El docente pierde horas filtrando y adaptando manualmente enunciados.</td>
                    <td className="bg-ink-50/70 px-6 py-4 font-semibold text-ink-900">Generación y adaptación en 10 segundos en formato ministerial ERCA.</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-bold text-sand-950">IA Genérica (ChatGPT / Gemini libre)</td>
                    <td className="px-6 py-4 text-sand-500">El estudiante copia la respuesta final sin razonar ni aprender el procedimiento.</td>
                    <td className="bg-ink-50/70 px-6 py-4 font-semibold text-ink-900">Guardrail Anti-Copia estricto: prohibido dar la respuesta final servida.</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-bold text-sand-950">Preuniversitarios Privados</td>
                    <td className="px-6 py-4 text-sand-500">Costos elevados ($300 a $800) inaccesibles para la mayoría de familias.</td>
                    <td className="bg-ink-50/70 px-6 py-4 font-semibold text-ink-900">Entrenamiento democratizado dentro de la propia institución escolar.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* 7. Sección: Política de Privacidad, Ética y Licencia (Ficha Control 1) */}
        <section id="privacidad" className="py-20 border-t border-sand-200 bg-sand-100">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <span className="text-xs font-bold uppercase tracking-widest text-ink-800">
                Compromiso Ético · Control 1 Sprint 0
              </span>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-sand-950 sm:text-4xl">
                Privacidad desde el Diseño y Uso Ético de Inteligencia Artificial
              </h2>
              <p className="mt-4 text-sm text-sand-600 leading-relaxed">
                Cumplimos rigurosamente con la <strong>Ley Orgánica de Protección de Datos Personales (LOPDP) de Ecuador</strong> y las directrices internacionales de la UNESCO sobre IA en educación.
              </p>
            </div>

            <div className="mt-8 flex flex-col gap-4 border-l-4 border-ink-700 bg-white px-5 py-5 shadow-sm sm:flex-row sm:items-center sm:gap-6 sm:px-7">
              <span className="shrink-0 text-3xl font-semibold text-ink-900">0 PII</span>
              <p className="max-w-3xl text-sm leading-relaxed text-sand-700">
                Los estudiantes acceden únicamente con un PIN temporal. No pedimos nombres, correos ni teléfonos.
              </p>
            </div>

            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-sand-200 bg-sand-50 p-6">
                <span className="text-2xl mb-3 block">🛡️</span>
                <h3 className="text-sm font-bold text-sand-950">Protección a Menores</h3>
                <p className="mt-2 text-xs text-sand-500 leading-relaxed">
                  Cero recolección de PII. Los estudiantes acceden únicamente con un PIN temporal de 6 caracteres. No pedimos nombres, correos ni teléfonos.
                </p>
              </div>

              <div className="rounded-xl border border-sand-200 bg-sand-50 p-6">
                <span className="text-2xl mb-3 block">🏫</span>
                <h3 className="text-sm font-bold text-sand-950">Cuentas Institucionales</h3>
                <p className="mt-2 text-xs text-sand-500 leading-relaxed">
                  Solo los docentes autorizados por la unidad educativa acceden con su correo institucional verificado (`@colegio.edu.ec`).
                </p>
              </div>

              <div className="rounded-xl border border-sand-200 bg-sand-50 p-6">
                <span className="text-2xl mb-3 block">🤖</span>
                <h3 className="text-sm font-bold text-sand-950">Transparencia Algorítmica</h3>
                <p className="mt-2 text-xs text-sand-500 leading-relaxed">
                  El modelo opera bajo contratos de ingeniería de prompts socráticos que impiden sesgos, alucinaciones y entrega de soluciones automáticas.
                </p>
              </div>

              <div className="rounded-xl border border-sand-200 bg-sand-50 p-6">
                <span className="text-2xl mb-3 block">⚖️</span>
                <h3 className="text-sm font-bold text-sand-950">Licencia Abierta MIT</h3>
                <p className="mt-2 text-xs text-sand-500 leading-relaxed">
                  Software transparente auditado y registrado bajo licencia permisiva MIT (Copyright © 2026 Equipo ECduLearm - PUCE).
                </p>
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={() => setPrivacyModalOpen(true)}
                className="flex min-h-[44px] items-center gap-2 rounded-xl border border-ink-300 bg-ink-50 px-5 text-xs font-bold text-ink-800 transition hover:bg-ink-100"
              >
                <span>📜 Ver Declaración Completa de Privacidad y Ética</span>
              </button>
            </div>
          </div>
        </section>

        {/* Banner CTA Final */}
        <section className="border-t border-ink-950 bg-ink-950 py-16 text-center">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-semibold text-white sm:text-3xl">
              ¿Listo para ver ECduLearm en acción en tu colegio?
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-ink-100">
              Prueba la plataforma web directamente desde el navegador de tu computadora o celular.
            </p>
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={onEnterApp}
                className="flex min-h-[48px] items-center gap-2 rounded-lg bg-sand-50 px-8 font-bold text-ink-950 shadow-sm transition hover:bg-white focus:outline-none focus:ring-4 focus:ring-ink-300"
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

      {/* 8. Footer */}
      <footer className="border-t border-sand-200 bg-sand-50 py-12 text-xs text-sand-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sand-950">ECduLearm</span>
              <span>·</span>
              <span>Proyecto de Emprendimiento Tecnológico</span>
              <span>·</span>
              <span className="text-ink-800">Pontificia Universidad Católica del Ecuador (PUCE)</span>
            </div>

            <div className="flex items-center gap-5">
              <button
                type="button"
                onClick={() => setPrivacyModalOpen(true)}
                className="hover:text-sand-700 underline"
              >
                Política de Privacidad
              </button>
              <a
                href="https://github.com/eisefaaabri/ECduLearm_Proyecto_Tecnologia"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-sand-600 hover:text-sand-950"
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
        <div className="fixed inset-0 z-50 grid place-items-center bg-sand-950/50 p-4 backdrop-blur-md">
          <div
            className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl border border-sand-300 bg-white p-6 text-sand-950 shadow-2xl sm:p-8"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start justify-between border-b border-sand-200 pb-4">
              <div>
                <h3 className="text-lg font-bold text-ink-800 flex items-center gap-2">
                  <span>📜 Política de Privacidad y Marco Ético de IA</span>
                </h3>
                <p className="mt-1 text-xs text-sand-500">
                  Cumplimiento con LOPDP Ecuador y Estándares WCAG 2.2 / UNESCO
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPrivacyModalOpen(false)}
                className="text-sand-500 hover:text-sand-950 text-base"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 space-y-4 text-xs leading-relaxed text-sand-600">
              <section>
                <h4 className="font-bold text-sand-950 text-sm">1. Principio de Privacidad desde el Diseño (Menores de Edad)</h4>
                <p className="mt-1">
                  En concordancia con el Código de la Niñez y Adolescencia y la Ley Orgánica de Protección de Datos Personales (LOPDP) de Ecuador, <strong>ECduLearm no solicita, almacena ni procesa información personal identificable (PII) de los estudiantes</strong>. El acceso a las actividades y al tutor socrático se efectúa exclusivamente mediante un código PIN efímero de 6 caracteres (ej. <code>PISA26</code>).
                </p>
              </section>

              <section>
                <h4 className="font-bold text-sand-950 text-sm">2. Gestión de Cuentas Docentes e Institucionales</h4>
                <p className="mt-1">
                  Los registros de usuario están restringidos a docentes y directivos escolares autorizados por sus respectivas instituciones. Los datos de correo institucional son utilizados únicamente para la gestión de guías ERCA y la generación de aulas virtuales.
                </p>
              </section>

              <section>
                <h4 className="font-bold text-sand-950 text-sm">3. Guardrails de Inteligencia Artificial (Anti-Copia y Andamiaje)</h4>
                <p className="mt-1">
                  El motor pedagógico de IA opera bajo restricciones de ingeniería de prompts inviolables. El tutor tiene prohibido de forma cardinal otorgar la solución final directa, garantizando que el estudiante ejercite procesos de inferencia, formulación e interpretación cuantitativa.
                </p>
              </section>

              <section>
                <h4 className="font-bold text-sand-950 text-sm">4. Almacenamiento Local y Ausencia de Cookies Rastreadoras</h4>
                <p className="mt-1">
                  El estado de la sesión se preserva en el <code>localStorage</code> del navegador del usuario. No se emplean cookies de terceros, píxeles de seguimiento publicitario ni telemetría invasiva.
                </p>
              </section>

              <section>
                <h4 className="font-bold text-sand-950 text-sm">5. Propiedad Intelectual y Licenciamiento</h4>
                <p className="mt-1">
                  El código base de ECduLearm está licenciado bajo la <strong>MIT License</strong>. Copyright (c) 2026 Joan Sebastian Santacruz Villamarin, Ariel Fabricio Chacha Pilco, Michael (Melissa Dayana) Molina Sierra — PUCE.
                </p>
              </section>
            </div>

            <div className="mt-6 border-t border-sand-200 pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setPrivacyModalOpen(false)}
                className="rounded-xl bg-ink-800 px-5 py-2 text-xs font-bold text-white hover:bg-ink-900"
              >
                Entendido y de Acuerdo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LandingPage;
