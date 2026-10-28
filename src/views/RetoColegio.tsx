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

export default function RetoColegio({ header }: { header: (titulo: string) => ReactNode }) {
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

  const marcarResuelto = () => {
    if (!sesion || !reto) return;
    setResueltos((actuales) => ({ ...actuales, [reto.id]: true }));
    estudiante.registrarIntento(sesion, { ejercicioId: reto.id, logroResolver: true });
  };

  const siguienteReto = () => {
    setIndice((actual) => Math.min(actual + 1, total - 1));
    setPistas([]);
    setSinPistas(false);
    setBloqueo(null);
    setMensajes([]);
    setEntrada("");
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
      <div className="min-h-screen bg-sand-50 text-sand-950">
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
      <div className="min-h-screen bg-sand-50 text-sand-950">
        {header("Reto del colegio")}
        <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <section className="border border-sand-200 bg-white p-6 text-center shadow-sm sm:p-10">
            <span className="mx-auto grid size-12 place-items-center rounded-full bg-hint-100 text-hint-900">
              <ZoneIcon name="target" className="size-6" />
            </span>
            <h1 className="mt-5 text-lg font-semibold text-sand-950">{aviso.titulo}</h1>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-sand-600">{aviso.texto}</p>
          </section>
        </main>
      </div>
    );
  }

  const progreso = Math.round(((indice + (resuelto ? 1 : 0)) / total) * 100);

  return (
    <div className="min-h-screen bg-sand-50 text-sand-950">
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
                Reto del colegio{reto.curso ? ` · ${reto.curso}` : ""}
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
                <li key={i} className="rounded-2xl border border-hint-200 bg-hint-50 p-4 text-sm leading-relaxed text-hint-950">
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
                <div key={m.id} className={`flex ${m.role === "student" ? "justify-end" : "justify-start"}`}>
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
                <p className="text-xs font-medium text-sand-500" role="status">
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

        {resuelto ? (
          <div className="mt-4 space-y-3">
            <p className="flex items-center gap-3 rounded-2xl border border-ink-200 bg-ink-50 p-4 text-sm font-semibold text-ink-950" role="status">
              <ZoneIcon name="check" className="size-5 shrink-0" />
              ¡Bien hecho! Registramos que resolviste este reto.
            </p>
            {indice < total - 1 && (
              <button
                type="button"
                onClick={siguienteReto}
                className="min-h-14 w-full rounded-2xl bg-ink-600 px-6 text-sm font-bold text-white shadow-lg shadow-ink-600/20 transition-colors duration-150 hover:bg-ink-500 focus:outline-none focus:ring-4 focus:ring-ink-200"
              >
                Ir al siguiente reto
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={marcarResuelto}
            className="mt-4 min-h-14 w-full rounded-2xl bg-ink-600 px-6 text-sm font-bold text-white shadow-lg shadow-ink-600/20 transition-colors duration-150 hover:bg-ink-500 focus:outline-none focus:ring-4 focus:ring-ink-200"
          >
            Ya lo resolví
          </button>
        )}

        <p className="mt-5 flex items-center justify-center gap-2 text-center text-xs text-sand-500">
          <ZoneIcon name="shield" className="size-4 text-ink-700" />
          Estudias de forma anónima. El tutor orienta tu proceso sin revelar el resultado final.
        </p>
      </main>
    </div>
  );
}
