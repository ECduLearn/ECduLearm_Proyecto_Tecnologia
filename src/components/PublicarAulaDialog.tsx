import { useEffect, useRef, useState } from "react"
import ZoneIcon from "@/components/ZoneIcon"
import { aulasController, ejerciciosController } from "@/services/dbService"
import { copyPinToClipboard, formatPin, generarPinAula } from "@/services/pinService"
import type { Exercise } from "@/models/types"

type Paso =
  | { tipo: "elegir" }
  | { tipo: "publicando" }
  | { tipo: "listo"; pin: string; soloEsteNavegador: boolean }
  | { tipo: "error"; mensaje: string }

export default function PublicarAulaDialog({
  onClose,
  onIrAlAsistente,
}: {
  onClose: () => void
  onIrAlAsistente: () => void
}) {
  const [ejercicio] = useState<Exercise | null>(() => ejerciciosController.getEjercicioActivo())
  const [titulo, setTitulo] = useState(ejercicio?.topic ?? "")
  const [paso, setPaso] = useState<Paso>({ tipo: "elegir" })
  const [copiado, setCopiado] = useState(false)
  const dialogo = useRef<HTMLElement>(null)

  useEffect(() => {
    dialogo.current?.querySelector<HTMLElement>("button, input")?.focus()
    const cerrarConEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", cerrarConEscape)
    return () => window.removeEventListener("keydown", cerrarConEscape)
  }, [onClose])

  const publicar = async () => {
    if (!ejercicio) return
    setPaso({ tipo: "publicando" })
    // Un PIN aleatorio casi nunca choca, pero si ya existe se prueba con otro
    for (let intento = 0; intento < 3; intento++) {
      const res = await aulasController.publicarAula(generarPinAula(), titulo.trim() || ejercicio.topic, ejercicio)
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
        className="ui-pop relative w-full max-w-md rounded-[1.25rem] border border-sand-200 bg-sand-50 p-6 shadow-2xl sm:p-8"
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

        {!ejercicio ? (
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
            <p className="mt-3 text-sm text-sand-600">Tus estudiantes lo escriben en la página de inicio, sin crear cuenta.</p>
            {paso.soloEsteNavegador && (
              <p className="mt-4 rounded-xl border border-hint-200 bg-hint-50 p-3 text-left text-sm leading-relaxed text-hint-900" role="status">
                Estás en modo demo: este PIN solo funciona en este navegador. Para que entren desde sus celulares,
                inicia sesión con la cuenta de tu colegio.
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
              Crearemos un PIN nuevo para que tus estudiantes resuelvan este ejercicio con el tutor.
            </p>

            <div className="mt-5 rounded-xl border border-sand-200 bg-sand-100/60 p-4">
              <p className="text-xs font-medium text-sand-500">
                {ejercicio.level} · {String(ejercicio.difficulty)}
              </p>
              <p className="mt-1 font-semibold text-sand-950">{ejercicio.topic}</p>
            </div>

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
              disabled={paso.tipo === "publicando"}
              className="mt-6 min-h-12 w-full rounded-xl bg-ink-950 px-5 font-semibold text-sand-50 transition-colors duration-150 hover:bg-ink-800 disabled:opacity-70"
            >
              {paso.tipo === "publicando" ? "Creando el PIN…" : paso.tipo === "error" ? "Intentar otra vez" : "Crear PIN y publicar"}
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
