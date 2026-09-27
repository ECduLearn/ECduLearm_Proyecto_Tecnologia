import { FormEvent, ReactNode, useEffect, useRef, useState } from "react";

type IconName =
  | "book"
  | "chevron"
  | "clock"
  | "download"
  | "info"
  | "layers"
  | "settings"
  | "sparkles"
  | "target"
  | "user";

const iconPaths: Record<IconName, ReactNode> = {
  book: (
    <>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
      <path d="M8 7h8M8 11h6" />
    </>
  ),
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
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </>
  ),
  layers: (
    <>
      <path d="m12 3-9 5 9 5 9-5-9-5Z" />
      <path d="m3 12 9 5 9-5M3 16l9 5 9-5" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21h-4v-.08A1.7 1.7 0 0 0 9 19.37a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.63 15 1.7 1.7 0 0 0 3.08 14H3v-4h.08A1.7 1.7 0 0 0 4.63 9a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.63h.01A1.7 1.7 0 0 0 10 3.08V3h4v.08A1.7 1.7 0 0 0 15 4.63a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.37 9v.01A1.7 1.7 0 0 0 20.92 10H21v4h-.08A1.7 1.7 0 0 0 19.4 15Z" />
    </>
  ),
  sparkles: (
    <>
      <path d="m12 3-1.1 3.1A4.3 4.3 0 0 1 8.3 8.7L5 10l3.3 1.3a4.3 4.3 0 0 1 2.6 2.6L12 17l1.1-3.1a4.3 4.3 0 0 1 2.6-2.6L19 10l-3.3-1.3a4.3 4.3 0 0 1-2.6-2.6L12 3Z" />
      <path d="m5 3-.4 1.1a1.6 1.6 0 0 1-1 1L2.5 5.5l1.1.4a1.6 1.6 0 0 1 1 1L5 8l.4-1.1a1.6 1.6 0 0 1 1-1l1.1-.4-1.1-.4a1.6 1.6 0 0 1-1-1L5 3ZM19 16l-.6 1.5a2 2 0 0 1-1 1L16 19l1.4.5a2 2 0 0 1 1 1L19 22l.6-1.5a2 2 0 0 1 1-1L22 19l-1.4-.5a2 2 0 0 1-1-1L19 16Z" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
};

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

function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <label className="group block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      <span className="relative block">
        <select
          className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm font-medium text-slate-800 shadow-sm outline-none transition hover:border-slate-300 focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          {children}
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-500">
          <Icon name="chevron" className="size-4 rotate-90" />
        </span>
      </span>
    </label>
  );
}

function App() {
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("1ro BGU");
  const [context, setContext] = useState("Arquitectura");
  const [difficulty, setDifficulty] = useState("Intermedia");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [questionCount, setQuestionCount] = useState("6 ejercicios");
  const [includeAnswers, setIncludeAnswers] = useState(true);
  const [status, setStatus] = useState<"idle" | "loading" | "ready">("idle");
  const [error, setError] = useState("");
  const [generatedTopic, setGeneratedTopic] = useState("");
  const timerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    },
    [],
  );

  const generateGuide = (event: FormEvent) => {
    event.preventDefault();
    if (!topic.trim()) {
      setError("Escribe un tema para que podamos crear tu guía.");
      return;
    }

    setError("");
    setStatus("loading");
    timerRef.current = window.setTimeout(() => {
      setGeneratedTopic(topic.trim());
      setStatus("ready");
    }, 1400);
  };

  const printGuide = () => window.print();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3" aria-label="ECduLearm, inicio">
            <span className="grid size-10 place-items-center rounded-xl bg-blue-950 text-white shadow-sm">
              <Icon name="book" className="size-5" />
            </span>
            <span className="text-lg font-bold tracking-tight text-blue-950">
              EC<span className="text-teal-600">du</span>Learm
            </span>
          </div>

          <button
            type="button"
            className="flex min-h-11 items-center gap-3 rounded-xl px-2 text-left transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-blue-100"
            aria-label="Abrir perfil docente"
          >
            <span className="hidden sm:block">
              <span className="block text-sm font-semibold text-slate-900">María Andrade</span>
              <span className="block text-xs text-slate-500">Docente</span>
            </span>
            <span className="grid size-10 place-items-center rounded-full bg-blue-100 text-blue-950">
              <Icon name="user" className="size-5" />
            </span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="mb-8 max-w-3xl sm:mb-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-blue-800">
            <Icon name="sparkles" className="size-4" />
            Generador PISA
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-blue-950 sm:text-4xl lg:text-5xl">
            Convierte un tema en una experiencia de razonamiento
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
            Crea ejercicios matemáticos contextualizados y listos para el aula en pocos minutos.
          </p>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-12 lg:gap-8">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8 lg:col-span-7">
            <div className="mb-7 flex items-start gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-700">
                <Icon name="target" className="size-6" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-slate-950">Diseña tu guía</h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">
                  Cuéntanos qué necesitas. Nosotros estructuramos el desafío.
                </p>
              </div>
            </div>

            <form onSubmit={generateGuide}>
              <label htmlFor="topic" className="mb-2 block text-sm font-semibold text-slate-700">
                Tema de matemáticas
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-4 text-slate-400">
                  <Icon name="sparkles" className="size-5" />
                </span>
                <textarea
                  id="topic"
                  rows={3}
                  value={topic}
                  onChange={(event) => {
                    setTopic(event.target.value);
                    if (error) setError("");
                  }}
                  className="min-h-28 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 text-base leading-relaxed text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-700 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  placeholder="¿Qué tema de matemáticas deseas enseñar hoy? (Ej. Funciones cuadráticas)"
                  aria-describedby={error ? "topic-error" : "topic-help"}
                  aria-invalid={Boolean(error)}
                />
              </div>
              {error ? (
                <p id="topic-error" className="mt-2 flex items-center gap-2 text-sm font-medium text-amber-700" role="alert">
                  <Icon name="info" className="size-4 shrink-0" />
                  {error}
                </p>
              ) : (
                <p id="topic-help" className="mt-2 text-xs text-slate-500">
                  Puedes escribir un tema, una destreza o un objetivo de aprendizaje.
                </p>
              )}

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <SelectField label="Nivel" value={level} onChange={setLevel}>
                  <option>1ro BGU</option>
                  <option>2do BGU</option>
                  <option>3ro BGU</option>
                </SelectField>
                <SelectField label="Contexto PISA" value={context} onChange={setContext}>
                  <option>Arquitectura</option>
                  <option>Finanzas</option>
                  <option>Medio ambiente</option>
                  <option>Vida cotidiana</option>
                </SelectField>
                <SelectField label="Dificultad" value={difficulty} onChange={setDifficulty}>
                  <option>Básica</option>
                  <option>Intermedia</option>
                  <option>Avanzada</option>
                </SelectField>
              </div>

              <button
                type="button"
                className="mt-6 flex min-h-11 w-full items-center justify-between rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-blue-100"
                aria-expanded={advancedOpen}
                aria-controls="advanced-settings"
                onClick={() => setAdvancedOpen((current) => !current)}
              >
                <span className="flex items-center gap-2">
                  <Icon name="settings" className="size-4" />
                  Ajustes avanzados
                </span>
                <Icon name="chevron" className={`size-4 transition ${advancedOpen ? "-rotate-90" : "rotate-90"}`} />
              </button>

              {advancedOpen && (
                <div id="advanced-settings" className="mt-3 grid gap-4 rounded-2xl bg-slate-50 p-4 sm:grid-cols-2">
                  <SelectField label="Extensión" value={questionCount} onChange={setQuestionCount}>
                    <option>4 ejercicios</option>
                    <option>6 ejercicios</option>
                    <option>8 ejercicios</option>
                  </SelectField>
                  <label className="flex min-h-12 cursor-pointer items-center gap-3 self-end rounded-xl border border-slate-200 bg-white px-4 shadow-sm">
                    <input
                      type="checkbox"
                      checked={includeAnswers}
                      onChange={(event) => setIncludeAnswers(event.target.checked)}
                      className="size-5 rounded border-slate-300 accent-blue-800"
                    />
                    <span className="text-sm font-medium text-slate-800">Incluir solucionario docente</span>
                  </label>
                </div>
              )}

              <button
                type="submit"
                disabled={status === "loading"}
                className="mt-6 flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-blue-950 px-6 text-base font-bold text-white shadow-lg shadow-blue-950/15 transition hover:bg-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-wait disabled:bg-slate-600"
              >
                {status === "loading" ? (
                  <>
                    <span className="size-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Generando guía...
                  </>
                ) : (
                  <>
                    <Icon name="sparkles" className="size-5" />
                    Generar Guía de Razonamiento
                  </>
                )}
              </button>
              <p className="mt-3 flex items-center justify-center gap-2 text-center text-xs text-slate-500">
                <Icon name="clock" className="size-4" />
                Tu guía estará lista en menos de un minuto
              </p>
            </form>
          </section>

          <aside className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:sticky lg:top-6 lg:col-span-5">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
              <div>
                <h2 className="font-bold text-slate-950">Vista previa</h2>
                <p className="mt-0.5 text-xs text-slate-500">Documento para el estudiante</p>
              </div>
              <span
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${
                  status === "ready" ? "bg-teal-50 text-teal-700" : "bg-slate-100 text-slate-600"
                }`}
                aria-live="polite"
              >
                <span className={`size-2 rounded-full ${status === "ready" ? "bg-teal-500" : "bg-slate-400"}`} />
                {status === "loading" ? "Creando" : status === "ready" ? "Lista" : "Borrador"}
              </span>
            </div>

            <div className="bg-slate-100 p-4 sm:p-6">
              <div className="mx-auto min-h-96 max-w-md rounded-sm bg-white p-6 shadow-md sm:p-8">
                {status === "loading" ? (
                  <div className="animate-pulse" aria-label="Generando vista previa">
                    <div className="h-3 w-24 rounded bg-blue-100" />
                    <div className="mt-4 h-6 w-4/5 rounded bg-slate-200" />
                    <div className="mt-2 h-3 w-2/5 rounded bg-slate-100" />
                    <div className="mt-8 space-y-3">
                      <div className="h-3 rounded bg-slate-100" />
                      <div className="h-3 rounded bg-slate-100" />
                      <div className="h-3 w-3/4 rounded bg-slate-100" />
                    </div>
                    <div className="mt-8 h-28 rounded-lg bg-slate-100" />
                    <div className="mt-6 h-3 rounded bg-slate-100" />
                    <div className="mt-3 h-3 w-5/6 rounded bg-slate-100" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between border-b border-blue-950 pb-4">
                      <div className="flex items-center gap-2 text-blue-950">
                        <Icon name="book" className="size-5" />
                        <span className="text-xs font-extrabold">ECduLearm</span>
                      </div>
                      <span className="text-xs font-medium text-slate-400">Guía PISA</span>
                    </div>
                    <div className="pt-5">
                      <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
                        Matemáticas · {level}
                      </span>
                      <h3 className="mt-2 text-xl font-bold leading-tight text-blue-950">
                        {generatedTopic || "Tu próxima guía aparecerá aquí"}
                      </h3>
                      <p className="mt-2 text-xs leading-relaxed text-slate-500">
                        Contexto: {context} · Dificultad {difficulty.toLowerCase()}
                      </p>
                    </div>

                    <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-4">
                      <div className="flex items-center gap-2 text-blue-900">
                        <Icon name="layers" className="size-4" />
                        <span className="text-xs font-bold">Situación problemática</span>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-slate-600">
                        {status === "ready"
                          ? `Analiza una situación de ${context.toLowerCase()} y aplica tus conocimientos sobre ${generatedTopic.toLowerCase()}.`
                          : "La guía integrará una situación real, datos relevantes y preguntas de razonamiento progresivo."}
                      </p>
                    </div>

                    <div className="mt-6 space-y-4">
                      {[1, 2, 3].map((number) => (
                        <div key={number} className="flex gap-3">
                          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                            {number}
                          </span>
                          <div className="flex-1 pt-1">
                            <div className="h-2 rounded bg-slate-200" />
                            <div className="mt-2 h-2 w-3/4 rounded bg-slate-100" />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-400">
                      <span>{questionCount}</span>
                      <span>{includeAnswers ? "Solucionario incluido" : "Sin solucionario"}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="p-4 sm:p-5">
              <button
                type="button"
                onClick={printGuide}
                disabled={status !== "ready"}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-blue-950 bg-white px-4 text-sm font-bold text-blue-950 transition hover:bg-blue-50 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
              >
                <Icon name="download" className="size-5" />
                Exportar a PDF / Imprimir
              </button>
              {status !== "ready" && (
                <p className="mt-2 text-center text-xs text-slate-500">Genera una guía para habilitar la exportación.</p>
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

export default App;
