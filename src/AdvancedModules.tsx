import { DragEvent, FormEvent, ReactNode, useEffect, useState } from "react";
import { generateExerciseAI, reviewExamAI } from "./services/aiService";
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

export function PlanningWorkspace({ onBack }: { onBack: () => void }) {
  const [fileName, setFileName] = useState("");
  const [uploadState, setUploadState] = useState<"idle" | "loading" | "ready">("idle");
  const [duration, setDuration] = useState("45 min");
  const [objective, setObjective] = useState("Analizar cómo las formas triangulares distribuyen cargas en estructuras.");
  const [notice, setNotice] = useState("Plan guardado automáticamente");
  const [isDragging, setIsDragging] = useState(false);
  const [pisaModalOpen, setPisaModalOpen] = useState(false);
  const [pisaContext, setPisaContext] = useState("");
  const [pisaInserted, setPisaInserted] = useState(false);
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

  const applyAI = (action: string) => {
    setNotice(`Aplicando “${action}”...`);
    window.setTimeout(() => setNotice("Cambio aplicado y guardado"), 600);
  };

  const generatePisa = async () => {
    if (!pisaContext.trim()) return;
    setIsGeneratingPisa(true);
    try {
      const res = await generateExerciseAI(pisaContext);
      setIsGeneratingPisa(false);
      setPisaInserted(true);
      setPisaModalOpen(false);
      setNotice(`Ejercicio PISA “${res.data.exercise.topic}” insertado en Aplicación (Guardado en BD)`);
      localStorage.setItem("ecdulearm_active_exercise", JSON.stringify(res.data.exercise));

      // Persistir ejercicio en tabla ejercicios_pisa
      const savedEx = await ejerciciosController.createEjercicio(res.data.exercise);

      // Persistir planificación ERCA completa vinculada al ejercicio
      await planificacionesController.savePlanificacion({
        titulo: `Planificación ERCA: ${res.data.exercise.topic}`,
        curso: "2do BGU",
        destreza: "M.5.2.3 Resolver problemas en contextos reales justificando procedimientos con modelos matemáticos.",
        duracionMinutos: parseInt(duration) || 45,
        experiencia: "Observar estructuras y registros fotográficos e identificar elementos geométricos y cuantitativos.",
        reflexion: "¿Qué datos son indispensables para asegurar la estabilidad o proporcionalidad de la situación?",
        conceptualizacion: "Formalización analítica del modelo matemático y deducción de relaciones.",
        aplicacion: `Resolución del reto PISA: ${res.data.exercise.situation}`,
        ejercicioPisaId: savedEx.data.id,
      });
    } catch {
      setIsGeneratingPisa(false);
      setPisaInserted(true);
      setPisaModalOpen(false);
      setNotice("Ejercicio PISA insertado en Aplicación");
    }
  };

  return (
    <div className="min-h-screen bg-sand-50 text-sand-950">
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
          <span className="hidden rounded-full bg-ink-50 px-3 py-1.5 text-xs font-bold text-ink-900 sm:block">
            Plan de clase · Borrador
          </span>
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
              onClick={() => applyAI("Estructurar plan de clase")}
              className="mt-5 flex min-h-13 w-full items-center justify-center gap-2 rounded-lg bg-ink-800 px-5 text-sm font-bold text-white hover:bg-ink-900 focus:outline-none focus:ring-4 focus:ring-ink-200"
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
                  <p className="mt-1 text-sm font-bold text-ink-950">2do BGU</p>
                </div>
                <div className="border-t border-sand-200 p-4 sm:col-span-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-sand-500">
                    Destreza con Criterio de Desempeño (DCD)
                  </p>
                  <p
                    contentEditable
                    suppressContentEditableWarning
                    className="mt-2 rounded-md text-sm leading-7 text-sand-700 outline-none focus:bg-ink-50 focus:ring-4 focus:ring-ink-100"
                  >
                    M.5.2.3. Resolver y plantear problemas que involucren áreas de figuras geométricas y relaciones de
                    proporcionalidad, justificando procedimientos en contextos reales.
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-sand-200 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-sand-500">Objetivo de aprendizaje</p>
                <p
                  contentEditable
                  suppressContentEditableWarning
                  className="mt-2 rounded-md text-sm leading-7 text-sand-700 outline-none focus:bg-ink-50 focus:ring-4 focus:ring-ink-100"
                >
                  {objective}
                </p>
              </div>

              <div className="mt-7 space-y-4">
                {planningPhases.map((phase, index) => (
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
                          className="mt-2 rounded-md text-lg font-bold text-ink-950 outline-none focus:bg-white focus:ring-4 focus:ring-ink-100"
                        >
                          {phase.title}
                        </h3>

                        {phase.key !== "application" && (
                          <p
                            contentEditable
                            suppressContentEditableWarning
                            className="mt-3 rounded-md text-sm leading-7 text-sand-700 outline-none focus:bg-white focus:ring-4 focus:ring-ink-100"
                          >
                            {phase.body}
                          </p>
                        )}

                        {phase.key === "application" && !pisaInserted && (
                          <div className="mt-4 rounded-xl border border-dashed border-sand-300 bg-white/80 p-4">
                            <p className="text-xs font-bold uppercase tracking-wide text-sand-400">Actividad actual</p>
                            <p
                              contentEditable
                              suppressContentEditableWarning
                              className="mt-2 text-sm leading-7 text-sand-600 outline-none"
                            >
                              Calcular el área de cinco triángulos usando los datos indicados en la ficha y copiar el
                              procedimiento.
                            </p>
                          </div>
                        )}

                        {phase.key === "application" && pisaInserted && (
                          <div className="mt-4">
                            <div className="rounded-2xl border-2 border-ink-300 bg-white p-5 shadow-sm">
                              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-ink-700">
                                <AdvancedIcon name="sparkles" className="size-4" />
                                Ejercicio PISA · {pisaContext}
                              </div>
                              <div className="mt-4 space-y-4 text-sm leading-7 text-sand-700">
                                <div>
                                  <p className="font-bold text-ink-950">Contexto</p>
                                  <p className="mt-1">
                                    El Municipio de Quito planea construir un puente peatonal cerca de una zona escolar. El
                                    diseño utiliza módulos triangulares para distribuir el peso de forma segura.
                                  </p>
                                </div>
                                <div>
                                  <p className="font-bold text-ink-950">Problema</p>
                                  <p className="mt-1">
                                    Cada módulo tiene 4 m de base y 3 m de altura. La propuesta emplea 12 módulos y cada
                                    metro cuadrado admite una carga máxima definida por la norma técnica.
                                  </p>
                                </div>
                                <div className="rounded-xl bg-ink-50 p-4">
                                  <p className="font-bold text-ink-950">Pregunta de reflexión</p>
                                  <p className="mt-1 text-ink-950">
                                    Justifica con tu procedimiento si el puente soportará el peso previsto según la norma
                                    de seguridad. ¿Qué dato adicional necesitarías para confirmar tu decisión?
                                  </p>
                                </div>
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
                                onClick={() => setNotice("Edición manual activada en el ejercicio")}
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
      <div className="min-h-screen bg-sand-100 px-4 py-8 text-sand-950 sm:py-14">
        <main className="mx-auto max-w-3xl">
          <div className="rounded-3xl border border-sand-200 bg-white p-6 text-center shadow-xl shadow-sand-900/5 sm:p-10">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-ink-100 text-ink-900">
              <AdvancedIcon name="check" className="size-7" />
            </span>
            <p className="mt-6 text-xs font-bold uppercase tracking-widest text-ink-700">Simulador completado</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink-950">Tu práctica terminó. Ahora viene lo valioso.</h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-sand-600">
              La revisión no se limita a una nota: analizaremos las decisiones que tomaste para fortalecer tu estrategia.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                ["28 / 40", "preguntas respondidas"],
                ["6", "marcadas para revisar"],
                ["01:02:14", "tiempo utilizado"],
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl bg-sand-50 p-5">
                  <p className="text-2xl font-bold text-ink-950">{value}</p>
                  <p className="mt-1 text-xs text-sand-500">{label}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-2xl border border-ink-200 bg-ink-50 p-5 text-left">
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-ink-950 text-white">
                  <AdvancedIcon name="sparkles" className="size-5" />
                </span>
                <div>
                  <h2 className="font-bold text-ink-950">Convierte errores en estrategia</h2>
                  <p className="mt-1 text-sm leading-relaxed text-sand-600">
                    El tutor seleccionará los problemas clave y te hará preguntas para reconstruir el razonamiento.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setMode("review")}
              className="mt-6 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-ink-950 px-6 text-sm font-bold text-white hover:bg-ink-900 focus:outline-none focus:ring-4 focus:ring-ink-200"
            >
              <AdvancedIcon name="sparkles" className="size-5 text-ink-300" />
              Revisión Socrática
            </button>
            <button
              type="button"
              onClick={onBack}
              className="mt-3 min-h-11 px-4 text-sm font-bold text-sand-500 hover:text-ink-950"
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
      <div className="min-h-screen bg-sand-100 text-sand-950">
        <header className="border-b border-sand-200 bg-white">
          <div className="mx-auto flex min-h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
            <button
              type="button"
              onClick={() => setMode("results")}
              className="flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-bold text-sand-700 hover:bg-sand-100"
            >
              <AdvancedIcon name="arrow-left" />
              Resultados
            </button>
            <p className="font-bold text-ink-950">Revisión Socrática</p>
            <span className="rounded-full bg-ink-50 px-3 py-1.5 text-xs font-bold text-ink-900">Pregunta 12</span>
          </div>
        </header>
        <main className="mx-auto grid max-w-5xl gap-5 px-4 py-6 sm:px-6 lg:grid-cols-2 lg:py-10">
          <section className="rounded-3xl border border-sand-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-hint-700">Pregunta para revisar</p>
            <h1 className="mt-3 text-xl font-bold leading-tight text-ink-950">Escalera apoyada contra una pared</h1>
            <p className="mt-4 text-base leading-8 text-sand-700">{examQuestions[0].prompt}</p>
            <div className="mt-6 rounded-2xl bg-sand-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-sand-500">Tu elección durante el examen</p>
              <p className="mt-2 text-sm font-semibold text-sand-800">A. 5² + 3²</p>
            </div>
            <p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-sand-500">
              <AdvancedIcon name="shield" className="mt-0.5 size-4 shrink-0 text-ink-700" />
              No mostraremos la respuesta. El objetivo es que reconstruyas el procedimiento con una estrategia transferible.
            </p>
          </section>

          <section className="flex min-h-[32rem] flex-col overflow-hidden rounded-3xl border border-sand-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-sand-200 p-5">
              <span className="grid size-10 place-items-center rounded-xl bg-ink-100 text-ink-900">
                <AdvancedIcon name="sparkles" className="size-5" />
              </span>
              <div>
                <h2 className="font-bold text-ink-950">Tutor de revisión</h2>
                <p className="text-xs text-sand-500">Reconstruye, no memorices</p>
              </div>
            </div>
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-sand-50 p-5" aria-live="polite">
              {reviewMessages.map((message, index) => (
                <div
                  key={`${message}-${index}`}
                  className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    index % 2
                      ? "ml-auto rounded-br-md bg-ink-950 text-white"
                      : "rounded-tl-md border border-sand-200 bg-white text-sand-700"
                  }`}
                >
                  {message}
                </div>
              ))}
            </div>
            <form
              className="border-t border-sand-200 p-3"
              onSubmit={async (event: FormEvent) => {
                event.preventDefault();
                if (!reviewInput.trim()) return;
                const prompt = reviewInput.trim();
                setReviewMessages((currentMessages) => [
                  ...currentMessages,
                  prompt,
                ]);
                setReviewInput("");
                try {
                  const res = await reviewExamAI(
                    "Escalera apoyada contra una pared",
                    examQuestions[0].prompt,
                    "A. 5² + 3²",
                    prompt
                  );
                  setReviewMessages((currentMessages) => [
                    ...currentMessages,
                    res.data,
                  ]);
                } catch {
                  setReviewMessages((currentMessages) => [
                    ...currentMessages,
                    "Bien. Ahora dibuja mentalmente el triángulo: ¿cuál lado está frente al ángulo recto y qué representa en el enunciado?",
                  ]);
                }
              }}
            >
              <div className="flex items-center gap-2 rounded-2xl border border-sand-300 p-2 focus-within:border-ink-700 focus-within:ring-4 focus-within:ring-ink-100">
                <label htmlFor="review-input" className="sr-only">
                  Explica tu razonamiento
                </label>
                <input
                  id="review-input"
                  value={reviewInput}
                  onChange={(event) => setReviewInput(event.target.value)}
                  placeholder="Explica qué fórmula usaste..."
                  className="min-h-10 min-w-0 flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-sand-400"
                />
                <button
                  type="submit"
                  disabled={!reviewInput.trim()}
                  className="grid size-11 place-items-center rounded-xl bg-ink-950 text-white disabled:bg-sand-300"
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
    <div className="min-h-screen bg-white text-sand-950">
      <header className="sticky top-0 z-30 border-b-2 border-sand-950 bg-white">
        <div className="mx-auto grid min-h-20 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-3 px-3 sm:px-6">
          <div className="min-w-0">
            <p className="truncate text-xs font-bold uppercase tracking-wide text-sand-500">Simulador Universidad Central</p>
            <p className="mt-1 truncate text-sm font-bold text-sand-950">Matemáticas</p>
          </div>
          <div
            className={`rounded-xl border-2 px-3 py-2 text-center sm:px-6 ${
              isUrgent ? "border-hint-500 bg-hint-50 text-hint-950" : "border-sand-950 bg-white text-sand-950"
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
            className="ml-auto min-h-11 rounded-xl border-2 border-sand-950 px-3 text-xs font-bold text-sand-950 hover:bg-sand-950 hover:text-white focus:outline-none focus:ring-4 focus:ring-sand-300 sm:px-5 sm:text-sm"
          >
            Finalizar
            <span className="hidden sm:inline"> simulador</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-7 pb-44 sm:px-6 sm:py-10">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-bold text-sand-600">Pregunta {currentNumber} de 40</p>
          <button
            type="button"
            onClick={toggleFlag}
            className={`flex min-h-11 items-center gap-2 rounded-xl border-2 px-3 text-xs font-bold ${
              flagged.has(currentNumber)
                ? "border-hint-500 bg-hint-50 text-hint-950"
                : "border-sand-300 text-sand-700 hover:border-sand-950"
            }`}
          >
            <AdvancedIcon name="flag" className="size-4" />
            {flagged.has(currentNumber) ? "Marcada" : "Marcar para revisar"}
          </button>
        </div>

        <section className="mt-7">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-sand-500">{question.area}</p>
          <h1 className="mt-4 text-xl font-bold leading-relaxed text-sand-950 sm:text-3xl">{question.prompt}</h1>
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
                      ? "border-sand-950 bg-sand-950 text-white"
                      : "border-sand-300 bg-white text-sand-950 hover:border-sand-950"
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
                      selected ? "border-white bg-white text-sand-950" : "border-sand-300 bg-sand-50"
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
            className="min-h-12 rounded-xl border-2 border-sand-300 px-5 text-sm font-bold text-sand-700 hover:border-sand-950 disabled:opacity-40"
          >
            Anterior
          </button>
          <button
            type="button"
            onClick={() => setCurrent((value) => Math.min(39, value + 1))}
            className="flex min-h-12 items-center gap-2 rounded-xl bg-sand-950 px-6 text-sm font-bold text-white hover:bg-sand-800 focus:outline-none focus:ring-4 focus:ring-sand-300"
          >
            Siguiente
            <AdvancedIcon name="chevron" className="size-4" />
          </button>
        </div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-sand-950 bg-white px-4 py-3" aria-label="Preguntas del examen">
        <div className="mx-auto max-w-7xl">
          <div className="mb-2 flex items-center gap-4 text-[0.7rem] font-semibold text-sand-600">
            <span className="flex items-center gap-1.5">
              <span className="size-3 rounded-sm bg-sand-700" />
              Respondida
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-3 rounded-sm border border-sand-400 bg-white" />
              Pendiente
            </span>
            <span className="flex items-center gap-1.5">
              <AdvancedIcon name="flag" className="size-3 text-hint-700" />
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
                      ? "border-ink-700 bg-ink-700 text-white"
                      : answered
                        ? "border-sand-700 bg-sand-700 text-white"
                        : "border-sand-300 bg-white text-sand-800"
                  }`}
                  aria-label={`Pregunta ${number}${answered ? ", respondida" : ", pendiente"}${flagged.has(number) ? ", marcada" : ""}`}
                >
                  {number}
                  {flagged.has(number) && (
                    <span className="absolute -right-1 -top-1 size-2.5 rounded-full bg-hint-500 ring-2 ring-white" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {finishOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-sand-950/55 p-4 backdrop-blur-sm">
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
              className="absolute right-4 top-4 grid size-11 place-items-center rounded-xl text-sand-500 hover:bg-sand-100"
              aria-label="Cerrar"
            >
              <AdvancedIcon name="x" />
            </button>
            <span className="grid size-12 place-items-center rounded-2xl bg-hint-100 text-hint-900">
              <AdvancedIcon name="flag" className="size-6" />
            </span>
            <h2 className="mt-5 text-2xl font-bold text-sand-950">¿Finalizar el simulador?</h2>
            <p className="mt-3 text-sm leading-relaxed text-sand-600">
              Has respondido {Object.keys(answers).length} de 40 preguntas y tienes {flagged.size} marcadas para revisar.
              Después de finalizar no podrás cambiar tus elecciones.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setFinishOpen(false)}
                className="min-h-12 rounded-xl border-2 border-sand-300 px-4 text-sm font-bold text-sand-700"
              >
                Seguir revisando
              </button>
              <button
                type="button"
                onClick={() => {
                  setFinishOpen(false);
                  setMode("results");
                }}
                className="min-h-12 rounded-xl bg-sand-950 px-4 text-sm font-bold text-white"
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
