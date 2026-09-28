import { FormEvent, ReactNode, useState } from "react";

type StudyIconName =
  | "arrow-left"
  | "atom"
  | "book"
  | "brain"
  | "calculator"
  | "check"
  | "chevron"
  | "clock"
  | "flame"
  | "formula"
  | "graduation"
  | "grid"
  | "moon"
  | "send"
  | "shield"
  | "sparkles"
  | "sun"
  | "target";

const studyIconPaths: Record<StudyIconName, ReactNode> = {
  "arrow-left": (
    <>
      <path d="m15 18-6-6 6-6" />
      <path d="M9 12h11" />
    </>
  ),
  atom: (
    <>
      <circle cx="12" cy="12" r="1.5" />
      <path d="M19.4 15c2-3.5 2-6.8.2-7.8-1.9-1.1-4.8.6-6.8 4.1s-2.1 6.8-.2 7.8c1.8 1.1 4.8-.7 6.8-4.1Z" />
      <path d="M12.6 19.1c1.8-1 1.8-4.4-.2-7.8s-4.9-5.2-6.8-4.1c-1.8 1-1.8 4.4.2 7.8s5 5.2 6.8 4.1Z" />
      <path d="M5.8 15.1c4 0 6.9-1.6 6.9-3.8s-3-4-7-4-6.9 1.7-6.9 4 3 3.8 7 3.8Z" transform="translate(6.2 .7)" />
    </>
  ),
  book: (
    <>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
      <path d="M8 7h8M8 11h6" />
    </>
  ),
  brain: (
    <>
      <path d="M9.5 4.5A3 3 0 0 0 4 6.2 3.5 3.5 0 0 0 3 12a3.5 3.5 0 0 0 1.5 5.8A3 3 0 0 0 10 19.5V4.5Z" />
      <path d="M14.5 4.5A3 3 0 0 1 20 6.2a3.5 3.5 0 0 1 1 5.8 3.5 3.5 0 0 1-1.5 5.8 3 3 0 0 1-5.5 1.7V4.5ZM10 9H7.5M14 9h2.5M10 15H7.5M14 15h2.5" />
    </>
  ),
  calculator: (
    <>
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M8 6h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h.01M12 19h.01M16 19h.01" />
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
  flame: <path d="M12 22c4 0 7-3 7-7 0-3-1.5-5.5-4.5-8 .1 2-1 3.3-2 4-1-3-3-5-5-7 .2 3-2.5 5.3-2.5 9 0 5 3 9 7 9Z" />,
  formula: (
    <>
      <path d="M5 4h6M8 4v16M5 20h6M15 7l5 10M20 7l-5 10" />
    </>
  ),
  graduation: (
    <>
      <path d="m2 10 10-5 10 5-10 5Z" />
      <path d="M6 12.5V17c3 2 9 2 12 0v-4.5M22 10v6" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  moon: <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" />,
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
      <path d="m5 3-.4 1.1a1.6 1.6 0 0 1-1 1L2.5 5.5l1.1.4a1.6 1.6 0 0 1 1 1L5 8l.4-1.1a1.6 1.6 0 0 1 1-1l1.1-.4-1.1-.4a1.6 1.6 0 0 1-1-1L5 3Z" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </>
  ),
};

function StudyIcon({ name, className = "size-5" }: { name: StudyIconName; className?: string }) {
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
      {studyIconPaths[name]}
    </svg>
  );
}

type StudyMessage = {
  id: number;
  role: "student" | "tutor";
  text: string;
};

const quickPrompts = [
  "Dame una pista",
  "¿Qué fórmula uso?",
  "Explícame el concepto",
  "Revisa mi procedimiento",
];

const studyOptions = [
  {
    title: "Simuladores de Admisión",
    description: "Entrena con tiempos y preguntas similares a una prueba real.",
    detail: "Prueba de Ingreso · Universidad Central",
    icon: "graduation" as const,
    accent: "bg-blue-600 text-white",
  },
  {
    title: "Práctica Libre",
    description: "Elige un tema y avanza a tu ritmo con apoyo del tutor.",
    detail: "Álgebra · Física · Razonamiento lógico",
    icon: "grid" as const,
    accent: "bg-white text-blue-950",
  },
  {
    title: "Retos del Colegio",
    description: "Continúa las actividades preparadas por tu docente.",
    detail: "1 guía nueva · Fecha sugerida: viernes",
    icon: "target" as const,
    accent: "bg-teal-100 text-teal-950",
  },
];

export default function StudyZone({ onExit }: { onExit: () => void }) {
  const [screen, setScreen] = useState<"home" | "challenge">("home");
  const [darkMode, setDarkMode] = useState(false);
  const [formulaOpen, setFormulaOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<StudyMessage[]>([
    {
      id: 1,
      role: "tutor",
      text: "¡Hola! Intenta resolver el ejercicio. Si te trabas, pídeme una pista, pero recuerda que yo no te daré el resultado final. ¡Tú puedes!",
    },
    {
      id: 2,
      role: "student",
      text: "Creo que la respuesta es 45, multipliqué todo.",
    },
    {
      id: 3,
      role: "tutor",
      text: "Ojo ahí. Revisemos el enunciado: si la velocidad es constante, ¿seguro que debes multiplicar el tiempo por la aceleración? Piensa en la fórmula de MRU.",
    },
  ]);

  const tutorReply = (prompt: string) => {
    const normalized = prompt.toLowerCase();
    if (normalized.includes("fórmula")) {
      return "Primero identifica qué magnitudes conoces: distancia, velocidad o tiempo. ¿Cuál relación del MRU conecta exactamente esas tres variables?";
    }
    if (normalized.includes("concepto")) {
      return "En MRU la velocidad no cambia. Imagina que recorres la misma distancia en cada unidad de tiempo: ¿qué operación usarías para hallar la distancia total?";
    }
    if (normalized.includes("procedimiento")) {
      return "Compárteme tus pasos, no solo el resultado. Revisaremos juntos en qué momento cada dato entra en tu razonamiento.";
    }
    return "Empieza subrayando los datos del enunciado. ¿Qué conoces y qué te están pidiendo encontrar? Escríbelo con tus palabras.";
  };

  const sendMessage = (event: FormEvent) => {
    event.preventDefault();
    if (!input.trim()) return;
    const prompt = input.trim();
    setMessages((current) => [
      ...current,
      { id: Date.now(), role: "student", text: prompt },
      { id: Date.now() + 1, role: "tutor", text: tutorReply(prompt) },
    ]);
    setInput("");
  };

  const useQuickPrompt = (prompt: string) => {
    setMessages((current) => [
      ...current,
      { id: Date.now(), role: "student", text: prompt },
      { id: Date.now() + 1, role: "tutor", text: tutorReply(prompt) },
    ]);
  };

  const shellClass = darkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-950";
  const surfaceClass = darkMode ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white";
  const mutedClass = darkMode ? "text-slate-400" : "text-slate-500";

  if (screen === "home") {
    return (
      <div className={`min-h-screen transition-colors ${shellClass}`}>
        <header className={`border-b ${darkMode ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-white"}`}>
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-blue-600 text-white">
                <StudyIcon name="book" className="size-5" />
              </span>
              <span className="font-bold tracking-tight">
                EC<span className="text-teal-500">du</span>Learm
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`hidden rounded-full px-3 py-1.5 text-xs font-bold sm:block ${
                  darkMode ? "bg-slate-800 text-slate-200" : "bg-blue-50 text-blue-900"
                }`}
              >
                2do BGU · Matemática
              </span>
              <button
                type="button"
                onClick={() => setDarkMode((current) => !current)}
                className={`grid size-11 place-items-center rounded-xl ${
                  darkMode ? "text-slate-300 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-100"
                }`}
                aria-label={darkMode ? "Activar modo claro" : "Activar modo oscuro"}
              >
                <StudyIcon name={darkMode ? "sun" : "moon"} />
              </button>
              <button
                type="button"
                onClick={onExit}
                className={`min-h-11 rounded-xl px-3 text-xs font-bold ${
                  darkMode ? "text-slate-300 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Salir
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-teal-100 px-3 py-1.5 text-xs font-bold text-teal-900">
                <StudyIcon name="shield" className="size-4" />
                Sesión anónima
              </span>
              <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-5xl">¡Listo para entrenar!</h1>
              <p className={`mt-3 max-w-xl text-base leading-relaxed ${mutedClass}`}>
                Elige una ruta. Tu tutor te ayudará a pensar paso a paso sin resolver el ejercicio por ti.
              </p>
            </div>
            <div className={`flex items-center gap-3 rounded-2xl border p-4 ${surfaceClass}`}>
              <span className="grid size-11 place-items-center rounded-xl bg-orange-100 text-orange-700">
                <StudyIcon name="flame" className="size-5" />
              </span>
              <div>
                <p className="text-lg font-bold">4 días</p>
                <p className={`text-xs ${mutedClass}`}>racha de práctica</p>
              </div>
            </div>
          </div>

          <section className="mt-10 grid gap-4 lg:grid-cols-3" aria-label="Rutas de entrenamiento">
            {studyOptions.map((option, index) => (
              <button
                key={option.title}
                type="button"
                onClick={() => setScreen("challenge")}
                className={`group min-h-64 rounded-3xl border p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-200 ${
                  index === 0
                    ? "border-blue-500 bg-blue-600 text-white"
                    : index === 2
                      ? darkMode
                        ? "border-teal-900 bg-teal-950 text-teal-50"
                        : "border-teal-200 bg-teal-50 text-teal-950"
                      : surfaceClass
                }`}
              >
                <span
                  className={`grid size-12 place-items-center rounded-2xl ${
                    index === 0
                      ? "bg-white/15 text-white"
                      : index === 2
                        ? "bg-teal-200 text-teal-950"
                        : "bg-blue-100 text-blue-900"
                  }`}
                >
                  <StudyIcon name={option.icon} className="size-6" />
                </span>
                <h2 className="mt-8 text-xl font-bold">{option.title}</h2>
                <p
                  className={`mt-2 text-sm leading-relaxed ${
                    index === 0 ? "text-blue-100" : darkMode && index === 1 ? "text-slate-400" : "text-slate-600"
                  }`}
                >
                  {option.description}
                </p>
                <div
                  className={`mt-6 flex items-center justify-between gap-3 border-t pt-4 text-xs font-bold ${
                    index === 0 ? "border-white/15 text-white" : darkMode ? "border-slate-700" : "border-slate-200"
                  }`}
                >
                  <span>{option.detail}</span>
                  <StudyIcon name="chevron" className="size-4 shrink-0 transition group-hover:translate-x-1" />
                </div>
              </button>
            ))}
          </section>

          <section className={`mt-8 rounded-3xl border p-5 sm:p-6 ${surfaceClass}`}>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-blue-100 text-blue-900">
                  <StudyIcon name="clock" className="size-6" />
                </span>
                <div>
                  <h2 className="font-bold">Continúa donde quedaste</h2>
                  <p className={`mt-1 text-sm ${mutedClass}`}>Razonamiento numérico · Pregunta 7 de 15</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setScreen("challenge")}
                className="min-h-12 rounded-xl bg-blue-600 px-6 text-sm font-bold text-white hover:bg-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-200"
              >
                Continuar práctica
              </button>
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors ${shellClass}`}>
      <header className={`sticky top-0 z-30 border-b ${darkMode ? "border-slate-800 bg-slate-950/95" : "border-slate-200 bg-white/95"} backdrop-blur`}>
        <div className="mx-auto flex min-h-16 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setScreen("home")}
            className={`flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-bold ${
              darkMode ? "text-slate-300 hover:bg-slate-800" : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            <StudyIcon name="arrow-left" className="size-5" />
            <span className="hidden sm:inline">Centro de entrenamiento</span>
          </button>
          <div className="min-w-0 text-center">
            <p className="truncate text-sm font-bold">Prueba de Ingreso · Universidad Central</p>
            <p className={`text-xs ${mutedClass}`}>Razonamiento físico-matemático</p>
          </div>
          <button
            type="button"
            onClick={() => setDarkMode((current) => !current)}
            className={`grid size-11 shrink-0 place-items-center rounded-xl ${
              darkMode ? "text-slate-300 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-100"
            }`}
            aria-label={darkMode ? "Activar modo claro" : "Activar modo oscuro"}
          >
            <StudyIcon name={darkMode ? "sun" : "moon"} />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-8">
        <section className={`overflow-hidden rounded-3xl border shadow-sm ${surfaceClass}`}>
          <div className={`flex items-center justify-between gap-4 border-b px-5 py-4 sm:px-7 ${darkMode ? "border-slate-700" : "border-slate-200"}`}>
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-blue-600 text-white">
                <StudyIcon name="target" className="size-5" />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-teal-600">Desafío 7 de 15</p>
                <p className={`mt-0.5 text-xs ${mutedClass}`}>Movimiento rectilíneo uniforme</p>
              </div>
            </div>
            <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${darkMode ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"}`}>
              3 min
            </span>
          </div>

          <div className="p-5 sm:p-8">
            <p className={`text-xs font-bold uppercase tracking-widest ${mutedClass}`}>Situación</p>
            <h1 className="mt-3 text-xl font-bold leading-tight sm:text-2xl">
              La ruta de entrenamiento de Valentina
            </h1>
            <p className={`mt-4 text-base leading-8 ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
              Valentina entrena ciclismo en una pista recta. Durante un tramo mantiene una velocidad constante de 15 m/s
              por 3 minutos. ¿Qué distancia recorre en ese intervalo? Explica cómo organizas los datos antes de calcular.
            </p>

            <button
              type="button"
              onClick={() => setFormulaOpen((current) => !current)}
              className={`mt-6 flex min-h-11 items-center gap-2 rounded-xl border px-4 text-sm font-bold ${
                darkMode
                  ? "border-slate-700 text-slate-200 hover:bg-slate-800"
                  : "border-slate-300 text-slate-700 hover:bg-slate-50"
              }`}
              aria-expanded={formulaOpen}
            >
              <StudyIcon name="formula" className="size-5 text-blue-500" />
              Ver fórmulas básicas
              <StudyIcon
                name="chevron"
                className={`size-4 transition-transform ${formulaOpen ? "rotate-90" : ""}`}
              />
            </button>

            {formulaOpen && (
              <div className={`mt-4 grid gap-3 rounded-2xl p-4 text-sm sm:grid-cols-3 ${darkMode ? "bg-slate-800" : "bg-blue-50"}`}>
                <p>
                  <strong>Distancia:</strong> d = v × t
                </p>
                <p>
                  <strong>Velocidad:</strong> v = d ÷ t
                </p>
                <p>
                  <strong>Tiempo:</strong> t = d ÷ v
                </p>
              </div>
            )}
          </div>
        </section>

        <section className={`mt-5 overflow-hidden rounded-3xl border shadow-sm ${surfaceClass}`}>
          <div className={`flex items-center justify-between gap-4 border-b px-5 py-4 sm:px-7 ${darkMode ? "border-slate-700" : "border-slate-200"}`}>
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-teal-100 text-teal-900">
                <StudyIcon name="sparkles" className="size-5" />
              </span>
              <div>
                <h2 className="font-bold">Tutor Socrático</h2>
                <p className={`text-xs ${mutedClass}`}>Tu compañero para razonar paso a paso</p>
              </div>
            </div>
            <span className="flex items-center gap-1.5 rounded-full bg-teal-100 px-2.5 py-1 text-xs font-bold text-teal-900">
              <StudyIcon name="shield" className="size-3.5" />
              Sin respuestas finales
            </span>
          </div>

          <div className={`max-h-96 space-y-4 overflow-y-auto p-5 sm:p-7 ${darkMode ? "bg-slate-900" : "bg-slate-50/70"}`} aria-live="polite">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start gap-3 ${message.role === "student" ? "justify-end" : ""}`}
              >
                {message.role === "tutor" && (
                  <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-teal-100 text-teal-900">
                    <StudyIcon name="brain" className="size-4" />
                  </span>
                )}
                <div
                  className={`max-w-2xl rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    message.role === "student"
                      ? "rounded-br-md bg-blue-600 text-white"
                      : darkMode
                        ? "rounded-tl-md border border-slate-700 bg-slate-800 text-slate-200"
                        : "rounded-tl-md border border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
          </div>

          <div className={`border-t p-4 sm:p-5 ${darkMode ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}>
            <p className={`mb-2 text-xs font-semibold ${mutedClass}`}>Elige una ayuda rápida</p>
            <div className="flex gap-2 overflow-x-auto pb-3">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => useQuickPrompt(prompt)}
                  className={`min-h-11 shrink-0 rounded-full border px-4 text-sm font-semibold ${
                    darkMode
                      ? "border-slate-700 bg-slate-800 text-slate-200 hover:border-blue-500"
                      : "border-slate-300 bg-white text-slate-700 hover:border-blue-400 hover:bg-blue-50"
                  }`}
                >
                  {prompt}
                </button>
              ))}
            </div>
            <form onSubmit={sendMessage}>
              <div
                className={`flex items-end gap-2 rounded-2xl border p-2 focus-within:ring-4 focus-within:ring-blue-100 ${
                  darkMode ? "border-slate-700 bg-slate-800 focus-within:border-blue-500" : "border-slate-300 bg-white focus-within:border-blue-600"
                }`}
              >
                <label htmlFor="socratic-input" className="sr-only">
                  Escribe tu duda o procedimiento
                </label>
                <textarea
                  id="socratic-input"
                  rows={1}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      if (input.trim()) {
                        const prompt = input.trim();
                        setMessages((current) => [
                          ...current,
                          { id: Date.now(), role: "student", text: prompt },
                          { id: Date.now() + 1, role: "tutor", text: tutorReply(prompt) },
                        ]);
                        setInput("");
                      }
                    }
                  }}
                  placeholder="Escribe tu duda o comparte tus pasos..."
                  className={`min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm outline-none ${
                    darkMode ? "text-white placeholder:text-slate-500" : "text-slate-900 placeholder:text-slate-400"
                  }`}
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="grid size-11 shrink-0 place-items-center rounded-xl bg-blue-600 text-white hover:bg-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-slate-400"
                  aria-label="Enviar al tutor"
                >
                  <StudyIcon name="send" className="size-5" />
                </button>
              </div>
            </form>
            <p className={`mt-3 flex items-center justify-center gap-2 text-center text-xs ${mutedClass}`}>
              <StudyIcon name="shield" className="size-4 text-teal-600" />
              El tutor guía tu razonamiento y nunca entrega el resultado final.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
