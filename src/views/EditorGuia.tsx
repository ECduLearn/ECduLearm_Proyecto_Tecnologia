import { useEffect, useRef, useState } from "react"
import Icon from "@/components/Icon"
import { generateExerciseAI } from "@/services/aiService"
import { ejerciciosController } from "@/services/dbService"
import { estadoInicialDocente } from "@/models/estadoInicialDocente"
import { actualizarSesionDocente, useSesionDocente } from "@/models/sesionDocente"
import type { Exercise } from "@/models/types"

const editorActions = [
  "Hacer más fácil",
  "Hacer más difícil",
  "Cambiar contexto",
  "Regenerar",
]

function EditorTools({
  fileName,

  command,

  onCommandChange,

  onFileChange,

  onApply,

  onQuickAction,
}: {
  fileName: string

  command: string

  onCommandChange: (value: string) => void

  onFileChange: (name: string) => void

  onApply: () => void

  onQuickAction: (action: string) => void
}) {
  return (
    <div className="space-y-7">
      <section>
        <div className="flex items-center gap-2 text-sm font-bold text-sand-900">
          <Icon name="paperclip" className="size-4 text-ink-800" />
          Contexto de la guía
        </div>
        <p className="mt-1 text-xs leading-relaxed text-sand-500">
          Añade un sílabo, notas o el currículo para orientar a la IA.
        </p>
        <label className="mt-4 flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-sand-300 bg-sand-50 px-4 text-center transition hover:border-ink-400 hover:bg-ink-50">
          <input
            type="file"
            className="sr-only"
            accept=".pdf,.doc,.docx,.txt"
            onChange={(event) =>
              onFileChange(event.target.files?.[0]?.name ?? "")
            }
          />
          <span className="grid size-10 place-items-center rounded-xl bg-white text-ink-900 shadow-sm">
            <Icon name="upload" className="size-5" />
          </span>
          <span className="mt-3 text-sm font-semibold text-sand-700">
            {fileName || "Subir archivo"}
          </span>
          <span className="mt-1 text-xs text-sand-500">
            PDF, Word o TXT · máx. 10 MB
          </span>
        </label>
      </section>

      <section className="border-t border-sand-200 pt-6">
        <div className="flex items-center gap-2 text-sm font-bold text-sand-900">
          <Icon name="magic" className="size-4 text-ink-800" />
          Ajuste rápido con IA
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {editorActions.map((action) => (
            <button
              key={action}
              type="button"
              onClick={() => onQuickAction(action)}
              className="min-h-10 rounded-full border border-sand-300 bg-white px-3 text-xs font-semibold text-sand-700 transition hover:border-ink-400 hover:bg-ink-50 focus:outline-none focus:ring-4 focus:ring-ink-100"
            >
              {action}
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
          placeholder="Ej: “Reescribe el problema 2 para que hable de economía local”"
          className="mt-3 w-full resize-none rounded-xl border border-sand-300 bg-white p-3 text-sm leading-relaxed text-sand-800 outline-none placeholder:text-sand-400 focus:border-ink-700 focus:ring-4 focus:ring-ink-100"
        />
        <button
          type="button"
          disabled={!command.trim()}
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
  onBack,
  onExerciseChange,
  onEditarCampo,
}: {
  exercise: Exercise
  onBack: () => void
  onExerciseChange: (exercise: Exercise) => void
  onEditarCampo: (cambio: Partial<Exercise>) => void
}) {
  const [title, setTitle] = useState(`Guía PISA: ${exercise.topic}`)

  const [fileName, setFileName] = useState("")

  const [command, setCommand] = useState("")

  const [notice, setNotice] = useState("Todos los cambios guardados")

  const [toolsOpen, setToolsOpen] = useState(false)

  const [selectionOpen, setSelectionOpen] = useState(false)

  const applyAI = async (label: string) => {
    setNotice(`Aplicando «${label}»…`)

    try {
      const res = await generateExerciseAI(label, exercise)

      // createEjercicio toma la siguiente etiqueta libre si esta ya existe para el mismo padre
      const etiqueta = /versi[oó]n/i.test(label) ? "Versión B" : "Iteración 2"

      // Guarda la variante, espera su UUID real y actualiza el documento
      const activo = await ejerciciosController.guardarComoActivo(res.data.exercise, {
        ejercicioPadreId: exercise.id,

        etiquetaVersion: etiqueta,
      })

      onExerciseChange(activo)

      setNotice(`Listo: ${activo.topic}. Ya está guardado.`)
    } catch {
      setNotice("No pudimos aplicar el cambio. Inténtalo otra vez.")
    }

    setCommand("")
  }

  const checkSelection = () => {
    setSelectionOpen(Boolean(window.getSelection()?.toString().trim()))
  }

  const formatSelection = (commandName: string) => {
    document.execCommand(commandName)

    setNotice("Formato actualizado")

    setSelectionOpen(false)
  }

  const shareDocument = async () => {
    await navigator.clipboard?.writeText(window.location.href)

    setNotice("Enlace de la guía copiado")
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
            <label htmlFor="document-title" className="sr-only">
              Título del documento
            </label>
            <input
              id="document-title"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value)

                setNotice("Guardando cambios...")
              }}
              onBlur={() => setNotice("Todos los cambios guardados")}
              className="w-full truncate rounded-lg bg-transparent px-2 py-1 text-center text-sm font-bold text-sand-950 outline-none hover:bg-sand-100 focus:bg-sand-100 focus:ring-4 focus:ring-ink-100 sm:text-base"
            />
            <p
              className="mt-0.5 flex items-center justify-center gap-1.5 text-xs text-sand-500"
              aria-live="polite"
            >
              <Icon name="check" className="size-3.5 text-ink-600" />
              {notice}
            </p>
          </div>

          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={shareDocument}
              className="grid size-11 place-items-center rounded-xl text-sand-700 transition hover:bg-sand-100 focus:outline-none focus:ring-4 focus:ring-ink-100"
              aria-label="Compartir guía"
            >
              <Icon name="share" className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="hidden min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-sand-700 transition hover:bg-sand-100 focus:outline-none focus:ring-4 focus:ring-ink-100 md:flex"
            >
              <Icon name="printer" className="size-4" />
              Imprimir
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex min-h-11 items-center gap-2 rounded-xl bg-ink-950 px-3 text-sm font-bold text-white transition hover:bg-ink-900 focus:outline-none focus:ring-4 focus:ring-ink-100 sm:px-4"
            >
              <Icon name="download" className="size-4" />
              <span className="hidden sm:inline">Exportar</span>
              <span className="hidden xl:inline">PDF/Word</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-4rem)]">
        <aside className="hidden w-80 shrink-0 border-r border-sand-200 bg-white p-6 print:hidden lg:block">
          <EditorTools
            fileName={fileName}
            command={command}
            onCommandChange={setCommand}
            onFileChange={(name) => {
              setFileName(name)

              if (name) setNotice(`${name} añadido como contexto`)
            }}
            onApply={() => applyAI(command)}
            onQuickAction={applyAI}
          />
        </aside>

        <main className="min-w-0 flex-1 overflow-auto px-3 py-6 pb-28 sm:px-8 sm:py-10 lg:pb-10">
          <div className="mx-auto mb-4 flex max-w-4xl items-center justify-between print:hidden">
            <div className="flex items-center gap-1 rounded-xl border border-sand-300 bg-white p-1 shadow-sm">
              <button
                type="button"
                onClick={() => document.execCommand("undo")}
                className="grid size-11 place-items-center rounded-lg text-sand-600 hover:bg-sand-100 focus:outline-none focus:ring-4 focus:ring-ink-100"
                aria-label="Deshacer"
              >
                <Icon name="undo" className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => document.execCommand("redo")}
                className="grid size-11 place-items-center rounded-lg text-sand-600 hover:bg-sand-100 focus:outline-none focus:ring-4 focus:ring-ink-100"
                aria-label="Rehacer"
              >
                <Icon name="redo" className="size-4" />
              </button>
              <span className="mx-1 h-5 w-px bg-sand-200" />
              <button
                type="button"
                onClick={() => formatSelection("bold")}
                className="grid size-11 place-items-center rounded-lg text-sand-600 hover:bg-sand-100 focus:outline-none focus:ring-4 focus:ring-ink-100"
                aria-label="Negrita"
              >
                <Icon name="bold" className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => formatSelection("italic")}
                className="grid size-11 place-items-center rounded-lg text-sand-600 hover:bg-sand-100 focus:outline-none focus:ring-4 focus:ring-ink-100"
                aria-label="Cursiva"
              >
                <Icon name="italic" className="size-4" />
              </button>
            </div>
            <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-sand-500 shadow-sm">
              Página 1 de 1 · A4
            </span>
          </div>

          <article
            key={exercise.id ?? exercise.version}
            id="guide-document"
            className="relative mx-auto min-h-[70rem] max-w-4xl bg-white px-6 py-10 shadow-2xl shadow-sand-900/10 sm:px-12 sm:py-14 md:px-16"
            onMouseUp={checkSelection}
            onKeyUp={checkSelection}
          >
            {selectionOpen && (
              <div className="absolute left-1/2 top-5 z-20 flex -translate-x-1/2 items-center gap-1 rounded-xl bg-sand-950 p-1.5 text-white shadow-xl print:hidden">
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => formatSelection("bold")}
                  className="grid size-11 place-items-center rounded-lg hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/50"
                  aria-label="Poner en negrita"
                >
                  <Icon name="bold" className="size-4" />
                </button>
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => formatSelection("italic")}
                  className="grid size-11 place-items-center rounded-lg hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/50"
                  aria-label="Poner en cursiva"
                >
                  <Icon name="italic" className="size-4" />
                </button>
                <span className="mx-1 h-5 w-px bg-white/20" />
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => applyAI("Mejorar redacción")}
                  className="flex min-h-11 items-center gap-2 rounded-lg px-2.5 text-xs font-semibold hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/50"
                >
                  <Icon name="sparkles" className="size-4 text-ink-300" />
                  Mejorar
                </button>
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => applyAI("Simplificar texto")}
                  className="hidden min-h-11 items-center rounded-lg px-2.5 text-xs font-semibold hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/50 sm:flex"
                >
                  Simplificar
                </button>
              </div>
            )}

            <div className="border-b-2 border-ink-950 pb-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-ink-950 text-white">
                    <Icon name="book" className="size-5" />
                  </span>
                  <span className="text-lg font-bold tracking-tight text-ink-950">
                    ECduLearn
                  </span>
                </div>
                <span className="rounded-full bg-ink-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-ink-900">
                  Guía docente · {exercise.level}
                </span>
              </div>
              <p className="mt-8 text-xs font-bold uppercase tracking-[0.18em] text-ink-700">
                Razonamiento lógico · {exercise.context}
              </p>
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
                Actividad contextualizada tipo PISA · Dificultad{" "}
                {String(exercise.difficulty).toLowerCase()}
              </p>
            </div>

            <div className="mt-9 space-y-9 text-[0.95rem] leading-7 text-sand-700">
              <section>
                <p className="text-xs font-bold uppercase tracking-widest text-ink-700">
                  Situación
                </p>
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
                <p className="text-xs font-bold uppercase tracking-widest text-ink-700">
                  Preguntas de desarrollo
                </p>
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

            <div className="mt-12 flex flex-wrap justify-between gap-3 border-t border-sand-200 pt-5 text-xs text-sand-400">
              <span>ECduLearn · Material para uso educativo</span>
              <span>
                Generado con asistencia de IA · Revisión docente recomendada
              </span>
            </div>
          </article>
        </main>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-sand-200 bg-white p-3 print:hidden lg:hidden">
        <div className="mx-auto flex max-w-xl items-center gap-2">
          {editorActions.slice(0, 2).map((action) => (
            <button
              key={action}
              type="button"
              onClick={() => applyAI(action)}
              className="min-h-11 flex-1 rounded-full border border-sand-300 px-3 text-xs font-semibold text-sand-700"
            >
              {action}
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
          <button
            type="button"
            className="absolute inset-0"
            onClick={() => setToolsOpen(false)}
            aria-label="Cerrar herramientas"
          />
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
              fileName={fileName}
              command={command}
              onCommandChange={setCommand}
              onFileChange={setFileName}
              onApply={() => {
                applyAI(command)

                setToolsOpen(false)
              }}
              onQuickAction={(action) => {
                applyAI(action)

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
  const { ejercicio } = useSesionDocente(estadoInicialDocente)
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
    actualizarSesionDocente(() => ({ ejercicio: guardado }))
  }

  // Al salir del editor (o cerrar la vista) se envía lo editado como una iteración nueva
  useEffect(() => () => void guardarPendiente(), [])

  return (
    <EditorView
      exercise={ejercicio}
      onBack={onBack}
      onExerciseChange={(nuevo) =>
        actualizarSesionDocente((actual) => ({ versiones: [...actual.versiones, actual.ejercicio], ejercicio: nuevo }))
      }
      onEditarCampo={(cambio) => {
        if (!pendiente.current) pendiente.current = { padreId: ejercicio.id }
        // Sin id: lo editado ya no es el registro original; al publicar se guarda como ejercicio nuevo
        actualizarSesionDocente((actual) => {
          const editado = { ...actual.ejercicio, ...cambio, id: undefined }
          ejerciciosController.guardarActivoLocal(editado)
          return { ejercicio: editado }
        })
      }}
    />
  )
}
