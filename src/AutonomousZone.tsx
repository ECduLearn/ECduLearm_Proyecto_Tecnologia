import { FormEvent, ReactNode, useState } from "react";
import { socraticTutorAI } from "./services/aiService";

type ZoneIconName =
  | "algebra"
  | "arrow-left"
  | "book"
  | "brain"
  | "check"
  | "chevron"
  | "compass"
  | "formula"
  | "graduation"
  | "grid"
  | "key"
  | "logic"
  | "send"
  | "shield"
  | "sparkles"
  | "target";

const zoneIconPaths: Record<ZoneIconName, ReactNode> = {
  algebra: <path d="M4 6h7M7.5 2.5v7M14 4l6 6M20 4l-6 6M4 16h7M14 16h6M14 20h6" />,
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
  brain: (
    <>
      <path d="M9.5 4.5A3 3 0 0 0 4 6.2 3.5 3.5 0 0 0 3 12a3.5 3.5 0 0 0 1.5 5.8A3 3 0 0 0 10 19.5V4.5Z" />
      <path d="M14.5 4.5A3 3 0 0 1 20 6.2a3.5 3.5 0 0 1 1 5.8 3.5 3.5 0 0 1-1.5 5.8 3 3 0 0 1-5.5 1.7V4.5ZM10 9H7.5M14 9h2.5M10 15H7.5M14 15h2.5" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  chevron: <path d="m9 18 6-6-6-6" />,
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m16 8-2.5 5.5L8 16l2.5-5.5Z" />
    </>
  ),
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
  key: (
    <>
      <circle cx="8" cy="15" r="4" />
      <path d="m11 12 9-9M16 7l3 3M14 9l3 3" />
    </>
  ),
  logic: (
    <>
      <circle cx="6" cy="6" r="2" />
      <circle cx="18" cy="6" r="2" />
      <circle cx="12" cy="18" r="2" />
      <path d="M8 6h8M7 8l4 8M17 8l-4 8" />
    </>
  ),
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
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </>
  ),
};

function ZoneIcon({ name, className = "size-5" }: { name: ZoneIconName; className?: string }) {
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
      {zoneIconPaths[name]}
    </svg>
  );
}

type Message = {
  id: number;
  role: "student" | "tutor";
  text: string;
};

const practiceCategories = [
  { name: "Álgebra", detail: "12 microretos", icon: "algebra" as const, tone: "bg-ink-100 text-ink-900" },
  { name: "Geometría", detail: "8 microretos", icon: "compass" as const, tone: "bg-ink-100 text-ink-900" },
  {
    name: "Razonamiento Lógico",
    detail: "10 microretos",
    icon: "logic" as const,
    tone: "bg-ink-100 text-ink-900",
  },
  {
    name: "Simuladores de Admisión",
    detail: "3 simuladores",
    icon: "graduation" as const,
    tone: "bg-hint-100 text-hint-900",
  },
];

const quickPrompts = [
  "No entiendo el enunciado",
  "Dame una pista del primer paso",
  "Revisa mi procedimiento",
  "¿Uso regla de tres?",
];

function StudentHeader({
  onBack,
  title,
}: {
  onBack?: () => void;
  title?: string;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-sand-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-bold text-sand-700 hover:bg-sand-100 focus:outline-none focus:ring-4 focus:ring-ink-100"
          >
            <ZoneIcon name="arrow-left" />
            <span className="hidden sm:inline">Centro de mando</span>
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-ink-800 text-white">
              <ZoneIcon name="book" className="size-5" />
            </span>
            <span className="font-semibold tracking-tight text-sand-950">
              EC<span className="text-hint-600">du</span>Learm
            </span>
          </div>
        )}
        {title && <p className="min-w-0 truncate text-center text-sm font-bold text-ink-950 sm:text-base">{title}</p>}
        <span className="flex items-center gap-1.5 rounded-full bg-ink-50 px-3 py-1.5 text-xs font-bold text-ink-900">
          <ZoneIcon name="shield" className="size-4" />
          Anónimo
        </span>
      </div>
    </header>
  );
}

export default function AutonomousZone({
  onExit,
  onSimulator,
}: {
  onExit: () => void;
  onSimulator: () => void;
}) {
  const [view, setView] = useState<"dashboard" | "free" | "school">("dashboard");
  const [newPin, setNewPin] = useState("");
  const [pinNotice, setPinNotice] = useState("");
  const [formulaOpen, setFormulaOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "tutor",
      text: "Aquí tienes un reto de lógica. ¿Cuál crees que es el primer paso?",
    },
  ]);
  const [stepInput, setStepInput] = useState("");
  const [stepStatus, setStepStatus] = useState<"idle" | "review" | "success">("idle");
  const [stepHint, setStepHint] = useState("");
  const [schoolStep, setSchoolStep] = useState(1);

  const socraticReply = (prompt: string) => {
    const normalized = prompt.toLowerCase();
    if (normalized.includes("regla de tres")) {
      return "Antes de elegir una técnica, observa cómo cambia cada figura. ¿La relación es proporcional o sigue otro patrón?";
    }
    if (normalized.includes("enunciado")) {
      return "Reescribe la pregunta con tus palabras: ¿qué elementos se repiten y qué elemento debes predecir?";
    }
    return "Mira la diferencia entre una figura y la siguiente. ¿Qué cambia siempre y qué permanece igual?";
  };

  const submitChat = async (event: FormEvent) => {
    event.preventDefault();
    if (!chatInput.trim()) return;
    const prompt = chatInput.trim();
    const studentId = Date.now();
    setMessages((current) => [
      ...current,
      { id: studentId, role: "student", text: prompt },
    ]);
    setChatInput("");

    try {
      const history = messages.map((m) => ({ role: m.role, text: m.text }));
      const res = await socraticTutorAI(prompt, history, "Reto de lógica y patrones numéricos");
      setMessages((current) => [
        ...current,
        { id: Date.now() + 1, role: "tutor", text: res.data },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        { id: Date.now() + 1, role: "tutor", text: socraticReply(prompt) },
      ]);
    }
  };

  const useChip = async (prompt: string) => {
    const studentId = Date.now();
    setMessages((current) => [
      ...current,
      { id: studentId, role: "student", text: prompt },
    ]);

    try {
      const history = messages.map((m) => ({ role: m.role, text: m.text }));
      const res = await socraticTutorAI(prompt, history, "Reto de lógica y patrones numéricos");
      setMessages((current) => [
        ...current,
        { id: Date.now() + 1, role: "tutor", text: res.data },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        { id: Date.now() + 1, role: "tutor", text: socraticReply(prompt) },
      ]);
    }
  };

  const validateStep = async () => {
    const answer = stepInput.toLowerCase();
    const isUseful =
      schoolStep === 1
        ? (answer.includes("tiempo") || answer.includes("minuto")) &&
          (answer.includes("velocidad") || answer.includes("distancia") || answer.includes("km"))
        : answer.includes("minuto") && (answer.includes("segundo") || answer.includes("60") || answer.includes("hora"));

    if (isUseful) {
      setStepStatus("success");
    } else {
      setStepStatus("review");
      try {
        const hintRes = await socraticTutorAI(
          `El estudiante respondió en el paso ${schoolStep}: "${stepInput}". Dale una pista reflexiva corta sin darle el cálculo final.`,
          [],
          "Vehículo a 60 km/h durante 45 minutos. Determinar distancia y justificar conversión de unidades."
        );
        setStepHint(hintRes.data);
      } catch {
        setStepHint(
          schoolStep === 1
            ? "Revisa bien el texto: ¿cuáles son las dos magnitudes numéricas conocidas y cuál es la variable que te piden encontrar?"
            : "Recuerda que la velocidad está en km/h y el tiempo en minutos. ¿Qué fracción de una hora representan 45 minutos?"
        );
      }
    }
  };

  if (view === "dashboard") {
    return (
      <div className="min-h-screen bg-sand-50 text-sand-950">
        <StudentHeader />
        <main className="mx-auto max-w-6xl px-4 py-7 sm:px-6 sm:py-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold text-ink-800">Zona de estudio autónomo</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-sand-950 sm:text-4xl">
                ¡Hola! ¿Qué vamos a entrenar hoy?
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-sand-600">
                Continúa un reto de tu colegio o elige un tema para practicar a tu ritmo.
              </p>
            </div>
            <form
              className="w-full sm:max-w-xs"
              onSubmit={(event) => {
                event.preventDefault();
                if (newPin.trim()) {
                  setPinNotice("PIN vinculado. Tus retos están actualizados.");
                  setNewPin("");
                }
              }}
            >
              <label htmlFor="new-class-pin" className="text-xs font-bold text-sand-600">
                Ingresar nuevo PIN de clase
              </label>
              <div className="mt-2 flex items-center gap-2 border border-sand-300 bg-white p-1.5 focus-within:border-ink-700 focus-within:ring-4 focus-within:ring-ink-100">
                <ZoneIcon name="key" className="ml-2 size-4 text-ink-800" />
                <input
                  id="new-class-pin"
                  value={newPin}
                  onChange={(event) => setNewPin(event.target.value)}
                  placeholder="Ej. 482 917"
                  className="min-h-10 min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:font-normal placeholder:text-sand-400"
                />
                <button
                  type="submit"
                  className="min-h-10 rounded-md bg-ink-800 px-3 text-xs font-bold text-white hover:bg-ink-900"
                >
                  Vincular
                </button>
              </div>
              <p className="mt-2 min-h-4 text-xs font-medium text-ink-700" aria-live="polite">
                {pinNotice}
              </p>
            </form>
          </div>

          <section className="mt-10">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-ink-800">Tu ruta</p>
                  <h2 className="mt-1 text-xl font-semibold text-sand-950">Retos del colegio</h2>
              </div>
              <span className="text-xs font-medium text-sand-400">Desliza para explorar</span>
            </div>

            <div className="-mx-4 mt-5 flex snap-x gap-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0">
              <article className="min-w-[88%] snap-center border border-sand-300 bg-white p-6 shadow-md shadow-sand-900/5 sm:min-w-[30rem]">
                <div className="flex items-start justify-between gap-4">
                  <span className="grid size-11 place-items-center rounded-full bg-ink-100 text-ink-900">
                    <ZoneIcon name="target" className="size-5" />
                  </span>
                  <span className="rounded-full bg-hint-100 px-2.5 py-1 text-xs font-bold text-hint-900">En curso</span>
                </div>
                <p className="mt-7 text-xs font-bold uppercase tracking-widest text-ink-800">Matemática · 2do BGU</p>
                <h3 className="mt-2 text-xl font-semibold text-sand-950">Guía PISA: Análisis de Estructuras</h3>
                <div className="mt-6 flex items-center justify-between text-xs font-semibold text-sand-600">
                  <span>2 de 5 completados</span>
                  <span>40%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-sand-200">
                  <div className="h-full w-2/5 rounded-full bg-hint-500" />
                </div>
                <button
                  type="button"
                  onClick={() => setView("school")}
                  className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-ink-800 px-5 text-sm font-bold text-white hover:bg-ink-900 focus:outline-none focus:ring-4 focus:ring-ink-200"
                >
                  Continuar reto
                  <ZoneIcon name="chevron" className="size-4" />
                </button>
              </article>

              <article className="min-w-[82%] snap-center border border-sand-300 bg-white p-6 sm:min-w-[25rem]">
                <span className="grid size-11 place-items-center rounded-xl bg-hint-100 text-hint-900">
                  <ZoneIcon name="graduation" className="size-5" />
                </span>
                <p className="mt-7 text-xs font-bold uppercase tracking-widest text-sand-500">Simulador asignado</p>
                <h3 className="mt-2 text-xl font-semibold text-sand-950">Preparación para admisión</h3>
                <p className="mt-3 text-sm text-sand-500">Disponible hasta el viernes · 20 preguntas</p>
                <button
                  type="button"
                  onClick={onSimulator}
                  className="mt-6 min-h-12 w-full rounded-xl border border-sand-300 px-5 text-sm font-bold text-sand-700 hover:bg-sand-50"
                >
                  Empezar reto
                </button>
              </article>
            </div>
          </section>

          <section className="mt-10">
            <p className="text-xs font-bold uppercase tracking-widest text-hint-800">A tu ritmo</p>
            <h2 className="mt-1 text-xl font-semibold text-sand-950">Práctica libre</h2>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              {practiceCategories.map((category) => (
                <article key={category.name} className="flex min-h-56 flex-col border border-sand-200 bg-white p-4 sm:p-5">
                  <span className={`grid size-11 place-items-center rounded-xl ${category.tone}`}>
                    <ZoneIcon name={category.icon} className="size-5" />
                  </span>
                  <h3 className="mt-5 text-base font-semibold leading-tight text-sand-950">{category.name}</h3>
                  <p className="mt-2 text-xs text-sand-500">{category.detail}</p>
                  <button
                    type="button"
                    onClick={() =>
                      category.name === "Simuladores de Admisión" ? onSimulator() : setView("free")
                    }
                    className="mt-auto flex min-h-11 items-center justify-between rounded-xl bg-sand-100 px-3 text-xs font-bold text-sand-700 hover:bg-ink-50 hover:text-ink-900 focus:outline-none focus:ring-4 focus:ring-ink-100"
                  >
                    Entrenar
                    <ZoneIcon name="chevron" className="size-4" />
                  </button>
                </article>
              ))}
            </div>
          </section>

          <div className="mt-10 flex flex-col items-center justify-between gap-4 border border-ink-200 bg-ink-50 p-5 text-center sm:flex-row sm:text-left">
            <div className="flex items-center gap-3">
              <ZoneIcon name="shield" className="size-5 shrink-0 text-ink-800" />
              <p className="text-xs leading-relaxed text-ink-900">
                Estudias de forma anónima. El tutor ofrece pistas y nunca revela respuestas finales.
              </p>
            </div>
            <button type="button" onClick={onExit} className="min-h-11 shrink-0 px-3 text-xs font-bold text-ink-900 underline">
              Salir de la zona
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (view === "free") {
    return (
      <div className="min-h-screen bg-sand-50 text-sand-950">
        <StudentHeader onBack={() => setView("dashboard")} title="Práctica libre · Razonamiento Lógico" />
        <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col gap-4 px-4 py-5 sm:px-6">
          <section className="border border-sand-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-full bg-ink-100 text-ink-900">
                  <ZoneIcon name="logic" className="size-5" />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-ink-800">Microreto 1</p>
                  <h1 className="mt-0.5 font-semibold text-sand-950">Patrones de construcción</h1>
                </div>
              </div>
              <span className="rounded-full bg-sand-100 px-3 py-1.5 text-xs font-bold text-sand-600">Nivel medio</span>
            </div>
            <p className="mt-6 text-base leading-8 text-sand-700">
              Una estructura se construye con triángulos de palitos. La figura 1 usa 3 palitos, la figura 2 usa 5 y la
              figura 3 usa 7. Sin dibujar todas las figuras, explica cómo determinarías cuántos palitos necesita la figura
              10.
            </p>
            <button
              type="button"
              onClick={() => setFormulaOpen((current) => !current)}
              className="mt-5 flex min-h-11 items-center gap-2 rounded-xl border border-sand-300 px-4 text-sm font-bold text-sand-700 hover:bg-sand-50"
              aria-expanded={formulaOpen}
            >
              <ZoneIcon name="formula" className="size-5 text-ink-600" />
              Ver fórmulas básicas
              <ZoneIcon name="chevron" className={`size-4 transition ${formulaOpen ? "rotate-90" : ""}`} />
            </button>
            {formulaOpen && (
              <div className="mt-4 border-l-2 border-hint-500 bg-hint-50 p-4 text-sm leading-relaxed text-sand-800">
                En una secuencia lineal puedes explorar: <strong>término = valor inicial + cambio × posición</strong>.
                Decide primero si el cambio entre figuras es constante.
              </div>
            )}
          </section>

          <section className="flex min-h-[40vh] flex-1 flex-col overflow-hidden border border-sand-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-sand-200 px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-ink-100 text-ink-900">
                  <ZoneIcon name="sparkles" className="size-5" />
                </span>
                <div>
                  <h2 className="font-semibold text-sand-950">Tutor Socrático</h2>
                  <p className="text-xs text-sand-500">Pistas para construir tu estrategia</p>
                </div>
              </div>
              <span className="hidden items-center gap-1.5 rounded-full bg-ink-50 px-2.5 py-1 text-xs font-bold text-ink-900 sm:flex">
                <ZoneIcon name="shield" className="size-3.5" />
                Sin respuestas directas
              </span>
            </div>
            <div className="max-h-72 flex-1 space-y-3 overflow-y-auto bg-sand-50 p-4 sm:p-5" aria-live="polite">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === "student" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      message.role === "student"
                        ? "rounded-br-md bg-ink-800 text-white"
                        : "rounded-tl-md border border-sand-200 bg-white text-sand-700"
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-sand-200 p-4">
              <div className="flex gap-2 overflow-x-auto pb-3">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => useChip(prompt)}
                    className="min-h-11 shrink-0 rounded-full border border-sand-300 bg-white px-4 text-sm font-semibold text-sand-700 hover:border-ink-400 hover:bg-ink-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
              <form onSubmit={submitChat}>
                <div className="flex items-end gap-2 rounded-2xl border border-sand-300 p-2 focus-within:border-ink-600 focus-within:ring-4 focus-within:ring-ink-100">
                  <label htmlFor="free-practice-input" className="sr-only">
                    Escribe tu procedimiento
                  </label>
                  <textarea
                    id="free-practice-input"
                    rows={1}
                    value={chatInput}
                    onChange={(event) => setChatInput(event.target.value)}
                    placeholder="Escribe tu procedimiento o una duda..."
                    className="min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-sand-400"
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim()}
                    className="grid size-11 shrink-0 place-items-center rounded-xl bg-ink-600 text-white disabled:bg-sand-300"
                    aria-label="Enviar al tutor"
                  >
                    <ZoneIcon name="send" className="size-5" />
                  </button>
                </div>
              </form>
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sand-50 text-sand-950">
      <StudentHeader onBack={() => setView("dashboard")} title="Guía PISA: Análisis de Estructuras" />
      <main className="mx-auto max-w-4xl px-4 py-5 pb-10 sm:px-6 sm:py-8">
        <section className="border border-sand-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-ink-800">Reto del colegio</p>
              <h1 className="mt-1 text-lg font-semibold text-sand-950">Reto PISA · Pregunta 1 de 3</h1>
            </div>
            <span className="text-sm font-bold text-ink-900">33%</span>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-sand-200">
            <div className="h-full w-1/3 rounded-full bg-hint-500" />
          </div>

          <div className="mt-8 border-l-2 border-hint-500 bg-sand-50 p-5 sm:p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-sand-500">Centro comunitario seguro</p>
            <p className="mt-3 text-base leading-8 text-sand-700">
              Un equipo evalúa una estructura modular para un centro comunitario. Un vehículo transporta las piezas a
              velocidad constante de 60 km/h durante 45 minutos. Para planificar la entrega, el equipo debe determinar la
              distancia recorrida y justificar cada conversión de unidades.
            </p>
          </div>
        </section>

        <section className="mt-4 border border-sand-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-start gap-4">
            <span
              className={`grid size-10 shrink-0 place-items-center rounded-full text-sm font-bold ${
                stepStatus === "success" ? "bg-ink-100 text-ink-900" : "bg-ink-100 text-ink-900"
              }`}
            >
              {stepStatus === "success" ? <ZoneIcon name="check" className="size-5" /> : schoolStep}
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-sand-500">Paso {schoolStep} de 3</p>
              <h2 className="mt-1 text-xl font-semibold text-sand-950">
                {schoolStep === 1 ? "Identifica las variables" : "Unifica las unidades"}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-sand-600">
                {schoolStep === 1
                  ? "Escribe qué datos conoces, con sus unidades, y qué necesitas encontrar."
                  : "Explica cómo convertirías el tiempo para que sea compatible con la velocidad."}
              </p>
            </div>
          </div>

          <label htmlFor="school-step-input" className="sr-only">
            Respuesta del paso actual
          </label>
          <textarea
            id="school-step-input"
            rows={5}
            value={stepInput}
            onChange={(event) => {
              setStepInput(event.target.value);
              setStepStatus("idle");
            }}
            placeholder={
              schoolStep === 1
                ? "Ej. Conozco la velocidad en... y el tiempo en..."
                : "Describe la conversión sin calcular la respuesta final..."
            }
            className={`mt-6 w-full resize-none rounded-2xl border p-4 text-sm leading-relaxed outline-none transition placeholder:text-sand-400 focus:ring-4 ${
              stepStatus === "review"
                ? "border-hint-300 bg-hint-50 focus:border-hint-400 focus:ring-hint-100"
                : stepStatus === "success"
                  ? "border-ink-300 bg-ink-50 focus:border-ink-500 focus:ring-ink-100"
                  : "border-sand-300 bg-white focus:border-ink-600 focus:ring-ink-100"
            }`}
          />

          {stepStatus === "review" && (
            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-hint-200 bg-hint-50 p-4" role="status">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-hint-800">
                <ZoneIcon name="brain" className="size-5" />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-hint-900">Pista del tutor</p>
                <p className="mt-1 text-sm leading-relaxed text-hint-950">
                  {stepHint ||
                    "Revisa bien el texto, ¿seguro que el tiempo está en horas y no en minutos? Nombra también la variable que representa la velocidad."}
                </p>
              </div>
            </div>
          )}

          {stepStatus === "success" && (
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-ink-200 bg-ink-50 p-4 text-sm font-semibold text-ink-950" role="status">
              <ZoneIcon name="check" className="size-5 shrink-0" />
              Buen análisis. Identificaste las variables y sus unidades; ya puedes avanzar.
            </div>
          )}

          <button
            type="button"
            disabled={!stepInput.trim()}
            onClick={() => {
              if (stepStatus === "success") {
                setSchoolStep((current) => Math.min(current + 1, 3));
                setStepInput("");
                setStepStatus("idle");
              } else {
                validateStep();
              }
            }}
            className="mt-6 min-h-14 w-full rounded-2xl bg-ink-600 px-6 text-sm font-bold text-white shadow-lg shadow-ink-600/20 hover:bg-ink-500 focus:outline-none focus:ring-4 focus:ring-ink-200 disabled:cursor-not-allowed disabled:bg-sand-300 disabled:shadow-none"
          >
            {stepStatus === "success" ? "Continuar al siguiente paso" : "Validar paso"}
          </button>
        </section>

        <p className="mt-5 flex items-center justify-center gap-2 text-center text-xs text-sand-500">
          <ZoneIcon name="shield" className="size-4 text-ink-700" />
          La retroalimentación orienta tu proceso sin revelar el resultado final.
        </p>
      </main>
    </div>
  );
}
