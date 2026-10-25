import { FormEvent, ReactNode, useState } from "react";
import { socraticTutorAI } from "./services/aiService";

type PortalIconName =
  | "arrow"
  | "book"
  | "chart"
  | "check"
  | "chevron"
  | "clock"
  | "copy"
  | "grid"
  | "help"
  | "link"
  | "lock"
  | "logout"
  | "menu"
  | "plus"
  | "send"
  | "shield"
  | "sparkles"
  | "users"
  | "x";

const portalIconPaths: Record<PortalIconName, ReactNode> = {
  arrow: <path d="m9 18 6-6-6-6" />,
  book: (
    <>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
      <path d="M8 7h8M8 11h6" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
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
  copy: (
    <>
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
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
  help: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.8 9a2.4 2.4 0 1 1 3.7 2c-1 .6-1.5 1.1-1.5 2.2M12 17h.01" />
    </>
  ),
  link: (
    <>
      <path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.1 1.1" />
      <path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.1-1.1" />
    </>
  ),
  lock: (
    <>
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" />
    </>
  ),
  logout: (
    <>
      <path d="M10 17l5-5-5-5M15 12H3" />
      <path d="M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5" />
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
  users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />
    </>
  ),
  x: <path d="m6 6 12 12M18 6 6 18" />,
};

function PortalIcon({ name, className = "size-5" }: { name: PortalIconName; className?: string }) {
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
      {portalIconPaths[name]}
    </svg>
  );
}

function Brand({ dark = false }: { dark?: boolean }) {
  return (
    <div className="flex items-center gap-3" aria-label="ECduLearm">
      <span
        className={`grid size-10 place-items-center rounded-xl ${
          dark ? "bg-emerald-950 text-white" : "bg-white text-emerald-950"
        }`}
      >
        <PortalIcon name="book" className="size-5" />
      </span>
      <span className={`text-lg font-bold tracking-tight ${dark ? "text-emerald-950" : "text-white"}`}>
        EC<span className="text-teal-500">du</span>Learm
      </span>
    </div>
  );
}

export function AccessPortal({
  onStudentEnter,
  onTeacherEnter,
  onBackToLanding,
}: {
  onStudentEnter: () => void;
  onTeacherEnter: () => void;
  onBackToLanding?: () => void;
}) {
  const [pin, setPin] = useState("");
  const [loginOpen, setLoginOpen] = useState(false);
  const [error, setError] = useState("");

  const enterSession = (event: FormEvent) => {
    event.preventDefault();
    const cleanPin = pin.trim().replace(/\s+/g, "").toUpperCase();
    if (!cleanPin) {
      setError("Escribe el PIN o pega el enlace de tu clase.");
      return;
    }
    localStorage.setItem("ecdulearm_active_pin", cleanPin || "PISA26");
    onStudentEnter();
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f6f2e8] text-stone-950">
      <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-emerald-100/70 blur-3xl" />
      <header className="relative z-10 flex items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onBackToLanding}
            className="rounded-xl text-left transition hover:opacity-85 focus:outline-none focus:ring-2 focus:ring-teal-400"
            title="Volver a Inicio"
          >
            <Brand dark />
          </button>
          {onBackToLanding && (
            <button
              type="button"
              onClick={onBackToLanding}
              className="hidden sm:inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <span>←</span>
              <span>Inicio</span>
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setLoginOpen(true)}
          className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-blue-950 focus:outline-none focus:ring-4 focus:ring-blue-100"
        >
          <PortalIcon name="lock" className="size-4" />
          Acceso Docentes
        </button>
      </header>

      <main className="relative z-10 grid min-h-[calc(100vh-10rem)] place-items-center px-5 py-12">
        <div className="w-full max-w-xl text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-800 text-white">
            <PortalIcon name="arrow" className="size-6" />
          </span>
          <p className="mt-6 text-sm font-bold uppercase tracking-[0.18em] text-emerald-800">Acceso para estudiantes</p>
          <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
            ¿Cuál es el código de tu clase?
          </h1>
          <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-stone-600">
            Escribe el PIN o pega el enlace que compartió tu docente. Sin cuenta y sin datos personales.
          </p>

          <form
            onSubmit={enterSession}
            className="mt-9 rounded-xl border border-stone-200 bg-white p-3 text-left shadow-lg shadow-stone-900/5 sm:flex sm:items-center sm:gap-3"
          >
            <label htmlFor="class-pin" className="sr-only">
              PIN o enlace de la clase
            </label>
            <div className="flex min-h-14 flex-1 items-center gap-3 px-3">
              <PortalIcon name="link" className="size-5 shrink-0 text-emerald-800" />
              <input
                id="class-pin"
                value={pin}
                onChange={(event) => {
                  setPin(event.target.value.toUpperCase());
                  setError("");
                }}
                placeholder="Ej. PISA26 o 482 917"
                className="min-w-0 flex-1 bg-transparent text-base font-semibold text-stone-900 outline-none placeholder:font-normal placeholder:text-stone-400 uppercase"
                autoComplete="off"
              />
            </div>
            <button
              type="submit"
              className="flex min-h-14 w-full items-center justify-center gap-2 rounded-lg bg-emerald-800 px-6 text-sm font-bold text-white transition hover:bg-emerald-900 focus:outline-none focus:ring-4 focus:ring-emerald-200 sm:w-auto"
            >
              Entrar a la clase
              <PortalIcon name="arrow" className="size-4" />
            </button>
          </form>
          <p className="mt-3 min-h-5 text-sm font-medium text-orange-800" role="alert">
            {error}
          </p>

          <div className="mt-8 border-t border-stone-300 pt-5">
            <p className="flex items-center justify-center gap-2 text-sm font-semibold text-emerald-900">
              <PortalIcon name="shield" className="size-5 text-emerald-800" />
              Tu privacidad primero
            </p>
            <p className="mt-2 text-center text-xs leading-relaxed text-stone-600">
              Tu colegio administra esta experiencia. No solicitamos nombres, correos ni perfiles.
            </p>
          </div>
        </div>
      </main>

      <footer className="relative z-10 px-5 pb-6 text-center text-xs text-stone-500">
        Tu colegio administra esta experiencia. ECduLearm no solicita nombres, correos ni perfiles a estudiantes.
      </footer>

      {loginOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <button
            type="button"
            className="absolute inset-0"
            onClick={() => setLoginOpen(false)}
            aria-label="Cerrar acceso docente"
          />
          <section
            className="relative w-full max-w-md border border-stone-200 bg-[#f6f2e8] p-6 shadow-2xl sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-labelledby="teacher-login-title"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="grid size-11 place-items-center rounded-xl bg-blue-950 text-white">
                  <PortalIcon name="lock" className="size-5" />
                </span>
                <h2 id="teacher-login-title" className="mt-5 text-2xl font-bold text-stone-950">
                  Acceso institucional
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  Usa las credenciales pre-creadas por tu colegio.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLoginOpen(false)}
                className="grid size-11 shrink-0 place-items-center rounded-xl text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-100"
                aria-label="Cerrar"
              >
                <PortalIcon name="x" />
              </button>
            </div>

            <form
              className="mt-7 space-y-5"
              onSubmit={(event) => {
                event.preventDefault();
                onTeacherEnter();
              }}
            >
              <div>
                <label htmlFor="institutional-email" className="text-sm font-bold text-slate-800">
                  Correo institucional
                </label>
                <input
                  id="institutional-email"
                  type="email"
                  required
                  placeholder="docente@colegio.edu.ec"
                  className="mt-2 min-h-12 w-full rounded-lg border border-stone-300 bg-white px-4 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
                />
              </div>
              <div>
                <label htmlFor="teacher-password" className="text-sm font-bold text-slate-800">
                  Contraseña
                </label>
                <input
                  id="teacher-password"
                  type="password"
                  required
                  placeholder="Ingresa tu contraseña"
                  className="mt-2 min-h-12 w-full rounded-lg border border-stone-300 bg-white px-4 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100"
                />
              </div>
              <button
                type="submit"
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-emerald-800 px-5 text-sm font-bold text-white transition hover:bg-emerald-900 focus:outline-none focus:ring-4 focus:ring-emerald-200"
              >
                Ingresar al panel
                <PortalIcon name="arrow" className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => onTeacherEnter()}
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-teal-500/50 bg-teal-50 px-4 text-xs font-bold text-teal-900 transition hover:bg-teal-100 focus:outline-none focus:ring-4 focus:ring-teal-100"
              >
                <PortalIcon name="sparkles" className="size-4 text-teal-700" />
                🔑 Autocompletar como Evaluador / Jurado
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

const questions = [
  {
    eyebrow: "Razonamiento numérico",
    title: "Secuencias y patrones",
    body: "Una secuencia comienza con 3, 7, 15, 31. Si el patrón continúa, ¿cuál es el siguiente término?",
    options: ["47", "55", "63", "64"],
  },
  {
    eyebrow: "Modelación",
    title: "Velocidad promedio",
    body: "Un bus recorre 120 km en 2 horas y luego 90 km en 1,5 horas. ¿Qué dato necesitas calcular primero?",
    options: ["Tiempo total", "Mayor velocidad", "Número de paradas", "Costo del viaje"],
  },
  {
    eyebrow: "Álgebra",
    title: "Ecuaciones cuadráticas",
    body: "Observa x² − 5x + 6 = 0. ¿Qué estrategia permite encontrar sus soluciones con mayor claridad?",
    options: ["Factorizar", "Sumar 5", "Dividir para 6", "Elevar al cuadrado"],
  },
];

export function StudentWorkspace({ onExit }: { onExit: () => void }) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<Array<{ role: "student" | "tutor"; text: string }>>([
    {
      role: "tutor",
      text: "Puedo ayudarte a pensar paso a paso. Cuéntame en qué parte te trabaste.",
    },
  ]);
  const question = questions[questionIndex];

  const sendHintRequest = async (event: FormEvent) => {
    event.preventDefault();
    if (!chatInput.trim()) return;
    const prompt = chatInput.trim();
    setMessages((current) => [
      ...current,
      { role: "student", text: prompt },
    ]);
    setChatInput("");

    try {
      const history = messages.map((m) => ({ role: m.role, text: m.text }));
      const res = await socraticTutorAI(prompt, history, question.title);
      setMessages((current) => [
        ...current,
        { role: "tutor", text: res.data },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: "tutor",
          text: "Busca la relación entre cada término y el anterior. ¿Qué operación se repite antes de sumar una unidad?",
        },
      ]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-widest text-teal-700">Sesión activa</p>
            <h1 className="mt-1 truncate text-sm font-bold text-blue-950 sm:text-lg">
              Simulador: Examen de Admisión — Razonamiento Numérico
            </h1>
          </div>
          <button
            type="button"
            onClick={onExit}
            className="grid size-11 shrink-0 place-items-center rounded-xl text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-100"
            aria-label="Salir de la sesión"
          >
            <PortalIcon name="logout" className="size-5" />
          </button>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 pb-28 sm:px-6 sm:py-10 lg:grid-cols-[1fr_18rem] lg:pb-10">
        <section>
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-slate-800">
                Pregunta {questionIndex + 1} de {questions.length}
              </p>
              <p className="mt-1 text-xs text-slate-500">Tu progreso se guarda solo durante esta sesión anónima.</p>
            </div>
            <span className="rounded-full bg-blue-100 px-3 py-1.5 text-xs font-bold text-blue-900">
              {Math.round(((questionIndex + 1) / questions.length) * 100)}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className={`h-full rounded-full bg-teal-600 transition-all ${
                questionIndex === 0 ? "w-1/3" : questionIndex === 1 ? "w-2/3" : "w-full"
              }`}
            />
          </div>

          <article className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/5 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">{question.eyebrow}</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-blue-950 sm:text-3xl">{question.title}</h2>
            <p className="mt-5 text-base leading-8 text-slate-700">{question.body}</p>

            <fieldset className="mt-8 space-y-3">
              <legend className="sr-only">Selecciona una opción</legend>
              {question.options.map((option, index) => (
                <label
                  key={option}
                  className={`flex min-h-14 cursor-pointer items-center gap-4 rounded-2xl border p-3 transition sm:p-4 ${
                    selected === option
                      ? "border-blue-800 bg-blue-50 ring-2 ring-blue-100"
                      : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${questionIndex}`}
                    value={option}
                    checked={selected === option}
                    onChange={() => setSelected(option)}
                    className="size-5 accent-blue-950"
                  />
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="text-sm font-semibold text-slate-800">{option}</span>
                </label>
              ))}
            </fieldset>

            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => setChatOpen(true)}
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-blue-100"
              >
                <PortalIcon name="help" className="size-5" />
                Necesito una pista
              </button>
              <button
                type="button"
                disabled={!selected}
                onClick={() => {
                  if (questionIndex < questions.length - 1) {
                    setQuestionIndex((current) => current + 1);
                    setSelected("");
                  }
                }}
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-950 px-6 text-sm font-bold text-white hover:bg-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {questionIndex === questions.length - 1 ? "Finalizar actividad" : "Continuar"}
                <PortalIcon name="arrow" className="size-4" />
              </button>
            </div>
          </article>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-teal-200 bg-teal-50 p-5">
            <div className="flex items-center gap-2 text-sm font-bold text-teal-900">
              <PortalIcon name="shield" className="size-5" />
              Tu privacidad primero
            </div>
            <p className="mt-2 text-xs leading-relaxed text-teal-900/80">
              Estás participando sin perfil, nombre ni correo. Solo se comparten resultados grupales.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2 text-sm font-bold text-blue-950">
              <PortalIcon name="sparkles" className="size-5 text-teal-700" />
              Chat Socrático
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              Recibe preguntas y pistas para avanzar. El tutor no revela la respuesta.
            </p>
            <button
              type="button"
              onClick={() => setChatOpen(true)}
              className="mt-4 min-h-11 w-full rounded-xl bg-blue-50 px-4 text-sm font-bold text-blue-900 hover:bg-blue-100 focus:outline-none focus:ring-4 focus:ring-blue-100"
            >
              Abrir tutor
            </button>
          </div>
        </aside>
      </main>

      <button
        type="button"
        onClick={() => setChatOpen(true)}
        className="fixed bottom-5 right-5 z-30 flex min-h-14 items-center gap-2 rounded-2xl bg-blue-950 px-5 text-sm font-bold text-white shadow-2xl shadow-blue-950/25 focus:outline-none focus:ring-4 focus:ring-blue-200 lg:hidden"
      >
        <PortalIcon name="sparkles" className="size-5 text-teal-300" />
        Pedir pista
      </button>

      {chatOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/30 backdrop-blur-sm">
          <button
            type="button"
            className="absolute inset-0"
            onClick={() => setChatOpen(false)}
            aria-label="Cerrar tutor"
          />
          <section
            className="absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col rounded-t-3xl bg-white shadow-2xl sm:inset-y-0 sm:left-auto sm:right-0 sm:w-[25rem] sm:rounded-none"
            role="dialog"
            aria-modal="true"
            aria-labelledby="socratic-title"
          >
            <div className="flex items-center justify-between border-b border-slate-200 p-4">
              <div>
                <h2 id="socratic-title" className="flex items-center gap-2 font-bold text-blue-950">
                  <PortalIcon name="sparkles" className="size-5 text-teal-700" />
                  Tutor Socrático
                </h2>
                <p className="mt-1 text-xs text-slate-500">Pistas, no respuestas</p>
              </div>
              <button
                type="button"
                onClick={() => setChatOpen(false)}
                className="grid size-11 place-items-center rounded-xl text-slate-500 hover:bg-slate-100"
                aria-label="Cerrar tutor"
              >
                <PortalIcon name="x" />
              </button>
            </div>
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
              {messages.map((message, index) => (
                <div
                  key={`${message.text}-${index}`}
                  className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    message.role === "student"
                      ? "ml-auto rounded-br-md bg-blue-950 text-white"
                      : "rounded-tl-md border border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  {message.text}
                </div>
              ))}
            </div>
            <form onSubmit={sendHintRequest} className="border-t border-slate-200 bg-white p-3">
              <div className="flex items-center gap-2 rounded-2xl border border-slate-300 p-2 focus-within:border-blue-700 focus-within:ring-4 focus-within:ring-blue-100">
                <label htmlFor="hint-input" className="sr-only">
                  Explica dónde te trabaste
                </label>
                <input
                  id="hint-input"
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                  placeholder="¿En qué paso te trabaste?"
                  className="min-h-10 min-w-0 flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="grid size-11 place-items-center rounded-xl bg-blue-950 text-white disabled:bg-slate-300"
                  aria-label="Enviar al tutor"
                >
                  <PortalIcon name="send" className="size-4" />
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

const rooms = [
  {
    name: "Admisión · Razonamiento Numérico",
    subject: "Simulador universitario",
    status: "Activa",
    students: 30,
    updated: "Hace 4 min",
  },
  {
    name: "Funciones y ecuaciones",
    subject: "Matemática · 2do BGU",
    status: "Programada",
    students: 0,
    updated: "Mañana, 08:00",
  },
  {
    name: "Estática aplicada",
    subject: "Ingeniería civil",
    status: "Borrador",
    students: 0,
    updated: "Editada ayer",
  },
];

export function TeacherDashboard({
  onExit,
  onCreateContent,
  onOpenPlanner,
}: {
  onExit: () => void;
  onCreateContent: () => void;
  onOpenPlanner: () => void;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyPin = async () => {
    await navigator.clipboard?.writeText("PISA26");
    localStorage.setItem("ecdulearm_active_pin", "PISA26");
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#f6f2e8] text-stone-950">
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Cerrar navegación"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-emerald-950 p-4 text-white transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-1">
          <Brand />
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="grid size-11 place-items-center rounded-xl text-blue-100 hover:bg-white/10 lg:hidden"
            aria-label="Cerrar menú"
          >
            <PortalIcon name="x" />
          </button>
        </div>
        <nav className="mt-8 space-y-1" aria-label="Panel docente">
          <button
            type="button"
            className="flex min-h-12 w-full items-center gap-3 rounded-lg border-l-2 border-orange-300 bg-white/10 px-3 text-left text-sm font-bold"
          >
            <PortalIcon name="grid" className="size-5 text-teal-300" />
            Resumen
          </button>
          <button
            type="button"
            className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold text-blue-100 hover:bg-white/10"
          >
            <PortalIcon name="book" className="size-5" />
            Salas y sesiones
          </button>
          <button
            type="button"
            onClick={onCreateContent}
            className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold text-blue-100 hover:bg-white/10"
          >
            <PortalIcon name="sparkles" className="size-5" />
            Crear con IA
          </button>
          <button
            type="button"
            onClick={onOpenPlanner}
            className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold text-blue-100 hover:bg-white/10"
          >
            <PortalIcon name="book" className="size-5" />
            Planificador de clase
          </button>
          <button
            type="button"
            className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold text-blue-100 hover:bg-white/10"
          >
            <PortalIcon name="chart" className="size-5" />
            Analítica grupal
          </button>
        </nav>
        <div className="mt-auto rounded-2xl border border-white/10 bg-white/10 p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-teal-200">
            <PortalIcon name="shield" className="size-4" />
            Privacidad B2B
          </div>
          <p className="mt-2 text-xs leading-relaxed text-blue-100">
            Las métricas son agregadas. No existen perfiles ni datos personales de estudiantes.
          </p>
        </div>
        <button
          type="button"
          onClick={onExit}
          className="mt-3 flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-blue-100 hover:bg-white/10"
        >
          <PortalIcon name="logout" className="size-5" />
          Cerrar sesión
        </button>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="grid size-11 shrink-0 place-items-center rounded-xl text-slate-600 hover:bg-slate-100 lg:hidden"
                aria-label="Abrir menú"
              >
                <PortalIcon name="menu" />
              </button>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-blue-950">Colegio Horizonte</p>
                <p className="truncate text-xs text-slate-500">María Andrade · Docente</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPinOpen(true)}
              className="flex min-h-11 items-center gap-2 rounded-lg bg-emerald-800 px-3 text-sm font-bold text-white hover:bg-emerald-900 focus:outline-none focus:ring-4 focus:ring-emerald-200 sm:px-5"
            >
              <PortalIcon name="link" className="size-4" />
              <span className="hidden sm:inline">Generar Enlace / PIN para Alumnos</span>
              <span className="sm:hidden">Generar PIN</span>
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-bold text-teal-700">Panel del docente</p>
              <h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight text-stone-950">Buenos días, María</h1>
              <p className="mt-2 text-sm text-stone-600">Orquesta tus sesiones y observa el avance anónimo del grupo.</p>
            </div>
            <button
              type="button"
              onClick={onCreateContent}
              className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-stone-300 bg-white px-4 text-sm font-bold text-stone-700 hover:bg-stone-100 focus:outline-none focus:ring-4 focus:ring-emerald-100"
            >
              <PortalIcon name="sparkles" className="size-4 text-teal-700" />
              Crear contenido con IA
            </button>
          </div>

          <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Métricas rápidas">
            {[
              {
                label: "Conectados ahora",
                value: "30",
                detail: "estudiantes anónimos",
                icon: "users" as const,
              },
              { label: "Progreso promedio", value: "72%", detail: "+8% esta semana", icon: "chart" as const },
              { label: "Sesiones activas", value: "1", detail: "2 programadas", icon: "clock" as const },
              { label: "Participación", value: "88%", detail: "del grupo activo", icon: "check" as const },
            ].map((metric) => (
              <article key={metric.label} className="border border-stone-200 bg-white p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{metric.label}</p>
                    <p className="mt-3 font-serif text-3xl font-semibold text-stone-950">{metric.value}</p>
                    <p className="mt-1 text-xs text-slate-500">{metric.detail}</p>
                  </div>
                  <span className="grid size-10 place-items-center rounded-full bg-emerald-100 text-emerald-900">
                    <PortalIcon name={metric.icon} className="size-5" />
                  </span>
                </div>
              </article>
            ))}
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_22rem]">
            <div className="overflow-hidden border border-stone-200 bg-white">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5 sm:p-6">
                <div>
                  <h2 className="font-serif text-lg font-semibold text-stone-950">Salas y sesiones</h2>
                  <p className="mt-1 text-sm text-slate-500">Contenido asignado a tus grupos.</p>
                </div>
                <button
                  type="button"
                  onClick={onCreateContent}
                  className="flex min-h-11 items-center gap-2 rounded-lg border border-stone-300 px-4 text-sm font-bold text-stone-700 hover:bg-stone-50"
                >
                  <PortalIcon name="plus" className="size-4" />
                  Nueva sala
                </button>
              </div>
              <div className="divide-y divide-slate-200">
                {rooms.map((room) => (
                  <button
                    key={room.name}
                    type="button"
                    className="grid w-full gap-3 p-5 text-left transition hover:bg-slate-50 sm:grid-cols-[1fr_auto_auto] sm:items-center sm:px-6"
                  >
                    <span>
                      <span className="block text-sm font-bold text-slate-900">{room.name}</span>
                      <span className="mt-1 block text-xs text-slate-500">{room.subject}</span>
                    </span>
                    <span className="flex items-center gap-2 text-xs text-slate-500 sm:min-w-24">
                      <PortalIcon name="users" className="size-4" />
                      {room.students} activos
                    </span>
                    <span className="flex items-center justify-between gap-4 sm:min-w-36">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                          room.status === "Activa"
                            ? "bg-teal-100 text-teal-900"
                            : room.status === "Programada"
                              ? "bg-blue-100 text-blue-900"
                              : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {room.status}
                      </span>
                      <PortalIcon name="chevron" className="size-4 text-slate-400" />
                    </span>
                    <span className="text-xs text-slate-400 sm:col-start-3">{room.updated}</span>
                  </button>
                ))}
              </div>
            </div>

            <aside className="space-y-5">
              <div className="border border-orange-200 bg-orange-50 p-6 text-stone-900">
                <p className="text-xs font-bold uppercase tracking-widest text-orange-800">Atención requerida</p>
                <h2 className="mt-3 text-lg font-bold">Pregunta con más fallos</h2>
                <p className="mt-2 text-2xl font-bold">Ecuaciones cuadráticas</p>
                <p className="mt-2 text-sm leading-relaxed text-stone-700">
                  El 46% del grupo pidió una pista al factorizar.
                </p>
                <button
                  type="button"
                  onClick={onCreateContent}
                  className="mt-5 min-h-11 w-full rounded-lg bg-stone-900 px-4 text-sm font-bold text-white hover:bg-stone-800"
                >
                  Crear refuerzo
                </button>
              </div>
              <div className="border border-stone-200 bg-white p-5">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                  <PortalIcon name="shield" className="size-5 text-teal-700" />
                  Datos agregados
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-500">
                  Los indicadores describen al grupo, nunca a estudiantes individuales.
                </p>
              </div>
            </aside>
          </section>
        </main>
      </div>

      {pinOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <button
            type="button"
            className="absolute inset-0"
            onClick={() => setPinOpen(false)}
            aria-label="Cerrar PIN"
          />
          <section
            className="relative w-full max-w-lg border border-stone-200 bg-[#f6f2e8] p-6 text-center shadow-2xl sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pin-title"
          >
            <button
              type="button"
              onClick={() => setPinOpen(false)}
              className="absolute right-4 top-4 grid size-11 place-items-center rounded-xl text-slate-500 hover:bg-slate-100"
              aria-label="Cerrar"
            >
              <PortalIcon name="x" />
            </button>
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-teal-100 text-teal-900">
              <PortalIcon name="link" className="size-6" />
            </span>
            <p className="mt-5 text-xs font-bold uppercase tracking-widest text-teal-700">Sesión lista</p>
            <h2 id="pin-title" className="mt-2 font-serif text-2xl font-semibold text-stone-950">
              Comparte este PIN con tu clase
            </h2>
            <div className="mt-6 border border-stone-300 bg-white p-5">
              <p className="font-serif text-4xl font-semibold tracking-[0.2em] text-emerald-900">PISA26</p>
              <p className="mt-3 text-sm text-slate-600">ecdu.io/s/PISA26</p>
            </div>
            <button
              type="button"
              onClick={copyPin}
              className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-emerald-800 px-5 text-sm font-bold text-white hover:bg-emerald-900 focus:outline-none focus:ring-4 focus:ring-emerald-200"
            >
              <PortalIcon name={copied ? "check" : "copy"} className="size-5" />
              {copied ? "PIN y enlace copiados" : "Copiar PIN y enlace"}
            </button>
            <p className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
              <PortalIcon name="shield" className="size-4 text-teal-700" />
              Los estudiantes ingresan sin cuenta ni datos personales
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
