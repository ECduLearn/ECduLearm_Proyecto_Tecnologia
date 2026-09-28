import { FormEvent, ReactNode, useEffect, useRef, useState } from "react";
import { AccessPortal, TeacherDashboard } from "./Portal";
import AutonomousZone from "./AutonomousZone";
import { AdmissionSimulator, PlanningWorkspace } from "./AdvancedModules";

type IconName =
  | "arrow-left"
  | "bold"
  | "book"
  | "check"
  | "chevron"
  | "clock"
  | "download"
  | "file"
  | "info"
  | "italic"
  | "magic"
  | "menu"
  | "paperclip"
  | "plus"
  | "printer"
  | "redo"
  | "send"
  | "share"
  | "sparkles"
  | "undo"
  | "upload"
  | "user"
  | "x";

type Message = {
  id: number;
  role: "user" | "assistant";
  text: string;
};

type Exercise = {
  topic: string;
  context: string;
  level: string;
  difficulty: string;
  questions: number;
  version: number;
};

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
  paperclip: <path d="m21.4 11.6-8.9 8.9a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5" />,
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
};

const initialExercise: Exercise = {
  topic: "Estabilidad de estructuras",
  context: "Ingeniería civil",
  level: "2do BGU",
  difficulty: "Intermedia",
  questions: 3,
  version: 1,
};

const initialMessages: Message[] = [
  {
    id: 1,
    role: "user",
    text: "Ingeniería civil, tengo varios alumnos que quieren seguir esa carrera.",
  },
  {
    id: 2,
    role: "assistant",
    text: "Perfecto. Preparé un desafío que conecta el razonamiento lógico con una decisión real de ingeniería civil.",
  },
];

const recentItems = [
  { title: "Análisis estructural", meta: "Ingeniería Civil · Ahora", context: "Ingeniería civil" },
  { title: "Funciones cuadráticas", meta: "Arquitectura · Ayer", context: "Arquitectura" },
  { title: "Interés compuesto", meta: "Finanzas · 12 jun", context: "Economía" },
];

const quickActions = ["Más fácil", "Contexto de arquitectura", "Economía", "Agrega una pregunta"];

function Icon({ name, className = "size-5" }: { name: IconName; className?: string }) {
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
  );
}

function Logo() {
  return (
    <div className="flex items-center gap-3" aria-label="ECduLearm">
      <span className="grid size-10 place-items-center rounded-xl bg-white text-blue-950">
        <Icon name="book" className="size-5" />
      </span>
      <span className="text-lg font-bold tracking-tight text-white">
        EC<span className="text-teal-300">du</span>Learm
      </span>
    </div>
  );
}

const editorActions = ["Hacer más fácil", "Hacer más difícil", "Cambiar contexto", "Regenerar"];

function EditorTools({
  fileName,
  command,
  onCommandChange,
  onFileChange,
  onApply,
  onQuickAction,
}: {
  fileName: string;
  command: string;
  onCommandChange: (value: string) => void;
  onFileChange: (name: string) => void;
  onApply: () => void;
  onQuickAction: (action: string) => void;
}) {
  return (
    <div className="space-y-7">
      <section>
        <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <Icon name="paperclip" className="size-4 text-blue-800" />
          Contexto de la guía
        </div>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          Añade un sílabo, notas o el currículo para orientar a la IA.
        </p>
        <label className="mt-4 flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 text-center transition hover:border-blue-400 hover:bg-blue-50">
          <input
            type="file"
            className="sr-only"
            accept=".pdf,.doc,.docx,.txt"
            onChange={(event) => onFileChange(event.target.files?.[0]?.name ?? "")}
          />
          <span className="grid size-10 place-items-center rounded-xl bg-white text-blue-900 shadow-sm">
            <Icon name="upload" className="size-5" />
          </span>
          <span className="mt-3 text-sm font-semibold text-slate-700">
            {fileName || "Subir archivo"}
          </span>
          <span className="mt-1 text-xs text-slate-500">PDF, Word o TXT · máx. 10 MB</span>
        </label>
      </section>

      <section className="border-t border-slate-200 pt-6">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <Icon name="magic" className="size-4 text-blue-800" />
          Ajuste rápido con IA
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {editorActions.map((action) => (
            <button
              key={action}
              type="button"
              onClick={() => onQuickAction(action)}
              className="min-h-10 rounded-full border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-blue-400 hover:bg-blue-50 focus:outline-none focus:ring-4 focus:ring-blue-100"
            >
              {action}
            </button>
          ))}
        </div>
      </section>

      <section className="border-t border-slate-200 pt-6">
        <label htmlFor="ai-command" className="text-sm font-bold text-slate-900">
          Instrucción personalizada
        </label>
        <textarea
          id="ai-command"
          rows={4}
          value={command}
          onChange={(event) => onCommandChange(event.target.value)}
          placeholder='Ej: “Reescribe el problema 2 para que hable de economía local”'
          className="mt-3 w-full resize-none rounded-xl border border-slate-300 bg-white p-3 text-sm leading-relaxed text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
        />
        <button
          type="button"
          disabled={!command.trim()}
          onClick={onApply}
          className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-950 px-4 text-sm font-bold text-white transition hover:bg-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          <Icon name="sparkles" className="size-4" />
          Aplicar al documento
        </button>
      </section>
    </div>
  );
}

function EditorView({ exercise, onBack }: { exercise: Exercise; onBack: () => void }) {
  const [title, setTitle] = useState("Guía PISA: Análisis de Estructuras Civiles");
  const [fileName, setFileName] = useState("");
  const [command, setCommand] = useState("");
  const [notice, setNotice] = useState("Todos los cambios guardados");
  const [toolsOpen, setToolsOpen] = useState(false);
  const [selectionOpen, setSelectionOpen] = useState(false);

  const applyAI = (label: string) => {
    setNotice(`Aplicando “${label}”...`);
    window.setTimeout(() => setNotice("Cambios de IA aplicados y guardados"), 700);
    setCommand("");
  };

  const checkSelection = () => {
    setSelectionOpen(Boolean(window.getSelection()?.toString().trim()));
  };

  const formatSelection = (commandName: string) => {
    document.execCommand(commandName);
    setNotice("Formato actualizado");
    setSelectionOpen(false);
  };

  const shareDocument = async () => {
    await navigator.clipboard?.writeText(window.location.href);
    setNotice("Enlace de la guía copiado");
  };

  return (
    <div className="min-h-screen bg-slate-200 text-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur print:hidden">
        <div className="grid min-h-16 grid-cols-[auto_1fr_auto] items-center gap-3 px-3 sm:px-5">
          <button
            type="button"
            onClick={onBack}
            className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-100"
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
                setTitle(event.target.value);
                setNotice("Guardando cambios...");
              }}
              onBlur={() => setNotice("Todos los cambios guardados")}
              className="w-full truncate rounded-lg bg-transparent px-2 py-1 text-center text-sm font-bold text-slate-950 outline-none hover:bg-slate-100 focus:bg-slate-100 focus:ring-4 focus:ring-blue-100 sm:text-base"
            />
            <p className="mt-0.5 flex items-center justify-center gap-1.5 text-xs text-slate-500" aria-live="polite">
              <Icon name="check" className="size-3.5 text-teal-600" />
              {notice}
            </p>
          </div>

          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={shareDocument}
              className="grid size-11 place-items-center rounded-xl text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-100"
              aria-label="Compartir guía"
            >
              <Icon name="share" className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="hidden min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-100 md:flex"
            >
              <Icon name="printer" className="size-4" />
              Imprimir
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex min-h-11 items-center gap-2 rounded-xl bg-blue-950 px-3 text-sm font-bold text-white transition hover:bg-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-100 sm:px-4"
            >
              <Icon name="download" className="size-4" />
              <span className="hidden sm:inline">Exportar</span>
              <span className="hidden xl:inline">PDF/Word</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-4rem)]">
        <aside className="hidden w-80 shrink-0 border-r border-slate-200 bg-white p-6 print:hidden lg:block">
          <EditorTools
            fileName={fileName}
            command={command}
            onCommandChange={setCommand}
            onFileChange={(name) => {
              setFileName(name);
              if (name) setNotice(`${name} añadido como contexto`);
            }}
            onApply={() => applyAI(command)}
            onQuickAction={applyAI}
          />
        </aside>

        <main className="min-w-0 flex-1 overflow-auto px-3 py-6 pb-28 sm:px-8 sm:py-10 lg:pb-10">
          <div className="mx-auto mb-4 flex max-w-4xl items-center justify-between print:hidden">
            <div className="flex items-center gap-1 rounded-xl border border-slate-300 bg-white p-1 shadow-sm">
              <button
                type="button"
                onClick={() => document.execCommand("undo")}
                className="grid size-9 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-100"
                aria-label="Deshacer"
              >
                <Icon name="undo" className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => document.execCommand("redo")}
                className="grid size-9 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-100"
                aria-label="Rehacer"
              >
                <Icon name="redo" className="size-4" />
              </button>
              <span className="mx-1 h-5 w-px bg-slate-200" />
              <button
                type="button"
                onClick={() => formatSelection("bold")}
                className="grid size-9 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-100"
                aria-label="Negrita"
              >
                <Icon name="bold" className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => formatSelection("italic")}
                className="grid size-9 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-100"
                aria-label="Cursiva"
              >
                <Icon name="italic" className="size-4" />
              </button>
            </div>
            <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 shadow-sm">
              Página 1 de 1 · A4
            </span>
          </div>

          <article
            id="guide-document"
            className="relative mx-auto min-h-[70rem] max-w-4xl bg-white px-6 py-10 shadow-2xl shadow-slate-900/10 sm:px-12 sm:py-14 md:px-16"
            onMouseUp={checkSelection}
            onKeyUp={checkSelection}
          >
            {selectionOpen && (
              <div className="absolute left-1/2 top-5 z-20 flex -translate-x-1/2 items-center gap-1 rounded-xl bg-slate-950 p-1.5 text-white shadow-xl print:hidden">
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => formatSelection("bold")}
                  className="grid size-9 place-items-center rounded-lg hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/50"
                  aria-label="Poner en negrita"
                >
                  <Icon name="bold" className="size-4" />
                </button>
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => formatSelection("italic")}
                  className="grid size-9 place-items-center rounded-lg hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/50"
                  aria-label="Poner en cursiva"
                >
                  <Icon name="italic" className="size-4" />
                </button>
                <span className="mx-1 h-5 w-px bg-white/20" />
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => applyAI("Mejorar redacción")}
                  className="flex min-h-9 items-center gap-2 rounded-lg px-2.5 text-xs font-semibold hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/50"
                >
                  <Icon name="sparkles" className="size-4 text-teal-300" />
                  Mejorar
                </button>
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => applyAI("Simplificar texto")}
                  className="hidden min-h-9 items-center rounded-lg px-2.5 text-xs font-semibold hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/50 sm:flex"
                >
                  Simplificar
                </button>
              </div>
            )}

            <div className="border-b-2 border-blue-950 pb-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-blue-950 text-white">
                    <Icon name="book" className="size-5" />
                  </span>
                  <span className="text-lg font-bold tracking-tight text-blue-950">ECduLearm</span>
                </div>
                <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-blue-900">
                  Guía docente · {exercise.level}
                </span>
              </div>
              <p className="mt-8 text-xs font-bold uppercase tracking-[0.18em] text-teal-700">
                Razonamiento lógico · {exercise.context}
              </p>
              <h1
                contentEditable
                suppressContentEditableWarning
                className="mt-2 rounded-lg text-3xl font-bold leading-tight tracking-tight text-blue-950 outline-none hover:bg-blue-50/60 focus:bg-blue-50 focus:ring-4 focus:ring-blue-100 sm:text-4xl"
                onInput={() => setNotice("Guardando cambios...")}
                onBlur={() => setNotice("Todos los cambios guardados")}
              >
                Análisis de estructuras civiles
              </h1>
              <p className="mt-3 text-sm text-slate-500">Actividad contextualizada tipo PISA · Dificultad intermedia</p>
            </div>

            <div
              className="mt-9 space-y-9 text-[0.95rem] leading-7 text-slate-700"
              contentEditable
              suppressContentEditableWarning
              onInput={() => setNotice("Guardando cambios...")}
              onBlur={() => setNotice("Todos los cambios guardados")}
            >
              <section>
                <p className="text-xs font-bold uppercase tracking-widest text-teal-700">Situación</p>
                <h2 className="mt-2 text-xl font-bold text-slate-950">Un centro comunitario seguro y sostenible</h2>
                <p className="mt-3">
                  El municipio construirá un centro comunitario en una zona de alta actividad sísmica. Un equipo de
                  estudiantes analiza dos propuestas estructurales que utilizan módulos triangulares de 4 metros de base y
                  3 metros de altura. La meta es elegir una solución que distribuya adecuadamente las cargas y use los
                  materiales de forma responsable.
                </p>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Datos para el análisis</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-white p-4">
                    <p className="font-bold text-blue-950">Propuesta A</p>
                    <p className="mt-1 text-sm">12 módulos · 28 kg de acero por módulo</p>
                  </div>
                  <div className="rounded-xl bg-white p-4">
                    <p className="font-bold text-blue-950">Propuesta B</p>
                    <p className="mt-1 text-sm">10 módulos · 34 kg de acero por módulo</p>
                  </div>
                </div>
              </section>

              <section>
                <p className="text-xs font-bold uppercase tracking-widest text-teal-700">Preguntas de desarrollo</p>
                <ol className="mt-4 space-y-5">
                  <li>
                    <strong className="text-slate-950">1. Comprender.</strong> Calcula el área de uno de los módulos
                    triangulares. Explica el procedimiento utilizado.
                    <div className="mt-4 h-16 border-b border-dashed border-slate-300" />
                  </li>
                  <li>
                    <strong className="text-slate-950">2. Analizar.</strong> Compara la cantidad total de acero requerida
                    por cada propuesta. ¿Cuál utiliza menos material?
                    <div className="mt-4 h-16 border-b border-dashed border-slate-300" />
                  </li>
                  <li>
                    <strong className="text-slate-950">3. Reflexionar.</strong> ¿Qué propuesta recomendarías al municipio?
                    Sustenta tu decisión usando los datos y un criterio de seguridad.
                    <div className="mt-4 h-20 border-b border-dashed border-slate-300" />
                  </li>
                </ol>
              </section>
            </div>

            <div className="mt-12 flex flex-wrap justify-between gap-3 border-t border-slate-200 pt-5 text-xs text-slate-400">
              <span>ECduLearm · Material para uso educativo</span>
              <span>Generado con asistencia de IA · Revisión docente recomendada</span>
            </div>
          </article>
        </main>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white p-3 print:hidden lg:hidden">
        <div className="mx-auto flex max-w-xl items-center gap-2">
          {editorActions.slice(0, 2).map((action) => (
            <button
              key={action}
              type="button"
              onClick={() => applyAI(action)}
              className="min-h-11 flex-1 rounded-full border border-slate-300 px-3 text-xs font-semibold text-slate-700"
            >
              {action}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setToolsOpen(true)}
            className="flex min-h-11 items-center gap-2 rounded-xl bg-blue-950 px-4 text-sm font-bold text-white"
          >
            <Icon name="magic" className="size-4" />
            Más
          </button>
        </div>
      </div>

      {toolsOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm print:hidden lg:hidden">
          <button
            type="button"
            className="absolute inset-0"
            onClick={() => setToolsOpen(false)}
            aria-label="Cerrar herramientas"
          />
          <aside className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <p className="font-bold text-slate-950">Herramientas de IA</p>
              <button
                type="button"
                onClick={() => setToolsOpen(false)}
                className="grid size-11 place-items-center rounded-xl text-slate-600 hover:bg-slate-100"
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
                applyAI(command);
                setToolsOpen(false);
              }}
              onQuickAction={(action) => {
                applyAI(action);
                setToolsOpen(false);
              }}
            />
          </aside>
        </div>
      )}
    </div>
  );
}

function App() {
  const [view, setView] = useState<
    "portal" | "student" | "dashboard" | "planner" | "simulator" | "chat" | "editor"
  >("portal");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [exercise, setExercise] = useState<Exercise>(initialExercise);
  const [versions, setVersions] = useState<Exercise[]>([]);
  const [hasExercise, setHasExercise] = useState(true);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const timerRef = useRef<number | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(
    () => () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    },
    [],
  );

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isGenerating, hasExercise]);

  const processPrompt = (prompt: string) => {
    if (!prompt.trim() || isGenerating) return;

    const normalized = prompt.toLowerCase();
    const nextExercise: Exercise = hasExercise
      ? { ...exercise, version: exercise.version + 1 }
      : {
          ...initialExercise,
          topic: prompt.length > 54 ? `${prompt.slice(0, 54)}…` : prompt,
          version: 1,
        };

    if (normalized.includes("fácil") || normalized.includes("basica") || normalized.includes("básica")) {
      nextExercise.difficulty = "Básica";
    }
    if (normalized.includes("arquitectura")) nextExercise.context = "Arquitectura";
    if (normalized.includes("econom")) nextExercise.context = "Economía";
    if (normalized.includes("ingeniería") || normalized.includes("civil")) nextExercise.context = "Ingeniería civil";
    if (normalized.includes("pregunta")) nextExercise.questions += 1;

    if (hasExercise) setVersions((current) => [...current, exercise]);
    setMessages((current) => [
      ...current,
      { id: Date.now(), role: "user", text: prompt.trim() },
    ]);
    setInput("");
    setIsGenerating(true);

    timerRef.current = window.setTimeout(() => {
      setExercise(nextExercise);
      setHasExercise(true);
      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          role: "assistant",
          text: hasExercise
            ? "Listo. Ajusté el ejercicio y guardé la versión anterior por si deseas volver."
            : "Listo. Organicé tu idea como un ejercicio contextualizado tipo PISA.",
        },
      ]);
      setIsGenerating(false);
    }, 900);
  };

  const submitPrompt = (event: FormEvent) => {
    event.preventDefault();
    processPrompt(input);
  };

  const startNewExercise = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setMessages([
      {
        id: Date.now(),
        role: "assistant",
        text: "¿Qué tema deseas trabajar? Puedes describirlo con tus palabras o elegir una sugerencia.",
      },
    ]);
    setHasExercise(false);
    setVersions([]);
    setInput("");
    setIsGenerating(false);
    setSidebarOpen(false);
  };

  const undoVersion = () => {
    const previous = versions.at(-1);
    if (!previous) return;
    setExercise(previous);
    setVersions((current) => current.slice(0, -1));
    setMessages((current) => [
      ...current,
      {
        id: Date.now(),
        role: "assistant",
        text: `Restauré la versión ${previous.version}. Puedes seguir iterando sin perder tu trabajo.`,
      },
    ]);
  };

  const openRecent = (item: (typeof recentItems)[number]) => {
    const recentExercise = {
      ...initialExercise,
      topic: item.title,
      context: item.context,
    };
    setExercise(recentExercise);
    setHasExercise(true);
    setVersions([]);
    setMessages([
      {
        id: Date.now(),
        role: "assistant",
        text: `Abrí “${item.title}”. Puedes continuar desde donde lo dejaste o pedir cualquier cambio.`,
      },
    ]);
    setSidebarOpen(false);
  };

  if (view === "portal") {
    return (
      <AccessPortal
        onStudentEnter={() => setView("student")}
        onTeacherEnter={() => setView("dashboard")}
      />
    );
  }

  if (view === "student") {
    return (
      <AutonomousZone
        onExit={() => setView("portal")}
        onSimulator={() => setView("simulator")}
      />
    );
  }

  if (view === "dashboard") {
    return (
      <TeacherDashboard
        onExit={() => setView("portal")}
        onCreateContent={() => setView("chat")}
        onOpenPlanner={() => setView("planner")}
      />
    );
  }

  if (view === "planner") {
    return <PlanningWorkspace onBack={() => setView("dashboard")} />;
  }

  if (view === "simulator") {
    return <AdmissionSimulator onBack={() => setView("student")} />;
  }

  if (view === "editor") {
    return <EditorView exercise={exercise} onBack={() => setView("chat")} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden"
          aria-label="Cerrar navegación"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        id="app-sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-blue-950 p-4 text-white transition-transform duration-300 print:hidden lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Navegación e historial"
      >
        <div className="flex items-center justify-between px-1">
          <Logo />
          <button
            type="button"
            className="grid size-11 place-items-center rounded-xl text-blue-100 hover:bg-white/10 focus:outline-none focus:ring-4 focus:ring-white/20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Cerrar menú"
          >
            <Icon name="x" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setView("dashboard")}
          className="mt-5 flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-blue-100 transition hover:bg-white/10 focus:outline-none focus:ring-4 focus:ring-white/15"
        >
          <Icon name="arrow-left" className="size-4" />
          Volver al panel docente
        </button>

        <button
          type="button"
          onClick={startNewExercise}
          className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-blue-950 shadow-lg shadow-slate-950/20 transition hover:bg-blue-50 focus:outline-none focus:ring-4 focus:ring-white/20"
        >
          <Icon name="plus" className="size-5" />
          Nuevo ejercicio
        </button>

        <nav className="mt-8 min-h-0 flex-1 overflow-y-auto" aria-label="Ejercicios recientes">
          <p className="px-2 text-xs font-bold uppercase tracking-widest text-blue-200">Recientes</p>
          <div className="mt-3 space-y-1">
            {recentItems.map((item, index) => (
              <button
                key={item.title}
                type="button"
                onClick={() => openRecent(item)}
                className={`min-h-16 w-full rounded-xl px-3 py-2.5 text-left transition hover:bg-white/10 focus:outline-none focus:ring-4 focus:ring-white/15 ${
                  index === 0 && hasExercise ? "bg-white/10" : ""
                }`}
              >
                <span className="block truncate text-sm font-semibold text-white">{item.title}</span>
                <span className="mt-1 block truncate text-xs text-blue-200">{item.meta}</span>
              </button>
            ))}
          </div>
        </nav>

        <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-teal-200">
            <Icon name="info" className="size-4" />
            Tip para iterar
          </div>
          <p className="mt-2 text-xs leading-relaxed text-blue-100">
            Escribe “contexto de arquitectura” para adaptar la guía al instante.
          </p>
        </div>

        <button
          type="button"
          className="mt-4 flex min-h-14 items-center gap-3 rounded-xl px-2 text-left hover:bg-white/10 focus:outline-none focus:ring-4 focus:ring-white/15"
        >
          <span className="grid size-10 place-items-center rounded-full bg-teal-100 text-blue-950">
            <Icon name="user" className="size-5" />
          </span>
          <span>
            <span className="block text-sm font-semibold">María Andrade</span>
            <span className="block text-xs text-blue-200">Docente · 2do BGU</span>
          </span>
        </button>
      </aside>

      <div className="flex min-h-screen flex-col lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur print:hidden">
          <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                className="grid size-11 shrink-0 place-items-center rounded-xl text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-100 lg:hidden"
                onClick={() => setSidebarOpen(true)}
                aria-label="Abrir menú"
                aria-controls="app-sidebar"
                aria-expanded={sidebarOpen}
              >
                <Icon name="menu" />
              </button>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-950">
                  {hasExercise ? exercise.topic : "Nuevo ejercicio"}
                </p>
                <p className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="size-1.5 rounded-full bg-teal-500" />
                  Asistente pedagógico
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {hasExercise && versions.length > 0 && (
                <button
                  type="button"
                  onClick={undoVersion}
                  className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-blue-100"
                >
                  <Icon name="undo" className="size-4" />
                  <span className="hidden sm:inline">Deshacer</span>
                </button>
              )}
              {hasExercise && (
                <button
                  type="button"
                  onClick={() => setView("editor")}
                  className="flex min-h-11 items-center gap-2 rounded-xl bg-blue-950 px-3 text-sm font-semibold text-white transition hover:bg-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-100 sm:px-4"
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
            <div className="mb-8 flex items-center justify-center gap-2 text-xs font-medium text-slate-500 print:hidden">
              <Icon name="clock" className="size-4" />
              Hoy
            </div>

            <div className="space-y-6 print:hidden" aria-live="polite" aria-busy={isGenerating}>
              {messages.map((message) =>
                message.role === "user" ? (
                  <div key={message.id} className="flex justify-end">
                    <div className="max-w-xl rounded-2xl rounded-br-md bg-blue-950 px-4 py-3 text-sm leading-relaxed text-white shadow-sm sm:px-5">
                      {message.text}
                    </div>
                  </div>
                ) : (
                  <div key={message.id} className="flex items-start gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-teal-100 text-teal-800">
                      <Icon name="sparkles" className="size-4" />
                    </span>
                    <div className="max-w-2xl rounded-2xl rounded-tl-md border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-700 shadow-sm sm:px-5">
                      {message.text}
                    </div>
                  </div>
                ),
              )}

              {isGenerating && (
                <div className="flex items-start gap-3" aria-live="polite">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-teal-100 text-teal-800">
                    <Icon name="sparkles" className="size-4 animate-pulse" />
                  </span>
                  <div
                    className="flex min-h-12 items-center gap-3 rounded-2xl rounded-tl-md border border-slate-200 bg-white px-5 text-sm font-medium text-slate-600 shadow-sm"
                    role="status"
                  >
                    <span className="size-4 animate-spin rounded-full border-2 border-slate-200 border-t-blue-800" />
                    Adaptando el ejercicio...
                  </div>
                </div>
              )}
            </div>

            {!hasExercise && !isGenerating && (
              <div className="mx-auto mt-10 max-w-2xl text-center print:hidden">
                <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-blue-950 text-white shadow-lg shadow-blue-950/15">
                  <Icon name="sparkles" className="size-6" />
                </span>
                <h1 className="mt-5 text-2xl font-bold tracking-tight text-blue-950 sm:text-3xl">
                  ¿Qué vamos a crear hoy?
                </h1>
                <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-slate-600">
                  Describe un tema, curso o contexto. ECduLearm lo convertirá en una actividad de razonamiento lista para usar.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {["Funciones cuadráticas para 1ro BGU", "Probabilidad con fútbol", "Finanzas personales"].map(
                    (suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => processPrompt(suggestion)}
                        className="min-h-11 rounded-full border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus:ring-4 focus:ring-blue-100"
                      >
                        {suggestion}
                      </button>
                    ),
                  )}
                </div>
              </div>
            )}

            {hasExercise && (
              <div className="mt-6 sm:ml-12">
                <article
                  id="exercise-document"
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5"
                >
                  <div className="border-b border-slate-200 bg-slate-50 px-5 py-4 sm:px-8">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap gap-2">
                        {[exercise.context, exercise.level, "Razonamiento lógico"].map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-blue-900"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                        <Icon name="check" className="size-4 text-teal-600" />
                        Versión {exercise.version}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 sm:p-8">
                    <div className="flex items-start gap-4">
                      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-blue-950 text-white">
                        <Icon name="file" className="size-5" />
                      </span>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-teal-700">Desafío aplicado</p>
                        <h2 className="mt-1 text-xl font-bold leading-tight text-blue-950 sm:text-2xl">
                          {exercise.topic}
                        </h2>
                        <p className="mt-2 text-sm text-slate-500">
                          Dificultad {exercise.difficulty.toLowerCase()} · {exercise.questions} preguntas
                        </p>
                      </div>
                    </div>

                    <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
                      <p className="text-sm font-bold text-slate-900">Situación</p>
                      <p className="mt-2 text-sm leading-7 text-slate-700">
                        Un equipo de estudiantes analiza la estabilidad de una estructura para un nuevo centro comunitario.
                        El diseño utiliza módulos triangulares de 4 metros de base y 3 metros de altura. Antes de construir,
                        deben comparar alternativas y justificar cuál distribuye mejor las cargas.
                      </p>
                    </div>

                    <div className="mt-7 space-y-5">
                      {Array.from({ length: Math.min(exercise.questions, 4) }, (_, index) => (
                        <div key={index} className="flex gap-4">
                          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-blue-100 text-sm font-bold text-blue-950">
                            {index + 1}
                          </span>
                          <div>
                            <p className="text-sm font-semibold leading-6 text-slate-800">
                              {index === 0
                                ? "Calcula el área de uno de los módulos triangulares utilizados en la estructura."
                                : index === 1
                                  ? "Si el diseño requiere 12 módulos, ¿qué superficie total representan?"
                                  : index === 2
                                    ? "Explica qué alternativa elegirías y sustenta tu decisión con los datos."
                                    : "Propón un cambio al diseño que reduzca material sin comprometer la estabilidad."}
                            </p>
                            <div className="mt-3 h-8 border-b border-dashed border-slate-300" />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5 text-xs text-slate-500">
                      <span>ECduLearm · Guía docente</span>
                      <span>Solucionario disponible al exportar</span>
                    </div>
                  </div>
                </article>

                <div className="mt-4 print:hidden">
                  <p className="mb-2 text-xs font-semibold text-slate-500">Ajusta sin escribir un prompt largo</p>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {quickActions.map((action) => (
                      <button
                        key={action}
                        type="button"
                        disabled={isGenerating}
                        onClick={() => processPrompt(action)}
                        className="min-h-11 shrink-0 rounded-full border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-wait disabled:opacity-50"
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
        </main>

        <footer className="sticky bottom-0 z-20 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur print:hidden sm:px-6">
          <form onSubmit={submitPrompt} className="mx-auto max-w-4xl">
            <div className="flex items-end gap-2 rounded-2xl border border-slate-300 bg-white p-2 shadow-lg shadow-slate-900/5 transition focus-within:border-blue-700 focus-within:ring-4 focus-within:ring-blue-100">
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
                    event.preventDefault();
                    processPrompt(input);
                  }
                }}
                placeholder='Ej: “más fácil”, “contexto de arquitectura”, “agrega una pregunta”...'
                className="max-h-32 min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-wait"
              />
              <button
                type="submit"
                disabled={!input.trim() || isGenerating}
                className="grid size-11 shrink-0 place-items-center rounded-xl bg-blue-950 text-white transition hover:bg-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-slate-300"
                aria-label="Enviar instrucción"
              >
                <Icon name="send" className="size-5" />
              </button>
            </div>
            <p className="mt-2 text-center text-xs text-slate-400">
              ECduLearm puede equivocarse. Revisa los resultados antes de usarlos en clase.
            </p>
          </form>
        </footer>
      </div>
    </div>
  );
}

export default App;
