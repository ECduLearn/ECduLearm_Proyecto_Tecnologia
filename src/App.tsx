import { FormEvent, ReactNode, useEffect, useRef, useState } from "react";

type IconName =
  | "book"
  | "check"
  | "chevron"
  | "clock"
  | "download"
  | "file"
  | "info"
  | "menu"
  | "plus"
  | "send"
  | "sparkles"
  | "undo"
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
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  plus: <path d="M12 5v14M5 12h14" />,
  send: (
    <>
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
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

function App() {
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
          onClick={startNewExercise}
          className="mt-7 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-blue-950 shadow-lg shadow-slate-950/20 transition hover:bg-blue-50 focus:outline-none focus:ring-4 focus:ring-white/20"
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
                  onClick={() => window.print()}
                  className="flex min-h-11 items-center gap-2 rounded-xl bg-blue-950 px-3 text-sm font-semibold text-white transition hover:bg-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-100 sm:px-4"
                >
                  <Icon name="download" className="size-4" />
                  <span className="hidden sm:inline">Exportar PDF</span>
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
