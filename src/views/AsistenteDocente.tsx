import { FormEvent, useEffect, useRef, useState } from "react"
import Icon, { Logo } from "@/components/Icon"
import ExerciseCard from "@/components/ExerciseCard"
import PublicarAulaDialog from "@/components/PublicarAulaDialog"
import { generateExerciseAI } from "@/services/aiService"
import { authController, ejerciciosController, isValidUuid } from "@/services/dbService"
import { estadoInicialDocente, SALUDO_ASISTENTE } from "@/models/estadoInicialDocente"
import { actualizarSesionDocente, useSesionDocente, type LetraParalelo, type MensajeChat } from "@/models/sesionDocente"
import { ACCIONES_EJERCICIO, instruccionVersion } from "@/models/accionesIA"
import type { Exercise } from "@/models/types"
import type { AppView } from "@/router"

const CURSOS = ["1ro BGU", "2do BGU", "3ro BGU"] as const
const DIFICULTADES = ["Básica", "Intermedia", "Avanzada"] as const
const CONTEXTOS = [
  "Metro de Quito y movilidad",
  "Galápagos y biodiversidad",
  "Economía familiar",
  "Deportes",
  "Agricultura y comercio local",
  "Volcanes y gestión de riesgos",
]

const selectClase =
  "mt-1.5 min-h-11 w-full rounded-xl border border-sand-300 bg-white px-3 text-sm text-sand-900 focus:border-ink-700 focus:outline-none focus:ring-4 focus:ring-ink-100"

type Reciente = { ejercicio: Exercise; creadoEn: string | null }

function cambioReal(nuevo: Exercise, actual: Exercise): boolean {
  const huella = (e: Exercise) => JSON.stringify([e.topic, e.situation, e.questionList, e.difficulty, e.level, e.solucionDocente])
  return nuevo.id !== "ex-default" && huella(nuevo) !== huella(actual)
}

function agregarMensaje(mensaje: Omit<MensajeChat, "id">) {
  actualizarSesionDocente((actual) => ({ mensajes: [...actual.mensajes, { ...mensaje, id: Date.now() + Math.random() }] }))
}

function fechaCorta(iso: string | null): string {
  if (!iso) return "En este dispositivo"
  return new Date(iso).toLocaleDateString("es-EC", { day: "numeric", month: "short" })
}

export default function AsistenteDocente({ setView }: { setView: (next: AppView) => void }) {
  const sesion = useSesionDocente(estadoInicialDocente)
  const { mensajes, ejercicio, versiones, tieneEjercicio, paralelos, paraleloActivo } = sesion

  const [publicarOpen, setPublicarOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [input, setInput] = useState("")
  const [generando, setGenerando] = useState<string | null>(null)
  const [recientes, setRecientes] = useState<Reciente[] | null>(null)
  const [usuario] = useState(() => authController.getCurrentUser())

  const [modoNuevo, setModoNuevo] = useState<"tema" | "transformar">("tema")
  const [curso, setCurso] = useState<(typeof CURSOS)[number]>("2do BGU")
  const [dificultad, setDificultad] = useState<(typeof DIFICULTADES)[number]>("Intermedia")
  const [tema, setTema] = useState("")
  const [contexto, setContexto] = useState("")
  const [mecanico, setMecanico] = useState("")

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const cargarRecientes = () => {
    ejerciciosController.getMisEjercicios().then(setRecientes)
  }

  useEffect(cargarRecientes, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }, [mensajes, generando])

  // Ejercicio nuevo: reinicia las versiones de paralelos y lo deja como activo
  const iniciarEjercicio = (nuevo: Exercise) => {
    actualizarSesionDocente(() => ({
      ejercicio: nuevo,
      tieneEjercicio: true,
      versiones: [],
      paralelos: { A: nuevo },
      paraleloActivo: "A",
    }))
  }

  // Ajuste del ejercicio de la pestaña activa: el anterior queda para «Versión anterior»
  const reemplazarActivo = (nuevo: Exercise) => {
    actualizarSesionDocente((actual) => ({
      versiones: [...actual.versiones, actual.ejercicio],
      ejercicio: nuevo,
      paralelos: { ...actual.paralelos, [actual.paraleloActivo]: nuevo },
    }))
  }

  const pedirIA = async (etiqueta: string, instruccion: string, modo: "nuevo" | "ajuste") => {
    if (generando) return
    agregarMensaje({ role: "user", text: etiqueta })
    setInput("")
    setGenerando("Preparando tu ejercicio…")
    const inicio = Date.now()

    try {
      const base = modo === "ajuste" && tieneEjercicio ? ejercicio : undefined
      const res = await generateExerciseAI(instruccion, base)
      const propuesto = res.data.exercise
      const hayCambio = modo === "nuevo" ? propuesto.id !== "ex-default" : cambioReal(propuesto, ejercicio)
      let guardado: Exercise | undefined

      if (hayCambio) {
        const padre = paralelos.A?.id
        guardado = await ejerciciosController.guardarComoActivo(propuesto, {
          ejercicioPadreId: modo === "ajuste" && isValidUuid(padre) ? padre : undefined,
          etiquetaVersion: modo === "ajuste" ? "Iteración 2" : "Original",
          tiempoCreacionSegundos: Math.max(1, Math.round((Date.now() - inicio) / 1000)),
        })
        if (modo === "nuevo") {
          iniciarEjercicio(guardado)
          cargarRecientes()
        } else {
          reemplazarActivo(guardado)
        }
      }

      agregarMensaje({ role: "assistant", text: res.data.reply, exercise: guardado, sinConexion: res.isOfflineFallback })
    } catch {
      agregarMensaje({ role: "assistant", text: "No pude procesar tu pedido. Inténtalo otra vez en unos segundos." })
    } finally {
      setGenerando(null)
    }
  }

  const crearDesdeFormulario = (event: FormEvent) => {
    event.preventDefault()
    const ctx = contexto ? `, en el contexto de ${contexto} en Ecuador` : ", con un contexto real de Ecuador"
    if (modoNuevo === "tema") {
      if (!tema.trim()) return
      pedirIA(
        `${tema.trim()} · ${curso} · ${dificultad}`,
        `Crea un ejercicio tipo PISA para ${curso}, dificultad ${dificultad}, sobre ${tema.trim()}${ctx}.`,
        "nuevo",
      )
    } else {
      if (!mecanico.trim()) return
      pedirIA(
        `Transformar: ${mecanico.trim().slice(0, 90)}`,
        `Transforma este ejercicio mecánico en un problema tipo PISA para ${curso}, dificultad ${dificultad}${ctx}: conserva el contenido matemático, agrega una situación real y preguntas que pidan razonar. Ejercicio: ${mecanico.trim()}`,
        "nuevo",
      )
    }
  }

  const enviarTexto = (texto: string) => {
    const limpio = texto.trim()
    if (!limpio) return
    // Con un ejercicio abierto, el texto libre lo ajusta; «crea…» o «transforma…» empieza otro
    const pideNuevo = !tieneEjercicio || /^(crea|genera|diseña|transforma|convierte)\b/i.test(limpio)
    pedirIA(limpio, limpio, pideNuevo ? "nuevo" : "ajuste")
  }

  const crearVersion = async (letra: Exclude<LetraParalelo, "A">) => {
    const original = paralelos.A
    if (!original || generando) return
    setGenerando(`Creando la Versión ${letra}…`)
    try {
      const res = await generateExerciseAI(instruccionVersion(letra), original)
      if (res.isOfflineFallback || !cambioReal(res.data.exercise, original)) {
        agregarMensaje({
          role: "assistant",
          text: `No pude crear la Versión ${letra} ahora porque la IA no respondió a tiempo. Inténtalo de nuevo en unos segundos.`,
          sinConexion: res.isOfflineFallback,
        })
        return
      }
      const guardada = await ejerciciosController.guardarComoActivo(res.data.exercise, {
        ejercicioPadreId: isValidUuid(original.id) ? original.id : undefined,
        etiquetaVersion: `Versión ${letra}`,
      })
      actualizarSesionDocente((actual) => ({
        paralelos: { ...actual.paralelos, [letra]: guardada },
        paraleloActivo: letra,
        ejercicio: guardada,
        versiones: [],
      }))
      agregarMensaje({
        role: "assistant",
        text: `Listo, la Versión ${letra}: misma estructura matemática con otros datos y otro escenario. Su solución está actualizada.`,
        exercise: guardada,
      })
    } finally {
      setGenerando(null)
    }
  }

  const cambiarParalelo = (letra: LetraParalelo) => {
    const elegido = paralelos[letra]
    if (!elegido) return
    ejerciciosController.guardarActivoLocal(elegido)
    actualizarSesionDocente(() => ({ paraleloActivo: letra, ejercicio: elegido, versiones: [] }))
  }

  const versionAnterior = () => {
    const anterior = versiones.at(-1)
    if (!anterior) return
    ejerciciosController.guardarActivoLocal(anterior)
    actualizarSesionDocente((actual) => ({
      ejercicio: anterior,
      versiones: actual.versiones.slice(0, -1),
      paralelos: { ...actual.paralelos, [actual.paraleloActivo]: anterior },
    }))
    agregarMensaje({ role: "assistant", text: "Volví a la versión anterior del ejercicio.", exercise: anterior })
  }

  const nuevoEjercicio = () => {
    actualizarSesionDocente(() => ({
      mensajes: [{ id: Date.now(), role: "assistant", text: SALUDO_ASISTENTE }],
      tieneEjercicio: false,
      versiones: [],
      paralelos: {},
      paraleloActivo: "A",
    }))
    setInput("")
    setSidebarOpen(false)
  }

  const abrirReciente = ({ ejercicio: elegido }: Reciente) => {
    ejerciciosController.guardarActivoLocal(elegido)
    iniciarEjercicio(elegido)
    agregarMensaje({ role: "assistant", text: `Abrí «${elegido.topic}». Puedes ajustarlo o publicarlo en una clase.`, exercise: elegido })
    setSidebarOpen(false)
  }

  return (
    <div className="ui-view min-h-screen bg-sand-100 text-sand-950">
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-sand-950/50 backdrop-blur-sm lg:hidden"
          aria-label="Cerrar navegación"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        id="app-sidebar"
        className={`fixed top-[var(--barra-evaluador,0px)] bottom-0 left-0 z-50 flex w-72 flex-col border-r border-sand-200 bg-sand-100 p-4 text-sand-900 transition-transform duration-300 print:hidden lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Navegación e historial"
      >
        <div className="flex items-center justify-between px-1">
          <Logo />
          <button
            type="button"
            className="grid size-11 place-items-center rounded-xl text-sand-700 hover:bg-sand-200 focus:outline-none focus:ring-4 focus:ring-ink-200 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Cerrar menú"
          >
            <Icon name="x" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setView("dashboard")}
          className="mt-5 flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-sand-700 transition hover:bg-sand-200 focus:outline-none focus:ring-4 focus:ring-ink-200"
        >
          <Icon name="arrow-left" className="size-4" />
          Volver al panel docente
        </button>

        <button
          type="button"
          onClick={nuevoEjercicio}
          className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-ink-950 px-4 text-sm font-bold text-white transition hover:bg-ink-800 focus:outline-none focus:ring-4 focus:ring-ink-200"
        >
          <Icon name="plus" className="size-5" />
          Nuevo ejercicio
        </button>

        <nav className="mt-8 min-h-0 flex-1 overflow-y-auto" aria-label="Tus ejercicios recientes">
          <p className="px-2 text-xs font-bold uppercase tracking-widest text-sand-600">Tus ejercicios</p>
          {recientes === null ? (
            <div className="mt-3 space-y-2" aria-busy="true">
              <p className="sr-only" role="status">
                Cargando tus ejercicios…
              </p>
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-xl bg-sand-200/80" />
              ))}
            </div>
          ) : recientes.length === 0 ? (
            <p className="mt-3 px-2 text-sm leading-relaxed text-sand-600">
              Aún no has creado ejercicios. El primero que hagas aparecerá aquí.
            </p>
          ) : (
            <div className="mt-3 space-y-1">
              {recientes.map((item) => (
                <button
                  key={item.ejercicio.id}
                  type="button"
                  onClick={() => abrirReciente(item)}
                  className={`min-h-14 w-full rounded-xl px-3 py-2.5 text-left transition hover:bg-sand-200 focus:outline-none focus:ring-4 focus:ring-ink-200 ${
                    tieneEjercicio && paralelos.A?.id === item.ejercicio.id ? "bg-white ring-1 ring-sand-200" : ""
                  }`}
                >
                  <span className="block truncate text-sm font-semibold text-sand-900">{item.ejercicio.topic}</span>
                  <span className="mt-1 block truncate text-xs text-sand-600">
                    {item.ejercicio.level} · {fechaCorta(item.creadoEn)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </nav>

        {usuario && (
          <div className="mt-4 flex min-h-14 items-center gap-3 border-t border-sand-200 px-2 pt-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ink-100 text-ink-950">
              <Icon name="user" className="size-5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{usuario.name}</span>
              <span className="block truncate text-xs text-sand-600">{usuario.institution}</span>
            </span>
          </div>
        )}
      </aside>

      <div className="flex min-h-screen flex-col lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-sand-200 bg-white/95 backdrop-blur print:hidden">
          <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                className="grid size-11 shrink-0 place-items-center rounded-xl text-sand-700 hover:bg-sand-100 focus:outline-none focus:ring-4 focus:ring-ink-100 lg:hidden"
                onClick={() => setSidebarOpen(true)}
                aria-label="Abrir menú"
                aria-controls="app-sidebar"
                aria-expanded={sidebarOpen}
              >
                <Icon name="menu" />
              </button>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-sand-950">{tieneEjercicio ? ejercicio.topic : "Nuevo ejercicio"}</p>
                <p className="flex items-center gap-1.5 text-xs text-sand-500">
                  <span className="size-1.5 rounded-full bg-ink-500" />
                  Asistente pedagógico
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {tieneEjercicio && versiones.length > 0 && (
                <button
                  type="button"
                  onClick={versionAnterior}
                  disabled={Boolean(generando)}
                  className="flex min-h-11 items-center gap-2 rounded-xl border border-sand-200 px-3 text-sm font-semibold text-sand-700 transition hover:bg-sand-50 focus:outline-none focus:ring-4 focus:ring-ink-100 disabled:opacity-50"
                >
                  <Icon name="undo" className="size-4" />
                  <span className="hidden sm:inline">Versión anterior</span>
                </button>
              )}
              {tieneEjercicio && (
                <button
                  type="button"
                  onClick={() => setView("editor")}
                  className="flex min-h-11 items-center gap-2 rounded-xl bg-ink-950 px-3 text-sm font-semibold text-white transition hover:bg-ink-900 focus:outline-none focus:ring-4 focus:ring-ink-100 sm:px-4"
                >
                  <Icon name="file" className="size-4" />
                  <span className="hidden sm:inline">Editar guía</span>
                </button>
              )}
              {tieneEjercicio && (
                <button
                  type="button"
                  onClick={() => setPublicarOpen(true)}
                  className="flex min-h-11 items-center gap-2 rounded-xl border border-ink-300 bg-ink-50 px-3 text-sm font-semibold text-ink-900 transition hover:bg-ink-100 focus:outline-none focus:ring-4 focus:ring-ink-100 sm:px-4"
                >
                  <Icon name="send" className="size-4" />
                  <span>Publicar</span>
                </button>
              )}
            </div>
          </div>

          {tieneEjercicio && (
            <div className="mx-auto flex max-w-5xl items-center gap-2 overflow-x-auto px-4 pb-3 sm:px-6" role="group" aria-label="Versiones para paralelos">
              <span className="shrink-0 text-xs font-semibold text-sand-500">Paralelos:</span>
              {(["A", "B", "C"] as const).map((letra) =>
                paralelos[letra] ? (
                  <button
                    key={letra}
                    type="button"
                    aria-pressed={paraleloActivo === letra}
                    onClick={() => cambiarParalelo(letra)}
                    className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-semibold transition-colors duration-150 focus:outline-none focus:ring-4 focus:ring-ink-100 ${
                      paraleloActivo === letra ? "bg-ink-950 text-white" : "border border-sand-300 bg-white text-sand-700 hover:bg-sand-50"
                    }`}
                  >
                    Versión {letra}
                  </button>
                ) : (
                  letra !== "A" && (
                    <button
                      key={letra}
                      type="button"
                      disabled={Boolean(generando) || !paralelos.A}
                      onClick={() => crearVersion(letra)}
                      className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border border-dashed border-sand-400 px-4 text-sm font-semibold text-sand-700 transition-colors duration-150 hover:border-ink-400 hover:bg-ink-50 focus:outline-none focus:ring-4 focus:ring-ink-100 disabled:opacity-50"
                    >
                      <Icon name="plus" className="size-4" />
                      Crear versión {letra}
                    </button>
                  )
                ),
              )}
            </div>
          )}
        </header>

        <main className="flex-1">
          <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
            <div className="space-y-6 print:hidden" aria-live="polite" aria-busy={Boolean(generando)}>
              {mensajes.map((message) =>
                message.role === "user" ? (
                  <div key={message.id} className="ui-msg flex justify-end">
                    <div className="max-w-xl rounded-2xl rounded-br-md bg-ink-950 px-4 py-3 text-sm leading-relaxed text-white shadow-sm sm:px-5">
                      {message.text}
                    </div>
                  </div>
                ) : (
                  <div key={message.id} className="ui-msg space-y-4">
                    <div className="flex items-start gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-ink-100 text-ink-800 shadow-sm">
                        <Icon name="sparkles" className="size-4" />
                      </span>
                      <div className="max-w-2xl rounded-2xl rounded-tl-md border border-sand-200 bg-white px-4 py-3.5 text-sm leading-relaxed text-sand-800 shadow-sm sm:px-5">
                        <div className="whitespace-pre-line text-sand-700">{message.text}</div>
                        {message.sinConexion && (
                          <p className="mt-2 border-t border-sand-100 pt-2 text-xs text-sand-500">
                            La IA no respondió a tiempo: esta respuesta es una propuesta preparada de antemano.
                          </p>
                        )}
                      </div>
                    </div>
                    {message.exercise && <ExerciseCard exercise={message.exercise} />}
                  </div>
                ),
              )}

              {generando && (
                <div className="ui-msg flex items-start gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-ink-100 text-ink-800">
                    <Icon name="sparkles" className="size-4" />
                  </span>
                  <div
                    className="flex min-h-12 items-center gap-3 rounded-2xl rounded-tl-md border border-ink-200 bg-ink-50/80 px-5 text-sm font-semibold text-ink-900 shadow-sm"
                    role="status"
                  >
                    <span className="ui-typing flex items-center gap-1" aria-hidden="true">
                      <span className="size-1.5 rounded-full bg-ink-600" />
                      <span className="size-1.5 rounded-full bg-ink-600" />
                      <span className="size-1.5 rounded-full bg-ink-600" />
                    </span>
                    {generando}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} className="h-2" />
            </div>

            {!tieneEjercicio && !generando && (
              <form onSubmit={crearDesdeFormulario} className="ui-enter mx-auto mt-8 max-w-2xl rounded-2xl border border-sand-200 bg-white p-5 shadow-sm sm:p-7 print:hidden">
                <h1 className="text-xl font-bold tracking-tight text-ink-950">¿Qué vamos a crear hoy?</h1>
                <div className="mt-4 flex gap-2" role="tablist" aria-label="Forma de crear el ejercicio">
                  {(
                    [
                      ["tema", "Desde un tema"],
                      ["transformar", "Transformar un ejercicio"],
                    ] as const
                  ).map(([valor, etiqueta]) => (
                    <button
                      key={valor}
                      type="button"
                      role="tab"
                      aria-selected={modoNuevo === valor}
                      onClick={() => setModoNuevo(valor)}
                      className={`min-h-11 rounded-full px-4 text-sm font-semibold transition-colors duration-150 focus:outline-none focus:ring-4 focus:ring-ink-100 ${
                        modoNuevo === valor ? "bg-ink-950 text-white" : "border border-sand-300 text-sand-700 hover:bg-sand-50"
                      }`}
                    >
                      {etiqueta}
                    </button>
                  ))}
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-semibold text-sand-800">
                    Curso
                    <select value={curso} onChange={(e) => setCurso(e.target.value as typeof curso)} className={selectClase}>
                      {CURSOS.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm font-semibold text-sand-800">
                    Dificultad
                    <select value={dificultad} onChange={(e) => setDificultad(e.target.value as typeof dificultad)} className={selectClase}>
                      {DIFICULTADES.map((d) => (
                        <option key={d}>{d}</option>
                      ))}
                    </select>
                  </label>
                </div>

                {modoNuevo === "tema" ? (
                  <label className="mt-4 block text-sm font-semibold text-sand-800">
                    Tema o destreza
                    <input
                      value={tema}
                      onChange={(e) => setTema(e.target.value)}
                      required
                      maxLength={150}
                      placeholder="Ej. funciones cuadráticas, porcentajes, probabilidad"
                      className="mt-1.5 min-h-11 w-full rounded-xl border border-sand-300 bg-white px-3 text-sm text-sand-900 placeholder:text-sand-400 focus:border-ink-700 focus:outline-none focus:ring-4 focus:ring-ink-100"
                    />
                  </label>
                ) : (
                  <label className="mt-4 block text-sm font-semibold text-sand-800">
                    Ejercicio mecánico
                    <textarea
                      value={mecanico}
                      onChange={(e) => setMecanico(e.target.value)}
                      required
                      rows={3}
                      maxLength={1500}
                      placeholder="Pega el ejercicio del libro. Ej. Resuelve x² − 5x + 6 = 0"
                      className="mt-1.5 w-full resize-none rounded-xl border border-sand-300 bg-white p-3 text-sm text-sand-900 placeholder:text-sand-400 focus:border-ink-700 focus:outline-none focus:ring-4 focus:ring-ink-100"
                    />
                  </label>
                )}

                <label className="mt-4 block text-sm font-semibold text-sand-800">
                  Contexto
                  <select value={contexto} onChange={(e) => setContexto(e.target.value)} className={selectClase}>
                    <option value="">Que el asistente proponga uno</option>
                    {CONTEXTOS.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>

                <button
                  type="submit"
                  disabled={modoNuevo === "tema" ? !tema.trim() : !mecanico.trim()}
                  className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-ink-950 px-5 text-sm font-bold text-white transition hover:bg-ink-800 focus:outline-none focus:ring-4 focus:ring-ink-200 disabled:cursor-not-allowed disabled:bg-sand-300"
                >
                  <Icon name="sparkles" className="size-4" />
                  {modoNuevo === "tema" ? "Crear ejercicio" : "Transformar a tipo PISA"}
                </button>
              </form>
            )}
            <div className="h-4" />
          </div>
        </main>

        <footer className="sticky bottom-0 z-20 border-t border-sand-200 bg-white/95 px-4 py-3 backdrop-blur print:hidden sm:px-6">
          <form
            onSubmit={(event) => {
              event.preventDefault()
              enviarTexto(input)
            }}
            className="mx-auto max-w-4xl"
          >
            {tieneEjercicio && (
              <div className="mb-2.5 flex items-center gap-2 overflow-x-auto pb-1" role="group" aria-label="Ajustes rápidos">
                {ACCIONES_EJERCICIO.map((accion) => (
                  <button
                    key={accion.etiqueta}
                    type="button"
                    disabled={Boolean(generando)}
                    onClick={() => pedirIA(accion.etiqueta, accion.instruccion, "ajuste")}
                    className="min-h-11 shrink-0 rounded-full border border-sand-200 bg-sand-50 px-4 text-sm font-semibold text-sand-700 transition hover:border-ink-400 hover:bg-ink-50 focus:outline-none focus:ring-4 focus:ring-ink-100 disabled:opacity-50"
                  >
                    {accion.etiqueta}
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-end gap-2 rounded-2xl border border-sand-300 bg-white p-2 shadow-lg shadow-sand-900/5 transition focus-within:border-ink-700 focus-within:ring-4 focus-within:ring-ink-100">
              <label htmlFor="chat-input" className="sr-only">
                Escribe una instrucción para el asistente
              </label>
              <textarea
                id="chat-input"
                rows={1}
                value={input}
                disabled={Boolean(generando)}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault()
                    enviarTexto(input)
                  }
                }}
                placeholder={tieneEjercicio ? "Ej. «agrega una pregunta sobre el costo total»" : "O escribe directamente lo que necesitas"}
                className="max-h-32 min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm leading-6 text-sand-900 outline-none placeholder:text-sand-400 disabled:cursor-wait"
              />
              <button
                type="submit"
                disabled={!input.trim() || Boolean(generando)}
                className="grid size-11 shrink-0 place-items-center rounded-xl bg-ink-950 text-white transition hover:bg-ink-900 focus:outline-none focus:ring-4 focus:ring-ink-200 disabled:cursor-not-allowed disabled:bg-sand-300"
                aria-label="Enviar instrucción"
              >
                <Icon name="send" className="size-5" />
              </button>
            </div>
            <p className="mt-2 text-center text-xs text-sand-500">
              ECduLearn puede equivocarse. Revisa los resultados antes de usarlos en clase.
            </p>
          </form>
        </footer>
      </div>

      {publicarOpen && (
        <PublicarAulaDialog onClose={() => setPublicarOpen(false)} onIrAlAsistente={() => setPublicarOpen(false)} />
      )}
    </div>
  )
}
