import { useState } from "react";

export interface LandingPageProps {
  onEnterApp: () => void;
  onStudentEnter?: (pin?: string) => void;
}

export function LandingPage({ onEnterApp, onStudentEnter }: LandingPageProps) {
  // Estado del modal de Política de Privacidad
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-teal-500 selection:text-slate-950">
      {/* 1. Header / Navbar Público */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-2xl bg-gradient-to-tr from-blue-600 to-teal-400 text-white shadow-md shadow-teal-500/20">
              <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
                <path d="m9 9 3 3 5-5" />
              </svg>
            </span>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-tight text-white">
                EC<span className="text-teal-400">du</span>Learm
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                EdTech SaaS Ecuador
              </span>
            </div>
          </div>

          <nav className="hidden items-center gap-6 md:flex" aria-label="Navegación principal">
            <a href="#problema" className="text-sm font-medium text-slate-300 transition hover:text-white">
              El Problema
            </a>
            <a href="#solucion" className="text-sm font-medium text-slate-300 transition hover:text-white">
              Solución
            </a>
            <a href="#como-funciona" className="text-sm font-medium text-slate-300 transition hover:text-white">
              Cómo Funciona
            </a>
            <a href="#impacto-b2b" className="text-sm font-medium text-slate-300 transition hover:text-white">
              Alternativas
            </a>
            <a href="#privacidad" className="text-sm font-medium text-slate-300 transition hover:text-white">
              Privacidad & Ética
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onEnterApp}
              className="flex min-h-[44px] items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-teal-500 px-5 text-sm font-bold text-white shadow-lg shadow-teal-500/20 transition hover:from-blue-500 hover:to-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400"
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
        <section className="relative overflow-hidden pt-14 pb-20 lg:pt-20 lg:pb-28">
          {/* Luces y degradados de fondo */}
          <div className="pointer-events-none absolute left-1/4 top-0 -z-10 h-96 w-96 -translate-y-1/2 rounded-full bg-blue-600/20 blur-3xl" />
          <div className="pointer-events-none absolute right-1/4 top-1/3 -z-10 h-96 w-96 rounded-full bg-teal-500/15 blur-3xl" />

          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-950/60 px-3.5 py-1.5 text-xs font-semibold text-teal-300">
              <span className="inline-block size-2 rounded-full bg-teal-400 animate-pulse" />
              <span>Plataforma EdTech SaaS · Estándares PISA y ERCA</span>
            </div>

            <h1 className="mx-auto mt-6 max-w-4xl text-3xl font-extrabold tracking-tight text-white sm:text-5xl sm:leading-[1.15] lg:text-6xl">
              Transforma horas de planificación manual en{" "}
              <span className="bg-gradient-to-r from-blue-400 via-teal-300 to-emerald-300 bg-clip-text text-transparent">
                razonamiento lógico real
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
              <strong>ECduLearm</strong> automatiza la creación de problemas contextualizados tipo PISA para docentes de bachillerato en Ecuador y entrena a los estudiantes con un <strong>Tutor Socrático de IA</strong> que guía paso a paso sin regalar la respuesta final.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <button
                type="button"
                onClick={onEnterApp}
                className="flex min-h-[48px] items-center gap-2 rounded-2xl bg-teal-500 px-6 font-bold text-slate-950 shadow-xl shadow-teal-500/25 transition hover:bg-teal-400 hover:shadow-teal-400/30"
              >
                <span>Ingresar a la Plataforma Web</span>
                <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>

              <a
                href="#solucion"
                className="flex min-h-[48px] items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/60 px-5 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
              >
                Conocer el Ecosistema
              </a>
            </div>

            {/* Métricas destacadas en el Hero */}
            <div className="mx-auto mt-12 grid max-w-2xl grid-cols-3 gap-6 border-t border-slate-800/80 pt-8 text-center">
              <div>
                <span className="block text-2xl font-black text-white sm:text-3xl">&lt; 10s</span>
                <span className="text-xs text-slate-400">Generación de guías PISA</span>
              </div>
              <div>
                <span className="block text-2xl font-black text-teal-400 sm:text-3xl">100%</span>
                <span className="text-xs text-slate-400">Tutoría Anti-Copia</span>
              </div>
              <div>
                <span className="block text-2xl font-black text-amber-400 sm:text-3xl">PIN</span>
                <span className="text-xs text-slate-400">Cero datos de menores</span>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Sección: El Problema Validado en Campo */}
        <section id="problema" className="border-t border-slate-800/80 bg-slate-900/40 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <span className="text-xs font-bold uppercase tracking-widest text-teal-400">
                Diagnóstico de Campo en Ecuador
              </span>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-4xl">
                El bloqueo del alumno es real, y también el agotamiento docente
              </h2>
              <p className="mt-4 text-base text-slate-300 leading-relaxed">
                Nuestras entrevistas y encuestas con docentes de matemáticas de bachillerato en colegios públicos y particulares de Quito revelaron tres cuellos de botella estructurales:
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {/* Tarjeta 1 */}
              <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-7 shadow-lg transition hover:border-slate-700">
                <div className="grid size-12 place-items-center rounded-2xl bg-rose-500/15 text-rose-400 mb-5">
                  <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <span className="text-3xl font-black text-white">4 a 10 h</span>
                <h3 className="mt-2 text-lg font-bold text-rose-300">Semanales perdidas por docente</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">
                  Los profesores dedican horas fuera de su jornada laboral adaptando manualmente ejercicios mecánicos a situaciones cotidianas tipo PISA y redactando solucionarios paso a paso.
                </p>
              </div>

              {/* Tarjeta 2 */}
              <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-7 shadow-lg transition hover:border-slate-700">
                <div className="grid size-12 place-items-center rounded-2xl bg-amber-500/15 text-amber-400 mb-5">
                  <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v1" />
                    <path d="M18 8h4a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-4" />
                    <circle cx="8" cy="12" r="2" />
                  </svg>
                </div>
                <span className="text-3xl font-black text-white">+50%</span>
                <h3 className="mt-2 text-lg font-bold text-amber-300">Copia pasiva con IA genérica</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">
                  Ante problemas de texto largo, más de la mitad de los estudiantes recurre a chatbots comerciales para obtener la respuesta final, anulando el esfuerzo reflexivo y la destreza lógica.
                </p>
              </div>

              {/* Tarjeta 3 */}
              <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-7 shadow-lg transition hover:border-slate-700">
                <div className="grid size-12 place-items-center rounded-2xl bg-teal-500/15 text-teal-400 mb-5">
                  <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <span className="text-3xl font-black text-white">35 a 40</span>
                <h3 className="mt-2 text-lg font-bold text-teal-300">Estudiantes por paralelo</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">
                  En aulas masivas es matemáticamente inviable que un solo docente atienda individualmente las dudas de cada alumno sin atrasar la planificación anual del Ministerio de Educación.
                </p>
              </div>
            </div>

            {/* Datos estadísticos complementarios */}
            <div className="mt-12 rounded-3xl border border-slate-800 bg-slate-950/60 p-6 sm:p-8">
              <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
                <div>
                  <span className="block text-2xl font-extrabold text-blue-400">80%</span>
                  <span className="text-xs text-slate-400">En Ecuador bajo el nivel 2 de PISA</span>
                </div>
                <div>
                  <span className="block text-2xl font-extrabold text-teal-400">22 de 28</span>
                  <span className="text-xs text-slate-400">Docentes encuestados adaptan problemas</span>
                </div>
                <div>
                  <span className="block text-2xl font-extrabold text-amber-400">0 PII</span>
                  <span className="text-xs text-slate-400">Cero datos de menores recolectados</span>
                </div>
                <div>
                  <span className="block text-2xl font-extrabold text-purple-400">4 Fases</span>
                  <span className="text-xs text-slate-400">Formato oficial ERCA integrado</span>
                </div>
              </div>
              <p className="mt-5 text-[11px] text-slate-500 text-center">
                Fuentes: Informes oficiales PISA, 28 encuestas directas a docentes de matemáticas de bachillerato y 12 entrevistas de profundidad del equipo Scrum.
              </p>
            </div>
          </div>
        </section>

        {/* 4. Sección: Ecosistema Dual de ECduLearm */}
        <section id="solucion" className="py-20 border-t border-slate-800/80">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <span className="text-xs font-bold uppercase tracking-widest text-teal-400">
                Arquitectura de Solución
              </span>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-4xl">
                Una herramienta para el docente, un entrenador para el estudiante
              </h2>
              <p className="mt-4 text-sm text-slate-300 sm:text-base">
                ECduLearm no es otro banco estático de preguntas. Es un sistema integral que conecta la planificación curricular con el aprendizaje reflexivo autónomo.
              </p>
            </div>

            <div className="mt-14 grid gap-8 lg:grid-cols-3">
              {/* Tarjeta 1: Docente */}
              <div className="flex flex-col justify-between rounded-3xl border border-blue-500/40 bg-gradient-to-b from-blue-950/40 to-slate-900 p-8 shadow-xl">
                <div>
                  <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/20 mb-6">
                    <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
                    </svg>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-400">El Orquestador</span>
                  <h3 className="mt-1 text-xl font-bold text-white">Para el Docente</h3>
                  <ul className="mt-5 space-y-3 text-sm text-slate-300 leading-relaxed">
                    <li className="flex items-start gap-2.5">
                      <span className="text-teal-400 font-bold">✓</span>
                      <span><strong>Chatbot Curricular PISA:</strong> Genera ejercicios contextualizados (Metro de Quito, Galápagos, finanzas) en 10 segundos.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-teal-400 font-bold">✓</span>
                      <span><strong>Chips de Ajuste Rápido:</strong> Adapta dificultad (*más fácil*, *más difícil*, *cambiar a arquitectura*) sin editar a mano.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-teal-400 font-bold">✓</span>
                      <span><strong>Plantilla Oficial ERCA:</strong> Inyecta el problema en la fase de Aplicación de clase lista para imprimir.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-teal-400 font-bold">✓</span>
                      <span><strong>Generación de PIN:</strong> Crea aulas virtuales en 1 clic para compartir con los 40 alumnos.</span>
                    </li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={onEnterApp}
                  className="mt-8 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white transition hover:bg-blue-500"
                >
                  Abrir Entorno Docente en la App
                </button>
              </div>

              {/* Tarjeta 2: Estudiante */}
              <div className="flex flex-col justify-between rounded-3xl border border-teal-500/40 bg-gradient-to-b from-teal-950/40 to-slate-900 p-8 shadow-xl">
                <div>
                  <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20 mb-6">
                    <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                      <path d="M6 12v5c3 3 9 3 12 0v-5" />
                    </svg>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-400">El Ejecutor Autónomo</span>
                  <h3 className="mt-1 text-xl font-bold text-white">Para el Estudiante</h3>
                  <ul className="mt-5 space-y-3 text-sm text-slate-300 leading-relaxed">
                    <li className="flex items-start gap-2.5">
                      <span className="text-teal-400 font-bold">✓</span>
                      <span><strong>Tutor Socrático Anti-Copia:</strong> Prohibición estricta de entregar respuestas directas; ofrece pistas y preguntas guía.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-teal-400 font-bold">✓</span>
                      <span><strong>Acceso por PIN Fricción Cero:</strong> Entrada instantánea sin cuentas, correos ni datos personales.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-teal-400 font-bold">✓</span>
                      <span><strong>Simulador de Admisión Universitaria:</strong> Práctica cronometrada con retroalimentación socrática en cada error.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-teal-400 font-bold">✓</span>
                      <span><strong>Mobile-First Accesible:</strong> Optimizado para teléfonos inteligentes con botones táctiles ≥ 44px.</span>
                    </li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => onStudentEnter ? onStudentEnter("PISA26") : onEnterApp()}
                  className="mt-8 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-teal-500 px-4 text-xs font-bold text-slate-950 transition hover:bg-teal-400"
                >
                  Abrir Zona de Estudiantes
                </button>
              </div>

              {/* Tarjeta 3: Colegio / B2B */}
              <div className="flex flex-col justify-between rounded-3xl border border-purple-500/40 bg-gradient-to-b from-purple-950/40 to-slate-900 p-8 shadow-xl">
                <div>
                  <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-purple-600 text-white shadow-lg shadow-purple-500/20 mb-6">
                    <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-400">El Decisor B2B</span>
                  <h3 className="mt-1 text-xl font-bold text-white">Para el Colegio</h3>
                  <ul className="mt-5 space-y-3 text-sm text-slate-300 leading-relaxed">
                    <li className="flex items-start gap-2.5">
                      <span className="text-teal-400 font-bold">✓</span>
                      <span><strong>Licenciamiento B2B Anual:</strong> Suscripción institucional asequible por paralelo o plantel completo.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-teal-400 font-bold">✓</span>
                      <span><strong>Panel de Métricas Agregadas:</strong> Reportes de dónde se bloquean los alumnos sin violar su privacidad.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-teal-400 font-bold">✓</span>
                      <span><strong>Retención de Matrículas:</strong> Incremento en tasas de aprobación y preparación universitaria de bachilleres.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-teal-400 font-bold">✓</span>
                      <span><strong>Cumplimiento Normativo:</strong> Alineado con los requerimientos curriculares del Ministerio de Educación.</span>
                    </li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={onEnterApp}
                  className="mt-8 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-purple-500/50 bg-purple-950/40 px-4 text-xs font-bold text-purple-300 transition hover:bg-purple-900/60"
                >
                  Probar Plataforma Institucional
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Sección: Cómo Funciona en Tu Clase */}
        <section id="como-funciona" className="py-20 border-t border-slate-800/80 bg-slate-900/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto">
              <span className="text-xs font-bold uppercase tracking-widest text-teal-400">Flujo Operativo Simple</span>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                Cómo funciona en una clase de 45 minutos
              </h2>
            </div>

            <div className="mt-12 grid gap-8 md:grid-cols-3">
              <div className="relative rounded-3xl border border-slate-800 bg-slate-950/80 p-7">
                <span className="grid size-10 place-items-center rounded-xl bg-teal-400 text-slate-950 font-black text-lg mb-4">
                  1
                </span>
                <h3 className="text-lg font-bold text-white">El Docente Pide el Reto</h3>
                <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                  Indica el tema (ej. <em>funciones cuadráticas</em>), nivel (<em>2do BGU</em>) y contexto (<em>Metro de Quito</em>). La IA estructura la guía PISA con rúbrica ministerial en segundos.
                </p>
              </div>

              <div className="relative rounded-3xl border border-slate-800 bg-slate-950/80 p-7">
                <span className="grid size-10 place-items-center rounded-xl bg-teal-400 text-slate-950 font-black text-lg mb-4">
                  2
                </span>
                <h3 className="text-lg font-bold text-white">Proyecta el Código PIN</h3>
                <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                  El profesor publica el aula y proyecta el PIN (ej. <strong>PISA26</strong>). Los 40 estudiantes abren el enlace desde su celular sin registros ni descargas.
                </p>
              </div>

              <div className="relative rounded-3xl border border-slate-800 bg-slate-950/80 p-7">
                <span className="grid size-10 place-items-center rounded-xl bg-teal-400 text-slate-950 font-black text-lg mb-4">
                  3
                </span>
                <h3 className="text-lg font-bold text-white">Tutoría y Nivelación Real</h3>
                <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                  El Tutor Socrático destraba a los alumnos con pistas graduales sin dar la respuesta. El profesor ve en su panel los pasos críticos donde se bloquean y refuerza ese punto exacto.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Sección: Comparativa B2B e Impacto */}
        <section id="impacto-b2b" className="py-20 border-t border-slate-800/80">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <span className="text-xs font-bold uppercase tracking-widest text-teal-400">
                Propuesta de Valor B2B
              </span>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-4xl">
                Lo que usan los colegios hoy y por qué falla
              </h2>
              <p className="mt-4 text-sm text-slate-300 sm:text-base">
                Comparamos el enfoque de ECduLearm frente a las alternativas tradicionales que generan frustración docente y plagio estudiantil.
              </p>
            </div>

            <div className="mt-12 overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900/80 shadow-2xl">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="border-b border-slate-800 bg-slate-950/80 text-xs font-bold uppercase text-slate-400">
                  <tr>
                    <th scope="col" className="px-6 py-4">Alternativa Actual</th>
                    <th scope="col" className="px-6 py-4">Dónde se queda corta</th>
                    <th scope="col" className="px-6 py-4 text-teal-400">Con ECduLearm</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-normal">
                  <tr>
                    <td className="px-6 py-4 font-bold text-white">Bancos de preguntas y simuladores</td>
                    <td className="px-6 py-4 text-slate-400">Ejercicios repetitivos, descontextualizados y sin retroalimentación paso a paso.</td>
                    <td className="px-6 py-4 font-semibold text-teal-300">Problemas nuevos contextualizados en Ecuador y tutor socrático en vivo.</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-bold text-white">Búsquedas en Google y YouTube</td>
                    <td className="px-6 py-4 text-slate-400">El docente pierde horas filtrando y adaptando manualmente enunciados.</td>
                    <td className="px-6 py-4 font-semibold text-teal-300">Generación y adaptación en 10 segundos en formato ministerial ERCA.</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-bold text-white">IA Genérica (ChatGPT / Gemini libre)</td>
                    <td className="px-6 py-4 text-slate-400">El estudiante copia la respuesta final sin razonar ni aprender el procedimiento.</td>
                    <td className="px-6 py-4 font-semibold text-teal-300">Guardrail Anti-Copia estricto: prohibido dar la respuesta final servida.</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-bold text-white">Preuniversitarios Privados</td>
                    <td className="px-6 py-4 text-slate-400">Costos elevados ($300 a $800) inaccesibles para la mayoría de familias.</td>
                    <td className="px-6 py-4 font-semibold text-teal-300">Entrenamiento democratizado dentro de la propia institución escolar.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* 7. Sección: Política de Privacidad, Ética y Licencia (Ficha Control 1) */}
        <section id="privacidad" className="py-20 border-t border-slate-800/80 bg-slate-900/60">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <span className="text-xs font-bold uppercase tracking-widest text-teal-400">
                Compromiso Ético · Control 1 Sprint 0
              </span>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-4xl">
                Privacidad desde el Diseño y Uso Ético de Inteligencia Artificial
              </h2>
              <p className="mt-4 text-sm text-slate-300 leading-relaxed">
                Cumplimos rigurosamente con la <strong>Ley Orgánica de Protección de Datos Personales (LOPDP) de Ecuador</strong> y las directrices internacionales de la UNESCO sobre IA en educación.
              </p>
            </div>

            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
                <span className="text-2xl mb-3 block">🛡️</span>
                <h3 className="text-sm font-bold text-white">Protección a Menores</h3>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  Cero recolección de PII. Los estudiantes acceden únicamente con un PIN temporal de 6 caracteres. No pedimos nombres, correos ni teléfonos.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
                <span className="text-2xl mb-3 block">🏫</span>
                <h3 className="text-sm font-bold text-white">Cuentas Institucionales</h3>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  Solo los docentes autorizados por la unidad educativa acceden con su correo institucional verificado (`@colegio.edu.ec`).
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
                <span className="text-2xl mb-3 block">🤖</span>
                <h3 className="text-sm font-bold text-white">Transparencia Algorítmica</h3>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  El modelo opera bajo contratos de ingeniería de prompts socráticos que impiden sesgos, alucinaciones y entrega de soluciones automáticas.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
                <span className="text-2xl mb-3 block">⚖️</span>
                <h3 className="text-sm font-bold text-white">Licencia Abierta MIT</h3>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  Software transparente auditado y registrado bajo licencia permisiva MIT (Copyright © 2026 Equipo ECduLearm - PUCE).
                </p>
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={() => setPrivacyModalOpen(true)}
                className="flex min-h-[44px] items-center gap-2 rounded-xl border border-teal-500/50 bg-teal-950/40 px-5 text-xs font-bold text-teal-300 transition hover:bg-teal-900/60"
              >
                <span>📜 Ver Declaración Completa de Privacidad y Ética</span>
              </button>
            </div>
          </div>
        </section>

        {/* Banner CTA Final */}
        <section className="border-t border-slate-800 bg-gradient-to-r from-blue-950 via-slate-900 to-teal-950 py-16 text-center">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-extrabold text-white sm:text-3xl">
              ¿Listo para ver ECduLearm en acción en tu colegio?
            </h2>
            <p className="mt-3 text-sm text-slate-300 max-w-2xl mx-auto">
              Prueba la plataforma web directamente desde el navegador de tu computadora o celular.
            </p>
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={onEnterApp}
                className="flex min-h-[48px] items-center gap-2 rounded-2xl bg-teal-500 px-8 font-bold text-slate-950 shadow-xl transition hover:bg-teal-400"
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
      <footer className="border-t border-slate-800 bg-slate-950 py-12 text-xs text-slate-400">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white">ECduLearm</span>
              <span>·</span>
              <span>Proyecto de Emprendimiento Tecnológico</span>
              <span>·</span>
              <span className="text-teal-400">Pontificia Universidad Católica del Ecuador (PUCE)</span>
            </div>

            <div className="flex items-center gap-5">
              <button
                type="button"
                onClick={() => setPrivacyModalOpen(true)}
                className="hover:text-slate-200 underline"
              >
                Política de Privacidad
              </button>
              <a
                href="https://github.com/eisefaaabri/ECduLearm_Proyecto_Tecnologia"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-slate-300 hover:text-white"
              >
                <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                </svg>
                <span>GitHub Repo</span>
              </a>
            </div>
          </div>

          <div className="mt-6 border-t border-slate-900 pt-6 text-center text-[11px] text-slate-500">
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
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/75 p-4 backdrop-blur-md">
          <div
            className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl border border-slate-700 bg-slate-900 p-6 text-white shadow-2xl sm:p-8"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-teal-400 flex items-center gap-2">
                  <span>📜 Política de Privacidad y Marco Ético de IA</span>
                </h3>
                <p className="mt-1 text-xs text-slate-400">
                  Cumplimiento con LOPDP Ecuador y Estándares WCAG 2.2 / UNESCO
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPrivacyModalOpen(false)}
                className="text-slate-400 hover:text-white text-base"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 space-y-4 text-xs leading-relaxed text-slate-300">
              <section>
                <h4 className="font-bold text-white text-sm">1. Principio de Privacidad desde el Diseño (Menores de Edad)</h4>
                <p className="mt-1">
                  En concordancia con el Código de la Niñez y Adolescencia y la Ley Orgánica de Protección de Datos Personales (LOPDP) de Ecuador, <strong>ECduLearm no solicita, almacena ni procesa información personal identificable (PII) de los estudiantes</strong>. El acceso a las actividades y al tutor socrático se efectúa exclusivamente mediante un código PIN efímero de 6 caracteres (ej. <code>PISA26</code>).
                </p>
              </section>

              <section>
                <h4 className="font-bold text-white text-sm">2. Gestión de Cuentas Docentes e Institucionales</h4>
                <p className="mt-1">
                  Los registros de usuario están restringidos a docentes y directivos escolares autorizados por sus respectivas instituciones. Los datos de correo institucional son utilizados únicamente para la gestión de guías ERCA y la generación de aulas virtuales.
                </p>
              </section>

              <section>
                <h4 className="font-bold text-white text-sm">3. Guardrails de Inteligencia Artificial (Anti-Copia y Andamiaje)</h4>
                <p className="mt-1">
                  El motor pedagógico de IA opera bajo restricciones de ingeniería de prompts inviolables. El tutor tiene prohibido de forma cardinal otorgar la solución final directa, garantizando que el estudiante ejercite procesos de inferencia, formulación e interpretación cuantitativa.
                </p>
              </section>

              <section>
                <h4 className="font-bold text-white text-sm">4. Almacenamiento Local y Ausencia de Cookies Rastreadoras</h4>
                <p className="mt-1">
                  El estado de la sesión se preserva en el <code>localStorage</code> del navegador del usuario. No se emplean cookies de terceros, píxeles de seguimiento publicitario ni telemetría invasiva.
                </p>
              </section>

              <section>
                <h4 className="font-bold text-white text-sm">5. Propiedad Intelectual y Licenciamiento</h4>
                <p className="mt-1">
                  El código base de ECduLearm está licenciado bajo la <strong>MIT License</strong>. Copyright (c) 2026 Joan Sebastian Santacruz Villamarin, Ariel Fabricio Chacha Pilco, Michael (Melissa Dayana) Molina Sierra — PUCE.
                </p>
              </section>
            </div>

            <div className="mt-6 border-t border-slate-800 pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setPrivacyModalOpen(false)}
                className="rounded-xl bg-teal-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-teal-400"
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
