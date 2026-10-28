import { FormEvent, useEffect, useRef, useState } from "react"
import Icon, { Logo } from "@/components/Icon"
import ExerciseCard from "@/components/ExerciseCard"
import PublicarAulaDialog from "@/components/PublicarAulaDialog"
import { EvaluatorPill, EvaluatorTopBar } from "@/components/BarraEvaluador"
import { generateExerciseAI } from "@/services/aiService"
import { ejerciciosController } from "@/services/dbService"
import { estadoInicialDocente, initialExercise } from "@/models/estadoInicialDocente"
import { setterSesion, useSesionDocente } from "@/models/sesionDocente"
import type { Exercise } from "@/models/types"
import type { AppView } from "@/router"

const recentItems = [
  {
    title: "Análisis estructural",
    meta: "Ingeniería Civil · Ahora",
    context: "Ingeniería civil",
  },

  {
    title: "Funciones cuadráticas",
    meta: "Arquitectura · Ayer",
    context: "Arquitectura",
  },

  {
    title: "Interés compuesto",
    meta: "Finanzas · 12 jun",
    context: "Economía",
  },
]

const quickActions = [
  "✨ Orientación PISA",

  "🔄 Convertir mecánico a razonamiento",

  "⚖️ Ajustar dificultad",

  "📑 Crear Versión B/C",

  "🔍 Generar solución paso a paso",
]

const setMessages = setterSesion("mensajes")
const setExercise = setterSesion("ejercicio")
const setVersions = setterSesion("versiones")
const setHasExercise = setterSesion("tieneEjercicio")

export default function AsistenteDocente({
  view,
  setView,
}: {
  view: AppView
  setView: (next: AppView) => void
}) {
  const [publicarOpen, setPublicarOpen] = useState(false)

  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Estado compartido con el editor A4: sobrevive al ir del chat al editor y volver
  const sesion = useSesionDocente(estadoInicialDocente)
  const messages = sesion.mensajes
  const exercise = sesion.ejercicio
  const versions = sesion.versiones
  const hasExercise = sesion.tieneEjercicio




  const [input, setInput] = useState("")

  const [isGenerating, setIsGenerating] = useState(false)

  const timerRef = useRef<number | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(
    () => () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    },

    [],
  )

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    })
  }, [messages, isGenerating])

  const processPrompt = async (prompt: string) => {
    if (!prompt.trim() || isGenerating) return

    setMessages((current) => [
      ...current,

      { id: Date.now(), role: "user", text: prompt.trim() },
    ])

    setInput("")

    setIsGenerating(true)

    try {
      const res = await generateExerciseAI(
        prompt,
        hasExercise ? exercise : undefined,
      )

      const newEx = res.data.exercise

      const hasMeaningfulChange =
        newEx &&
        newEx.topic &&
        (newEx.topic !== exercise.topic ||
          newEx.difficulty !== exercise.difficulty ||
          newEx.questions !== exercise.questions ||
          newEx.version > exercise.version)

      let updatedExercise: Exercise | undefined = undefined

      if (hasMeaningfulChange) {
        if (hasExercise) setVersions((current) => [...current, exercise])

        updatedExercise = {
          ...newEx,

          version: exercise.version + 1,
        }

        setExercise(updatedExercise)

        setHasExercise(true)

        // Guarda en ejercicios_pisa y reemplaza el id local por el UUID real
        // Mismo tema = versión del ejercicio actual; tema nuevo = ejercicio original
        const esVersion = hasExercise && newEx.topic === exercise.topic

        const guardado = await ejerciciosController.guardarComoActivo(updatedExercise, {
          ejercicioPadreId: esVersion ? exercise.id : undefined,

          etiquetaVersion: !esVersion
            ? "Original"
            : /versi[oó]n/i.test(prompt)
              ? "Versión B"
              : "Iteración 2",

          tiempoCreacionSegundos: 8,
        })

        if (guardado.id !== updatedExercise.id) {
          updatedExercise = guardado

          setExercise(guardado)
        }
      }

      setMessages((current) => [
        ...current,

        {
          id: Date.now() + 1,

          role: "assistant",

          text: res.data.reply,

          exercise: updatedExercise,
        },
      ])
    } catch {
      setMessages((current) => [
        ...current,

        {
          id: Date.now() + 1,

          role: "assistant",

          text: "¡Hola! Tu mensaje ha sido recibido. Puedes pedirme crear una actividad contextualizada tipo PISA para Ecuador (ej: «Crea un ejercicio sobre el Metro de Quito para 2do BGU») o ajustar este ejercicio.",
        },
      ])
    } finally {
      setIsGenerating(false)
    }
  }

  const submitPrompt = (event: FormEvent) => {
    event.preventDefault()

    processPrompt(input)
  }

  const startNewExercise = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current)

    setMessages([
      {
        id: Date.now(),

        role: "assistant",

        text: "¡Nuevo espacio iniciado! ¿Qué tema o destreza deseas trabajar hoy? Escribe tu idea (ej: «Crea un ejercicio de funciones cuadráticas sobre el Metro de Quito para 2do BGU») o haz una consulta metodológica.",
      },
    ])

    setHasExercise(false)

    setVersions([])

    setInput("")

    setIsGenerating(false)

    setSidebarOpen(false)
  }

  const undoVersion = () => {
    const previous = versions.at(-1)

    if (!previous) return

    setExercise(previous)

    setVersions((current) => current.slice(0, -1))

    setMessages((current) => [
      ...current,

      {
        id: Date.now(),

        role: "assistant",

        text: `Restauré la versión ${previous.version}. Puedes seguir iterando sin perder tu trabajo.`,

        exercise: previous,
      },
    ])
  }

  const openRecent = (item: typeof recentItems[number]) => {
    const recentExercise = {
      ...initialExercise,

      topic: item.title,

      context: item.context,
    }

    setExercise(recentExercise)

    setHasExercise(true)

    setVersions([])

    setMessages([
      {
        id: Date.now(),

        role: "assistant",

        text: `Abrí “${item.title}”. Puedes continuar desde donde lo dejaste o pedir cualquier cambio con el asistente Gemini.`,

        exercise: recentExercise,
      },
    ])

    setSidebarOpen(false)
  }

  return (
    <div className="ui-view min-h-screen bg-sand-100 text-sand-950">
      <EvaluatorTopBar currentView={view} onViewChange={setView} />
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
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-sand-200 bg-sand-100 p-4 text-sand-900 transition-transform duration-300 print:hidden lg:translate-x-0 ${
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
          onClick={startNewExercise}
          className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-ink-950 px-4 text-sm font-bold text-white transition hover:bg-ink-800 focus:outline-none focus:ring-4 focus:ring-ink-200"
        >
          <Icon name="plus" className="size-5" />
          Nuevo ejercicio
        </button>

        <nav
          className="mt-8 min-h-0 flex-1 overflow-y-auto"
          aria-label="Ejercicios recientes"
        >
          <p className="px-2 text-xs font-bold uppercase tracking-widest text-sand-600">
            Recientes
          </p>
          <div className="mt-3 space-y-1">
            {recentItems.map((item, index) => (
              <button
                key={item.title}
                type="button"
                onClick={() => openRecent(item)}
                className={`min-h-16 w-full rounded-xl px-3 py-2.5 text-left transition hover:bg-sand-200 focus:outline-none focus:ring-4 focus:ring-ink-200 ${
                  index === 0 && hasExercise
                    ? "bg-white ring-1 ring-sand-200"
                    : ""
                }`}
              >
                <span className="block truncate text-sm font-semibold text-sand-900">
                  {item.title}
                </span>
                <span className="mt-1 block truncate text-xs text-sand-600">
                  {item.meta}
                </span>
              </button>
            ))}
          </div>
        </nav>

        <div className="rounded-2xl bg-hint-50 p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-hint-800">
            <Icon name="info" className="size-4" />
            Tip para iterar
          </div>
          <p className="mt-2 text-xs leading-relaxed text-sand-700">
            Escribe “contexto de arquitectura” para adaptar la guía al instante.
          </p>
        </div>

        <button
          type="button"
          className="mt-4 flex min-h-14 items-center gap-3 rounded-xl border-t border-sand-200 px-2 text-left hover:bg-sand-200 focus:outline-none focus:ring-4 focus:ring-ink-200"
        >
          <span className="grid size-10 place-items-center rounded-full bg-ink-100 text-ink-950">
            <Icon name="user" className="size-5" />
          </span>
          <span>
            <span className="block text-sm font-semibold">María Andrade</span>
            <span className="block text-xs text-sand-600">
              Docente · 2do BGU
            </span>
          </span>
        </button>
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
                <p className="truncate text-sm font-bold text-sand-950">
                  {hasExercise ? exercise.topic : "Nuevo ejercicio"}
                </p>
                <p className="flex items-center gap-1.5 text-xs text-sand-500">
                  <span className="size-1.5 rounded-full bg-ink-500" />
                  Asistente pedagógico
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {hasExercise && versions.length > 0 && (
                <button
                  type="button"
                  onClick={undoVersion}
                  className="flex min-h-11 items-center gap-2 rounded-xl border border-sand-200 px-3 text-sm font-semibold text-sand-700 transition hover:bg-sand-50 focus:outline-none focus:ring-4 focus:ring-ink-100"
                >
                  <Icon name="undo" className="size-4" />
                  <span className="hidden sm:inline">Deshacer</span>
                </button>
              )}
              {hasExercise && (
                <button
                  type="button"
                  onClick={() => setView("editor")}
                  className="flex min-h-11 items-center gap-2 rounded-xl bg-ink-950 px-3 text-sm font-semibold text-white transition hover:bg-ink-900 focus:outline-none focus:ring-4 focus:ring-ink-100 sm:px-4"
                >
                  <Icon name="file" className="size-4" />
                  <span className="hidden sm:inline">Editar guía</span>
                </button>
              )}
              {hasExercise && (
                <button
                  type="button"
                  onClick={() => setPublicarOpen(true)}
                  className="flex min-h-11 items-center gap-2 rounded-xl border border-ink-300 bg-ink-50 px-3 text-sm font-semibold text-ink-900 transition hover:bg-ink-100 focus:outline-none focus:ring-4 focus:ring-ink-100 sm:px-4"
                >
                  <Icon name="send" className="size-4" />
                  <span>Publicar</span>
                </button>
              )}
              {publicarOpen && (
                <PublicarAulaDialog onClose={() => setPublicarOpen(false)} onIrAlAsistente={() => setPublicarOpen(false)} />
              )}
            </div>
          </div>
        </header>

        <main className="flex-1">
          <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
            <div className="mb-8 flex items-center justify-center gap-2 text-xs font-medium text-sand-500 print:hidden">
              <Icon name="clock" className="size-4" />
              Hoy
            </div>

            <div
              className="space-y-6 print:hidden"
              aria-live="polite"
              aria-busy={isGenerating}
            >
              {messages.map((message) =>
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
                        <div className="mb-2 border-b border-sand-100 pb-1.5 text-xs font-bold text-ink-700">
                          Asistente pedagógico
                        </div>
                        <div className="whitespace-pre-line text-sand-700 leading-relaxed font-normal">
                          {message.text}
                        </div>
                      </div>
                    </div>
                    {message.exercise && (
                      <ExerciseCard exercise={message.exercise} />
                    )}
                  </div>
                ),
              )}

              {isGenerating && (
                <div className="ui-msg flex items-start gap-3" aria-live="polite">
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
                    Preparando tu ejercicio…
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} className="h-2" />
            </div>

            {!hasExercise && !isGenerating && (
              <div className="mx-auto mt-10 max-w-2xl text-center print:hidden">
                <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-ink-950 text-white shadow-lg shadow-ink-950/15">
                  <Icon name="sparkles" className="size-6" />
                </span>
                <h1 className="mt-5 text-2xl font-bold tracking-tight text-ink-950 sm:text-3xl">
                  ¿Qué vamos a crear hoy?
                </h1>
                <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-sand-600">
                  Describe un tema, curso o contexto. ECduLearn lo convertirá en
                  una actividad de razonamiento lista para usar.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {[
                    "Funciones cuadráticas para 1ro BGU",
                    "Probabilidad con fútbol",
                    "Finanzas personales",
                  ].map(
                    (suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => processPrompt(suggestion)}
                        className="min-h-11 rounded-full border border-sand-300 bg-white px-4 text-sm font-semibold text-sand-700 shadow-sm transition hover:border-ink-300 hover:bg-ink-50 focus:outline-none focus:ring-4 focus:ring-ink-100"
                      >
                        {suggestion}
                      </button>
                    ),
                  )}
                </div>
              </div>
            )}
            <div className="h-4" />
          </div>
        </main>

        <footer className="sticky bottom-0 z-20 border-t border-sand-200 bg-white/95 px-4 py-3 backdrop-blur print:hidden sm:px-6">
          <form onSubmit={submitPrompt} className="mx-auto max-w-4xl">
            <div className="mb-2.5 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <span className="shrink-0 font-bold text-sand-400">
                Atajos rápidos:
              </span>
              {quickActions.map((action) => (
                <button
                  key={action}
                  type="button"
                  disabled={isGenerating}
                  onClick={() => processPrompt(action)}
                  className="shrink-0 rounded-full border border-sand-200 bg-sand-50 px-3.5 py-1 text-xs font-semibold text-sand-700 shadow-sm transition hover:border-ink-400 hover:bg-ink-50 focus:outline-none focus:ring-2 focus:ring-ink-200 disabled:opacity-50"
                >
                  {action}
                </button>
              ))}
            </div>
            <div className="flex items-end gap-2 rounded-2xl border border-sand-300 bg-white p-2 shadow-lg shadow-sand-900/5 transition focus-within:border-ink-700 focus-within:ring-4 focus-within:ring-ink-100">
              <label htmlFor="chat-input" className="sr-only">
                Escribe una instrucción para ECduLearn
              </label>
              <textarea
                id="chat-input"
                rows={1}
                value={input}
                disabled={isGenerating}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault()

                    processPrompt(input)
                  }
                }}
                placeholder="Ej: “más fácil”, “contexto de arquitectura”, “agrega una pregunta”..."
                className="max-h-32 min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm leading-6 text-sand-900 outline-none placeholder:text-sand-400 disabled:cursor-wait"
              />
              <button
                type="submit"
                disabled={!input.trim() || isGenerating}
                className="grid size-11 shrink-0 place-items-center rounded-xl bg-ink-950 text-white transition hover:bg-ink-900 focus:outline-none focus:ring-4 focus:ring-ink-200 disabled:cursor-not-allowed disabled:bg-sand-300"
                aria-label="Enviar instrucción"
              >
                <Icon name="send" className="size-5" />
              </button>
            </div>
            <p className="mt-2 text-center text-xs text-sand-400">
              ECduLearn puede equivocarse. Revisa los resultados antes de
              usarlos en clase.
            </p>
          </form>
        </footer>
      </div>
      <EvaluatorPill currentView={view} onViewChange={setView} />
    </div>
  )
}
