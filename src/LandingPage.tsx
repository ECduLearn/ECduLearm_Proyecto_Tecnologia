import { FormEvent, useState } from "react"
import { estudianteSocraticoController } from "@/services/dbService"

export interface LandingPageProps {
  onEnterApp: () => void

  onStudentEnter?: (pin?: string) => void

  onNavigate?: (view: string) => void
}

const REPO_URL = "https://github.com/ECduLearn/ECduLearm_Proyecto_Tecnologia"

const FUNCIONES_DOCENTE = [
  {
    titulo: "Orientación tipo PISA",
    texto:
      "Te sugiere cómo plantear el problema para que el estudiante tenga que razonar, no repetir un procedimiento.",
  },
  {
    titulo: "Del ejercicio mecánico al problema real",
    texto:
      "Pegas un ejercicio del libro y lo convierte en una situación de Ecuador: el Metro de Quito, Galápagos o la canasta básica.",
  },
  {
    titulo: "Dificultad a tu medida",
    texto: "Básico, intermedio o avanzado. Cambias el nivel con un toque y el problema se reescribe.",
  },
  {
    titulo: "Versiones A, B y C",
    texto: "Problemas equivalentes para cada paralelo, así nadie copia la respuesta del compañero de al lado.",
  },
  {
    titulo: "Solución paso a paso, solo para ti",
    texto: "La explicación completa queda dentro de la plantilla ERCA, lista para revisar o imprimir.",
  },
]

const CLASE = [
  {
    minuto: "Min 0",
    titulo: "Pides el reto",
    texto: "Escribes el tema, el curso y un contexto. En segundos tienes el problema y su guía ERCA.",
  },
  {
    minuto: "Min 5",
    titulo: "Proyectas el PIN",
    texto: "Tus estudiantes lo escriben en el celular. Sin descargar nada y sin crear cuentas.",
  },
  {
    minuto: "Min 10 a 40",
    titulo: "Cada uno avanza a su ritmo",
    texto: "Quien se traba pide una pista. El tutor responde con preguntas, nunca con el resultado.",
  },
  {
    minuto: "Min 45",
    titulo: "Ves dónde se trabó la clase",
    texto: "Tu panel muestra en qué paso se detuvieron más estudiantes, para reforzar justo eso.",
  },
]

const ALTERNATIVAS = [
  {
    hoy: "Bancos de preguntas",
    problema: "Ejercicios repetidos, lejos de la vida del estudiante y sin acompañamiento.",
    ecdulearn: "Problemas nuevos con contexto ecuatoriano y un tutor que guía cada paso.",
  },
  {
    hoy: "Google y YouTube",
    problema: "Horas buscando material que después igual hay que adaptar a mano.",
    ecdulearn: "El problema adaptado en segundos y dentro del formato ERCA.",
  },
  {
    hoy: "ChatGPT u otra IA general",
    problema: "El estudiante copia la respuesta y se salta el razonamiento.",
    ecdulearn: "Un tutor que tiene prohibido dar el resultado, aunque se lo pidan.",
  },
]

function Flecha({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

function Marca() {
  return (
    <span className="text-lg font-semibold tracking-tight text-ink-950">
      EC<span className="text-hint-600">du</span>Learn
    </span>
  )
}

export function LandingPage({ onEnterApp, onStudentEnter, onNavigate }: LandingPageProps) {
  const [pin, setPin] = useState("")
  const [pinError, setPinError] = useState("")
  const [buscandoClase, setBuscandoClase] = useState(false)

  const entrarConPin = async (event: FormEvent) => {
    event.preventDefault()
    const limpio = pin.replace(/\s+/g, "").toUpperCase()
    if (!/^[A-Z0-9]{6}$/.test(limpio)) {
      setPinError("El PIN tiene 6 letras o números. Revisa el que te dio tu docente.")
      return
    }
    setPinError("")
    setBuscandoClase(true)
    const resultado = await estudianteSocraticoController.ingresarConPin(limpio)
    setBuscandoClase(false)
    if (resultado.estado === "no_encontrada") {
      setPinError("No encontramos una clase con ese PIN. Revísalo con tu docente.")
      return
    }
    if (resultado.estado === "aula_llena") {
      setPinError("Esta clase ya está completa. Avísale a tu docente.")
      return
    }
    if (onStudentEnter) onStudentEnter(limpio)
    else onEnterApp()
  }

  return (
    <div className="min-h-screen bg-sand-50 font-sans text-sand-900 selection:bg-hint-200 selection:text-sand-950">
      <header className="sticky top-0 z-40 border-b border-sand-200/80 bg-sand-50/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-3 sm:px-6">
          <a href="#inicio" className="flex min-h-11 items-center rounded-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-ink-200">
            <Marca />
          </a>

          <nav aria-label="Secciones" className="hidden items-center gap-1 md:flex">
            {[
              ["#como-funciona", "Cómo funciona"],
              ["#docentes", "Docentes"],
              ["#estudiantes", "Estudiantes"],
              ["#privacidad", "Privacidad"],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-sand-600 transition-colors duration-150 hover:text-ink-950 focus:outline-none focus-visible:ring-4 focus-visible:ring-ink-200"
              >
                {label}
              </a>
            ))}
          </nav>

          <button
            type="button"
            onClick={onEnterApp}
            className="flex min-h-11 items-center gap-2 rounded-full bg-ink-950 px-5 text-sm font-semibold text-sand-50 transition-colors duration-150 hover:bg-ink-800 active:translate-y-px focus:outline-none focus-visible:ring-4 focus-visible:ring-ink-200"
          >
            Entrar
            <Flecha />
          </button>
        </div>
      </header>

      <main id="inicio">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="mx-auto grid max-w-6xl gap-14 px-4 pb-20 pt-14 sm:px-6 sm:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-10 lg:pb-28">
            <div>
              <p className="reveal flex items-center gap-2 text-sm font-medium text-ink-800" style={{ "--delay": "0ms" } as React.CSSProperties}>
                <span className="size-1.5 rounded-full bg-hint-500" aria-hidden="true" />
                Para colegios de Ecuador, de 1ro a 3ro de Bachillerato
              </p>

              <h1
                className="reveal mt-6 text-[clamp(2.4rem,5.4vw,4.1rem)] font-semibold leading-[1.04] tracking-[-0.025em] text-sand-950"
                style={{ "--delay": "80ms" } as React.CSSProperties}
              >
                Ejercicios que hacen pensar. Un tutor que <span className="marker">no da la respuesta.</span>
              </h1>

              <p
                className="reveal mt-6 max-w-xl text-[1.0625rem] leading-relaxed text-sand-700"
                style={{ "--delay": "160ms" } as React.CSSProperties}
              >
                Los docentes crean y adaptan problemas tipo PISA en segundos, con la planificación ERCA lista. Sus
                estudiantes practican con un tutor que los guía con preguntas hasta que llegan solos al resultado.
              </p>

              <div className="reveal mt-9 flex flex-wrap items-center gap-3" style={{ "--delay": "240ms" } as React.CSSProperties}>
                <button
                  type="button"
                  onClick={onEnterApp}
                  className="flex min-h-12 items-center gap-2 rounded-full bg-ink-950 px-6 text-[0.95rem] font-semibold text-sand-50 transition-colors duration-150 hover:bg-ink-800 active:translate-y-px focus:outline-none focus-visible:ring-4 focus-visible:ring-ink-200"
                >
                  Entrar como docente
                  <Flecha />
                </button>
                <button
                  type="button"
                  onClick={() => (onStudentEnter ? onStudentEnter("PISA26") : onEnterApp())}
                  className="flex min-h-12 items-center gap-2.5 rounded-full border border-sand-300 bg-sand-50 px-5 text-[0.95rem] font-semibold text-sand-800 transition-colors duration-150 hover:border-ink-700 hover:text-ink-950 active:translate-y-px focus:outline-none focus-visible:ring-4 focus-visible:ring-ink-100"
                >
                  Probar como estudiante
                  <span className="rounded-md bg-sand-200 px-1.5 py-0.5 font-mono text-xs text-sand-700">PISA26</span>
                </button>
              </div>

              <details className="reveal group mt-6 max-w-md text-sm text-sand-600" style={{ "--delay": "320ms" } as React.CSSProperties}>
                <summary className="flex min-h-11 cursor-pointer list-none items-center gap-1.5 rounded-lg font-medium text-sand-600 hover:text-ink-900 focus:outline-none focus-visible:ring-4 focus-visible:ring-ink-100 [&::-webkit-details-marker]:hidden">
                  <svg className="size-4 transition-transform duration-200 group-open:rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="m9 6 6 6-6 6" />
                  </svg>
                  ¿Vienes a evaluar el proyecto? Accesos de prueba
                </summary>
                <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-xl border border-sand-200 bg-sand-100/70 p-4 text-[0.8125rem]">
                  <dt className="text-sand-500">Docente</dt>
                  <dd className="font-mono text-sand-800">docente@puce.edu.ec · demo123</dd>
                  <dt className="text-sand-500">Estudiante</dt>
                  <dd className="font-mono text-sand-800">PIN PISA26</dd>
                  <dt className="text-sand-500">Administración</dt>
                  <dd>
                    <button
                      type="button"
                      onClick={() => (onNavigate ? onNavigate("admin") : onEnterApp())}
                      className="font-mono text-hint-700 underline decoration-hint-300 underline-offset-2 hover:text-hint-900"
                    >
                      admin@ecdulearn.edu.ec
                    </button>
                  </dd>
                </dl>
              </details>
            </div>

            {/* Página del cuaderno: el momento que define al producto */}
            <figure className="reveal relative mx-auto w-full max-w-md lg:max-w-none" style={{ "--delay": "200ms" } as React.CSSProperties}>
              <div className="paper-grid relative rounded-[1.25rem] border border-sand-300/80 p-6 shadow-[0_1px_0_rgba(11,37,89,0.06),0_24px_48px_-28px_rgba(11,37,89,0.3)] sm:p-8 lg:rotate-[0.6deg]">
                <div className="flex items-baseline justify-between gap-4">
                  <p className="font-mono text-xs text-sand-500">Reto semanal · 2do BGU</p>
                  <p className="font-mono text-xs text-sand-500">Pista 1 de 3</p>
                </div>
                <h2 className="mt-2 text-xl font-semibold tracking-tight text-sand-950">La cercha del Puente del Chiche</h2>
                <p className="mt-3 text-[0.9375rem] leading-relaxed text-sand-700">
                  Una cercha triangular isósceles tiene 12 m de base y sus lados forman 35° con ella. La altura no puede
                  pasar de 5 m. ¿Cumple?
                </p>

                <div className="mt-6 space-y-3 text-[0.9375rem]">
                  <p className="reveal ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-ink-900 px-4 py-2.5 text-sand-50" style={{ "--delay": "520ms" } as React.CSSProperties}>
                    ¿Me das la respuesta? Es para mañana.
                  </p>
                  <p className="reveal w-fit max-w-[90%] rounded-2xl rounded-tl-md border border-sand-200 bg-sand-50 px-4 py-2.5 text-sand-800" style={{ "--delay": "760ms" } as React.CSSProperties}>
                    Te ayudo a que llegues tú. Si trazas la altura desde el vértice, ¿qué figura te queda?
                  </p>
                  <p className="reveal ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-ink-900 px-4 py-2.5 text-sand-50" style={{ "--delay": "1000ms" } as React.CSSProperties}>
                    Dos triángulos rectángulos…
                  </p>
                  <p className="reveal w-fit max-w-[90%] rounded-2xl rounded-tl-md border border-sand-200 bg-sand-50 px-4 py-2.5 text-sand-800" style={{ "--delay": "1240ms" } as React.CSSProperties}>
                    ¡Eso! ¿Qué lado conoces y cuál buscas respecto al ángulo de 35°?
                  </p>
                </div>
              </div>

              {/* Nota al margen, como un lápiz sobre el cuaderno */}
              <figcaption className="mt-3 flex items-start justify-end gap-2 pr-2 text-sm italic text-hint-700">
                <svg className="mt-0.5 h-7 w-10 shrink-0 text-hint-500" viewBox="0 0 40 28" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
                  <path d="M36 24C24 22 12 16 6 5" />
                  <path d="M4 12 6 4l7 3" />
                </svg>
                <span>El tutor nunca da el resultado. Pregunta.</span>
              </figcaption>
            </figure>
          </div>
        </section>

        {/* Evidencia */}
        <section id="problema" className="scroll-mt-20 border-y border-sand-200 bg-sand-100/70">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
            <h2 className="max-w-2xl text-[clamp(1.75rem,3.2vw,2.6rem)] font-semibold leading-tight tracking-tight text-sand-950">
              Los problemas que piden razonar son justo donde más se traban.
            </h2>

            <div className="mt-14 divide-y divide-sand-300/80 border-y border-sand-300/80">
              <div className="grid gap-3 py-8 sm:grid-cols-[13rem_1fr] sm:items-baseline sm:gap-10">
                <p className="text-[clamp(2.4rem,4.4vw,3.4rem)] font-semibold leading-none tracking-[-0.03em] tabular-nums text-hint-700">8 de 10</p>
                <p className="max-w-2xl text-lg leading-relaxed text-sand-800">
                  estudiantes en Ecuador están bajo el nivel 2 de matemáticas en PISA. Solo el 17,4 % alcanza el
                  desempeño básico.
                </p>
              </div>
              <div className="grid gap-3 py-8 sm:grid-cols-[13rem_1fr] sm:items-baseline sm:gap-10">
                <p className="text-[clamp(2.4rem,4.4vw,3.4rem)] font-semibold leading-none tracking-[-0.03em] tabular-nums text-ink-800">10 h</p>
                <p className="max-w-2xl text-lg leading-relaxed text-sand-800">
                  a la semana puede perder un docente buscando y adaptando material para aulas de 35 a 40 estudiantes.
                </p>
              </div>
            </div>

            <p className="mt-8 max-w-3xl text-[0.9375rem] leading-relaxed text-sand-600">
              Lo probamos con quienes enseñan: 28 de 30 docentes encuestados participaron en el prototipo. 24 de ellos
              (85,7 %) calificaron útil o muy útil la orientación tipo PISA, y 22 (78,6 %) adaptan ejercicios con
              frecuencia.
            </p>
          </div>
        </section>

        {/* Cómo funciona */}
        <section id="como-funciona" className="scroll-mt-20">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
            <h2 className="max-w-xl text-[clamp(1.75rem,3.2vw,2.6rem)] font-semibold leading-tight tracking-tight text-sand-950">
              Así se ve en una clase de 45 minutos
            </h2>

            <ol className="mt-14 grid gap-10 border-l border-sand-300 pl-6 sm:pl-8 lg:grid-cols-4 lg:gap-8 lg:border-l-0 lg:border-t lg:pl-0 lg:pt-8">
              {CLASE.map((paso) => (
                <li key={paso.minuto} className="relative">
                  <span
                    className="absolute -left-[1.85rem] top-1.5 size-2.5 rounded-full border-2 border-sand-50 bg-hint-500 ring-1 ring-hint-500 sm:-left-[2.35rem] lg:-top-[2.35rem] lg:left-0"
                    aria-hidden="true"
                  />
                  <p className="font-mono text-sm text-hint-700">{paso.minuto}</p>
                  <h3 className="mt-2 text-lg font-semibold text-sand-950">{paso.titulo}</h3>
                  <p className="mt-2 text-[0.9375rem] leading-relaxed text-sand-600">{paso.texto}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Docentes */}
        <section id="docentes" className="scroll-mt-20 border-t border-sand-200">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <p className="text-sm font-medium text-ink-800">Para docentes</p>
              <h2 className="mt-3 text-[clamp(1.75rem,3.2vw,2.6rem)] font-semibold leading-tight tracking-tight text-sand-950">
                Tu próxima guía, lista antes del recreo
              </h2>
              <p className="mt-5 text-[1.0625rem] leading-relaxed text-sand-700">
                Le dices qué necesitas como se lo dirías a un colega. El asistente propone, tú ajustas y decides.
              </p>
              <button
                type="button"
                onClick={() => (onNavigate ? onNavigate("dashboard") : onEnterApp())}
                className="mt-8 flex min-h-12 items-center gap-2 rounded-full bg-ink-950 px-6 text-[0.95rem] font-semibold text-sand-50 transition-colors duration-150 hover:bg-ink-800 active:translate-y-px focus:outline-none focus-visible:ring-4 focus-visible:ring-ink-200"
              >
                Ver el panel docente
                <Flecha />
              </button>
            </div>

            <ol className="divide-y divide-sand-200 border-y border-sand-200">
              {FUNCIONES_DOCENTE.map((funcion, i) => (
                <li key={funcion.titulo} className="grid grid-cols-[2.5rem_1fr] gap-4 py-7">
                  <span className="font-mono text-sm text-sand-400">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-sand-950">{funcion.titulo}</h3>
                    <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-sand-600">{funcion.texto}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Estudiantes: entrada directa con el PIN */}
        <section id="estudiantes" className="scroll-mt-20 bg-ink-950 text-sand-100">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 sm:py-24 lg:grid-cols-2 lg:items-center lg:gap-20">
            <div>
              <p className="text-sm font-medium text-hint-300">Para estudiantes</p>
              <h2 className="mt-3 text-[clamp(1.75rem,3.2vw,2.6rem)] font-semibold leading-tight tracking-tight text-sand-50">
                Sin cuentas. Solo el PIN de tu clase.
              </h2>
              <ul className="mt-8 space-y-4 text-[1.0625rem] leading-relaxed text-ink-100">
                <li className="flex gap-3">
                  <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-hint-400" aria-hidden="true" />
                  No te pedimos nombre, correo ni teléfono.
                </li>
                <li className="flex gap-3">
                  <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-hint-400" aria-hidden="true" />
                  Si te trabas, pides una pista. Llegan de una en una.
                </li>
                <li className="flex gap-3">
                  <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-hint-400" aria-hidden="true" />
                  Funciona en celulares sencillos y con internet lento.
                </li>
              </ul>
            </div>

            <form onSubmit={entrarConPin} className="rounded-[1.25rem] bg-ink-900 p-6 ring-1 ring-ink-800 sm:p-8" noValidate>
              <label htmlFor="landing-pin" className="text-sm font-medium text-ink-100">
                Escribe el PIN que te dio tu docente
              </label>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                <input
                  id="landing-pin"
                  value={pin}
                  onChange={(event) => {
                    setPin(event.target.value.toUpperCase())
                    if (pinError) setPinError("")
                  }}
                  maxLength={7}
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  placeholder="ABC123"
                  aria-invalid={Boolean(pinError)}
                  aria-describedby="landing-pin-ayuda"
                  className="min-h-12 flex-1 rounded-xl border border-ink-700 bg-ink-950 px-4 font-mono text-lg tracking-[0.3em] text-sand-50 placeholder:tracking-[0.3em] placeholder:text-ink-500 focus:border-hint-400 focus:outline-none focus:ring-4 focus:ring-hint-500/25"
                />
                <button
                  type="submit"
                  disabled={buscandoClase}
                  className="min-h-12 rounded-xl bg-hint-500 disabled:opacity-70 px-6 font-semibold text-sand-950 transition-colors duration-150 hover:bg-hint-400 active:translate-y-px focus:outline-none focus-visible:ring-4 focus-visible:ring-hint-300/40"
                >
                  {buscandoClase ? "Buscando tu clase…" : "Entrar a mi clase"}
                </button>
              </div>
              <p id="landing-pin-ayuda" className="mt-3 min-h-5 text-sm" aria-live="polite">
                {pinError ? (
                  <span className="text-hint-300">{pinError}</span>
                ) : (
                  <span className="text-ink-300">
                    ¿Solo quieres probar?{" "}
                    <button
                      type="button"
                      onClick={() => setPin("PISA26")}
                      className="font-mono text-hint-300 underline decoration-hint-300/50 underline-offset-2 hover:text-hint-200"
                    >
                      Usa PISA26
                    </button>
                  </span>
                )}
              </p>
            </form>
          </div>
        </section>

        {/* Alternativas */}
        <section id="alternativas" className="scroll-mt-20">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
            <h2 className="max-w-2xl text-[clamp(1.75rem,3.2vw,2.6rem)] font-semibold leading-tight tracking-tight text-sand-950">
              ¿Por qué no basta con lo que ya existe?
            </h2>

            <div className="mt-12 border-t border-sand-300">
              <div className="hidden grid-cols-[1fr_1.3fr_1.3fr] gap-8 border-b border-sand-200 py-3 text-sm font-medium text-sand-500 md:grid">
                <span>Lo que se usa hoy</span>
                <span>Dónde se queda corto</span>
                <span className="text-ink-800">Con ECduLearn</span>
              </div>
              {ALTERNATIVAS.map((fila) => (
                <div key={fila.hoy} className="grid gap-2 border-b border-sand-200 py-6 md:grid-cols-[1fr_1.3fr_1.3fr] md:gap-8">
                  <h3 className="font-semibold text-sand-950">{fila.hoy}</h3>
                  <p className="text-[0.9375rem] leading-relaxed text-sand-600">{fila.problema}</p>
                  <p className="text-[0.9375rem] leading-relaxed text-ink-900">
                    <span className="mr-1.5 text-hint-600 md:hidden" aria-hidden="true">→</span>
                    {fila.ecdulearn}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Privacidad */}
        <section id="privacidad" className="scroll-mt-20 border-t border-sand-200 bg-sand-100/70">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
            <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-20">
              <div>
                <p className="text-sm font-medium text-ink-800">Privacidad</p>
                <h2 className="mt-3 text-[clamp(1.75rem,3.2vw,2.6rem)] font-semibold leading-tight tracking-tight text-sand-950">
                  No pedimos datos de menores. Así de simple.
                </h2>
                <p className="mt-5 text-[1.0625rem] leading-relaxed text-sand-700">
                  Seguimos la Ley Orgánica de Protección de Datos Personales de Ecuador y las recomendaciones de la UNESCO
                  sobre inteligencia artificial en educación.
                </p>
              </div>

              <dl className="space-y-6">
                <div>
                  <dt className="font-semibold text-sand-950">Los estudiantes son anónimos</dt>
                  <dd className="mt-1 text-[0.9375rem] leading-relaxed text-sand-600">
                    Entran con el PIN de su clase y reciben un alias temporal. Nada más.
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-sand-950">Los docentes usan la cuenta del colegio</dt>
                  <dd className="mt-1 text-[0.9375rem] leading-relaxed text-sand-600">
                    Solo acceden quienes la institución autoriza, con su correo institucional y contraseña.
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-sand-950">El docente ve a la clase, no a la persona</dt>
                  <dd className="mt-1 text-[0.9375rem] leading-relaxed text-sand-600">
                    Las métricas son del grupo: cuántos resolvieron y en qué paso se trabaron.
                  </dd>
                </div>
              </dl>
            </div>

            <details className="group mt-12 border-t border-sand-300 pt-2">
              <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 font-medium text-ink-900 hover:text-ink-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-ink-100 [&::-webkit-details-marker]:hidden">
                <svg className="size-4 transition-transform duration-200 group-open:rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="m9 6 6 6-6 6" />
                </svg>
                Leer la política completa
              </summary>
              <div className="mt-4 grid max-w-4xl gap-8 pb-4 text-[0.9375rem] leading-relaxed text-sand-700 md:grid-cols-2">
                <section>
                  <h3 className="font-semibold text-sand-950">Datos de los estudiantes</h3>
                  <p className="mt-2">
                    De acuerdo con el Código de la Niñez y Adolescencia y la LOPDP, ECduLearn no pide, guarda ni procesa
                    información que identifique a un estudiante. El acceso a las actividades y al tutor es solo con un PIN
                    temporal de 6 caracteres.
                  </p>
                </section>
                <section>
                  <h3 className="font-semibold text-sand-950">Cuentas de docentes</h3>
                  <p className="mt-2">
                    Usamos el correo institucional que entrega el colegio. Las contraseñas viajan cifradas y nunca se
                    guardan en texto plano. Los paralelos no tienen listas con nombres de estudiantes, solo resultados del
                    grupo.
                  </p>
                </section>
                <section>
                  <h3 className="font-semibold text-sand-950">Cómo usamos la inteligencia artificial</h3>
                  <p className="mt-2">
                    El tutor tiene instrucciones que le prohíben entregar resultados o ecuaciones resueltas. Su trabajo es
                    preguntar y dar pistas para que el estudiante identifique los datos y razone por su cuenta.
                  </p>
                </section>
                <section>
                  <h3 className="font-semibold text-sand-950">Código abierto</h3>
                  <p className="mt-2">
                    ECduLearn se publica con licencia MIT. Cualquier colegio puede revisar cómo funciona y cómo trata la
                    información.
                  </p>
                </section>
              </div>
            </details>
          </div>
        </section>

        {/* Cierre */}
        <section className="border-t border-sand-200">
          <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-20 sm:px-6 md:flex-row md:items-end md:justify-between">
            <h2 className="max-w-xl text-[clamp(1.75rem,3.2vw,2.6rem)] font-semibold leading-tight tracking-tight text-sand-950">
              Pruébalo con tu próxima clase.
            </h2>
            <button
              type="button"
              onClick={onEnterApp}
              className="flex min-h-12 w-fit items-center gap-2 rounded-full bg-ink-950 px-6 text-[0.95rem] font-semibold text-sand-50 transition-colors duration-150 hover:bg-ink-800 active:translate-y-px focus:outline-none focus-visible:ring-4 focus-visible:ring-ink-200"
            >
              Entrar a la plataforma
              <Flecha />
            </button>
          </div>
        </section>
      </main>

      <footer className="border-t border-sand-300 bg-sand-100">
        <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-sand-600 sm:px-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Marca />
              <p className="mt-1">Proyecto de emprendimiento tecnológico · PUCE · Ecuador, 2026</p>
            </div>
            <div className="flex items-center gap-2">
              <a href="#privacidad" className="flex min-h-11 items-center rounded-lg px-2 hover:text-sand-950">
                Privacidad
              </a>
              <a
                href={REPO_URL}
                target="_blank"
                rel="noreferrer"
                className="flex min-h-11 items-center gap-1.5 rounded-lg px-2 hover:text-sand-950"
              >
                <svg className="size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                </svg>
                GitHub
              </a>
            </div>
          </div>
          <p className="mt-6 border-t border-sand-300 pt-6 text-[0.8125rem] leading-relaxed text-sand-500">
            Ariel Fabricio Chacha Pilco, Scrum Master y Tech Lead · Melissa Dayana Molina Sierra, Product Owner y UX/UI ·
            Joan Sebastian Santacruz Villamarin, Backend y base de datos. Licencia MIT.
          </p>
        </div>
      </footer>
    </div>
  )
}
