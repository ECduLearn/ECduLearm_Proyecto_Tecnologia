import { FormEvent, useState } from "react";
import { socraticTutorAI } from "./services/aiService";
import { estudianteSocraticoController } from "./services/dbService";
import ZoneIcon from "./components/ZoneIcon";
import RetoColegio from "./views/RetoColegio";


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
  "No entiendo el enunciado, ¿cómo empiezo?",
  "¿Qué datos son importantes aquí?",
  "Dame una pista del primer paso",
  "Revisa mi procedimiento",
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
              EC<span className="text-hint-600">du</span>Learn
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
  const sesionGuardada = estudianteSocraticoController.getSesionActual();
  const retosAsignados = sesionGuardada?.ejercicios.length ?? 0;
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

  const socraticReply = (prompt: string) => {
    const normalized = prompt.toLowerCase();
    if (
      normalized.includes("dame la respuesta") ||
      normalized.includes("resuelve") ||
      normalized.includes("resolvelo") ||
      normalized.includes("resuélvelo") ||
      normalized.includes("dime la solucion") ||
      normalized.includes("dime la solución")
    ) {
      return "🛡️ Como Tutor Socrático, mi misión es que tú desarrolles la destreza cognitiva, por lo que nunca te daré el número final servido. Si calculamos primero el punto de partida, ¿qué magnitud u operación crees que debemos aplicar?";
    }
    if (normalized.includes("regla de tres")) {
      return "Antes de elegir una técnica, observa cómo cambia cada magnitud. ¿La relación es directamente proporcional o inversamente proporcional?";
    }
    if (normalized.includes("enunciado") || normalized.includes("empiezo")) {
      return "Reescribe el problema con tus palabras: ¿qué datos exactos te da el texto y qué incógnita te pide calcular?";
    }
    if (normalized.includes("procedimiento") || normalized.includes("revisa")) {
      return "¡Excelente iniciativa! Escribe el paso exacto que calculaste (con sus unidades) y te diré si el razonamiento es sólido o si debemos ajustar una relación.";
    }
    return "Mira la diferencia entre el estado inicial y el final: ¿qué dato se mantiene constante en todo el proceso?";
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
                <p className="mt-7 text-xs font-bold uppercase tracking-widest text-ink-800">
                  {sesionGuardada?.ejercicios[0]?.curso || "Tu clase"}
                </p>
                <h3 className="mt-2 text-xl font-semibold text-sand-950">{sesionGuardada?.titulo || "Reto del colegio"}</h3>
                <p className="mt-6 text-xs font-semibold text-sand-600">
                  {retosAsignados === 1 ? "1 reto asignado" : retosAsignados > 1 ? `${retosAsignados} retos asignados` : "Entra para ver tus retos"}
                </p>
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

  return <RetoColegio header={(titulo) => <StudentHeader onBack={() => setView("dashboard")} title={titulo} />} />;
}
