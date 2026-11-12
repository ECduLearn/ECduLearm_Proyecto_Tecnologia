import { useEffect, useRef, useState } from "react"
import ZoneIcon from "@/components/ZoneIcon"
import { aulasController, ejerciciosController } from "@/services/dbService"
import { copyPinToClipboard, formatPin, generarPinAula } from "@/services/pinService"
import { MAX_EJERCICIOS_AULA } from "@/models/limites"
import type { Exercise } from "@/models/types"

type Paso =
  | { tipo: "elegir" }
  | { tipo: "publicando" }
  | { tipo: "listo"; pin: string; soloEsteNavegador: boolean }
  | { tipo: "error"; mensaje: string }

/** Ejercicio del chat que se puede publicar; `clave` lo identifica en la lista del asistente. */
export interface OpcionPublicar {
  clave: string

  ejercicio: Exercise

  publicado: boolean
}

export default function PublicarAulaDialog({
  onClose,
  onIrAlAsistente,
  opciones,
  seleccionInicial,
  onPublicado,
}: {
  onClose: () => void
  onIrAlAsistente: () => void
  // Desde el asistente: ejercicios del chat para elegir. Sin opciones se publica el ejercicio activo.
  opciones?: OpcionPublicar[]
  seleccionInicial?: string | null
  onPublicado?: (publicados: { clave: string; ejercicio: Exercise }[]) => void
}) {
  const [lista] = useState<OpcionPublicar[]>(() => {
    if (opciones) return opciones
    const activo = ejerciciosController.getEjercicioActivo()
    return activo ? [{ clave: "activo", ejercicio: activo, publicado: false }] : []
  })
  const [elegidos, setElegidos] = useState<string[]>(() => {
    const inicial = lista.find((o) => o.clave === seleccionInicial) ?? lista[0]
    return inicial ? [inicial.clave] : []
  })
  const conLista = Boolean(opciones && lista.length > 1)
  const marcados = lista.filter((o) => elegidos.includes(o.clave))
  const [titulo, setTitulo] = useState(() => marcados[0]?.ejercicio.topic ?? "")
  const [paso, setPaso] = useState<Paso>({ tipo: "elegir" })
  const [copiado, setCopiado] = useState(false)
  const dialogo = useRef<HTMLElement>(null)
  const enTope = elegidos.length >= MAX_EJERCICIOS_AULA

  useEffect(() => {
    dialogo.current?.querySelector<HTMLElement>("button, input")?.focus()
    const cerrarConEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", cerrarConEscape)
    return () => window.removeEventListener("keydown", cerrarConEscape)
  }, [onClose])

  const alternar = (clave: string) => {
    setElegidos((actuales) => {
      if (actuales.includes(clave)) return actuales.filter((c) => c !== clave)
      if (actuales.length >= MAX_EJERCICIOS_AULA) return actuales
      return [...actuales, clave]
    })
  }

  const publicar = async () => {
    if (!marcados.length) return
    setPaso({ tipo: "publicando" })
    const nombre = titulo.trim() || marcados[0].ejercicio.topic
    // Un PIN aleatorio casi nunca choca, pero si ya existe se prueba con otro
    for (let intento = 0; intento < 3; intento++) {
      const res = await aulasController.publicarAula(
        generarPinAula(),
        nombre,
        marcados.map((o) => o.ejercicio),
      )
      if (res.motivo === "pin_ocupado") continue
      if (res.motivo === "error") {
        setPaso({ tipo: "error", mensaje: "No pudimos publicar la clase. Revisa tu conexión y vuelve a intentarlo." })
        return
      }
      try {
        localStorage.setItem("ecdulearm_active_pin", res.pin)
      } catch {
        // El PIN igual se muestra en pantalla.
      }
      onPublicado?.(marcados.map((o, i) => ({ clave: o.clave, ejercicio: res.ejercicios[i] ?? o.ejercicio })))
      setPaso({ tipo: "listo", pin: res.pin, soloEsteNavegador: res.isOffline })
      return
    }
    setPaso({ tipo: "error", mensaje: "No encontramos un PIN libre esta vez. Vuelve a intentarlo." })
  }

  const copiar = async (pin: string) => {
    setCopiado(await copyPinToClipboard(pin))
    window.setTimeout(() => setCopiado(false), 2500)
  }

  return (
    <div className="ui-view fixed inset-0 z-50 grid place-items-center bg-sand-950/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <section
        ref={dialogo}
        role="dialog"
        aria-modal="true"
        aria-labelledby="publicar-titulo"
        onClick={(event) => event.stopPropagation()}
        className="ui-pop relative max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-[1.25rem] border border-sand-200 bg-sand-50 p-6 shadow-2xl sm:p-8"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-3 top-3 grid size-11 place-items-center rounded-xl text-sand-500 hover:bg-sand-100 hover:text-sand-900"
        >
          <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>

        {!lista.length ? (
          <div className="pr-8">
            <h2 id="publicar-titulo" className="text-xl font-semibold text-sand-950">
              Primero crea un ejercicio
            </h2>
            <p className="mt-2 text-[0.9375rem] leading-relaxed text-sand-600">
              Pídele al asistente un problema para tu clase. Cuando lo tengas, vuelve aquí y lo publicas con un PIN.
            </p>
            <button
              type="button"
              onClick={onIrAlAsistente}
              className="mt-6 min-h-12 w-full rounded-xl bg-ink-950 px-5 font-semibold text-sand-50 transition-colors duration-150 hover:bg-ink-800"
            >
              Ir al asistente
            </button>
          </div>
        ) : paso.tipo === "listo" ? (
          <div className="text-center">
            <p className="text-sm font-medium text-ink-800">Clase publicada</p>
            <h2 id="publicar-titulo" className="mt-1 text-xl font-semibold text-sand-950">
              Comparte este PIN con tu clase
            </h2>
            <p className="mt-6 rounded-2xl border border-sand-300 bg-sand-100/70 px-4 py-5 font-mono text-[2.5rem] font-medium tracking-[0.18em] text-ink-900">
              {formatPin(paso.pin)}
            </p>
            <p className="mt-3 text-sm text-sand-600">
              {marcados.length > 1 ? `Resolverán ${marcados.length} ejercicios, uno tras otro. ` : ""}
              Tus estudiantes lo escriben en la página de inicio, sin crear cuenta.
            </p>
            {paso.soloEsteNavegador && (
              <p className="mt-4 rounded-xl border border-hint-200 bg-hint-50 p-3 text-left text-sm leading-relaxed text-hint-900" role="status">
                No pudimos guardar la clase en el servidor, así que este PIN solo funciona en este dispositivo.
                Revisa tu conexión y vuelve a publicarla para que entren desde sus celulares.
              </p>
            )}
            <button
              type="button"
              onClick={() => copiar(paso.pin)}
              className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-ink-950 px-5 font-semibold text-sand-50 transition-colors duration-150 hover:bg-ink-800"
            >
              {copiado && <ZoneIcon name="check" className="size-5" />}
              {copiado ? "Copiado" : "Copiar PIN y enlace"}
            </button>
          </div>
        ) : (
          <div className="pr-8">
            <h2 id="publicar-titulo" className="text-xl font-semibold text-sand-950">
              Publicar en una clase
            </h2>
            <p className="mt-2 text-[0.9375rem] leading-relaxed text-sand-600">
              {conLista
                ? `Elige los ejercicios que resolverán tus estudiantes con el tutor, hasta ${MAX_EJERCICIOS_AULA}. Crearemos un PIN nuevo.`
                : "Crearemos un PIN nuevo para que tus estudiantes resuelvan este ejercicio con el tutor."}
            </p>

            {conLista ? (
              <fieldset className="mt-5">
                <legend className="flex w-full items-center justify-between text-sm font-medium text-sand-800">
                  <span>Ejercicios de este chat</span>
                  <span className="text-xs font-semibold text-sand-500">
                    {elegidos.length} de {MAX_EJERCICIOS_AULA}
                  </span>
                </legend>
                <div className="mt-2 space-y-2">
                  {lista.map((opcion) => {
                    const marcado = elegidos.includes(opcion.clave)
                    const bloqueado = !marcado && enTope
                    return (
                      <label
                        key={opcion.clave}
                        className={`flex min-h-14 cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors duration-150 ${
                          marcado ? "border-ink-400 bg-ink-50" : "border-sand-200 bg-sand-100/60 hover:bg-sand-100"
                        } ${bloqueado ? "cursor-not-allowed opacity-60" : ""}`}
                      >
                        <input
                          type="checkbox"
                          checked={marcado}
                          disabled={bloqueado || paso.tipo === "publicando"}
                          onChange={() => alternar(opcion.clave)}
                          className="mt-0.5 size-5 shrink-0 accent-ink-900"
                        />
                        <span className="min-w-0">
                          <span className="block font-semibold text-sand-950">{opcion.ejercicio.topic}</span>
                          <span className="mt-0.5 block text-xs text-sand-600">
                            {opcion.ejercicio.level} · {String(opcion.ejercicio.difficulty)}
                            {opcion.publicado ? " · Ya publicado en otra clase" : ""}
                          </span>
                        </span>
                      </label>
                    )
                  })}
                </div>
                {enTope && (
                  <p className="mt-2 text-xs font-medium text-sand-600" role="status">
                    Máximo {MAX_EJERCICIOS_AULA} ejercicios por clase.
                  </p>
                )}
              </fieldset>
            ) : (
              <div className="mt-5 rounded-xl border border-sand-200 bg-sand-100/60 p-4">
                <p className="text-xs font-medium text-sand-500">
                  {lista[0].ejercicio.level} · {String(lista[0].ejercicio.difficulty)}
                </p>
                <p className="mt-1 font-semibold text-sand-950">{lista[0].ejercicio.topic}</p>
              </div>
            )}

            <label htmlFor="publicar-nombre" className="mt-5 block text-sm font-medium text-sand-800">
              Nombre que verán tus estudiantes
            </label>
            <input
              id="publicar-nombre"
              value={titulo}
              onChange={(event) => setTitulo(event.target.value)}
              maxLength={150}
              className="mt-2 min-h-12 w-full rounded-xl border border-sand-300 bg-sand-50 px-4 text-[0.9375rem] text-sand-950 focus:border-ink-700 focus:outline-none focus:ring-4 focus:ring-ink-100"
            />

            {paso.tipo === "error" && (
              <p className="mt-4 rounded-xl border border-hint-200 bg-hint-50 p-3 text-sm text-hint-900" role="alert">
                {paso.mensaje}
              </p>
            )}

            <button
              type="button"
              onClick={publicar}
              disabled={paso.tipo === "publicando" || !marcados.length}
              className="mt-6 min-h-12 w-full rounded-xl bg-ink-950 px-5 font-semibold text-sand-50 transition-colors duration-150 hover:bg-ink-800 disabled:opacity-70"
            >
              {paso.tipo === "publicando"
                ? "Creando el PIN…"
                : paso.tipo === "error"
                  ? "Intentar otra vez"
                  : marcados.length > 1
                    ? `Crear PIN y publicar ${marcados.length} ejercicios`
                    : "Crear PIN y publicar"}
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
