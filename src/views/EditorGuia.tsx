import { useEffect, useRef, useState } from "react"
import Icon from "@/components/Icon"
import { generateExerciseAI } from "@/services/aiService"
import { ejerciciosController, isValidUuid } from "@/services/dbService"
import { estadoInicialDocente } from "@/models/estadoInicialDocente"
import { actualizarSesionDocente, useSesionDocente } from "@/models/sesionDocente"
import { ACCIONES_EJERCICIO, type AccionIA } from "@/models/accionesIA"
import type { Exercise } from "@/models/types"

// En el editor solo tienen sentido las acciones que reescriben el documento
const ACCIONES_EDITOR = ACCIONES_EJERCICIO.filter((a) => a.etiqueta !== "Orientación PISA" && a.etiqueta !== "Solución paso a paso")

function EditorTools({
  command,
  ocupado,
  onCommandChange,
  onApply,
  onQuickAction,
}: {
  command: string
  ocupado: boolean
  onCommandChange: (value: string) => void
  onApply: () => void
  onQuickAction: (accion: AccionIA) => void
}) {
  return (
    <div className="space-y-7">
      <section>
        <div className="flex items-center gap-2 text-sm font-bold text-sand-900">
          <Icon name="magic" className="size-4 text-ink-800" />
          Ajuste rápido con IA
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {ACCIONES_EDITOR.map((accion) => (
            <button
              key={accion.etiqueta}
              type="button"
              disabled={ocupado}
              onClick={() => onQuickAction(accion)}
              className="min-h-11 rounded-full border border-sand-300 bg-white px-4 text-sm font-semibold text-sand-700 transition hover:border-ink-400 hover:bg-ink-50 focus:outline-none focus:ring-4 focus:ring-ink-100 disabled:opacity-50"
            >
              {accion.etiqueta}
            </button>
          ))}
        </div>
      </section>

      <section className="border-t border-sand-200 pt-6">
        <label htmlFor="ai-command" className="text-sm font-bold text-sand-900">
          Instrucción personalizada
        </label>
        <textarea
          id="ai-command"
          rows={4}
          value={command}
          onChange={(event) => onCommandChange(event.target.value)}
          placeholder="Ej: «Reescribe la pregunta 2 para que hable de economía local»"
          className="mt-3 w-full resize-none rounded-xl border border-sand-300 bg-white p-3 text-sm leading-relaxed text-sand-800 outline-none placeholder:text-sand-400 focus:border-ink-700 focus:ring-4 focus:ring-ink-100"
        />
        <button
          type="button"
          disabled={!command.trim() || ocupado}
          onClick={onApply}
          className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-ink-950 px-4 text-sm font-bold text-white transition hover:bg-ink-900 focus:outline-none focus:ring-4 focus:ring-ink-100 disabled:cursor-not-allowed disabled:bg-sand-300"
        >
          <Icon name="sparkles" className="size-4" />
          Aplicar al documento
        </button>
      </section>
    </div>
  )
}

function EditorView({
  exercise,
  hayAnterior,
  onBack,
  onExerciseChange,
  onEditarCampo,
  onVersionAnterior,
}: {
  exercise: Exercise
  hayAnterior: boolean
  onBack: () => void
  onExerciseChange: (exercise: Exercise) => void
  onEditarCampo: (cambio: Partial<Exercise>) => void
  onVersionAnterior: () => void
}) {
  const [command, setCommand] = useState("")
  const [notice, setNotice] = useState("Todos los cambios guardados")
  const [ocupado, setOcupado] = useState(false)
  const [toolsOpen, setToolsOpen] = useState(false)

  const applyAI = async (etiqueta: string, instruccion: string) => {
    setOcupado(true)
    setNotice(`Aplicando «${etiqueta}»…`)
    const res = await generateExerciseAI(instruccion, exercise)
    const cambio = JSON.stringify([res.data.exercise.situation, res.data.exercise.questionList, res.data.exercise.difficulty]) !==
      JSON.stringify([exercise.situation, exercise.questionList, exercise.difficulty])

    if (!cambio) {
      setNotice(res.isOfflineFallback ? "La IA no respondió a tiempo. Inténtalo de nuevo." : "La IA no propuso cambios esta vez.")
    } else {
      const activo = await ejerciciosController.guardarComoActivo(res.data.exercise, {
        ejercicioPadreId: isValidUuid(exercise.id) ? exercise.id : undefined,
        etiquetaVersion: "Iteración 2",
      })
      onExerciseChange(activo)
      setNotice("Listo, el cambio quedó guardado.")
    }
    setOcupado(false)
    setCommand("")
  }

  return (
    <div className="ui-view min-h-screen bg-sand-200 text-sand-950">
      <header className="sticky top-0 z-40 border-b border-sand-200 bg-white/95 backdrop-blur print:hidden">
        <div className="grid min-h-16 grid-cols-[auto_1fr_auto] items-center gap-3 px-3 sm:px-5">
          <button
            type="button"
            onClick={onBack}
            className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-sand-700 transition hover:bg-sand-100 focus:outline-none focus:ring-4 focus:ring-ink-100"
          >
            <Icon name="arrow-left" className="size-5" />
            <span className="hidden sm:inline">Volver al chat</span>
          </button>

          <div className="mx-auto min-w-0 max-w-xl text-center">
            <p className="truncate text-sm font-bold text-sand-950 sm:text-base">Guía PISA: {exercise.topic}</p>
            <p className="mt-0.5 flex items-center justify-center gap-1.5 text-xs text-sand-500" aria-live="polite">
              <Icon name="check" className="size-3.5 text-ink-600" />
              {notice}
            </p>
          </div>

          <div className="flex items-center justify-end gap-1.5">
            {hayAnterior && (
              <button
                type="button"
                onClick={onVersionAnterior}
                disabled={ocupado}
                className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-sand-700 transition hover:bg-sand-100 focus:outline-none focus:ring-4 focus:ring-ink-100 disabled:opacity-50"
              >
                <Icon name="undo" className="size-4" />
                <span className="hidden md:inline">Versión anterior</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => window.print()}
              className="flex min-h-11 items-center gap-2 rounded-xl bg-ink-950 px-3 text-sm font-bold text-white transition hover:bg-ink-900 focus:outline-none focus:ring-4 focus:ring-ink-100 sm:px-4"
            >
              <Icon name="printer" className="size-4" />
              <span className="hidden sm:inline">Imprimir o guardar PDF</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-4rem)]">
        <aside className="hidden w-80 shrink-0 border-r border-sand-200 bg-white p-6 print:hidden lg:block">
          <EditorTools
            command={command}
            ocupado={ocupado}
            onCommandChange={setCommand}
            onApply={() => applyAI("Instrucción personalizada", command)}
            onQuickAction={(accion) => applyAI(accion.etiqueta, accion.instruccion)}
          />
        </aside>

        <main className="min-w-0 flex-1 overflow-auto px-3 py-6 pb-28 sm:px-8 sm:py-10 lg:pb-10">
          <p className="mx-auto mb-4 max-w-4xl text-xs text-sand-600 print:hidden">
            Toca el título, la situación o una pregunta para editarla. Se guarda al salir del campo.
          </p>

          <article
            key={exercise.id ?? exercise.version}
            id="guide-document"
            className="relative mx-auto min-h-[70rem] max-w-4xl bg-white px-6 py-10 shadow-2xl shadow-sand-900/10 sm:px-12 sm:py-14 md:px-16"
          >
            <div className="border-b-2 border-ink-950 pb-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-ink-950 text-white">
                    <Icon name="book" className="size-5" />
                  </span>
                  <span className="text-lg font-bold tracking-tight text-ink-950">ECduLearn</span>
                </div>
                <span className="rounded-full bg-ink-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-ink-900">
                  {exercise.level}
                </span>
              </div>
              <p className="mt-8 text-xs font-bold uppercase tracking-[0.18em] text-ink-700">Razonamiento lógico · {exercise.context}</p>
              <h1
                contentEditable
                suppressContentEditableWarning
                className="mt-2 rounded-lg text-3xl font-bold leading-tight tracking-tight text-ink-950 outline-none hover:bg-ink-50/60 focus:bg-ink-50 focus:ring-4 focus:ring-ink-100 sm:text-4xl"
                onInput={() => setNotice("Editando…")}
                onBlur={(event) => {
                  const texto = event.currentTarget.textContent?.trim() ?? ""
                  if (texto && texto !== exercise.topic) onEditarCampo({ topic: texto })
                  setNotice("Cambios guardados en el ejercicio")
                }}
              >
                {exercise.topic}
              </h1>
              <p className="mt-3 text-sm text-sand-500">
                Actividad contextualizada tipo PISA · Dificultad {String(exercise.difficulty).toLowerCase()}
              </p>
            </div>

            <div className="mt-9 space-y-9 text-[0.95rem] leading-7 text-sand-700">
              <section>
                <p className="text-xs font-bold uppercase tracking-widest text-ink-700">Situación</p>
                <p
                  contentEditable
                  suppressContentEditableWarning
                  className="mt-3 whitespace-pre-line rounded-lg outline-none hover:bg-ink-50/60 focus:bg-ink-50 focus:ring-4 focus:ring-ink-100"
                  onInput={() => setNotice("Editando…")}
                  onBlur={(event) => {
                    const texto = event.currentTarget.innerText.trim()
                    if (texto && texto !== exercise.situation && texto !== SITUACION_VACIA) onEditarCampo({ situation: texto })
                    setNotice("Cambios guardados en el ejercicio")
                  }}
                >
                  {exercise.situation || SITUACION_VACIA}
                </p>
              </section>

              <section>
                <p className="text-xs font-bold uppercase tracking-widest text-ink-700">Preguntas de desarrollo</p>
                <ol className="mt-4 space-y-5">
                  {(exercise.questionList ?? []).map((pregunta, index) => (
                    <li key={`${index}-${pregunta.slice(0, 12)}`}>
                      <strong className="text-sand-950">{index + 1}.</strong>{" "}
                      <span
                        contentEditable
                        suppressContentEditableWarning
                        className="rounded-md outline-none hover:bg-ink-50/60 focus:bg-ink-50 focus:ring-4 focus:ring-ink-100"
                        onInput={() => setNotice("Editando…")}
                        onBlur={(event) => {
                          const texto = event.currentTarget.textContent?.trim() ?? ""
                          const actual = pregunta.replace(/^\s*\d+[.)]\s*/, "")
                          if (texto && texto !== actual) {
                            const lista = [...(exercise.questionList ?? [])]
                            lista[index] = texto
                            onEditarCampo({ questionList: lista })
                          }
                          setNotice("Cambios guardados en el ejercicio")
                        }}
                      >
                        {pregunta.replace(/^\s*\d+[.)]\s*/, "")}
                      </span>
                      <div className="mt-4 h-16 border-b border-dashed border-sand-300" />
                    </li>
                  ))}
                </ol>
              </section>
            </div>

            <div className="mt-12 flex flex-wrap justify-between gap-3 border-t border-sand-200 pt-5 text-xs text-sand-500">
              <span>ECduLearn · Material para uso educativo</span>
              <span>Generado con asistencia de IA · Revisión docente recomendada</span>
            </div>
          </article>
        </main>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-sand-200 bg-white p-3 print:hidden lg:hidden">
        <div className="mx-auto flex max-w-xl items-center gap-2">
          {ACCIONES_EDITOR.slice(0, 2).map((accion) => (
            <button
              key={accion.etiqueta}
              type="button"
              disabled={ocupado}
              onClick={() => applyAI(accion.etiqueta, accion.instruccion)}
              className="min-h-11 flex-1 rounded-full border border-sand-300 px-3 text-sm font-semibold text-sand-700 disabled:opacity-50"
            >
              {accion.etiqueta}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setToolsOpen(true)}
            className="flex min-h-11 items-center gap-2 rounded-xl bg-ink-950 px-4 text-sm font-bold text-white"
          >
            <Icon name="magic" className="size-4" />
            Más
          </button>
        </div>
      </div>

      {toolsOpen && (
        <div className="fixed inset-0 z-50 bg-sand-950/40 backdrop-blur-sm print:hidden lg:hidden">
          <button type="button" className="absolute inset-0" onClick={() => setToolsOpen(false)} aria-label="Cerrar herramientas" />
          <aside className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <p className="font-bold text-sand-950">Herramientas de IA</p>
              <button
                type="button"
                onClick={() => setToolsOpen(false)}
                className="grid size-11 place-items-center rounded-xl text-sand-600 hover:bg-sand-100"
                aria-label="Cerrar herramientas"
              >
                <Icon name="x" />
              </button>
            </div>
            <EditorTools
              command={command}
              ocupado={ocupado}
              onCommandChange={setCommand}
              onApply={() => {
                applyAI("Instrucción personalizada", command)
                setToolsOpen(false)
              }}
              onQuickAction={(accion) => {
                applyAI(accion.etiqueta, accion.instruccion)
                setToolsOpen(false)
              }}
            />
          </aside>
        </div>
      )}
    </div>
  )
}

const SITUACION_VACIA = "Escribe aquí la situación del problema o pídele al asistente que la genere."

export default function EditorGuia({ onBack }: { onBack: () => void }) {
  const { ejercicio, versiones, tieneEjercicio } = useSesionDocente(estadoInicialDocente)
  // Ediciones manuales pendientes de guardar en la base; padreId es el ejercicio que se editó
  const pendiente = useRef<{ padreId?: string } | null>(null)
  const ultimo = useRef(ejercicio)
  ultimo.current = ejercicio

  const guardarPendiente = async () => {
    if (!pendiente.current) return
    const { padreId } = pendiente.current
    pendiente.current = null
    const guardado = await ejerciciosController.guardarComoActivo(ultimo.current, {
      ejercicioPadreId: padreId,
      etiquetaVersion: "Iteración 2",
    })
    actualizarSesionDocente((actual) => ({
      ejercicio: guardado,
      paralelos: { ...actual.paralelos, [actual.paraleloActivo]: guardado },
    }))
  }

  // Al salir del editor (o cerrar la vista) se envía lo editado como una iteración nueva
  useEffect(() => () => void guardarPendiente(), [])

  // Sin ejercicio no hay guía que editar: se vuelve al asistente
  useEffect(() => {
    if (!tieneEjercicio) onBack()
  }, [tieneEjercicio])

  if (!tieneEjercicio) return null

  return (
    <EditorView
      exercise={ejercicio}
      hayAnterior={versiones.length > 0}
      onBack={onBack}
      onExerciseChange={(nuevo) =>
        actualizarSesionDocente((actual) => ({
          versiones: [...actual.versiones, actual.ejercicio],
          ejercicio: nuevo,
          paralelos: { ...actual.paralelos, [actual.paraleloActivo]: nuevo },
        }))
      }
      onEditarCampo={(cambio) => {
        if (!pendiente.current) pendiente.current = { padreId: isValidUuid(ejercicio.id) ? ejercicio.id : undefined }
        // Sin id: lo editado ya no es el registro original; al publicar se guarda como ejercicio nuevo
        actualizarSesionDocente((actual) => {
          const editado = { ...actual.ejercicio, ...cambio, id: undefined }
          ejerciciosController.guardarActivoLocal(editado)
          return { ejercicio: editado, paralelos: { ...actual.paralelos, [actual.paraleloActivo]: editado } }
        })
      }}
      onVersionAnterior={() => {
        actualizarSesionDocente((actual) => {
          const anterior = actual.versiones.at(-1)
          if (!anterior) return {}
          ejerciciosController.guardarActivoLocal(anterior)
          return {
            ejercicio: anterior,
            versiones: actual.versiones.slice(0, -1),
            paralelos: { ...actual.paralelos, [actual.paraleloActivo]: anterior },
          }
        })
      }}
    />
  )
}
