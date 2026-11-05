import { FormEvent, useState } from "react";
import { socraticTutorAI } from "./services/aiService";
import { estudianteSocraticoController } from "./services/dbService";
import { verificarRespuestaLocal } from "./services/respuestas";
import ZoneIcon from "./components/ZoneIcon";
import RetoColegio from "./views/RetoColegio";
import { PREGUNTAS_SIMULADOR } from "./models/seedData";
import { CATEGORIAS_PRACTICA, type CategoriaPractica } from "./models/practicaLibre";
import type { SesionEstudiante } from "./models/types";

type Message = {
  id: number;
  role: "student" | "tutor";
  text: string;
};

const quickPrompts = [
  "No entiendo el enunciado, ¿cómo empiezo?",
  "¿Qué datos son importantes aquí?",
  "Dame una pista del primer paso",
  "Revisa mi procedimiento",
];

function StudentHeader({
  onBack,
  onExit,
  title,
}: {
  onBack?: () => void;
  onExit?: () => void;
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
            <span className="hidden sm:inline">Inicio</span>
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
        {onExit ? (
          <button
            type="button"
            onClick={onExit}
            className="flex min-h-11 items-center gap-2 rounded-xl border border-sand-300 px-3 text-sm font-semibold text-sand-700 hover:bg-sand-100 focus:outline-none focus:ring-4 focus:ring-ink-100"
          >
            Salir del aula
          </button>
        ) : (
          <span className="flex items-center gap-1.5 rounded-full bg-ink-50 px-3 py-1.5 text-xs font-bold text-ink-900">
            <ZoneIcon name="shield" className="size-4" />
            Anónimo
          </span>
        )}
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
  const [sesion, setSesion] = useState<SesionEstudiante | null>(() => estudianteSocraticoController.getSesionActual());
  const retosAsignados = sesion?.ejercicios.length ?? 0;
  const [newPin, setNewPin] = useState("");
  const [pinNotice, setPinNotice] = useState<{ tono: "ok" | "aviso"; texto: string } | null>(null);
  const [vinculando, setVinculando] = useState(false);
  const [categoria, setCategoria] = useState<CategoriaPractica>(CATEGORIAS_PRACTICA[0]);

  const salir = () => {
    estudianteSocraticoController.salirDelAula();
    onExit();
  };

  const vincularPin = async (event: FormEvent) => {
    event.preventDefault();
    const limpio = newPin.replace(/\s+/g, "").toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(limpio)) {
      setPinNotice({ tono: "aviso", texto: "El PIN tiene 6 letras o números." });
      return;
    }
    setVinculando(true);
    const resultado = await estudianteSocraticoController.ingresarConPin(limpio);
    setVinculando(false);
    if (!("sesion" in resultado)) {
      setPinNotice({
        tono: "aviso",
        texto: resultado.estado === "aula_llena" ? "Esa clase ya está completa. Avísale a tu docente." : "No encontramos una clase con ese PIN.",
      });
      return;
    }
    try {
      localStorage.setItem("ecdulearm_active_pin", limpio);
    } catch {
      // El PIN igual queda en la sesión actual.
    }
    setSesion(resultado.sesion);
    setNewPin("");
    setPinNotice({ tono: "ok", texto: `Listo, entraste a «${resultado.sesion.titulo}».` });
  };

  const abrirPractica = (elegida: CategoriaPractica) => {
    setCategoria(elegida);
    setView("free");
  };

  if (view === "dashboard") {
    return (
      <div className="ui-view min-h-screen bg-sand-50 text-sand-950">
        <StudentHeader onExit={salir} />
        <main className="mx-auto max-w-6xl px-4 py-7 sm:px-6 sm:py-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold text-ink-800">{sesion?.alias ?? "Estudiante anónimo"}</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-sand-950 sm:text-4xl">
                ¡Hola! ¿Qué vamos a entrenar hoy?
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-sand-600">
                Continúa el reto de tu clase o elige un tema para practicar a tu ritmo.
              </p>
            </div>
            <form className="w-full sm:max-w-xs" onSubmit={vincularPin} noValidate>
              <label htmlFor="new-class-pin" className="text-xs font-bold text-sand-600">
                ¿Tu docente te dio otro PIN?
              </label>
              <div className="mt-2 flex items-center gap-2 rounded-xl border border-sand-300 bg-white p-1.5 focus-within:border-ink-700 focus-within:ring-4 focus-within:ring-ink-100">
                <ZoneIcon name="key" className="ml-2 size-4 text-ink-800" />
                <input
                  id="new-class-pin"
                  value={newPin}
                  onChange={(event) => {
                    setNewPin(event.target.value.toUpperCase());
                    setPinNotice(null);
                  }}
                  maxLength={7}
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  placeholder="ABC123"
                  className="min-h-11 min-w-0 flex-1 bg-transparent font-mono text-sm font-semibold tracking-widest outline-none placeholder:font-normal placeholder:text-sand-400"
                />
                <button
                  type="submit"
                  disabled={vinculando}
                  className="min-h-11 rounded-lg bg-ink-800 px-3 text-sm font-bold text-white hover:bg-ink-900 disabled:opacity-60"
                >
                  {vinculando ? "Buscando…" : "Entrar"}
                </button>
              </div>
              <p
                className={`mt-2 min-h-4 text-xs font-medium ${pinNotice?.tono === "aviso" ? "text-hint-800" : "text-ink-700"}`}
                aria-live="polite"
              >
                {pinNotice?.texto}
              </p>
            </form>
          </div>

          <section className="mt-10">
            <p className="text-xs font-bold uppercase tracking-widest text-ink-800">Tu clase</p>
            <h2 className="mt-1 text-xl font-semibold text-sand-950">Retos de tu docente</h2>

            <div className="ui-stagger mt-5 grid gap-4 md:grid-cols-2">
              <article className="ui-lift rounded-2xl border border-sand-300 bg-white p-6 shadow-md shadow-sand-900/5">
                <div className="flex items-start justify-between gap-4">
                  <span className="grid size-11 place-items-center rounded-full bg-ink-100 text-ink-900">
                    <ZoneIcon name="target" className="size-5" />
                  </span>
                  {retosAsignados > 0 && (
                    <span className="rounded-full bg-hint-100 px-2.5 py-1 text-xs font-bold text-hint-900">En curso</span>
                  )}
                </div>
                <p className="mt-7 text-xs font-bold uppercase tracking-widest text-ink-800">
                  {sesion?.ejercicios[0]?.curso || "Tu clase"}
                </p>
                <h3 className="mt-2 text-xl font-semibold text-sand-950">{sesion?.titulo || "Reto de la clase"}</h3>
                <p className="mt-6 text-xs font-semibold text-sand-600">
                  {retosAsignados === 1 ? "1 reto asignado" : retosAsignados > 1 ? `${retosAsignados} retos asignados` : "Tu docente aún no publica retos"}
                </p>
                <button
                  type="button"
                  onClick={() => setView("school")}
                  className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-ink-800 px-5 text-sm font-bold text-white hover:bg-ink-900 focus:outline-none focus:ring-4 focus:ring-ink-200"
                >
                  Continuar reto
                  <ZoneIcon name="chevron" className="size-4" />
                </button>
              </article>

              <article className="ui-lift rounded-2xl border border-sand-300 bg-white p-6">
                <span className="grid size-11 place-items-center rounded-xl bg-hint-100 text-hint-900">
                  <ZoneIcon name="graduation" className="size-5" />
                </span>
                <p className="mt-7 text-xs font-bold uppercase tracking-widest text-sand-500">Preparación universitaria</p>
                <h3 className="mt-2 text-xl font-semibold text-sand-950">Simulador de admisión</h3>
                <p className="mt-3 text-sm text-sand-500">
                  {PREGUNTAS_SIMULADOR.length} preguntas · {Math.round((PREGUNTAS_SIMULADOR.length * 90) / 60)} minutos
                </p>
                <button
                  type="button"
                  onClick={onSimulator}
                  className="mt-6 min-h-12 w-full rounded-xl border border-sand-300 px-5 text-sm font-bold text-sand-700 hover:bg-sand-50"
                >
                  Empezar simulador
                </button>
              </article>
            </div>
          </section>

          <section className="mt-10">
            <p className="text-xs font-bold uppercase tracking-widest text-hint-800">A tu ritmo</p>
            <h2 className="mt-1 text-xl font-semibold text-sand-950">Práctica libre</h2>
            <div className="ui-stagger mt-5 grid gap-3 sm:grid-cols-3 sm:gap-4">
              {CATEGORIAS_PRACTICA.map((cat) => (
                <article key={cat.id} className="ui-lift flex min-h-44 flex-col rounded-2xl border border-sand-200 bg-white p-4 sm:p-5">
                  <span className="grid size-11 place-items-center rounded-xl bg-ink-100 text-ink-900">
                    <ZoneIcon name={cat.icono} className="size-5" />
                  </span>
                  <h3 className="mt-5 text-base font-semibold leading-tight text-sand-950">{cat.nombre}</h3>
                  <p className="mt-2 text-xs text-sand-500">{cat.retos.length} microretos</p>
                  <button
                    type="button"
                    onClick={() => abrirPractica(cat)}
                    className="mt-auto flex min-h-11 items-center justify-between rounded-xl bg-sand-100 px-3 text-sm font-bold text-sand-700 hover:bg-ink-50 hover:text-ink-900 focus:outline-none focus:ring-4 focus:ring-ink-100"
                  >
                    Entrenar
                    <ZoneIcon name="chevron" className="size-4" />
                  </button>
                </article>
              ))}
            </div>
          </section>

          <p className="mt-10 flex items-center justify-center gap-2 text-center text-xs leading-relaxed text-ink-900">
            <ZoneIcon name="shield" className="size-4 shrink-0 text-ink-800" />
            Estudias de forma anónima. El tutor te da pistas y nunca la respuesta final.
          </p>
        </main>
      </div>
    );
  }

  // Con un PIN de grado la práctica usa ejercicios reales del colegio y su telemetría llega al docente
  const practicaReal = sesion && !sesion.isOffline && sesion.modo === "PRACTICA_LIBRE" && retosAsignados > 0;

  if (view === "free" && practicaReal) {
    return <RetoColegio header={(titulo) => <StudentHeader onBack={() => setView("dashboard")} title={titulo} />} onTerminar={() => setView("dashboard")} />;
  }

  if (view === "free") {
    return <PracticaLibre categoria={categoria} onBack={() => setView("dashboard")} />;
  }

  return <RetoColegio header={(titulo) => <StudentHeader onBack={() => setView("dashboard")} title={titulo} />} onTerminar={() => setView("dashboard")} />;
}

function PracticaLibre({ categoria, onBack }: { categoria: CategoriaPractica; onBack: () => void }) {
  const [indice, setIndice] = useState(0);
  const reto = categoria.retos[indice];
  const [apoyoOpen, setApoyoOpen] = useState(false);
  const [pistasVistas, setPistasVistas] = useState(0);
  const [respuesta, setRespuesta] = useState("");
  const [resultado, setResultado] = useState<"correcta" | "incorrecta" | null>(null);
  const [intentos, setIntentos] = useState(0);
  const [chatInput, setChatInput] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const contexto = `${reto.enunciado}\nPregunta: ${reto.pregunta}`;

  const preguntarAlTutor = async (prompt: string) => {
    if (!prompt.trim() || enviando) return;
    const historial = messages.map((m) => ({ role: m.role, text: m.text }));
    setMessages((actuales) => [...actuales, { id: Date.now(), role: "student", text: prompt }]);
    setChatInput("");
    setEnviando(true);
    const res = await socraticTutorAI(prompt, historial, contexto);
    setMessages((actuales) => [...actuales, { id: Date.now() + 1, role: "tutor", text: res.data }]);
    setEnviando(false);
  };

  const comprobar = (event: FormEvent) => {
    event.preventDefault();
    if (!respuesta.trim()) return;
    setIntentos((n) => n + 1);
    setResultado(verificarRespuestaLocal(respuesta, reto.respuesta, reto.enunciado) ? "correcta" : "incorrecta");
  };

  const siguiente = () => {
    setIndice((i) => (i + 1) % categoria.retos.length);
    setApoyoOpen(false);
    setPistasVistas(0);
    setRespuesta("");
    setResultado(null);
    setIntentos(0);
    setMessages([]);
  };

  return (
    <div className="ui-view min-h-screen bg-sand-50 text-sand-950">
      <StudentHeader onBack={onBack} title={`Práctica libre · ${categoria.nombre}`} />
      <main className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-5 pb-10 sm:px-6">
        <p className="flex items-start gap-2 rounded-xl border border-hint-200 bg-hint-50 p-3 text-xs leading-relaxed text-hint-900" role="status">
          <ZoneIcon name="shield" className="mt-0.5 size-4 shrink-0" />
          Esto es práctica: lo que respondas aquí no se envía a tu docente.
        </p>

        <section className="rounded-2xl border border-sand-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-ink-800">
                Microreto {indice + 1} de {categoria.retos.length}
              </p>
              <h1 className="mt-0.5 font-semibold text-sand-950">{reto.titulo}</h1>
            </div>
            <span className="rounded-full bg-sand-100 px-3 py-1.5 text-xs font-bold text-sand-600">{reto.nivel}</span>
          </div>
          <p className="mt-6 text-base leading-8 text-sand-700">{reto.enunciado}</p>
          <p className="mt-3 text-base font-semibold leading-7 text-sand-950">{reto.pregunta}</p>

          <div className="mt-5 flex flex-wrap gap-2">
            {reto.apoyo && (
              <button
                type="button"
                onClick={() => setApoyoOpen((abierto) => !abierto)}
                className="flex min-h-11 items-center gap-2 rounded-xl border border-sand-300 px-4 text-sm font-bold text-sand-700 hover:bg-sand-50"
                aria-expanded={apoyoOpen}
              >
                <ZoneIcon name="formula" className="size-5 text-ink-600" />
                Ver apoyo
              </button>
            )}
            <button
              type="button"
              onClick={() => setPistasVistas((n) => Math.min(n + 1, reto.pistas.length))}
              disabled={pistasVistas >= reto.pistas.length || resultado === "correcta"}
              className="flex min-h-11 items-center gap-2 rounded-xl border border-hint-300 px-4 text-sm font-bold text-hint-900 hover:bg-hint-50 disabled:cursor-not-allowed disabled:border-sand-200 disabled:text-sand-400"
            >
              <ZoneIcon name="brain" className="size-5" />
              {pistasVistas >= reto.pistas.length ? "Ya viste todas las pistas" : pistasVistas ? "Otra pista" : "Pedir una pista"}
            </button>
          </div>
          {apoyoOpen && reto.apoyo && (
            <p className="mt-4 border-l-2 border-hint-500 bg-hint-50 p-4 text-sm leading-relaxed text-sand-800">{reto.apoyo}</p>
          )}
          {pistasVistas > 0 && (
            <ol className="mt-4 space-y-2" aria-live="polite">
              {reto.pistas.slice(0, pistasVistas).map((pista, i) => (
                <li key={pista} className="ui-enter rounded-2xl border border-hint-200 bg-hint-50 p-4 text-sm leading-relaxed text-hint-950">
                  <span className="block text-xs font-bold uppercase tracking-wide text-hint-800">Pista {i + 1}</span>
                  {pista}
                </li>
              ))}
            </ol>
          )}
        </section>

        <form onSubmit={comprobar} className="rounded-2xl border border-sand-200 bg-white p-5 shadow-sm sm:p-7">
          <label htmlFor="practica-respuesta" className="font-semibold text-sand-950">
            Tu respuesta final
          </label>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              id="practica-respuesta"
              value={respuesta}
              onChange={(event) => {
                setRespuesta(event.target.value);
                if (resultado === "incorrecta") setResultado(null);
              }}
              disabled={resultado === "correcta"}
              inputMode="decimal"
              autoComplete="off"
              placeholder="Ej. 12 o 12,5 m"
              className="min-h-12 flex-1 rounded-xl border border-sand-300 px-4 text-base outline-none focus:border-ink-700 focus:ring-4 focus:ring-ink-100 disabled:bg-sand-100"
            />
            <button
              type="submit"
              disabled={!respuesta.trim() || resultado === "correcta"}
              className="min-h-12 rounded-xl bg-ink-600 px-6 text-sm font-bold text-white hover:bg-ink-500 disabled:bg-sand-300"
            >
              Comprobar
            </button>
          </div>
          <div aria-live="polite">
            {resultado === "correcta" && (
              <div className="ui-pop mt-4 rounded-2xl border border-ink-200 bg-ink-50 p-4 text-sm text-ink-950">
                <p className="flex items-center gap-2 font-semibold">
                  <ZoneIcon name="check" className="size-5" />
                  ¡Correcto! Llegaste al resultado.
                </p>
                <p className="mt-1 text-ink-900">Antes de seguir, piensa: ¿podrías explicarle a un compañero por qué funciona tu procedimiento?</p>
                <button
                  type="button"
                  onClick={siguiente}
                  className="mt-3 min-h-11 rounded-xl bg-ink-800 px-4 text-sm font-bold text-white hover:bg-ink-900"
                >
                  Siguiente microreto
                </button>
              </div>
            )}
            {resultado === "incorrecta" && (
              <p className="mt-4 rounded-2xl border border-hint-200 bg-hint-50 p-4 text-sm leading-relaxed text-hint-900">
                Todavía no coincide. Revisa las unidades y el último cálculo.
                {intentos >= 2 && pistasVistas < reto.pistas.length ? " Una pista puede ayudarte a ver el paso que falta." : ""}
              </p>
            )}
          </div>
        </form>

        <section className="flex flex-col overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-sm" aria-labelledby="tutor-practica">
          <div className="flex items-center gap-3 border-b border-sand-200 px-5 py-4">
            <span className="grid size-10 place-items-center rounded-xl bg-ink-100 text-ink-900">
              <ZoneIcon name="sparkles" className="size-5" />
            </span>
            <div>
              <h2 id="tutor-practica" className="font-semibold text-sand-950">
                Tutor Socrático
              </h2>
              <p className="text-xs text-sand-500">Te guía con preguntas, sin darte la respuesta</p>
            </div>
          </div>
          {messages.length > 0 && (
            <div className="max-h-72 space-y-3 overflow-y-auto bg-sand-50 p-4 sm:p-5" aria-live="polite">
              {messages.map((message) => (
                <div key={message.id} className={`ui-msg flex ${message.role === "student" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      message.role === "student" ? "rounded-br-md bg-ink-800 text-white" : "rounded-tl-md border border-sand-200 bg-white text-sand-700"
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              ))}
              {enviando && (
                <p className="text-xs font-medium text-sand-500" role="status">
                  El tutor está pensando…
                </p>
              )}
            </div>
          )}
          <div className="border-t border-sand-200 p-4">
            <div className="flex gap-2 overflow-x-auto pb-3">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  disabled={enviando}
                  onClick={() => preguntarAlTutor(prompt)}
                  className="min-h-11 shrink-0 rounded-full border border-sand-300 bg-white px-4 text-sm font-semibold text-sand-700 hover:border-ink-400 hover:bg-ink-50 disabled:opacity-60"
                >
                  {prompt}
                </button>
              ))}
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                preguntarAlTutor(chatInput.trim());
              }}
            >
              <div className="flex items-end gap-2 rounded-2xl border border-sand-300 p-2 focus-within:border-ink-600 focus-within:ring-4 focus-within:ring-ink-100">
                <label htmlFor="free-practice-input" className="sr-only">
                  Escribe tu procedimiento o una duda
                </label>
                <textarea
                  id="free-practice-input"
                  rows={1}
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                  placeholder="Escribe tu procedimiento o una duda…"
                  className="min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-sand-400"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || enviando}
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
