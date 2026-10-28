import { FormEvent, useEffect, useMemo, useRef, useState } from "react"
import { reviewExamAI } from "@/services/aiService"
import { estudianteSocraticoController as estudiante } from "@/services/dbService"
import { PREGUNTAS_SIMULADOR } from "@/models/seedData"
import type { PreguntaSimulador } from "@/models/types"

type Modo = "examen" | "resultados" | "revision"

const LETRAS = ["A", "B", "C", "D", "E", "F"]

function formatearTiempo(segundos: number) {
  const m = Math.floor(segundos / 60)
  const s = segundos % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

export default function SimuladorAdmision({ onBack }: { onBack: () => void }) {
  // Con un aula real de simulador se usan sus ejercicios y la nota la pone el servidor
  const [sesion] = useState(() => {
    const actual = estudiante.getSesionActual()
    return actual && !actual.isOffline && actual.modo === "SIMULADOR_ADMISION" ? actual : null
  })
  const preguntas = useMemo<PreguntaSimulador[]>(() => {
    const reales = sesion?.ejercicios.filter((e) => e.opciones && e.opciones.length >= 2) ?? []
    if (!reales.length) return PREGUNTAS_SIMULADOR
    return reales.map((e) => ({
      id: e.id,
      area: e.tema,
      enunciado: [e.enunciado, e.pregunta].filter(Boolean).join("\n\n"),
      opciones: e.opciones as string[],
    }))
  }, [sesion])
  const esReal = preguntas !== PREGUNTAS_SIMULADOR
  const duracion = esReal && sesion?.tiempoLimiteMinutos ? sesion.tiempoLimiteMinutos * 60 : preguntas.length * 90

  const [modo, setModo] = useState<Modo>("examen")
  const [actual, setActual] = useState(0)
  const [respuestas, setRespuestas] = useState<Record<number, number>>({})
  const [marcadas, setMarcadas] = useState<Set<number>>(new Set())
  const [logros, setLogros] = useState<Record<number, boolean>>({})
  const [restante, setRestante] = useState(duracion)
  const [confirmar, setConfirmar] = useState(false)
  const [puntajeServidor, setPuntajeServidor] = useState<number | null>(null)
  const terminado = useRef(false)

  const terminar = async () => {
    if (terminado.current) return
    terminado.current = true
    setConfirmar(false)
    setModo("resultados")
    if (sesion && esReal) {
      const cierre = await estudiante.finalizarSesion(sesion)
      if (cierre?.puntaje_simulador != null) setPuntajeServidor(Number(cierre.puntaje_simulador))
    }
  }

  useEffect(() => {
    if (modo !== "examen") return
    const reloj = window.setInterval(() => {
      setRestante((valor) => {
        if (valor <= 1) {
          window.clearInterval(reloj)
          terminar()
          return 0
        }
        return valor - 1
      })
    }, 1000)
    return () => window.clearInterval(reloj)
    // terminar solo cambia de estado una vez (terminado.current)
  }, [modo])

  const elegir = async (indice: number, opcion: number) => {
    setRespuestas((actuales) => ({ ...actuales, [indice]: opcion }))
    if (sesion && esReal) {
      const res = await estudiante.registrarIntento(sesion, {
        ejercicioId: preguntas[indice].id,
        opcionSeleccionada: opcion,
        marcadaConBandera: marcadas.has(indice),
      })
      if (res) setLogros((actuales) => ({ ...actuales, [indice]: Boolean(res.logro_resolver) }))
    }
  }

  const alternarMarca = (indice: number) => {
    setMarcadas((actuales) => {
      const siguiente = new Set(actuales)
      if (siguiente.has(indice)) siguiente.delete(indice)
      else siguiente.add(indice)
      return siguiente
    })
  }

  const esCorrecta = (indice: number): boolean | null => {
    if (respuestas[indice] === undefined) return false
    if (esReal) return indice in logros ? logros[indice] : null
    return respuestas[indice] === preguntas[indice].correcta
  }

  const respondidas = Object.keys(respuestas).length
  const correctas = preguntas.filter((_, i) => esCorrecta(i) === true).length
  const paraRevisar = preguntas.map((_, i) => i).filter((i) => esCorrecta(i) === false)

  if (modo === "examen") {
    const pregunta = preguntas[actual]
    const urgente = restante < 120
    return (
      <div className="ui-view min-h-screen bg-sand-50 text-sand-950">
        <header className="sticky top-0 z-30 border-b border-sand-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex min-h-16 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
            <button type="button" onClick={onBack} className="flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-sand-700 hover:bg-sand-100">
              Salir
            </button>
            <p
              className={`rounded-xl border px-4 py-1.5 font-mono text-lg font-semibold tabular-nums ${urgente ? "border-hint-400 bg-hint-50 text-hint-900" : "border-sand-300 text-sand-900"}`}
              role="timer"
              aria-label={`Tiempo restante ${formatearTiempo(restante)}`}
            >
              {formatearTiempo(restante)}
            </p>
            <button
              type="button"
              onClick={() => setConfirmar(true)}
              className="min-h-11 rounded-xl bg-ink-950 px-4 text-sm font-semibold text-sand-50 hover:bg-ink-800"
            >
              Terminar
            </button>
          </div>
        </header>

        <main className="mx-auto grid max-w-5xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_15rem]">
          <section key={actual} className="ui-enter rounded-2xl border border-sand-200 bg-white p-5 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-medium text-sand-600">
                Pregunta {actual + 1} de {preguntas.length} · {pregunta.area}
              </p>
              <button
                type="button"
                onClick={() => alternarMarca(actual)}
                aria-pressed={marcadas.has(actual)}
                className={`min-h-11 rounded-xl border px-3 text-sm font-semibold ${marcadas.has(actual) ? "border-hint-400 bg-hint-50 text-hint-900" : "border-sand-300 text-sand-700 hover:bg-sand-100"}`}
              >
                {marcadas.has(actual) ? "Marcada para revisar" : "Marcar para revisar"}
              </button>
            </div>
            <h1 className="mt-5 whitespace-pre-line text-lg font-semibold leading-relaxed sm:text-xl">{pregunta.enunciado}</h1>

            <fieldset className="mt-6 space-y-3">
              <legend className="sr-only">Opciones de respuesta</legend>
              {pregunta.opciones.map((opcion, i) => {
                const elegida = respuestas[actual] === i
                return (
                  <label
                    key={opcion}
                    className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3 transition-colors duration-150 ${elegida ? "border-ink-700 bg-ink-50" : "border-sand-200 hover:border-ink-300"}`}
                  >
                    <input
                      type="radio"
                      name={`pregunta-${actual}`}
                      checked={elegida}
                      onChange={() => elegir(actual, i)}
                      className="sr-only"
                    />
                    <span className={`grid size-8 shrink-0 place-items-center rounded-lg text-sm font-bold ${elegida ? "bg-ink-700 text-white" : "bg-sand-100 text-sand-700"}`}>
                      {LETRAS[i]}
                    </span>
                    <span className="text-[0.9375rem] text-sand-900">{opcion}</span>
                  </label>
                )
              })}
            </fieldset>

            <div className="mt-6 flex justify-between gap-3">
              <button
                type="button"
                disabled={actual === 0}
                onClick={() => setActual((v) => v - 1)}
                className="min-h-12 rounded-xl border border-sand-300 px-5 text-sm font-semibold text-sand-700 hover:bg-sand-100 disabled:opacity-40"
              >
                Anterior
              </button>
              {actual < preguntas.length - 1 ? (
                <button type="button" onClick={() => setActual((v) => v + 1)} className="min-h-12 rounded-xl bg-ink-950 px-5 text-sm font-semibold text-sand-50 hover:bg-ink-800">
                  Siguiente
                </button>
              ) : (
                <button type="button" onClick={() => setConfirmar(true)} className="min-h-12 rounded-xl bg-ink-950 px-5 text-sm font-semibold text-sand-50 hover:bg-ink-800">
                  Revisar y terminar
                </button>
              )}
            </div>
          </section>

          <aside className="rounded-2xl border border-sand-200 bg-white p-5">
            <p className="text-sm font-semibold text-sand-800">
              {respondidas} de {preguntas.length} respondidas
            </p>
            <div className="mt-4 grid grid-cols-6 gap-2 lg:grid-cols-4">
              {preguntas.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setActual(i)}
                  aria-label={`Pregunta ${i + 1}${respuestas[i] !== undefined ? ", respondida" : ""}${marcadas.has(i) ? ", marcada" : ""}`}
                  aria-current={i === actual ? "step" : undefined}
                  className={`relative grid size-11 place-items-center rounded-lg text-sm font-semibold ${
                    i === actual
                      ? "bg-ink-950 text-white"
                      : respuestas[i] !== undefined
                        ? "bg-ink-100 text-ink-900"
                        : "border border-sand-300 text-sand-600 hover:bg-sand-100"
                  }`}
                >
                  {i + 1}
                  {marcadas.has(i) && <span className="absolute right-1 top-1 size-1.5 rounded-full bg-hint-500" aria-hidden="true" />}
                </button>
              ))}
            </div>
          </aside>
        </main>

        {confirmar && (
          <div className="ui-view fixed inset-0 z-50 grid place-items-center bg-sand-950/50 p-4 backdrop-blur-sm" onClick={() => setConfirmar(false)}>
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="terminar-titulo"
              onClick={(e) => e.stopPropagation()}
              className="ui-pop w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
            >
              <h2 id="terminar-titulo" className="text-lg font-semibold">
                ¿Terminar el simulador?
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-sand-600">
                Respondiste {respondidas} de {preguntas.length}
                {marcadas.size === 1 ? " y tienes 1 marcada para revisar" : marcadas.size > 1 ? ` y tienes ${marcadas.size} marcadas para revisar` : ""}.
              </p>
              <div className="mt-6 flex gap-3">
                <button type="button" onClick={() => setConfirmar(false)} className="min-h-12 flex-1 rounded-xl border border-sand-300 text-sm font-semibold text-sand-700 hover:bg-sand-100">
                  Seguir
                </button>
                <button type="button" onClick={terminar} className="min-h-12 flex-1 rounded-xl bg-ink-950 text-sm font-semibold text-sand-50 hover:bg-ink-800">
                  Terminar
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    )
  }

  if (modo === "resultados") {
    const tiempoUsado = duracion - restante
    const pendientesDeNota = esReal && respondidas > Object.keys(logros).length
    return (
      <div className="ui-view min-h-screen bg-sand-50 px-4 py-10 text-sand-950">
        <main className="ui-pop mx-auto max-w-2xl rounded-2xl border border-sand-200 bg-white p-6 text-center sm:p-10">
          <p className="text-sm font-medium text-ink-800">Simulador terminado</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            {puntajeServidor != null
              ? `Tu puntaje: ${puntajeServidor} %`
              : `Acertaste ${correctas} de ${preguntas.length}`}
          </h1>
          {pendientesDeNota && <p className="mt-2 text-sm text-sand-600">Algunas respuestas aún se están calificando.</p>}

          <div className="ui-stagger mt-8 grid gap-3 sm:grid-cols-3">
            {[
              [`${respondidas} / ${preguntas.length}`, "respondidas"],
              [String(marcadas.size), "marcadas para revisar"],
              [formatearTiempo(tiempoUsado), "tiempo utilizado"],
            ].map(([valor, etiqueta]) => (
              <div key={etiqueta} className="rounded-xl bg-sand-50 p-4">
                <p className="text-2xl font-semibold tabular-nums text-ink-950">{valor}</p>
                <p className="mt-1 text-xs text-sand-500">{etiqueta}</p>
              </div>
            ))}
          </div>

          {paraRevisar.length > 0 ? (
            <>
              <p className="mt-8 text-sm leading-relaxed text-sand-600">
                Hay {paraRevisar.length} {paraRevisar.length === 1 ? "pregunta" : "preguntas"} para revisar. El tutor te ayuda a encontrar
                dónde estuvo el error, sin darte la respuesta.
              </p>
              <button type="button" onClick={() => setModo("revision")} className="mt-4 min-h-12 w-full rounded-xl bg-ink-950 px-5 font-semibold text-sand-50 hover:bg-ink-800">
                Revisar con el tutor
              </button>
            </>
          ) : (
            <p className="mt-8 text-sm font-medium text-ink-900">¡Respondiste todo bien!</p>
          )}
          <button type="button" onClick={onBack} className="mt-3 min-h-11 px-4 text-sm font-semibold text-sand-600 hover:text-ink-950">
            Volver a la zona de estudio
          </button>
        </main>
      </div>
    )
  }

  return <RevisionSocratica preguntas={preguntas} indices={paraRevisar} respuestas={respuestas} sesionReal={esReal ? sesion : null} onVolver={() => setModo("resultados")} />
}

function RevisionSocratica({
  preguntas,
  indices,
  respuestas,
  sesionReal,
  onVolver,
}: {
  preguntas: PreguntaSimulador[]
  indices: number[]
  respuestas: Record<number, number>
  sesionReal: ReturnType<typeof estudiante.getSesionActual>
  onVolver: () => void
}) {
  const [seleccion, setSeleccion] = useState(indices[0] ?? 0)
  const [mensajes, setMensajes] = useState<{ id: number; rol: "tutor" | "estudiante"; texto: string }[]>([])
  const [entrada, setEntrada] = useState("")
  const [enviando, setEnviando] = useState(false)

  const pregunta = preguntas[seleccion]
  const elegida = respuestas[seleccion]
  const textoElegido = elegida === undefined ? "Sin responder" : `${LETRAS[elegida]}. ${pregunta.opciones[elegida]}`

  useEffect(() => {
    setMensajes([
      {
        id: Date.now(),
        rol: "tutor",
        texto:
          elegida === undefined
            ? `Revisemos la pregunta ${seleccion + 1}, que quedó sin responder. ¿Qué dato del enunciado te parece el más importante?`
            : `Revisemos la pregunta ${seleccion + 1}. Elegiste «${pregunta.opciones[elegida]}». ¿Qué pasos seguiste para llegar ahí?`,
      },
    ])
  }, [seleccion, elegida, pregunta])

  const enviar = async (event: FormEvent) => {
    event.preventDefault()
    const texto = entrada.trim()
    if (!texto || enviando) return
    setEntrada("")
    setMensajes((m) => [...m, { id: Date.now(), rol: "estudiante", texto }])
    setEnviando(true)
    const res = await reviewExamAI(pregunta.area, pregunta.enunciado, textoElegido, texto)
    setMensajes((m) => [...m, { id: Date.now() + 1, rol: "tutor", texto: res.data }])
    setEnviando(false)
    if (sesionReal) {
      estudiante.registrarMensaje(sesionReal, { ejercicioId: pregunta.id, remitente: "ESTUDIANTE", tipo: "REVISION_POST_SIMULADOR", contenido: texto })
      estudiante.registrarMensaje(sesionReal, { ejercicioId: pregunta.id, remitente: "TUTOR_IA", tipo: "REVISION_POST_SIMULADOR", contenido: res.data })
    }
  }

  return (
    <div className="ui-view min-h-screen bg-sand-50 text-sand-950">
      <header className="border-b border-sand-200 bg-white">
        <div className="mx-auto flex min-h-16 max-w-4xl items-center gap-3 px-4 sm:px-6">
          <button type="button" onClick={onVolver} className="min-h-11 rounded-xl px-3 text-sm font-semibold text-sand-700 hover:bg-sand-100">
            Resultados
          </button>
          <p className="font-semibold">Revisión con el tutor</p>
        </div>
      </header>
      <main className="mx-auto max-w-4xl space-y-4 px-4 py-6 sm:px-6">
        {indices.length > 1 && (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Preguntas para revisar">
            {indices.map((i) => (
              <button
                key={i}
                type="button"
                aria-pressed={i === seleccion}
                onClick={() => setSeleccion(i)}
                className={`min-h-11 rounded-full border px-4 text-sm font-semibold ${i === seleccion ? "border-ink-700 bg-ink-800 text-white" : "border-sand-300 bg-white text-sand-700 hover:bg-ink-50"}`}
              >
                Pregunta {i + 1}
              </button>
            ))}
          </div>
        )}

        <section className="rounded-2xl border border-sand-200 bg-white p-5 sm:p-7">
          <p className="text-sm font-medium text-sand-600">{pregunta.area}</p>
          <p className="mt-2 whitespace-pre-line text-base leading-relaxed">{pregunta.enunciado}</p>
          <p className="mt-4 text-sm text-sand-700">
            <span className="font-semibold">Tu respuesta:</span> {textoElegido}
          </p>
        </section>

        <section className="overflow-hidden rounded-2xl border border-sand-200 bg-white">
          <div className="max-h-96 space-y-3 overflow-y-auto bg-sand-50 p-4 sm:p-5" aria-live="polite">
            {mensajes.map((m) => (
              <div key={m.id} className={`ui-msg flex ${m.rol === "estudiante" ? "justify-end" : "justify-start"}`}>
                <p className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.rol === "estudiante" ? "rounded-br-md bg-ink-800 text-white" : "rounded-tl-md border border-sand-200 bg-white text-sand-800"}`}>
                  {m.texto}
                </p>
              </div>
            ))}
            {enviando && (
              <p className="ui-msg flex items-center gap-2 text-xs font-medium text-sand-500" role="status">
                <span className="ui-typing flex items-center gap-1" aria-hidden="true">
                  <span className="size-1.5 rounded-full bg-ink-500" />
                  <span className="size-1.5 rounded-full bg-ink-500" />
                  <span className="size-1.5 rounded-full bg-ink-500" />
                </span>
                El tutor está pensando…
              </p>
            )}
          </div>
          <form onSubmit={enviar} className="flex gap-2 border-t border-sand-200 p-3">
            <label htmlFor="revision-entrada" className="sr-only">
              Explica tu razonamiento
            </label>
            <input
              id="revision-entrada"
              value={entrada}
              onChange={(e) => setEntrada(e.target.value)}
              placeholder="Explica cómo lo resolviste…"
              className="min-h-12 flex-1 rounded-xl border border-sand-300 px-4 text-sm focus:border-ink-700 focus:outline-none focus:ring-4 focus:ring-ink-100"
            />
            <button type="submit" disabled={!entrada.trim() || enviando} className="min-h-12 rounded-xl bg-ink-950 px-5 text-sm font-semibold text-sand-50 hover:bg-ink-800 disabled:opacity-50">
              Enviar
            </button>
          </form>
        </section>
      </main>
    </div>
  )
}
