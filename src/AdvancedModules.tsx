import { DragEvent, FormEvent, ReactNode, useEffect, useState } from "react";

type AdvancedIconName =
  | "arrow-left"
  | "book"
  | "check"
  | "chevron"
  | "clock"
  | "file"
  | "flag"
  | "magic"
  | "plus"
  | "send"
  | "shield"
  | "sparkles"
  | "upload"
  | "x";

const advancedIconPaths: Record<AdvancedIconName, ReactNode> = {
  "arrow-left": (
    <>
      <path d="m15 18-6-6 6-6" />
      <path d="M9 12h11" />
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
  file: (
    <>
      <path d="M6 2h8l4 4v16H6z" />
      <path d="M14 2v5h5M9 12h6M9 16h6" />
    </>
  ),
  flag: <path d="M5 22V4m0 0h11l-2 4 2 4H5" />,
  magic: (
    <>
      <path d="m15 4 5 5L8 21l-5-5Z" />
      <path d="m6 14 5 5M14 4l1-2M20 10l2 1M19 3l2-1M4 10 2-1" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  send: (
    <>
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </>
  ),
  shield: (
    <>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  sparkles: (
    <>
      <path d="m12 3-1.1 3.1A4.3 4.3 0 0 1 8.3 8.7L5 10l3.3 1.3a4.3 4.3 0 0 1 2.6 2.6L12 17l1.1-3.1a4.3 4.3 0 0 1 2.6-2.6L19 10l-3.3-1.3a4.3 4.3 0 0 1-2.6-2.6L12 3Z" />
    </>
  ),
  upload: (
    <>
      <path d="M12 16V4m0 0L7 9m5-5 5 5" />
      <path d="M4 15v5h16v-5" />
    </>
  ),
  x: <path d="m6 6 12 12M18 6 6 18" />,
};

function AdvancedIcon({
  name,
  className = "size-5",
}: {
  name: AdvancedIconName;
  className?: string;
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
      {advancedIconPaths[name]}
    </svg>
  );
}

const planningPhases = [
  {
    key: "anticipation",
    label: "Anticipación",
    time: "10 min",
    title: "Activar conocimientos previos",
    body: "Presentar una fotografía de un puente local y pedir al grupo que identifique las formas geométricas que aportan estabilidad. Registrar hipótesis sin evaluarlas todavía.",
  },
  {
    key: "construction",
    label: "Construcción del conocimiento",
    time: "25 min",
    title: "Explorar estructuras trianguladas",
    body: "En equipos, comparar modelos construidos con módulos cuadrados y triangulares. Medir su respuesta ante una carga y relacionar los resultados con el concepto de distribución de fuerzas.",
  },
  {
    key: "consolidation",
    label: "Consolidación",
    time: "10 min",
    title: "Transferir y argumentar",
    body: "Resolver una situación tipo PISA en la que deben elegir una estructura para un centro comunitario, justificar la decisión con datos y elaborar una conclusión breve.",
  },
];

export function PlanningWorkspace({ onBack }: { onBack: () => void }) {
  const [fileName, setFileName] = useState("");
  const [uploadState, setUploadState] = useState<"idle" | "loading" | "ready">("idle");
  const [duration, setDuration] = useState("45 min");
  const [objective, setObjective] = useState("Analizar cómo las formas triangulares distribuyen cargas en estructuras.");
  const [selectedPhase, setSelectedPhase] = useState("consolidation");
  const [notice, setNotice] = useState("Plan guardado automáticamente");
  const [isDragging, setIsDragging] = useState(false);

  const acceptFile = (name: string) => {
    if (!name) return;
    setFileName(name);
    setUploadState("loading");
    window.setTimeout(() => setUploadState("ready"), 700);
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    acceptFile(event.dataTransfer.files?.[0]?.name ?? "");
  };

  const applyAI = (action: string) => {
    setNotice(`Aplicando “${action}”...`);
    window.setTimeout(() => setNotice("Cambio aplicado y guardado"), 600);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6">
          <button
            type="button"
            onClick={onBack}
            className="flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-bold text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-100"
          >
            <AdvancedIcon name="arrow-left" />
            <span className="hidden sm:inline">Panel docente</span>
          </button>
          <div className="min-w-0 text-center">
            <p className="truncate text-sm font-bold text-blue-950 sm:text-base">Adaptador de planificación</p>
            <p className="flex items-center justify-center gap-1.5 text-xs text-slate-500" aria-live="polite">
              <AdvancedIcon name="check" className="size-3.5 text-teal-700" />
              {notice}
            </p>
          </div>
          <span className="hidden rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-900 sm:block">
            Plan de clase · Borrador
          </span>
        </div>
      </header>

      <main className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-[23rem_1fr]">
        <aside className="border-b border-slate-200 bg-white p-5 lg:border-b-0 lg:border-r lg:p-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-teal-700">1. Fuente pedagógica</p>
            <h1 className="mt-2 text-xl font-bold text-blue-950">Añade el contexto de tu clase</h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              El sistema acepta documentos completos y conserva su estructura.
            </p>
          </div>

          <label
            className={`mt-6 flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 text-center transition ${
              isDragging
                ? "border-blue-600 bg-blue-50"
                : uploadState === "ready"
                  ? "border-teal-400 bg-teal-50"
                  : "border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50"
            }`}
            onDragEnter={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <input
              type="file"
              className="sr-only"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.odt"
              onChange={(event) => acceptFile(event.target.files?.[0]?.name ?? "")}
            />
            <span
              className={`grid size-12 place-items-center rounded-2xl ${
                uploadState === "ready" ? "bg-teal-100 text-teal-900" : "bg-white text-blue-900 shadow-sm"
              }`}
            >
              <AdvancedIcon
                name={uploadState === "ready" ? "check" : "upload"}
                className={`size-6 ${uploadState === "loading" ? "animate-pulse" : ""}`}
              />
            </span>
            <span className="mt-4 text-sm font-bold text-slate-800">
              {uploadState === "loading"
                ? "Analizando estructura..."
                : fileName || "Arrastra o selecciona un archivo"}
            </span>
            <span className="mt-2 text-xs leading-relaxed text-slate-500">
              Temario, currículo o libro de texto
              <br />
              PDF, Word, PowerPoint, ODT o TXT
            </span>
          </label>

          <div className="mt-7 border-t border-slate-200 pt-6">
            <p className="text-xs font-bold uppercase tracking-widest text-teal-700">2. Parámetros</p>
            <label htmlFor="class-duration" className="mt-4 block text-sm font-bold text-slate-800">
              Duración de la clase
            </label>
            <select
              id="class-duration"
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
              className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold outline-none focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
            >
              <option>30 min</option>
              <option>45 min</option>
              <option>60 min</option>
              <option>90 min</option>
            </select>

            <label htmlFor="learning-objective" className="mt-5 block text-sm font-bold text-slate-800">
              Objetivo de aprendizaje
            </label>
            <textarea
              id="learning-objective"
              rows={4}
              value={objective}
              onChange={(event) => setObjective(event.target.value)}
              className="mt-2 w-full resize-none rounded-xl border border-slate-300 p-3 text-sm leading-relaxed outline-none focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
            />

            <button
              type="button"
              onClick={() => applyAI("Estructurar plan de clase")}
              className="mt-5 flex min-h-13 w-full items-center justify-center gap-2 rounded-xl bg-blue-950 px-5 text-sm font-bold text-white shadow-lg shadow-blue-950/15 hover:bg-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-200"
            >
              <AdvancedIcon name="magic" className="size-5" />
              Estructurar Plan de Clase
            </button>
          </div>
        </aside>

        <section className="min-w-0 overflow-auto p-4 sm:p-7 lg:p-10">
          <div className="mx-auto max-w-4xl">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-teal-700">Lienzo editable</p>
                <h2 className="mt-1 text-xl font-bold text-blue-950">Estructuras estables y distribución de cargas</h2>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <AdvancedIcon name="clock" className="size-4" />
                {duration} · 2do BGU
              </div>
            </div>

            <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/5 sm:p-8">
              <div className="border-b border-slate-200 pb-6">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Objetivo de aprendizaje</p>
                <p
                  contentEditable
                  suppressContentEditableWarning
                  className="mt-3 rounded-lg text-base leading-relaxed text-slate-700 outline-none hover:bg-blue-50 focus:bg-blue-50 focus:ring-4 focus:ring-blue-100"
                >
                  {objective}
                </p>
              </div>

              <div className="mt-7 space-y-5">
                {planningPhases.map((phase, index) => (
                  <section
                    key={phase.key}
                    className={`relative cursor-text rounded-2xl border p-5 transition sm:p-6 ${
                      selectedPhase === phase.key
                        ? "border-blue-400 bg-blue-50/50 ring-4 ring-blue-100"
                        : "border-slate-200 hover:border-blue-300"
                    }`}
                    onClick={() => setSelectedPhase(phase.key)}
                  >
                    {selectedPhase === phase.key && (
                      <div className="absolute -top-4 left-4 z-10 flex max-w-[calc(100%-2rem)] gap-1 overflow-x-auto rounded-xl bg-slate-950 p-1.5 text-white shadow-xl sm:left-auto sm:right-4">
                        {[
                          "Insertar ejercicio PISA aquí",
                          "Hacer esta explicación más corta",
                          "Generar rúbrica de evaluación",
                        ].map((action) => (
                          <button
                            key={action}
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              applyAI(action);
                            }}
                            className="min-h-9 shrink-0 rounded-lg px-3 text-xs font-semibold hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/50"
                          >
                            {action}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="flex items-start gap-4">
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-blue-950 text-sm font-bold text-white">
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-xs font-bold uppercase tracking-widest text-teal-700">{phase.label}</p>
                          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-500 shadow-sm">
                            {phase.time}
                          </span>
                        </div>
                        <h3
                          contentEditable
                          suppressContentEditableWarning
                          className="mt-2 rounded-md text-lg font-bold text-blue-950 outline-none focus:bg-white focus:ring-4 focus:ring-blue-100"
                        >
                          {phase.title}
                        </h3>
                        <p
                          contentEditable
                          suppressContentEditableWarning
                          className="mt-3 rounded-md text-sm leading-7 text-slate-700 outline-none focus:bg-white focus:ring-4 focus:ring-blue-100"
                        >
                          {phase.body}
                        </p>
                      </div>
                    </div>
                  </section>
                ))}
              </div>

              <button
                type="button"
                className="mt-6 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 text-sm font-bold text-slate-600 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-900"
              >
                <AdvancedIcon name="plus" className="size-4" />
                Añadir fase o actividad
              </button>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
}

const examQuestions = [
  {
    area: "Geometría",
    prompt:
      "Una escalera de 5 metros se apoya contra una pared. La base está a 3 metros de la pared. ¿Qué expresión permite calcular la altura alcanzada?",
    options: ["5² + 3²", "√(5² − 3²)", "5 × 3 ÷ 2", "(5 + 3)²"],
  },
  {
    area: "Álgebra",
    prompt: "Si 3x + 7 = 25, ¿qué operación conviene realizar primero para aislar la variable?",
    options: ["Dividir para 3", "Restar 7", "Sumar 25", "Multiplicar por 7"],
  },
  {
    area: "Razonamiento numérico",
    prompt: "Una cantidad aumenta 20% y luego disminuye 20%. ¿Qué deberías comparar para decidir si vuelve al valor inicial?",
    options: ["Las bases de cada porcentaje", "Solo los porcentajes", "El tiempo transcurrido", "La diferencia absoluta"],
  },
];

function formatTime(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":");
}

export function AdmissionSimulator({ onBack }: { onBack: () => void }) {
  const [mode, setMode] = useState<"exam" | "results" | "review">("exam");
  const [remaining, setRemaining] = useState(4530);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({ 1: "B", 3: "A", 5: "D" });
  const [flagged, setFlagged] = useState<Set<number>>(new Set([4]));
  const [finishOpen, setFinishOpen] = useState(false);
  const [reviewInput, setReviewInput] = useState("");
  const [reviewMessages, setReviewMessages] = useState([
    "Fallaste la pregunta 12. Analicemos juntos: ¿Qué fórmula usaste para calcular la hipotenusa?",
  ]);

  useEffect(() => {
    if (mode !== "exam") return;
    const timer = window.setInterval(() => {
      setRemaining((value) => {
        if (value <= 1) {
          window.clearInterval(timer);
          setMode("results");
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [mode]);

  const question = examQuestions[current % examQuestions.length];
  const currentNumber = current + 1;
  const currentAnswer = answers[currentNumber];
  const isUrgent = remaining < 600;

  const toggleFlag = () => {
    setFlagged((currentFlags) => {
      const next = new Set(currentFlags);
      if (next.has(currentNumber)) next.delete(currentNumber);
      else next.add(currentNumber);
      return next;
    });
  };

  if (mode === "results") {
    return (
      <div className="min-h-screen bg-slate-100 px-4 py-8 text-slate-950 sm:py-14">
        <main className="mx-auto max-w-3xl">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-xl shadow-slate-900/5 sm:p-10">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-teal-100 text-teal-900">
              <AdvancedIcon name="check" className="size-7" />
            </span>
            <p className="mt-6 text-xs font-bold uppercase tracking-widest text-teal-700">Simulador completado</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-blue-950">Tu práctica terminó. Ahora viene lo valioso.</h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-600">
              La revisión no se limita a una nota: analizaremos las decisiones que tomaste para fortalecer tu estrategia.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                ["28 / 40", "preguntas respondidas"],
                ["6", "marcadas para revisar"],
                ["01:02:14", "tiempo utilizado"],
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl bg-slate-50 p-5">
                  <p className="text-2xl font-bold text-blue-950">{value}</p>
                  <p className="mt-1 text-xs text-slate-500">{label}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-left">
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-950 text-white">
                  <AdvancedIcon name="sparkles" className="size-5" />
                </span>
                <div>
                  <h2 className="font-bold text-blue-950">Convierte errores en estrategia</h2>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">
                    El tutor seleccionará los problemas clave y te hará preguntas para reconstruir el razonamiento.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setMode("review")}
              className="mt-6 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-blue-950 px-6 text-sm font-bold text-white hover:bg-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-200"
            >
              <AdvancedIcon name="sparkles" className="size-5 text-teal-300" />
              Revisión Socrática
            </button>
            <button
              type="button"
              onClick={onBack}
              className="mt-3 min-h-11 px-4 text-sm font-bold text-slate-500 hover:text-blue-950"
            >
              Volver al centro de estudio
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (mode === "review") {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-950">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex min-h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
            <button
              type="button"
              onClick={() => setMode("results")}
              className="flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-bold text-slate-700 hover:bg-slate-100"
            >
              <AdvancedIcon name="arrow-left" />
              Resultados
            </button>
            <p className="font-bold text-blue-950">Revisión Socrática</p>
            <span className="rounded-full bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-900">Pregunta 12</span>
          </div>
        </header>
        <main className="mx-auto grid max-w-5xl gap-5 px-4 py-6 sm:px-6 lg:grid-cols-2 lg:py-10">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-700">Pregunta para revisar</p>
            <h1 className="mt-3 text-xl font-bold leading-tight text-blue-950">Escalera apoyada contra una pared</h1>
            <p className="mt-4 text-base leading-8 text-slate-700">{examQuestions[0].prompt}</p>
            <div className="mt-6 rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Tu elección durante el examen</p>
              <p className="mt-2 text-sm font-semibold text-slate-800">A. 5² + 3²</p>
            </div>
            <p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-slate-500">
              <AdvancedIcon name="shield" className="mt-0.5 size-4 shrink-0 text-teal-700" />
              No mostraremos la respuesta. El objetivo es que reconstruyas el procedimiento con una estrategia transferible.
            </p>
          </section>

          <section className="flex min-h-[32rem] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-200 p-5">
              <span className="grid size-10 place-items-center rounded-xl bg-teal-100 text-teal-900">
                <AdvancedIcon name="sparkles" className="size-5" />
              </span>
              <div>
                <h2 className="font-bold text-blue-950">Tutor de revisión</h2>
                <p className="text-xs text-slate-500">Reconstruye, no memorices</p>
              </div>
            </div>
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-slate-50 p-5" aria-live="polite">
              {reviewMessages.map((message, index) => (
                <div
                  key={`${message}-${index}`}
                  className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    index % 2
                      ? "ml-auto rounded-br-md bg-blue-950 text-white"
                      : "rounded-tl-md border border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  {message}
                </div>
              ))}
            </div>
            <form
              className="border-t border-slate-200 p-3"
              onSubmit={(event: FormEvent) => {
                event.preventDefault();
                if (!reviewInput.trim()) return;
                setReviewMessages((currentMessages) => [
                  ...currentMessages,
                  reviewInput.trim(),
                  "Bien. Ahora dibuja mentalmente el triángulo: ¿cuál lado está frente al ángulo recto y qué representa en el enunciado?",
                ]);
                setReviewInput("");
              }}
            >
              <div className="flex items-center gap-2 rounded-2xl border border-slate-300 p-2 focus-within:border-blue-700 focus-within:ring-4 focus-within:ring-blue-100">
                <label htmlFor="review-input" className="sr-only">
                  Explica tu razonamiento
                </label>
                <input
                  id="review-input"
                  value={reviewInput}
                  onChange={(event) => setReviewInput(event.target.value)}
                  placeholder="Explica qué fórmula usaste..."
                  className="min-h-10 min-w-0 flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  disabled={!reviewInput.trim()}
                  className="grid size-11 place-items-center rounded-xl bg-blue-950 text-white disabled:bg-slate-300"
                  aria-label="Enviar razonamiento"
                >
                  <AdvancedIcon name="send" className="size-4" />
                </button>
              </div>
            </form>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-950">
      <header className="sticky top-0 z-30 border-b-2 border-slate-950 bg-white">
        <div className="mx-auto grid min-h-20 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-3 px-3 sm:px-6">
          <div className="min-w-0">
            <p className="truncate text-xs font-bold uppercase tracking-wide text-slate-500">Simulador Universidad Central</p>
            <p className="mt-1 truncate text-sm font-bold text-slate-950">Matemáticas</p>
          </div>
          <div
            className={`rounded-xl border-2 px-3 py-2 text-center sm:px-6 ${
              isUrgent ? "border-amber-500 bg-amber-50 text-amber-950" : "border-slate-950 bg-white text-slate-950"
            }`}
            role="timer"
            aria-label={`Tiempo restante ${formatTime(remaining)}`}
          >
            <p className="text-[0.65rem] font-bold uppercase tracking-widest">Tiempo restante</p>
            <p className="mt-0.5 font-mono text-xl font-bold tabular-nums sm:text-2xl">{formatTime(remaining)}</p>
          </div>
          <button
            type="button"
            onClick={() => setFinishOpen(true)}
            className="ml-auto min-h-11 rounded-xl border-2 border-slate-950 px-3 text-xs font-bold text-slate-950 hover:bg-slate-950 hover:text-white focus:outline-none focus:ring-4 focus:ring-slate-300 sm:px-5 sm:text-sm"
          >
            Finalizar
            <span className="hidden sm:inline"> simulador</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-7 pb-44 sm:px-6 sm:py-10">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-bold text-slate-600">Pregunta {currentNumber} de 40</p>
          <button
            type="button"
            onClick={toggleFlag}
            className={`flex min-h-11 items-center gap-2 rounded-xl border-2 px-3 text-xs font-bold ${
              flagged.has(currentNumber)
                ? "border-amber-500 bg-amber-50 text-amber-950"
                : "border-slate-300 text-slate-700 hover:border-slate-950"
            }`}
          >
            <AdvancedIcon name="flag" className="size-4" />
            {flagged.has(currentNumber) ? "Marcada" : "Marcar para revisar"}
          </button>
        </div>

        <section className="mt-7">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{question.area}</p>
          <h1 className="mt-4 text-xl font-bold leading-relaxed text-slate-950 sm:text-3xl">{question.prompt}</h1>
          <fieldset className="mt-8 space-y-3">
            <legend className="sr-only">Opciones de respuesta</legend>
            {question.options.map((option, index) => {
              const letter = String.fromCharCode(65 + index);
              const selected = currentAnswer === letter;
              return (
                <label
                  key={option}
                  className={`flex min-h-16 cursor-pointer items-center gap-4 rounded-2xl border-2 p-3 transition sm:p-4 ${
                    selected
                      ? "border-slate-950 bg-slate-950 text-white"
                      : "border-slate-300 bg-white text-slate-950 hover:border-slate-950"
                  }`}
                >
                  <input
                    type="radio"
                    name={`exam-question-${currentNumber}`}
                    value={letter}
                    checked={selected}
                    onChange={() => setAnswers((currentAnswers) => ({ ...currentAnswers, [currentNumber]: letter }))}
                    className="sr-only"
                  />
                  <span
                    className={`grid size-10 shrink-0 place-items-center rounded-xl border-2 text-sm font-bold ${
                      selected ? "border-white bg-white text-slate-950" : "border-slate-300 bg-slate-50"
                    }`}
                  >
                    {letter}
                  </span>
                  <span className="text-sm font-semibold leading-relaxed sm:text-base">{option}</span>
                </label>
              );
            })}
          </fieldset>
        </section>

        <div className="mt-9 flex justify-between gap-3">
          <button
            type="button"
            disabled={current === 0}
            onClick={() => setCurrent((value) => Math.max(0, value - 1))}
            className="min-h-12 rounded-xl border-2 border-slate-300 px-5 text-sm font-bold text-slate-700 hover:border-slate-950 disabled:opacity-40"
          >
            Anterior
          </button>
          <button
            type="button"
            onClick={() => setCurrent((value) => Math.min(39, value + 1))}
            className="flex min-h-12 items-center gap-2 rounded-xl bg-slate-950 px-6 text-sm font-bold text-white hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-300"
          >
            Siguiente
            <AdvancedIcon name="chevron" className="size-4" />
          </button>
        </div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-slate-950 bg-white px-4 py-3" aria-label="Preguntas del examen">
        <div className="mx-auto max-w-7xl">
          <div className="mb-2 flex items-center gap-4 text-[0.7rem] font-semibold text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="size-3 rounded-sm bg-slate-700" />
              Respondida
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-3 rounded-sm border border-slate-400 bg-white" />
              Pendiente
            </span>
            <span className="flex items-center gap-1.5">
              <AdvancedIcon name="flag" className="size-3 text-amber-700" />
              Marcada
            </span>
          </div>
          <div className="grid grid-flow-col grid-rows-2 gap-2 overflow-x-auto pb-1">
            {Array.from({ length: 40 }, (_, index) => {
              const number = index + 1;
              const answered = Boolean(answers[number]);
              const active = number === currentNumber;
              return (
                <button
                  key={number}
                  type="button"
                  onClick={() => setCurrent(index)}
                  className={`relative grid size-10 place-items-center rounded-lg border-2 text-xs font-bold ${
                    active
                      ? "border-blue-700 bg-blue-700 text-white"
                      : answered
                        ? "border-slate-700 bg-slate-700 text-white"
                        : "border-slate-300 bg-white text-slate-800"
                  }`}
                  aria-label={`Pregunta ${number}${answered ? ", respondida" : ", pendiente"}${flagged.has(number) ? ", marcada" : ""}`}
                >
                  {number}
                  {flagged.has(number) && (
                    <span className="absolute -right-1 -top-1 size-2.5 rounded-full bg-amber-500 ring-2 ring-white" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {finishOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <button
            type="button"
            className="absolute inset-0"
            onClick={() => setFinishOpen(false)}
            aria-label="Cancelar finalización"
          />
          <section className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-8" role="dialog" aria-modal="true">
            <button
              type="button"
              onClick={() => setFinishOpen(false)}
              className="absolute right-4 top-4 grid size-11 place-items-center rounded-xl text-slate-500 hover:bg-slate-100"
              aria-label="Cerrar"
            >
              <AdvancedIcon name="x" />
            </button>
            <span className="grid size-12 place-items-center rounded-2xl bg-amber-100 text-amber-900">
              <AdvancedIcon name="flag" className="size-6" />
            </span>
            <h2 className="mt-5 text-2xl font-bold text-slate-950">¿Finalizar el simulador?</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Has respondido {Object.keys(answers).length} de 40 preguntas y tienes {flagged.size} marcadas para revisar.
              Después de finalizar no podrás cambiar tus elecciones.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setFinishOpen(false)}
                className="min-h-12 rounded-xl border-2 border-slate-300 px-4 text-sm font-bold text-slate-700"
              >
                Seguir revisando
              </button>
              <button
                type="button"
                onClick={() => {
                  setFinishOpen(false);
                  setMode("results");
                }}
                className="min-h-12 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white"
              >
                Finalizar ahora
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
