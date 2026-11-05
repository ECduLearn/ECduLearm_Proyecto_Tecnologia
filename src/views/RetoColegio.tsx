import { FormEvent, ReactNode, useEffect, useState } from "react";
import ZoneIcon from "@/components/ZoneIcon";
import { socraticTutorAI } from "@/services/aiService";
import { estudianteSocraticoController as estudiante } from "@/services/dbService";
import type { PasoBloqueo, RetoEstudiante, SesionEstudiante } from "@/models/types";

type Estado = "loading" | "ready" | "empty" | "no_encontrada" | "aula_llena";

const AVISOS_SIN_RETO: Record<"empty" | "no_encontrada" | "aula_llena", { titulo: string; texto: string }> = {
  empty: {
    titulo: "Tu docente aún no ha publicado retos",
    texto: "Cuando asigne un ejercicio a esta clase aparecerá aquí. Mientras tanto puedes entrenar en Práctica libre.",
  },
  no_encontrada: {
    titulo: "No encontramos tu clase",
    texto: "El PIN no existe o la clase ya terminó. Pídele el PIN de nuevo a tu docente.",
  },
  aula_llena: {
    titulo: "Esta clase ya está completa",
    texto: "Llegó al máximo de estudiantes. Avísale a tu docente para que te ayude a entrar.",
  },
};

type Mensaje = { id: number; role: "student" | "tutor"; text: string };

const PASOS: { id: PasoBloqueo; label: string; prompt: string }[] = [
  { id: "COMPRENSION_LECTORA", label: "Entender el enunciado", prompt: "No entiendo bien qué me pide el enunciado." },
  { id: "IDENTIFICACION_VARIABLES", label: "Identificar los datos", prompt: "No sé cuáles datos son importantes." },
  { id: "PLANTEAMIENTO_ECUACION", label: "Plantear la ecuación", prompt: "No sé cómo plantear la relación o la ecuación." },
  { id: "CALCULO", label: "Hacer los cálculos", prompt: "Me trabé haciendo los cálculos." },
  { id: "INTERPRETACION_RESULTADO", label: "Interpretar el resultado", prompt: "No sé si mi resultado tiene sentido." },
];

const PATRONES_COPIA = [
  "dame la respuesta",
  "dime la respuesta",
  "dime la solucion",
  "dime la solución",
  "resuelvelo",
  "resuélvelo",
  "cual es el resultado",
  "cuál es el resultado",
  "cuanto da",
  "cuánto da",
];

function esIntentoDeCopia(texto: string): boolean {
  const normal = texto.toLowerCase();
  return PATRONES_COPIA.some((patron) => normal.includes(patron));
}

function pinActivo(): string {
  try {
    return localStorage.getItem("ecdulearm_active_pin") || "PISA26";
  } catch {
    return "PISA26";
  }
}

export default function RetoColegio({ header, onTerminar }: { header: (titulo: string) => ReactNode; onTerminar: () => void }) {
  const [estado, setEstado] = useState<Estado>("loading");
  const [sesion, setSesion] = useState<SesionEstudiante | null>(null);
  const [indice, setIndice] = useState(0);
  const [pistas, setPistas] = useState<string[]>([]);
  const [sinPistas, setSinPistas] = useState(false);
  const [pidiendoPista, setPidiendoPista] = useState(false);
  const [bloqueo, setBloqueo] = useState<PasoBloqueo | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [entrada, setEntrada] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [resueltos, setResueltos] = useState<Record<string, boolean>>({});
  const [respuesta, setRespuesta] = useState("");
  const [opcion, setOpcion] = useState<number | null>(null);
  const [verificando, setVerificando] = useState(false);
  const [feedback, setFeedback] = useState<"correcta" | "incorrecta" | "registrada" | null>(null);
  const [fallos, setFallos] = useState(0);

  useEffect(() => {
    let activo = true;
    (async () => {
      const pin = pinActivo();
      let actual = estudiante.getSesionActual();
      // Reintenta la sesión real si la guardada es local o de otro PIN
      if (!actual || actual.isOffline || actual.pin !== pin) {
        const resultado = await estudiante.ingresarConPin(pin);
        if (!activo) return;
        if (!("sesion" in resultado)) {
          setEstado(resultado.estado);
          return;
        }
        actual = resultado.sesion;
      }
      if (!activo) return;
      setSesion(actual);
      setEstado(actual.ejercicios.length ? "ready" : "empty");
    })();
    return () => {
      activo = false;
    };
  }, []);

  const reto: RetoEstudiante | undefined = sesion?.ejercicios[indice];
  const total = sesion?.ejercicios.length ?? 0;
  const resuelto = reto ? Boolean(resueltos[reto.id]) : false;

  const contextoTutor = reto ? `${reto.enunciado}\nPregunta: ${reto.pregunta}` : "";

  const enviarAlTutor = async (texto: string, tipo: "TEXTO_LIBRE" | "CHIP_RAPIDO") => {
    if (!sesion || !reto || !texto.trim()) return;
    const historial = mensajes.map((m) => ({ role: m.role, text: m.text }));
    setMensajes((actuales) => [...actuales, { id: Date.now(), role: "student", text: texto }]);
    setEnviando(true);

    estudiante.registrarMensaje(sesion, {
      ejercicioId: reto.id,
      remitente: "ESTUDIANTE",
      tipo: esIntentoDeCopia(texto) ? "INTENTO_COPIA_BLOQUEADO" : tipo,
      contenido: texto,
    });

    const respuesta = await socraticTutorAI(texto, historial, contextoTutor);
    setMensajes((actuales) => [...actuales, { id: Date.now() + 1, role: "tutor", text: respuesta.data }]);
    setEnviando(false);
    estudiante.registrarMensaje(sesion, { ejercicioId: reto.id, remitente: "TUTOR_IA", contenido: respuesta.data });
  };

  const pedirPista = async () => {
    if (!sesion || !reto) return;
    setPidiendoPista(true);
    const remota = await estudiante.solicitarPista(sesion, reto.id);

    if (remota) {
      if (remota.pista) setPistas((actuales) => [...actuales, remota.pista as string]);
      setSinPistas(remota.restantes <= 0);
    } else if (reto.pistasLocales) {
      const siguiente = reto.pistasLocales[pistas.length];
      if (siguiente) setPistas((actuales) => [...actuales, siguiente]);
      setSinPistas(pistas.length + 1 >= reto.pistasLocales.length);
    } else {
      // Sin pistas guardadas disponibles: el tutor da una orientación general
      const respuesta = await socraticTutorAI("Dame una pista corta para el siguiente paso.", [], contextoTutor);
      setPistas((actuales) => [...actuales, respuesta.data]);
    }
    setPidiendoPista(false);
  };

  const marcarBloqueo = (paso: (typeof PASOS)[number]) => {
    if (!sesion || !reto) return;
    setBloqueo(paso.id);
    estudiante.registrarIntento(sesion, { ejercicioId: reto.id, pasoBloqueo: paso.id });
    enviarAlTutor(paso.prompt, "CHIP_RAPIDO");
  };

  const marcarResuelto = (comoQueda: "correcta" | "registrada") => {
    if (!reto) return;
    setResueltos((actuales) => ({ ...actuales, [reto.id]: true }));
    setFeedback(comoQueda);
  };

  const comprobar = async (event: FormEvent) => {
    event.preventDefault();
    if (!sesion || !reto || verificando) return;

    if (reto.opciones) {
      if (opcion === null) return;
      setVerificando(true);
      const res = await estudiante.registrarIntento(sesion, { ejercicioId: reto.id, opcionSeleccionada: opcion });
      setVerificando(false);
      if (!res) return marcarResuelto("registrada");
      if (res.logro_resolver) return marcarResuelto("correcta");
      setFallos((n) => n + 1);
      setFeedback("incorrecta");
      return;
    }

    if (!respuesta.trim()) return;
    setVerificando(true);
    const res = await estudiante.verificarRespuesta(sesion, reto, respuesta);
    setVerificando(false);
    if (!res.verificable) {
      // Sin un resultado numérico con qué comparar: se registra que terminó el reto
      estudiante.registrarIntento(sesion, { ejercicioId: reto.id, logroResolver: true });
      return marcarResuelto("registrada");
    }
    if (res.correcta) return marcarResuelto("correcta");
    setFallos((n) => n + 1);
    setFeedback("incorrecta");
  };

  const siguienteReto = () => {
    setIndice((actual) => Math.min(actual + 1, total - 1));
    setPistas([]);
    setSinPistas(false);
    setBloqueo(null);
    setMensajes([]);
    setEntrada("");
    setRespuesta("");
    setOpcion(null);
    setFeedback(null);
    setFallos(0);
  };

  const enviarEntrada = (event: FormEvent) => {
    event.preventDefault();
    const texto = entrada.trim();
    if (!texto || enviando) return;
    setEntrada("");
    enviarAlTutor(texto, "TEXTO_LIBRE");
  };

  if (estado === "loading") {
    return (
      <div className="ui-view min-h-screen bg-sand-50 text-sand-950">
        {header("Reto del colegio")}
        <main className="mx-auto max-w-4xl px-4 py-5 sm:px-6 sm:py-8" aria-busy="true">
          <p className="sr-only" role="status">
            Cargando el reto de tu clase…
          </p>
          <div className="space-y-4">
            <div className="h-56 animate-pulse rounded-sm bg-sand-200/70" />
            <div className="h-32 animate-pulse rounded-sm bg-sand-200/70" />
          </div>
        </main>
      </div>
    );
  }

  if (estado !== "ready" || !reto || !sesion) {
    const aviso = AVISOS_SIN_RETO[estado === "ready" ? "empty" : estado];
    return (
      <div className="ui-view min-h-screen bg-sand-50 text-sand-950">
        {header("Reto del colegio")}
        <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <section className="border border-sand-200 bg-white p-6 text-center shadow-sm sm:p-10">
            <span className="mx-auto grid size-12 place-items-center rounded-full bg-hint-100 text-hint-900">
              <ZoneIcon name="target" className="size-6" />
            </span>
            <h1 className="mt-5 text-lg font-semibold text-sand-950">{aviso.titulo}</h1>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-sand-600">{aviso.texto}</p>
            <button
              type="button"
              onClick={onTerminar}
              className="mt-6 min-h-11 rounded-xl border border-sand-300 px-5 text-sm font-semibold text-sand-800 hover:bg-sand-100"
            >
              Volver al inicio
            </button>
          </section>
        </main>
      </div>
    );
  }

  const progreso = Math.round(((indice + (resuelto ? 1 : 0)) / total) * 100);

  return (
    <div className="ui-view min-h-screen bg-sand-50 text-sand-950">
      {header(sesion.titulo)}
      <main className="mx-auto max-w-4xl px-4 py-5 pb-10 sm:px-6 sm:py-8">
        {sesion.isOffline && (
          <p className="mb-4 flex items-start gap-2 border border-hint-200 bg-hint-50 p-3 text-xs leading-relaxed text-hint-900" role="status">
            <ZoneIcon name="shield" className="mt-0.5 size-4 shrink-0" />
            Estás en modo práctica: tu avance se queda en este dispositivo y no llega a tu docente.
          </p>
        )}

        <section className="border border-sand-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-widest text-ink-800">
                {sesion.modo === "PRACTICA_LIBRE" ? "Práctica libre" : "Reto del colegio"}
                {reto.curso ? ` · ${reto.curso}` : ""}
              </p>
              <h1 className="mt-1 text-lg font-semibold text-sand-950">{reto.tema}</h1>
            </div>
            <span className="shrink-0 text-sm font-bold text-ink-900">
              {indice + 1} de {total}
            </span>
          </div>
          <div
            className="mt-4 h-2 overflow-hidden rounded-full bg-sand-200"
            role="progressbar"
            aria-label="Avance en los retos"
            aria-valuenow={progreso}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="h-full rounded-full bg-hint-500 transition-[width] duration-300" style={{ width: `${progreso}%` }} />
          </div>

          <div className="mt-8 border-l-2 border-hint-500 bg-sand-50 p-5 sm:p-6">
            {reto.contexto && (
              <p className="text-xs font-bold uppercase tracking-widest text-sand-500">{reto.contexto}</p>
            )}
            <p className="mt-3 text-base leading-8 text-sand-700">{reto.enunciado}</p>
            <p className="mt-4 whitespace-pre-line text-base font-semibold leading-7 text-sand-950">{reto.pregunta}</p>
          </div>
        </section>

        <section className="mt-4 border border-sand-200 bg-white p-5 shadow-sm sm:p-7" aria-labelledby="pistas-titulo">
          <div className="flex items-center justify-between gap-3">
            <h2 id="pistas-titulo" className="flex items-center gap-2 font-semibold text-sand-950">
              <ZoneIcon name="brain" className="size-5 text-hint-700" />
              Pistas
            </h2>
            {reto.totalPistas > 0 && (
              <span className="text-xs font-semibold text-sand-500">
                {pistas.length} de {reto.totalPistas}
              </span>
            )}
          </div>

          {pistas.length > 0 && (
            <ol className="mt-4 space-y-2" aria-live="polite">
              {pistas.map((pista, i) => (
                <li key={i} className="ui-enter rounded-2xl border border-hint-200 bg-hint-50 p-4 text-sm leading-relaxed text-hint-950">
                  <span className="block text-xs font-bold uppercase tracking-wide text-hint-800">Pista {i + 1}</span>
                  {pista}
                </li>
              ))}
            </ol>
          )}

          <button
            type="button"
            onClick={pedirPista}
            disabled={pidiendoPista || sinPistas || resuelto}
            className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-hint-300 bg-white px-4 text-sm font-bold text-hint-900 transition-colors duration-150 hover:bg-hint-50 focus:outline-none focus:ring-4 focus:ring-hint-100 disabled:cursor-not-allowed disabled:border-sand-200 disabled:text-sand-400"
          >
            {pidiendoPista ? "Buscando una pista…" : sinPistas ? "Ya usaste todas las pistas" : pistas.length ? "Pedir otra pista" : "Pedir una pista"}
          </button>
        </section>

        <section className="mt-4 border border-sand-200 bg-white p-5 shadow-sm sm:p-7" aria-labelledby="bloqueo-titulo">
          <h2 id="bloqueo-titulo" className="font-semibold text-sand-950">
            ¿En qué parte te trabaste?
          </h2>
          <p className="mt-1 text-xs text-sand-500">Tu docente solo ve en qué paso se traba la clase, nunca quién eres.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {PASOS.map((paso) => (
              <button
                key={paso.id}
                type="button"
                aria-pressed={bloqueo === paso.id}
                disabled={enviando || resuelto}
                onClick={() => marcarBloqueo(paso)}
                className={`min-h-11 rounded-full border px-4 text-sm font-semibold transition-colors duration-150 focus:outline-none focus:ring-4 focus:ring-ink-100 disabled:opacity-60 ${
                  bloqueo === paso.id
                    ? "border-ink-700 bg-ink-800 text-white"
                    : "border-sand-300 bg-white text-sand-700 hover:border-ink-400 hover:bg-ink-50"
                }`}
              >
                {paso.label}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-4 flex flex-col overflow-hidden border border-sand-200 bg-white shadow-sm" aria-labelledby="tutor-titulo">
          <div className="flex items-center justify-between border-b border-sand-200 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-ink-100 text-ink-900">
                <ZoneIcon name="sparkles" className="size-5" />
              </span>
              <div>
                <h2 id="tutor-titulo" className="font-semibold text-sand-950">
                  Tutor Socrático
                </h2>
                <p className="text-xs text-sand-500">Te guía con preguntas, sin darte la respuesta</p>
              </div>
            </div>
          </div>

          {mensajes.length > 0 && (
            <div className="max-h-80 space-y-3 overflow-y-auto bg-sand-50 p-4 sm:p-5" aria-live="polite">
              {mensajes.map((m) => (
                <div key={m.id} className={`ui-msg flex ${m.role === "student" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      m.role === "student"
                        ? "rounded-br-md bg-ink-800 text-white"
                        : "rounded-tl-md border border-sand-200 bg-white text-sand-700"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {enviando && (
                <p className="ui-msg flex items-center gap-2 text-xs font-medium text-sand-500" role="status">
                  <span className="ui-typing flex items-center gap-1" aria-hidden="true">
                    <span className="size-1.5 rounded-full bg-ink-500" />
                    <span className="size-1.5 rounded-full bg-ink-500" />
                    <span className="size-1.5 rounded-full bg-ink-500" />
                  </span>
                  El tutor está pensando en tu procedimiento…
                </p>
              )}
            </div>
          )}

          <form onSubmit={enviarEntrada} className="border-t border-sand-200 p-4">
            <div className="flex items-end gap-2 rounded-2xl border border-sand-300 p-2 focus-within:border-ink-600 focus-within:ring-4 focus-within:ring-ink-100">
              <label htmlFor="reto-entrada" className="sr-only">
                Escribe tu procedimiento o una duda
              </label>
              <textarea
                id="reto-entrada"
                rows={2}
                value={entrada}
                onChange={(event) => setEntrada(event.target.value)}
                placeholder="Escribe tu procedimiento o una duda…"
                className="min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-sand-400"
              />
              <button
                type="submit"
                disabled={!entrada.trim() || enviando}
                className="grid size-11 shrink-0 place-items-center rounded-xl bg-ink-600 text-white transition-colors duration-150 hover:bg-ink-500 disabled:bg-sand-300"
                aria-label="Enviar al tutor"
              >
                <ZoneIcon name="send" className="size-5" />
              </button>
            </div>
          </form>
        </section>

        <form onSubmit={comprobar} className="mt-4 border border-sand-200 bg-white p-5 shadow-sm sm:p-7" aria-labelledby="respuesta-titulo">
          <h2 id="respuesta-titulo" className="font-semibold text-sand-950">
            Tu respuesta final
          </h2>
          {reto.opciones ? (
            <fieldset className="mt-3 space-y-2" disabled={resuelto}>
              <legend className="sr-only">Elige una opción</legend>
              {reto.opciones.map((texto, i) => (
                <label
                  key={i}
                  className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-4 text-sm transition-colors duration-150 ${
                    opcion === i ? "border-ink-700 bg-ink-50 text-ink-950" : "border-sand-300 text-sand-800 hover:bg-sand-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="opcion-reto"
                    checked={opcion === i}
                    onChange={() => {
                      setOpcion(i);
                      if (feedback === "incorrecta") setFeedback(null);
                    }}
                    className="size-4 accent-ink-700"
                  />
                  <span>
                    <span className="font-semibold">{String.fromCharCode(65 + i)}.</span> {texto}
                  </span>
                </label>
              ))}
            </fieldset>
          ) : (
            <>
              <p className="mt-1 text-xs text-sand-500">Escribe el resultado con su unidad, por ejemplo «12 m» o «7,5».</p>
              <input
                value={respuesta}
                onChange={(event) => {
                  setRespuesta(event.target.value);
                  if (feedback === "incorrecta") setFeedback(null);
                }}
                disabled={resuelto}
                inputMode="decimal"
                autoComplete="off"
                maxLength={200}
                aria-label="Tu respuesta final"
                placeholder="Tu resultado"
                className="mt-3 min-h-12 w-full rounded-xl border border-sand-300 px-4 text-base outline-none focus:border-ink-700 focus:ring-4 focus:ring-ink-100 disabled:bg-sand-100"
              />
            </>
          )}

          {!resuelto && (
            <button
              type="submit"
              disabled={verificando || (reto.opciones ? opcion === null : !respuesta.trim())}
              className="mt-4 min-h-14 w-full rounded-2xl bg-ink-600 px-6 text-sm font-bold text-white shadow-lg shadow-ink-600/20 transition-colors duration-150 hover:bg-ink-500 focus:outline-none focus:ring-4 focus:ring-ink-200 disabled:bg-sand-300 disabled:shadow-none"
            >
              {verificando ? "Revisando tu respuesta…" : "Comprobar respuesta"}
            </button>
          )}

          <div aria-live="polite">
            {feedback === "incorrecta" && (
              <p className="ui-enter mt-4 rounded-2xl border border-hint-200 bg-hint-50 p-4 text-sm leading-relaxed text-hint-900">
                Todavía no coincide. Revisa tu último cálculo y las unidades.
                {fallos >= 2 ? " Si te trabaste, marca en qué parte o pide una pista: el tutor te ayuda a encontrar el error." : ""}
              </p>
            )}
            {feedback === "correcta" && (
              <p className="ui-pop mt-4 flex items-start gap-3 rounded-2xl border border-ink-200 bg-ink-50 p-4 text-sm text-ink-950" role="status">
                <ZoneIcon name="check" className="mt-0.5 size-5 shrink-0" />
                <span>
                  <span className="font-semibold">¡Correcto!</span> Llegaste al resultado
                  {pistas.length ? ` con ${pistas.length} ${pistas.length === 1 ? "pista" : "pistas"}` : " sin pistas"}.
                  {sesion.isOffline ? "" : " Tu avance ya le llega a tu docente."}
                </span>
              </p>
            )}
            {feedback === "registrada" && (
              <p className="ui-pop mt-4 flex items-start gap-3 rounded-2xl border border-ink-200 bg-ink-50 p-4 text-sm text-ink-950" role="status">
                <ZoneIcon name="check" className="mt-0.5 size-5 shrink-0" />
                Registramos que terminaste este reto. Su respuesta no se puede comprobar aquí, así que coméntala con tu docente.
              </p>
            )}
          </div>

          {resuelto && (
            <button
              type="button"
              onClick={indice < total - 1 ? siguienteReto : onTerminar}
              className="mt-4 min-h-14 w-full rounded-2xl bg-ink-600 px-6 text-sm font-bold text-white shadow-lg shadow-ink-600/20 transition-colors duration-150 hover:bg-ink-500 focus:outline-none focus:ring-4 focus:ring-ink-200"
            >
              {indice < total - 1 ? "Ir al siguiente reto" : "Terminaste los retos: volver al inicio"}
            </button>
          )}
        </form>

        <p className="mt-5 flex items-center justify-center gap-2 text-center text-xs text-sand-500">
          <ZoneIcon name="shield" className="size-4 text-ink-700" />
          Estudias de forma anónima. El tutor orienta tu proceso sin revelar el resultado final.
        </p>
      </main>
    </div>
  );
}
