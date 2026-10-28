import { FormEvent, ReactNode, useEffect, useRef, useState } from "react";
import { AccessPortal, TeacherDashboard } from "./Portal";
import AutonomousZone from "./AutonomousZone";
import { AdmissionSimulator, PlanningWorkspace } from "./AdvancedModules";
import { LandingPage } from "./LandingPage";
import { AdminDashboard } from "./AdminDashboard";
import { AppView, useAppRouter } from "./router";
export type { AppView } from "./router";
import { generateExerciseAI, getAIStatus, testAIConnection } from "./services/aiService";
import {
  getSupabaseConfig,
  setSupabaseConfig,
  isSupabaseConnected,
  getSupabaseClient,
} from "./services/supabaseClient"

import { ejerciciosController, aulasController } from "./services/dbService"

import type { Exercise } from "./models/types"

type IconName = "arrow-left" | "bold" | "book" | "check" | "chevron" | "clock" | "download" | "file" | "info" | "italic" | "magic" | "menu" | "paperclip" | "plus" | "printer" | "redo" | "send" | "share" | "sparkles" | "undo" | "upload" | "user" | "x"

type Message = {
  id: number

  role: "user" | "assistant"

  text: string

  exercise?: Exercise
}

const iconPaths: Record<IconName, ReactNode> = {
  "arrow-left": (
    <>
      <path d="m15 18-6-6 6-6" />
      <path d="M9 12h11" />
    </>
  ),

  bold: (
    <>
      <path d="M7 5h6a4 4 0 0 1 0 8H7z" />
      <path d="M7 13h7a4 4 0 0 1 0 8H7z" />
    </>
  ),

  book: (
    <>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
      <path d="M8 7h8M8 11h6" />
    </>
  ),

  check: <path d="m5 12 4 4L19 6" />,

  chevron: <path d="m9 18 6-6-6-6" />,

  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),

  download: (
    <>
      <path d="M12 3v12m0 0 4-4m-4 4-4-4" />
      <path d="M5 20h14" />
    </>
  ),

  file: (
    <>
      <path d="M6 2h8l4 4v16H6z" />
      <path d="M14 2v5h5M9 12h6M9 16h6" />
    </>
  ),

  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </>
  ),

  italic: <path d="M10 4h8M6 20h8M14 4 10 20" />,

  magic: (
    <>
      <path d="m15 4 5 5L8 21l-5-5Z" />
      <path d="m6 14 5 5M14 4l1-2M20 10l2 1M19 3l2-1M4 10 2-1" />
    </>
  ),

  menu: <path d="M4 7h16M4 12h16M4 17h16" />,

  paperclip: (
    <path d="m21.4 11.6-8.9 8.9a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5" />
  ),

  plus: <path d="M12 5v14M5 12h14" />,

  printer: (
    <>
      <path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <path d="M6 14h12v8H6z" />
    </>
  ),

  redo: (
    <>
      <path d="m15 7 5 5-5 5" />
      <path d="M4 17a7 7 0 0 1 7-7h9" />
    </>
  ),

  send: (
    <>
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </>
  ),

  share: (
    <>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4" />
    </>
  ),

  sparkles: (
    <>
      <path d="m12 3-1.1 3.1A4.3 4.3 0 0 1 8.3 8.7L5 10l3.3 1.3a4.3 4.3 0 0 1 2.6 2.6L12 17l1.1-3.1a4.3 4.3 0 0 1 2.6-2.6L19 10l-3.3-1.3a4.3 4.3 0 0 1-2.6-2.6L12 3Z" />
      <path d="m5 3-.4 1.1a1.6 1.6 0 0 1-1 1L2.5 5.5l1.1.4a1.6 1.6 0 0 1 1 1L5 8l.4-1.1a1.6 1.6 0 0 1 1-1l1.1-.4-1.1-.4a1.6 1.6 0 0 1-1-1L5 3Z" />
    </>
  ),

  undo: (
    <>
      <path d="m9 7-5 5 5 5" />
      <path d="M20 17a7 7 0 0 0-7-7H4" />
    </>
  ),

  upload: (
    <>
      <path d="M12 16V4m0 0L7 9m5-5 5 5" />
      <path d="M4 15v5h16v-5" />
    </>
  ),

  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),

  x: <path d="m6 6 12 12M18 6 6 18" />,
}

const initialExercise: Exercise = {
  topic: "Estabilidad de estructuras",

  context: "Ingeniería civil",

  level: "2do BGU",

  difficulty: "Intermedia",

  questions: 3,

  version: 1,

  situation:
    "Un equipo de estudiantes analiza la estabilidad de una estructura para un nuevo centro comunitario. El diseño utiliza módulos triangulares de 4 metros de base y 3 metros de altura. Antes de construir, deben comparar alternativas y justificar cuál distribuye mejor las cargas.",

  questionList: [
    "Calcula el área de uno de los módulos triangulares utilizados en la estructura.",

    "Si el diseño requiere 12 módulos, ¿qué superficie total representan?",

    "Explica qué alternativa elegirías y sustenta tu decisión con los datos.",
  ],
}

const initialMessages: Message[] = [
  {
    id: 1,

    role: "assistant",

    text: "¡Hola, colega docente! Soy tu asistente pedagógico en ECduLearm, potenciado en tiempo real con Google Gemini Flash (con balanceo multimodelo y ahorro de cuota).\n\nHe preparado esta guía de razonamiento inicial con enfoque PISA para bachillerato. ¿Deseas adaptarla (ej: «más fácil», «agrega una pregunta»), crear una nueva sobre otro tema («Metro de Quito», «Galápagos», «Finanzas»), o hacerme una consulta metodológica?",

    exercise: initialExercise,
  },
]

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

function Icon({
  name,
  className = "size-5",
}: {
  name: IconName
  className?: string
}) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {iconPaths[name]}
    </svg>
  )
}

function Logo() {
  return (
    <div className="flex items-center gap-3" aria-label="ECduLearm">
      <span className="grid size-10 place-items-center rounded-xl bg-ink-950 text-sand-50">
        <Icon name="book" className="size-5" />
      </span>
      <span className="text-lg font-bold tracking-tight text-sand-900">
        EC<span className="text-hint-600">du</span>Learm
      </span>
    </div>
  )
}

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
}: {
  exercise: Exercise
  onBack: () => void
}) {
  const [title, setTitle] = useState(
    "Guía PISA: Análisis de Estructuras Civiles",
  )

  const [fileName, setFileName] = useState("")

  const [command, setCommand] = useState("")

  const [notice, setNotice] = useState("Todos los cambios guardados")

  const [toolsOpen, setToolsOpen] = useState(false)

  const [selectionOpen, setSelectionOpen] = useState(false)

  const applyAI = async (label: string) => {
    setNotice(`Aplicando “${label}” con IA...`)

    try {
      const res = await generateExerciseAI(label, exercise)

      setNotice(
        `Cambios aplicados: ${res.data.exercise.topic} (Guardado en BD)`,
      )

      localStorage.setItem(
        "ecdulearm_active_exercise",
        JSON.stringify(res.data.exercise),
      )

      // Guardar iteración o variante A/B/C en base de datos

      const etiqueta = label.includes("fácil")
        ? "Versión A"
        : label.includes("difícil")
          ? "Versión B"
          : "Iteración 2"

      ejerciciosController.createEjercicio({
        ...res.data.exercise,

        ejercicioPadreId: exercise.id,

        etiquetaVersion: etiqueta,
      })
    } catch {
      setNotice("Cambios de IA aplicados y guardados")
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
    <div className="min-h-screen bg-sand-200 text-sand-950">
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
                    ECduLearm
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
                onInput={() => setNotice("Guardando cambios...")}
                onBlur={() => setNotice("Todos los cambios guardados")}
              >
                Análisis de estructuras civiles
              </h1>
              <p className="mt-3 text-sm text-sand-500">
                Actividad contextualizada tipo PISA · Dificultad intermedia
              </p>
            </div>

            <div
              className="mt-9 space-y-9 text-[0.95rem] leading-7 text-sand-700"
              contentEditable
              suppressContentEditableWarning
              onInput={() => setNotice("Guardando cambios...")}
              onBlur={() => setNotice("Todos los cambios guardados")}
            >
              <section>
                <p className="text-xs font-bold uppercase tracking-widest text-ink-700">
                  Situación
                </p>
                <h2 className="mt-2 text-xl font-bold text-sand-950">
                  Un centro comunitario seguro y sostenible
                </h2>
                <p className="mt-3">
                  El municipio construirá un centro comunitario en una zona de
                  alta actividad sísmica. Un equipo de estudiantes analiza dos
                  propuestas estructurales que utilizan módulos triangulares de
                  4 metros de base y 3 metros de altura. La meta es elegir una
                  solución que distribuya adecuadamente las cargas y use los
                  materiales de forma responsable.
                </p>
              </section>

              <section className="rounded-2xl border border-sand-200 bg-sand-50 p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-sand-500">
                  Datos para el análisis
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-white p-4">
                    <p className="font-bold text-ink-950">Propuesta A</p>
                    <p className="mt-1 text-sm">
                      12 módulos · 28 kg de acero por módulo
                    </p>
                  </div>
                  <div className="rounded-xl bg-white p-4">
                    <p className="font-bold text-ink-950">Propuesta B</p>
                    <p className="mt-1 text-sm">
                      10 módulos · 34 kg de acero por módulo
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <p className="text-xs font-bold uppercase tracking-widest text-ink-700">
                  Preguntas de desarrollo
                </p>
                <ol className="mt-4 space-y-5">
                  <li>
                    <strong className="text-sand-950">1. Comprender.</strong>{" "}
                    Calcula el área de uno de los módulos triangulares. Explica
                    el procedimiento utilizado.
                    <div className="mt-4 h-16 border-b border-dashed border-sand-300" />
                  </li>
                  <li>
                    <strong className="text-sand-950">2. Analizar.</strong>{" "}
                    Compara la cantidad total de acero requerida por cada
                    propuesta. ¿Cuál utiliza menos material?
                    <div className="mt-4 h-16 border-b border-dashed border-sand-300" />
                  </li>
                  <li>
                    <strong className="text-sand-950">3. Reflexionar.</strong>{" "}
                    ¿Qué propuesta recomendarías al municipio? Sustenta tu
                    decisión usando los datos y un criterio de seguridad.
                    <div className="mt-4 h-20 border-b border-dashed border-sand-300" />
                  </li>
                </ol>
              </section>
            </div>

            <div className="mt-12 flex flex-wrap justify-between gap-3 border-t border-sand-200 pt-5 text-xs text-sand-400">
              <span>ECduLearm · Material para uso educativo</span>
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

function ExerciseCard({ exercise }: { exercise: Exercise }) {
  return (
    <article
      id="exercise-document"
      className="mt-4 overflow-hidden rounded-3xl border border-sand-200 bg-white shadow-xl shadow-sand-900/5 sm:ml-12"
    >
      <div className="border-b border-sand-200 bg-sand-50 px-5 py-4 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {[exercise.context, exercise.level, "Razonamiento lógico"].map(
              (tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-ink-100 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-ink-900"
                >
                  {tag}
                </span>
              ),
            )}
          </div>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-sand-500">
            <Icon name="check" className="size-4 text-ink-600" />
            Versión {exercise.version}
          </span>
        </div>
      </div>

      <div className="p-5 sm:p-8">
        <div className="flex items-start gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-ink-950 text-white shadow-sm">
            <Icon name="file" className="size-5" />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-ink-700">
              Desafío aplicado PISA
            </p>
            <h2 className="mt-1 text-xl font-bold leading-tight text-ink-950 sm:text-2xl">
              {exercise.topic}
            </h2>
            <p className="mt-2 text-sm text-sand-500">
              Dificultad {exercise.difficulty.toLowerCase()} ·{" "}
              {exercise.questions} preguntas
            </p>
          </div>
        </div>

        <div className="mt-7 rounded-2xl border border-sand-200 bg-sand-50 p-5 sm:p-6">
          <p className="text-sm font-bold text-sand-900">Situación</p>
          <p className="mt-2 text-sm leading-7 text-sand-700">
            {exercise.situation ||
              "Un equipo de estudiantes analiza la estabilidad de una estructura para un nuevo centro comunitario. El diseño utiliza módulos triangulares de 4 metros de base y 3 metros de altura. Antes de construir, deben comparar alternativas y justificar cuál distribuye mejor las cargas."}
          </p>
        </div>

        <div className="mt-7 space-y-5">
          {exercise.questionList && exercise.questionList.length > 0
            ? exercise.questionList.map((q, index) => (
                <div key={index} className="flex gap-4">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-ink-100 text-sm font-bold text-ink-950">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold leading-6 text-sand-800">
                      {q}
                    </p>
                    <div className="mt-3 h-8 border-b border-dashed border-sand-300" />
                  </div>
                </div>
              ))
            : Array.from(
                { length: Math.min(exercise.questions, 4) },
                (_, index) => (
                  <div key={index} className="flex gap-4">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-ink-100 text-sm font-bold text-ink-950">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold leading-6 text-sand-800">
                        {index === 0
                          ? "Calcula el área de uno de los módulos triangulares utilizados en la estructura."
                          : index === 1
                            ? "Si el diseño requiere 12 módulos, ¿qué superficie total representan?"
                            : index === 2
                              ? "Explica qué alternativa elegirías y sustenta tu decisión con los datos."
                              : "Propón un cambio al diseño que reduzca material sin comprometer la estabilidad."}
                      </p>
                      <div className="mt-3 h-8 border-b border-dashed border-sand-300" />
                    </div>
                  </div>
                ),
              )}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-sand-200 pt-5 text-xs text-sand-500">
          <span>ECduLearm · Guía docente generada con Google Gemini</span>
          <span>Solucionario disponible al exportar</span>
        </div>
      </div>
    </article>
  )
}

function App() {
  const { view, setView } = useAppRouter()

  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [messages, setMessages] = useState<Message[]>(initialMessages)

  const [exercise, setExercise] = useState<Exercise>(initialExercise)

  const [versions, setVersions] = useState<Exercise[]>([])

  const [hasExercise, setHasExercise] = useState(true)

  const [input, setInput] = useState("")

  const [isGenerating, setIsGenerating] = useState(false)

  const timerRef = useRef<number | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const exerciseCardRef = useRef<HTMLDivElement>(null)

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

        localStorage.setItem(
          "ecdulearm_active_exercise",
          JSON.stringify(updatedExercise),
        )

        // Persistir en base de datos PostgreSQL real (ejercicios_pisa)

        ejerciciosController.createEjercicio({
          ...updatedExercise,

          ejercicioPadreId: exercise.id,

          tiempoCreacionSegundos: 8,
        })
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

  if (view === "landing") {
    return (
      <LandingPage
        onEnterApp={() => setView("portal")}
        onNavigate={(target) => setView(target as AppView)}
        onStudentEnter={(pin) => {
          if (pin) localStorage.setItem("ecdulearm_active_pin", pin)

          setView("student")
        }}
      />
    )
  }

  if (view === "portal") {
    return (
      <>
        <EvaluatorTopBar currentView={view} onViewChange={setView} />
        <AccessPortal
          onStudentEnter={() => setView("student")}
          onTeacherEnter={() => setView("dashboard")}
          onAdminEnter={() => setView("admin")}
          onBackToLanding={() => setView("landing")}
        />
        <EvaluatorPill currentView={view} onViewChange={setView} />
      </>
    )
  }

  if (view === "student") {
    return (
      <>
        <EvaluatorTopBar currentView={view} onViewChange={setView} />
        <AutonomousZone
          onExit={() => setView("portal")}
          onSimulator={() => setView("simulator")}
        />
        <EvaluatorPill currentView={view} onViewChange={setView} />
      </>
    )
  }

  if (view === "dashboard") {
    return (
      <>
        <EvaluatorTopBar currentView={view} onViewChange={setView} />
        <TeacherDashboard
          onExit={() => setView("portal")}
          onCreateContent={() => setView("chat")}
          onOpenPlanner={() => setView("planner")}
          onOpenAdmin={() => setView("admin")}
        />
        <EvaluatorPill currentView={view} onViewChange={setView} />
      </>
    )
  }

  if (view === "admin") {
    return (
      <>
        <EvaluatorTopBar currentView={view} onViewChange={setView} />
        <AdminDashboard
          onExit={() => setView("portal")}
          onNavigateTeacher={() => setView("dashboard")}
          onNavigateLanding={() => setView("landing")}
        />
        <EvaluatorPill currentView={view} onViewChange={setView} />
      </>
    )
  }

  if (view === "planner") {
    return (
      <>
        <EvaluatorTopBar currentView={view} onViewChange={setView} />
        <PlanningWorkspace onBack={() => setView("dashboard")} />
        <EvaluatorPill currentView={view} onViewChange={setView} />
      </>
    )
  }

  if (view === "simulator") {
    return (
      <>
        <EvaluatorTopBar currentView={view} onViewChange={setView} />
        <AdmissionSimulator onBack={() => setView("student")} />
        <EvaluatorPill currentView={view} onViewChange={setView} />
      </>
    )
  }

  if (view === "editor") {
    return (
      <>
        <EvaluatorTopBar currentView={view} onViewChange={setView} />
        <EditorView exercise={exercise} onBack={() => setView("chat")} />
        <EvaluatorPill currentView={view} onViewChange={setView} />
      </>
    )
  }

  return (
    <div className="min-h-screen bg-sand-100 text-sand-950">
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
                  <div key={message.id} className="flex justify-end">
                    <div className="max-w-xl rounded-2xl rounded-br-md bg-ink-950 px-4 py-3 text-sm leading-relaxed text-white shadow-sm sm:px-5">
                      {message.text}
                    </div>
                  </div>
                ) : (
                  <div key={message.id} className="space-y-4">
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
                <div className="flex items-start gap-3" aria-live="polite">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-ink-100 text-ink-800">
                    <Icon name="sparkles" className="size-4 animate-spin" />
                  </span>
                  <div
                    className="flex min-h-12 items-center gap-3 rounded-2xl rounded-tl-md border border-ink-200 bg-ink-50/80 px-5 text-sm font-semibold text-ink-900 shadow-sm"
                    role="status"
                  >
                    <span className="size-4 animate-spin rounded-full border-2 border-ink-400 border-t-ink-700" />
                    Consultando Google Gemini en tiempo real...
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
                  Describe un tema, curso o contexto. ECduLearm lo convertirá en
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
                Escribe una instrucción para ECduLearm
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
              ECduLearm puede equivocarse. Revisa los resultados antes de
              usarlos en clase.
            </p>
          </form>
        </footer>
      </div>
      <EvaluatorPill currentView={view} onViewChange={setView} />
    </div>
  )
}

function EvaluatorTopBar({
  currentView,

  onViewChange,
}: {
  currentView: AppView

  onViewChange: (v: AppView) => void
}) {
  const [copied, setCopied] = useState(false)

  const [collapsed, setCollapsed] = useState(false)

  const [keyModalOpen, setKeyModalOpen] = useState(false)

  const [modalTab, setModalTab] = useState<"ai" | "database">("ai")

  // Estado de la IA (la clave vive en el servidor)
  const [aiOnline, setAiOnline] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  // Supabase state

  const [supabaseUrl, setSupabaseUrl] = useState("")

  const [supabaseKey, setSupabaseKey] = useState("")

  const [isDbConnected, setIsDbConnected] = useState(false)

  const [dbTestResult, setDbTestResult] = useState<{
    success: boolean
    message: string
  } | null>(null)

  const [isDbTesting, setIsDbTesting] = useState(false)

  useEffect(() => {
    let active = true;
    getAIStatus().then((status) => {
      if (active) setAiOnline(status.online);
    });

    const dbConfig = getSupabaseConfig();
    setSupabaseUrl(dbConfig.url);
    setSupabaseKey(dbConfig.anonKey);
    setIsDbConnected(Boolean(dbConfig.url && dbConfig.anonKey));
    return () => {
      active = false;
    };
  }, [keyModalOpen]);

  const handleTestAI = async () => {
    setIsTesting(true);
    setTestResult(null);
    const result = await testAIConnection();
    setTestResult(result);
    setAiOnline(result.success);
    setIsTesting(false);
  };

  const handleSaveAndTestDb = async () => {
    setIsDbTesting(true)

    setDbTestResult(null)

    setSupabaseConfig(supabaseUrl, supabaseKey)

    setIsDbConnected(Boolean(supabaseUrl.trim() && supabaseKey.trim()))

    const client = getSupabaseClient()

    if (!client) {
      setDbTestResult({
        success: false,

        message:
          "Por favor proporciona la URL y la Anon Key de tu proyecto de Supabase.",
      })

      setIsDbTesting(false)

      return
    }

    try {
      // Probar conexión contra esquema v2 (aulas_virtuales) o v1 (pin_sessions)

      let tableName = "aulas_virtuales"

      let testQuery = await client
        .from("aulas_virtuales")
        .select("pin_acceso, activa")
        .limit(5)

      // PostgREST responde PGRST205 cuando la tabla no existe (esquema v1)
      if (
        testQuery.error &&
        (testQuery.error.code === "PGRST205" ||
          testQuery.error.code === "42P01")
      ) {
        tableName = "pin_sessions"

        testQuery = await client
          .from("pin_sessions")
          .select("pin_acceso:pin, activa:active")
          .limit(5)
      }

      const { data, error } = testQuery

      if (error) {
        setDbTestResult({
          success: false,

          message: `Error al consultar Supabase (${error.code}): ${error.message}. Recuerda ejecutar el script 'supabase/schema.sql' en el SQL Editor de Supabase.`,
        })
      } else {
        const pinList = data
          ?.map((d) => d.pin_acceso)
          .filter(Boolean)
          .join(", ")

        setDbTestResult({
          success: true,

          message: `¡Conexión exitosa a Supabase PostgreSQL! Tabla '${tableName}' activa con ${data?.length || 0} aulas registradas (${pinList || "lista vacía"}).`,
        })
      }
    } catch (err) {
      setDbTestResult({
        success: false,

        message: `Fallo de conexión: ${(err as Error).message}`,
      })
    } finally {
      setIsDbTesting(false)
    }
  }

  const handleClearDb = () => {
    setSupabaseConfig("", "")

    setSupabaseUrl("")

    setSupabaseKey("")

    setIsDbConnected(false)

    setDbTestResult({
      success: true,

      message:
        "Configuración de Supabase eliminada. La persistencia opera ahora con LocalStorage en el navegador.",
    })
  }

  const copyPin = async () => {
    try {
      await navigator.clipboard.writeText("PISA26")

      setCopied(true)

      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(true)

      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (collapsed) {
    return (
      <div className="fixed top-2 right-2 z-50 print:hidden font-sans">
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="flex items-center gap-1.5 rounded-full bg-sand-950/90 border border-hint-400/60 px-3 py-1 text-[11px] font-bold text-hint-300 shadow-lg backdrop-blur hover:bg-sand-900"
          title="Mostrar barra de evaluación rápida"
        >
          <span>⚖️ Barra Evaluador</span>
        </button>
      </div>
    )
  }

  return (
    <>
      <aside
        aria-label="Barra de evaluación rápida para el jurado"
        className="sticky top-0 z-50 w-full bg-sand-950/95 border-b border-sand-800 text-white backdrop-blur-md px-3 py-1.5 text-xs font-sans print:hidden shadow-md"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 font-bold text-hint-300">
              <span className="inline-block size-2 rounded-full bg-ink-400 animate-pulse" />
              ⚖️ Modo Demo Evaluador
            </span>
            <span className="hidden sm:inline text-sand-400 text-[11px]">
              | Control 1
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => onViewChange("landing")}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                currentView === "landing"
                  ? "bg-ink-500 text-sand-950 shadow-sm font-bold ring-1 ring-ink-300"
                  : "bg-sand-800/80 text-sand-200 hover:bg-sand-700"
              }`}
            >
              🏠 Inicio / Landing
            </button>
            <button
              type="button"
              onClick={() => onViewChange("chat")}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                currentView === "chat" || currentView === "editor"
                  ? "bg-ink-600 text-white shadow-sm font-bold ring-1 ring-ink-400"
                  : "bg-sand-800/80 text-sand-200 hover:bg-sand-700"
              }`}
            >
              💬 Chat Docente (Gemini IA)
            </button>
            <button
              type="button"
              onClick={() => onViewChange("dashboard")}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                currentView === "dashboard"
                  ? "bg-ink-600 text-white shadow-sm font-bold ring-1 ring-ink-400"
                  : "bg-sand-800/80 text-sand-200 hover:bg-sand-700"
              }`}
            >
              📊 Panel Métricas
            </button>
            <button
              type="button"
              onClick={() => {
                localStorage.setItem("ecdulearm_active_pin", "PISA26")

                onViewChange("student")
              }}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                currentView === "student"
                  ? "bg-ink-500 text-sand-950 shadow-sm font-bold ring-1 ring-ink-300"
                  : "bg-sand-800/80 text-sand-200 hover:bg-sand-700"
              }`}
            >
              🎓 Vista Estudiante (PIN: PISA26)
            </button>
            <button
              type="button"
              onClick={() => onViewChange("portal")}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                currentView === "portal"
                  ? "bg-sand-700 text-white font-bold"
                  : "text-sand-300 hover:bg-sand-800"
              }`}
            >
              🚪 Portal Acceso
            </button>
            <button
              type="button"
              onClick={() => onViewChange("planner")}
              className={`hidden md:inline-block rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                currentView === "planner"
                  ? "bg-sand-700 text-white font-bold"
                  : "text-sand-300 hover:bg-sand-800"
              }`}
            >
              📋 Planificador ERCA
            </button>
            <button
              type="button"
              onClick={() => onViewChange("simulator")}
              className={`hidden md:inline-block rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                currentView === "simulator"
                  ? "bg-sand-700 text-white font-bold"
                  : "text-sand-300 hover:bg-sand-800"
              }`}
            >
              🎯 Simulador Admisión
            </button>
            <button
              type="button"
              onClick={() => onViewChange("admin")}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                currentView === "admin"
                  ? "bg-hint-600 text-white shadow-sm ring-1 ring-hint-300"
                  : "bg-hint-950/70 text-hint-300 border border-hint-700/50 hover:bg-hint-900/80"
              }`}
              title="Panel de Administración y Control de Usuarios"
            >
              🛡️ Admin / Usuarios
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setModalTab("ai")

                setKeyModalOpen(true)
              }}
              className={`flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-[11px] font-semibold transition ${
                aiOnline
                  ? "border-ink-500/60 bg-ink-950/70 text-ink-300 hover:bg-ink-900/60"
                  : "border-sand-700 bg-sand-900 text-sand-300 hover:bg-sand-800"
              }`}
              title="Ver o probar la conexión con Google Gemini"
            >
              <span className={`inline-block size-1.5 rounded-full ${aiOnline ? "bg-ink-400" : "bg-hint-400"}`} />
              <span>{aiOnline ? "Gemini Online" : "Motor Offline"}</span>
              <span className="text-[10px]">⚙️</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setModalTab("database")

                setKeyModalOpen(true)
              }}
              className={`flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-[11px] font-semibold transition ${
                isDbConnected
                  ? "border-teal-500/60 bg-teal-950/70 text-teal-300 hover:bg-teal-900/60"
                  : "border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800"
              }`}
              title="Configurar o probar persistencia en base de datos Supabase PostgreSQL"
            >
              <span
                className={`inline-block size-1.5 rounded-full ${
                  isDbConnected ? "bg-teal-400" : "bg-amber-400"
                }`}
              />
              <span>{isDbConnected ? "Supabase Cloud" : "DB Local"}</span>
              <span className="text-[10px]">🗄️</span>
            </button>

            <button
              type="button"
              onClick={copyPin}
              className="flex items-center gap-1 rounded bg-ink-950/80 border border-ink-500/40 px-2 py-0.5 text-[11px] font-mono text-ink-300 hover:bg-ink-900/80 transition"
              title="Copiar PIN PISA26 al portapapeles"
            >
              <span>
                PIN: <strong>PISA26</strong>
              </span>
              <span className="text-[10px] text-ink-400">
                {copied ? "✓ Copiado" : "📋"}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              className="text-sand-400 hover:text-sand-200 px-1 py-0.5 text-xs"
              title="Ocultar barra evaluador"
              aria-label="Ocultar barra evaluador"
            >
              ✕
            </button>
          </div>
        </div>
      </aside>

      {keyModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-sand-950/60 p-4 backdrop-blur-sm print:hidden font-sans">
          <div className="w-full max-w-lg rounded-2xl border border-sand-700 bg-sand-900 p-6 text-white shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-sand-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-hint-300 flex items-center gap-2">
                  <span>⚙️ Configuración de Conectividad & Servicios</span>
                </h3>
                <p className="mt-1 text-xs text-sand-400">
                  Gestión para el jurado / evaluador: Inteligencia Artificial y
                  Base de Datos
                </p>
              </div>
              <button
                type="button"
                onClick={() => setKeyModalOpen(false)}
                className="text-sand-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {/* Pestañas Modal */}
            <div className="flex items-center gap-2 border-b border-sand-800 pt-3 pb-2 text-xs">
              <button
                type="button"
                onClick={() => setModalTab("ai")}
                className={`rounded-lg px-3 py-1.5 font-bold transition ${
                  modalTab === "ai"
                    ? "bg-ink-600 text-white shadow"
                    : "text-sand-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                🤖 IA Google Gemini
              </button>
              <button
                type="button"
                onClick={() => setModalTab("database")}
                className={`rounded-lg px-3 py-1.5 font-bold transition ${
                  modalTab === "database"
                    ? "bg-hint-500 text-sand-950 shadow"
                    : "text-sand-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                🗄️ Base de Datos Supabase (PostgreSQL)
              </button>
            </div>

            {modalTab === "ai" ? (
              <div className="mt-4 space-y-4 text-xs">
                <div className="rounded-xl border border-sand-800 bg-sand-950/80 p-3">
                  <p className="text-sand-300 font-semibold mb-1">Estado de la IA en este momento:</p>
                  {aiOnline ? (
                    <p className="text-ink-400 flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-ink-400" />
                      <strong>Modo Online Activo:</strong> Se envían peticiones
                      optimizadas con balanceo multimodelo (Flash-Lite / Flash)
                      para máximo ahorro de tokens y alta disponibilidad.
                    </p>
                  ) : (
                    <p className="text-hint-400 flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-hint-400" />
                      <strong>Modo Offline Inteligente:</strong> Respuestas automáticas adaptadas al currículo ecuatoriano mientras el servidor no tenga IA disponible.
                    </p>
                  )}
                </div>

                <p className="text-[11px] leading-relaxed text-sand-400">
                  La clave de Gemini se configura en el servidor (variable <code className="font-mono text-sand-200">GEMINI_API_KEY</code> en
                  Vercel o en <code className="font-mono text-sand-200">.env</code> en local). El navegador nunca la recibe.
                </p>

                {testResult && (
                  <div
                    role="status"
                    className={`rounded-xl border p-3 ${
                      testResult.success
                        ? "border-ink-500/50 bg-ink-950/50 text-ink-200"
                        : "border-hint-500/50 bg-hint-950/50 text-hint-200"
                    }`}
                  >
                    <p className="font-semibold">
                      {testResult.success ? "✅ Éxito" : "⚠️ Aviso"}
                    </p>
                    <p className="mt-0.5 text-[11px] leading-relaxed">
                      {testResult.message}
                    </p>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    disabled={isTesting}
                    onClick={handleTestAI}
                    className="flex-1 min-h-[44px] rounded-xl bg-ink-600 px-4 py-2.5 font-bold text-white transition hover:bg-ink-500 disabled:opacity-50"
                  >
                    {isTesting ? "Probando..." : "Probar conexión IA"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-4 text-xs">
                <div className="rounded-xl border border-sand-800 bg-sand-950/80 p-3">
                  <p className="text-sand-300 font-semibold mb-1">
                    Estado de la Base de Datos:
                  </p>
                  {isDbConnected ? (
                    <p className="text-hint-400 flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-hint-400" />
                      <strong>Supabase Cloud Activo:</strong> Sincronización en
                      tiempo real de PINs y ejercicios entre diferentes
                      computadoras y teléfonos.
                    </p>
                  ) : (
                    <p className="text-amber-400 flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-amber-400" />
                      <strong>Modo LocalStorage:</strong> Las aulas y PINs se
                      almacenan localmente en el navegador de este dispositivo.
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="supabase-url-input"
                    className="block font-semibold text-sand-200 mb-1"
                  >
                    Project URL de Supabase:
                  </label>
                  <input
                    id="supabase-url-input"
                    type="text"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    placeholder="https://xyzcompany.supabase.co"
                    className="w-full rounded-xl border border-sand-700 bg-sand-950 px-3 py-2 text-xs text-white outline-none focus:border-hint-400 font-mono"
                  />
                </div>

                <div>
                  <label
                    htmlFor="supabase-key-input"
                    className="block font-semibold text-sand-200 mb-1"
                  >
                    Anon Public Key (Clave Pública Anónima):
                  </label>
                  <input
                    id="supabase-key-input"
                    type="password"
                    value={supabaseKey}
                    onChange={(e) => setSupabaseKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full rounded-xl border border-sand-700 bg-sand-950 px-3 py-2 text-xs text-white outline-none focus:border-hint-400 font-mono"
                  />
                  <p className="mt-1.5 text-[11px] text-sand-400">
                    Crea tu proyecto gratuito en{" "}
                    <a
                      href="https://supabase.com"
                      target="_blank"
                      rel="noreferrer"
                      className="text-hint-400 underline hover:text-hint-300"
                    >
                      supabase.com
                    </a>{" "}
                    y ejecuta el script disponible en{" "}
                    <span className="font-mono text-amber-300">
                      supabase/schema.sql
                    </span>
                    .
                  </p>
                </div>

                {dbTestResult && (
                  <div
                    className={`rounded-xl border p-3 ${
                      dbTestResult.success
                        ? "border-emerald-500/50 bg-emerald-950/50 text-emerald-200"
                        : "border-rose-500/50 bg-rose-950/50 text-rose-200"
                    }`}
                  >
                    <p className="font-semibold">
                      {dbTestResult.success
                        ? "✅ Conexión Exitosa"
                        : "⚠️ Aviso de Base de Datos"}
                    </p>
                    <p className="mt-0.5 text-[11px] leading-relaxed">
                      {dbTestResult.message}
                    </p>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    disabled={isDbTesting}
                    onClick={handleSaveAndTestDb}
                    className="flex-1 rounded-xl bg-hint-500 px-4 py-2.5 font-bold text-sand-950 transition hover:bg-hint-400 disabled:opacity-50"
                  >
                    {isDbTesting
                      ? "Comprobando..."
                      : "Guardar y Probar Conexión BD"}
                  </button>
                  {isDbConnected && (
                    <button
                      type="button"
                      onClick={handleClearDb}
                      className="rounded-xl border border-sand-700 bg-sand-800 px-3 py-2.5 font-semibold text-sand-300 hover:bg-sand-700"
                    >
                      Usar Solo Local
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

function EvaluatorPill({
  currentView,
  onViewChange,
}: {
  currentView: AppView
  onViewChange: (v: AppView) => void
}) {
  const [open, setOpen] = useState(false)

  const viewsList: [AppView, string][] = [
    ["landing", "🏠 Inicio / Landing"],

    ["portal", "Portal Acceso"],

    ["dashboard", "Panel Docente"],

    ["chat", "Chat IA Docente"],

    ["editor", "Editor de Guía"],

    ["planner", "Planificador ERCA"],

    ["student", "Zona Estudiante"],

    ["simulator", "Simulador Admisión"],

    ["admin", "🛡️ Administración"],
  ]

  return (
    <div className="fixed bottom-3 right-3 z-50 print:hidden font-sans">
      {open ? (
        <div className="rounded-2xl border border-sand-700 bg-sand-950/95 p-3 text-white shadow-2xl backdrop-blur-md text-xs">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-2 mb-2">
            <span className="font-bold text-hint-300">
              ⚖️ Modo Jurado / Evaluador
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-sand-400 hover:text-white px-1"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {viewsList.map(([v, label]) => (
              <button
                key={v}
                type="button"
                onClick={() => {
                  onViewChange(v)
                  setOpen(false)
                }}
                className={`rounded-lg px-2.5 py-1.5 text-left font-medium transition ${
                  currentView === v
                    ? "bg-ink-500 text-sand-950 font-bold"
                    : "hover:bg-white/10 text-sand-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 rounded-full bg-sand-900/90 border border-hint-400/50 px-3 py-1.5 text-xs font-bold text-hint-300 shadow-xl backdrop-blur hover:bg-sand-800"
          title="Menú rápido para jurado / evaluador"
        >
          <span>⚖️ Evaluador</span>
        </button>
      )}
    </div>
  )
}

export default App
