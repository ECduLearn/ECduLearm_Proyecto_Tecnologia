import { DragEvent, ReactNode, useEffect, useState } from "react";
import { generateExerciseAI, planErcaAI } from "./services/aiService";
import type { Exercise } from "./models/types";
import { ejerciciosController, planificacionesController } from "./services/dbService";

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
    key: "experience",
    label: "Experiencia",
    time: "10 min",
    title: "Activación de conocimientos previos",
    body: "Observar fotografías de puentes de Quito e identificar las figuras geométricas que se repiten en sus estructuras. Compartir experiencias sobre construcciones que hayan visto en su comunidad.",
  },
  {
    key: "reflection",
    label: "Reflexión",
    time: "8 min",
    title: "Preguntas de enganche",
    body: "¿Por qué algunos puentes utilizan triángulos en lugar de cuadrados? ¿Qué podría ocurrir si una estructura no distribuye bien el peso? Formular una hipótesis en parejas.",
  },
  {
    key: "conceptualization",
    label: "Conceptualización",
    time: "15 min",
    title: "Área, proporcionalidad y distribución de cargas",
    body: "Relacionar el área del triángulo A = (b × h) ÷ 2 con la cantidad de material requerida. Analizar tablas de carga y construir una explicación sobre la estabilidad de módulos triangulados.",
  },
  {
    key: "application",
    label: "Aplicación",
    time: "12 min",
    title: "Transferencia a una situación real",
    body: "Resolver ejercicios rutinarios de área de triángulos y registrar el procedimiento en el cuaderno.",
  },
];

const DESTREZA_INICIAL = "M.5.2.3. Resolver y plantear problemas que involucren áreas de figuras geométricas y relaciones de proporcionalidad, justificando procedimientos en contextos reales.";

export function PlanningWorkspace({ onBack }: { onBack: () => void }) {
  const [fileName, setFileName] = useState("");
  const [uploadState, setUploadState] = useState<"idle" | "loading" | "ready">("idle");
  const [borrador] = useState(() => planificacionesController.getBorrador());
  const [duration, setDuration] = useState(borrador?.duracion ?? "45 min");
  const [objective, setObjective] = useState(
    borrador?.objetivo ?? "Analizar cómo las formas triangulares distribuyen cargas en estructuras."
  );
  const [destreza, setDestreza] = useState(borrador?.destreza ?? DESTREZA_INICIAL);
  const [planId, setPlanId] = useState<string | undefined>(borrador?.planId);
  const [guardando, setGuardando] = useState(false);
  const [notice, setNotice] = useState("Plan guardado automáticamente");
  const [isDragging, setIsDragging] = useState(false);
  const [pisaModalOpen, setPisaModalOpen] = useState(false);
  const [pisaContext, setPisaContext] = useState("");
  const [ejercicioInsertado, setEjercicioInsertado] = useState<Exercise | null>(borrador?.ejercicio ?? null);
  const [curso, setCurso] = useState<"1ro BGU" | "2do BGU" | "3ro BGU">(borrador?.curso ?? "2do BGU");
  const [fases, setFases] = useState(borrador?.fases ?? planningPhases);

  // Cada cambio queda en el borrador de este navegador
  useEffect(() => {
    planificacionesController.guardarBorrador({
      planId,
      duracion: duration,
      objetivo: objective,
      curso,
      destreza,
      fases,
      ejercicio: ejercicioInsertado,
    });
  }, [planId, duration, objective, curso, destreza, fases, ejercicioInsertado]);

  const editarFase = (clave: string, cambio: { title?: string; body?: string }) => {
    setFases((actuales) => actuales.map((fase) => (fase.key === clave ? { ...fase, ...cambio } : fase)));
    setNotice("Cambio guardado en el borrador");
  };

  const guardarPlan = async (ejercicio: Exercise | null = ejercicioInsertado) => {
    setGuardando(true);
    const textoFase = (clave: string) => fases.find((f) => f.key === clave)?.body ?? "";
    const res = await planificacionesController.savePlanificacion({
      id: planId,
      titulo: `Planificación ERCA: ${ejercicio?.topic ?? objective.slice(0, 80)}`,
      curso,
      destreza,
      duracionMinutos: parseInt(duration) || 45,
      experiencia: textoFase("experience"),
      reflexion: textoFase("reflection"),
      conceptualizacion: textoFase("conceptualization"),
      aplicacion: ejercicio ? `Resolución del reto PISA: ${ejercicio.situation || ejercicio.topic}` : textoFase("application"),
      ejercicioPisaId: ejercicio?.id,
    });
    if (!res.isOffline) setPlanId(res.id);
    setGuardando(false);
    setNotice(res.isOffline ? "Planificación guardada en este navegador" : "Planificación guardada");
  };
  const [estructurando, setEstructurando] = useState(false);
  const [isGeneratingPisa, setIsGeneratingPisa] = useState(false);

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

  const estructurarPlan = async () => {
    if (!objective.trim()) {
      setNotice("Escribe primero el objetivo de aprendizaje.");
      return;
    }
    setEstructurando(true);
    setNotice("Estructurando tu plan de clase…");
    const res = await planErcaAI(objective, duration, `${curso}${fileName ? ` · material de apoyo: ${fileName}` : ""}`);
    setFases((actuales) =>
      actuales.map((fase) => {
        const nueva = res.data.find((f) => f.id === fase.key);
        return nueva ? { ...fase, time: nueva.duration || fase.time, title: nueva.title, body: nueva.body } : fase;
      })
    );
    setEstructurando(false);
    setNotice(
      res.isOfflineFallback
        ? "La IA no respondió: te dejamos un plan de ejemplo que puedes editar."
        : "Plan listo. Puedes editar cada fase."
    );
  };

  const generatePisa = async () => {
    if (!pisaContext.trim()) return;
    setIsGeneratingPisa(true);
    try {
      const res = await generateExerciseAI(
        `Crea un ejercicio tipo PISA para ${curso} sobre: ${pisaContext}. Objetivo de la clase: ${objective}`
      );
      // Queda como ejercicio activo: se puede publicar en un aula desde el panel o el chat
      const activo = await ejerciciosController.guardarComoActivo(res.data.exercise);
      setEjercicioInsertado(activo);
      setPisaModalOpen(false);
      setNotice(
        res.isOfflineFallback
          ? `La IA no respondió: agregamos un ejercicio de ejemplo sobre «${activo.topic}».`
          : `Agregamos «${activo.topic}» a la fase de Aplicación.`
      );

      await guardarPlan(activo);
    } catch {
      setNotice("No pudimos generar el ejercicio. Inténtalo otra vez.");
    } finally {
      setIsGeneratingPisa(false);
    }
  };

  return (
    <div className="ui-view min-h-screen bg-sand-50 text-sand-950">
      <header className="sticky top-0 z-40 border-b border-sand-200 bg-white/95 backdrop-blur">
        <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6">
          <button
            type="button"
            onClick={onBack}
            className="flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-bold text-sand-700 hover:bg-sand-100 focus:outline-none focus:ring-4 focus:ring-ink-100"
          >
            <AdvancedIcon name="arrow-left" />
            <span className="hidden sm:inline">Panel docente</span>
          </button>
          <div className="min-w-0 text-center">
            <p className="truncate text-sm font-bold text-ink-950 sm:text-base">Adaptador de planificación</p>
            <p className="flex items-center justify-center gap-1.5 text-xs text-sand-500" aria-live="polite">
              <AdvancedIcon name="check" className="size-3.5 text-ink-700" />
              {notice}
            </p>
          </div>
          <button
            type="button"
            onClick={() => guardarPlan()}
            disabled={guardando}
            className="min-h-11 rounded-xl bg-ink-950 px-4 text-sm font-semibold text-sand-50 hover:bg-ink-800 disabled:opacity-70"
          >
            {guardando ? "Guardando…" : "Guardar planificación"}
          </button>
        </div>
      </header>

      <main className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-[1600px] lg:grid-cols-[22rem_1fr]">
        <aside className="border-b border-sand-200 bg-sand-100 p-5 lg:border-b-0 lg:border-r lg:p-7">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-ink-800">01 · Fuente pedagógica</p>
            <h1 className="mt-2 text-xl font-semibold text-sand-950">Añade el contexto de tu clase</h1>
            <p className="mt-2 text-sm leading-relaxed text-sand-600">
              El sistema acepta documentos completos y conserva su estructura.
            </p>
          </div>

          <label
            className={`mt-6 flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 text-center transition ${
              isDragging
                ? "border-ink-600 bg-ink-50"
                : uploadState === "ready"
                  ? "border-ink-400 bg-ink-50"
                  : "border-sand-300 bg-white/70 hover:border-ink-700 hover:bg-ink-50"
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
                uploadState === "ready" ? "bg-ink-100 text-ink-900" : "bg-white text-ink-900 shadow-sm"
              }`}
            >
              <AdvancedIcon
                name={uploadState === "ready" ? "check" : "upload"}
                className={`size-6 ${uploadState === "loading" ? "animate-pulse" : ""}`}
              />
            </span>
            <span className="mt-4 text-sm font-bold text-sand-800">
              {uploadState === "loading"
                ? "Analizando estructura..."
                : fileName || "Arrastra o selecciona un archivo"}
            </span>
            <span className="mt-2 text-xs leading-relaxed text-sand-500">
              Temario, currículo o libro de texto
              <br />
              PDF, Word, PowerPoint, ODT o TXT
            </span>
          </label>

          <div className="mt-7 border-t border-sand-200 pt-6">
            <p className="text-xs font-bold uppercase tracking-widest text-ink-700">2. Parámetros</p>
            <label htmlFor="class-duration" className="mt-4 block text-sm font-bold text-sand-800">
              Duración de la clase
            </label>
            <select
              id="class-duration"
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
              className="mt-2 min-h-12 w-full rounded-xl border border-sand-300 bg-white px-4 text-sm font-semibold outline-none focus:border-ink-700 focus:ring-4 focus:ring-ink-100"
            >
              <option>30 min</option>
              <option>45 min</option>
              <option>60 min</option>
              <option>90 min</option>
            </select>

            <label htmlFor="class-course" className="mt-5 block text-sm font-bold text-sand-800">
              Curso
            </label>
            <select
              id="class-course"
              value={curso}
              onChange={(event) => setCurso(event.target.value as "1ro BGU" | "2do BGU" | "3ro BGU")}
              className="mt-2 min-h-12 w-full rounded-xl border border-sand-300 bg-white px-4 text-sm font-semibold outline-none focus:border-ink-700 focus:ring-4 focus:ring-ink-100"
            >
              <option>1ro BGU</option>
              <option>2do BGU</option>
              <option>3ro BGU</option>
            </select>

            <label htmlFor="learning-objective" className="mt-5 block text-sm font-bold text-sand-800">
              Objetivo de aprendizaje
            </label>
            <textarea
              id="learning-objective"
              rows={4}
              value={objective}
              onChange={(event) => setObjective(event.target.value)}
              className="mt-2 w-full resize-none rounded-xl border border-sand-300 p-3 text-sm leading-relaxed outline-none focus:border-ink-700 focus:ring-4 focus:ring-ink-100"
            />

            <button
              type="button"
              onClick={estructurarPlan}
              disabled={estructurando}
              className="mt-5 flex min-h-13 w-full items-center justify-center gap-2 rounded-lg bg-ink-800 px-5 text-sm font-bold text-white hover:bg-ink-900 focus:outline-none focus:ring-4 focus:ring-ink-200 disabled:opacity-70"
            >
              <AdvancedIcon name="magic" className="size-5" />
              {estructurando ? "Estructurando…" : "Estructurar plan de clase"}
            </button>
          </div>
        </aside>

        <section className="min-w-0 overflow-auto p-4 sm:p-7 lg:p-10">
          <div className="mx-auto max-w-4xl">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-ink-800">Lienzo editable</p>
                <h2 className="mt-1 text-xl font-bold text-sand-950">Estructuras estables y distribución de cargas</h2>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-sand-500">
                <AdvancedIcon name="clock" className="size-4" />
                {duration} · 2do BGU
              </div>
            </div>

            <article className="border border-sand-300 bg-white p-5 shadow-lg shadow-sand-900/5 sm:p-8">
              <div className="border-b-2 border-ink-900 pb-6 text-center">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-sand-500">
                  Ministerio de Educación del Ecuador
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-sand-950">
                  Planificación Microcurricular
                </h2>
                <p className="mt-1 text-xs font-semibold text-ink-800">Modelo ERCA · Año lectivo 2025–2026</p>
              </div>

              <div className="mt-6 grid overflow-hidden rounded-2xl border border-sand-200 sm:grid-cols-2">
                <div className="border-b border-sand-200 p-4 sm:border-b-0 sm:border-r">
                  <p className="text-xs font-bold uppercase tracking-wide text-sand-500">Asignatura</p>
                  <p className="mt-1 text-sm font-bold text-ink-950">Matemáticas</p>
                </div>
                <div className="border-b border-sand-200 p-4 sm:border-b-0">
                  <p className="text-xs font-bold uppercase tracking-wide text-sand-500">Curso</p>
                  <p className="mt-1 text-sm font-bold text-ink-950">{curso}</p>
                </div>
                <div className="border-t border-sand-200 p-4 sm:col-span-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-sand-500">
                    Destreza con Criterio de Desempeño (DCD)
                  </p>
                  <p
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(event) => {
                      const texto = event.currentTarget.innerText.trim();
                      if (texto && texto !== destreza) {
                        setDestreza(texto);
                        setNotice("Cambio guardado en el borrador");
                      }
                    }}
                    className="mt-2 rounded-md text-sm leading-7 text-sand-700 outline-none focus:bg-ink-50 focus:ring-4 focus:ring-ink-100"
                  >
                    {destreza}
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-sand-200 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-sand-500">Objetivo de aprendizaje</p>
                <p
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(event) => {
                    const texto = event.currentTarget.innerText.trim();
                    if (texto && texto !== objective) setObjective(texto);
                  }}
                  className="mt-2 rounded-md text-sm leading-7 text-sand-700 outline-none focus:bg-ink-50 focus:ring-4 focus:ring-ink-100"
                >
                  {objective}
                </p>
              </div>

              <div className="mt-7 space-y-4">
                {fases.map((phase, index) => (
                  <section
                    key={phase.key}
                    className={`group relative rounded-2xl border p-5 transition sm:p-6 ${
                      phase.key === "application"
                        ? "border-hint-300 bg-hint-50/50 hover:border-hint-400 hover:ring-4 hover:ring-hint-100"
                        : "border-sand-200 hover:border-ink-300"
                    }`}
                  >
                    {phase.key === "application" && (
                      <button
                        type="button"
                        onClick={() => setPisaModalOpen(true)}
                        className="absolute -top-4 right-4 z-10 flex min-h-10 items-center gap-2 rounded-xl bg-ink-600 px-4 text-xs font-bold text-white opacity-100 shadow-lg shadow-ink-900/20 transition hover:bg-ink-500 focus:outline-none focus:ring-4 focus:ring-ink-200 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                      >
                        <AdvancedIcon name="sparkles" className="size-4" />
                        Insertar Ejercicio PISA aquí
                      </button>
                    )}
                    <div className="flex items-start gap-4">
                      <span
                        className={`grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold text-white ${
                          phase.key === "application" ? "bg-ink-600" : "bg-ink-950"
                        }`}
                      >
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p
                            className={`text-xs font-bold uppercase tracking-widest ${
                              phase.key === "application" ? "text-ink-700" : "text-ink-700"
                            }`}
                          >
                            {phase.label}
                          </p>
                          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-sand-500 shadow-sm">
                            {phase.time}
                          </span>
                        </div>
                        <h3
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(event) => {
                            const texto = event.currentTarget.innerText.trim();
                            if (texto && texto !== phase.title) editarFase(phase.key, { title: texto });
                          }}
                          className="mt-2 rounded-md text-lg font-bold text-ink-950 outline-none focus:bg-white focus:ring-4 focus:ring-ink-100"
                        >
                          {phase.title}
                        </h3>

                        {phase.key !== "application" && (
                          <p
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(event) => {
                              const texto = event.currentTarget.innerText.trim();
                              if (texto && texto !== phase.body) editarFase(phase.key, { body: texto });
                            }}
                            className="mt-3 rounded-md text-sm leading-7 text-sand-700 outline-none focus:bg-white focus:ring-4 focus:ring-ink-100"
                          >
                            {phase.body}
                          </p>
                        )}

                        {phase.key === "application" && !ejercicioInsertado && (
                          <div className="mt-4 rounded-xl border border-dashed border-sand-300 bg-white/80 p-4">
                            <p className="text-xs font-bold uppercase tracking-wide text-sand-400">Actividad actual</p>
                            <p
                              contentEditable
                              suppressContentEditableWarning
                              onBlur={(event) => {
                                const texto = event.currentTarget.innerText.trim();
                                if (texto && texto !== phase.body) editarFase(phase.key, { body: texto });
                              }}
                              className="mt-2 text-sm leading-7 text-sand-600 outline-none"
                            >
                              {phase.body}
                            </p>
                          </div>
                        )}

                        {phase.key === "application" && ejercicioInsertado && (
                          <div className="mt-4">
                            <div className="rounded-2xl border-2 border-ink-300 bg-white p-5 shadow-sm">
                              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-ink-700">
                                <AdvancedIcon name="sparkles" className="size-4" />
                                Ejercicio PISA · {ejercicioInsertado.context}
                              </div>
                              <div className="mt-4 space-y-4 text-sm leading-7 text-sand-700">
                                <p className="text-base font-bold text-ink-950">{ejercicioInsertado.topic}</p>
                                <p className="whitespace-pre-line">{ejercicioInsertado.situation}</p>
                                {ejercicioInsertado.questionList && ejercicioInsertado.questionList.length > 0 && (
                                  <ol className="list-decimal space-y-2 pl-5">
                                    {ejercicioInsertado.questionList.map((pregunta) => (
                                      <li key={pregunta}>{pregunta.replace(/^\s*\d+[.)]\s*/, "")}</li>
                                    ))}
                                  </ol>
                                )}
                              </div>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => setPisaModalOpen(true)}
                                className="min-h-10 rounded-lg px-3 text-xs font-bold text-ink-700 hover:bg-ink-100"
                              >
                                🔄 Regenerar
                              </button>
                              <button
                                type="button"
                                onClick={() => setNotice("Ya puedes editar el ejercicio a mano")}
                                className="min-h-10 rounded-lg px-3 text-xs font-bold text-sand-600 hover:bg-white"
                              >
                                ✏️ Editar a mano
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </section>
                ))}
              </div>

              <button
                type="button"
                className="mt-6 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-sand-300 text-sm font-bold text-sand-600 hover:border-ink-400 hover:bg-ink-50 hover:text-ink-900"
              >
                <AdvancedIcon name="plus" className="size-4" />
                Añadir fase o actividad
              </button>
            </article>
          </div>
        </section>
      </main>

      {pisaModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-sand-950/45 p-4 backdrop-blur-sm">
          <button
            type="button"
            className="absolute inset-0"
            onClick={() => setPisaModalOpen(false)}
            aria-label="Cerrar generador PISA"
          />
          <section
            className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pisa-modal-title"
          >
            <button
              type="button"
              onClick={() => setPisaModalOpen(false)}
              className="absolute right-4 top-4 grid size-11 place-items-center rounded-xl text-sand-500 hover:bg-sand-100 focus:outline-none focus:ring-4 focus:ring-ink-100"
              aria-label="Cerrar"
            >
              <AdvancedIcon name="x" />
            </button>
            <span className="grid size-12 place-items-center rounded-2xl bg-ink-100 text-ink-700">
              <AdvancedIcon name="sparkles" className="size-6" />
            </span>
            <p className="mt-5 text-xs font-bold uppercase tracking-widest text-ink-700">
              Asistencia de IA · Aplicación ERCA
            </p>
            <h2 id="pisa-modal-title" className="mt-2 text-2xl font-bold leading-tight text-ink-950">
              Adaptando destreza a formato PISA
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-sand-600">
              ¿En qué contexto de la vida real quieres aplicarlo?
            </p>

            <label htmlFor="pisa-context" className="sr-only">
              Contexto del ejercicio PISA
            </label>
            <input
              id="pisa-context"
              value={pisaContext}
              onChange={(event) => setPisaContext(event.target.value)}
              placeholder="Ej. Construcción de un puente en Quito"
              className="mt-6 min-h-12 w-full rounded-xl border border-sand-300 px-4 text-sm outline-none placeholder:text-sand-400 focus:border-ink-600 focus:ring-4 focus:ring-ink-100"
              autoFocus
            />
            <div className="mt-3 flex flex-wrap gap-2" aria-label="Contextos sugeridos">
              {["Arquitectura", "Finanzas Personales", "Cambio Climático", "Deportes"].map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setPisaContext(suggestion)}
                  className={`min-h-10 rounded-full border px-3 text-xs font-bold transition ${
                    pisaContext === suggestion
                      ? "border-ink-600 bg-ink-100 text-ink-800"
                      : "border-sand-300 bg-white text-sand-600 hover:border-ink-400 hover:bg-ink-50"
                  }`}
                >
                  {suggestion}
                </button>
              ))}
            </div>

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setPisaModalOpen(false)}
                className="min-h-12 rounded-xl px-5 text-sm font-bold text-sand-600 hover:bg-sand-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!pisaContext.trim() || isGeneratingPisa}
                onClick={generatePisa}
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-ink-600 px-5 text-sm font-bold text-white shadow-lg shadow-ink-900/20 hover:bg-ink-500 focus:outline-none focus:ring-4 focus:ring-ink-200 disabled:cursor-not-allowed disabled:bg-sand-300 disabled:shadow-none"
              >
                <AdvancedIcon
                  name="sparkles"
                  className={`size-5 ${isGeneratingPisa ? "animate-pulse" : ""}`}
                />
                {isGeneratingPisa ? "Generando ejercicio..." : "Generar e Insertar"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
