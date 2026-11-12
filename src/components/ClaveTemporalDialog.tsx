import { useEffect, useRef, useState } from "react"
import type { ClaveTemporal } from "@/services/dbService"

export type FaseClave = "confirmar" | "generando" | "lista" | "error"

export default function ClaveTemporalDialog({
  nombre,
  correo,
  fase,
  clave,
  mensaje,
  tieneAcceso,
  onConfirmar,
  onClose,
}: {
  nombre: string
  correo: string
  fase: FaseClave
  clave?: ClaveTemporal
  mensaje?: string
  // true: ya tenía cuenta y la contraseña actual dejará de servir
  tieneAcceso: boolean
  onConfirmar: () => void
  onClose: () => void
}) {
  const [copiado, setCopiado] = useState(false)
  const dialogo = useRef<HTMLDivElement>(null)

  useEffect(() => {
    dialogo.current?.querySelector<HTMLElement>("button")?.focus()
    const cerrarConEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && fase !== "generando") onClose()
    }
    window.addEventListener("keydown", cerrarConEscape)
    return () => window.removeEventListener("keydown", cerrarConEscape)
  }, [fase, onClose])

  const copiar = async () => {
    if (!clave) return
    try {
      await navigator.clipboard.writeText(`Correo: ${correo}\nContraseña temporal: ${clave.clave}`)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    } catch {
      setCopiado(false)
    }
  }

  const vence = clave
    ? new Date(clave.expira).toLocaleString("es-EC", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })
    : ""

  return (
    <div className="ui-view fixed inset-0 z-50 grid place-items-center bg-sand-950/60 p-4 backdrop-blur-sm">
      <div
        ref={dialogo}
        role="dialog"
        aria-modal="true"
        aria-labelledby="clave-temporal-titulo"
        className="ui-pop w-full max-w-md rounded-3xl border border-sand-300 bg-white p-6 shadow-2xl sm:p-7"
      >
        {fase === "lista" && clave ? (
          <>
            <h3 id="clave-temporal-titulo" className="text-lg font-bold text-sand-950">
              Contraseña temporal lista
            </h3>
            <p className="mt-1 text-sm text-sand-600">
              Entrégasela a <strong>{nombre}</strong> en persona o por un canal privado. No la volverás a ver.
            </p>
            <dl className="mt-5 space-y-3 rounded-2xl border border-sand-200 bg-sand-50 p-4">
              <div>
                <dt className="text-xs font-medium text-sand-500">Correo</dt>
                <dd className="break-all font-mono text-sm text-sand-900">{correo}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-sand-500">Contraseña temporal</dt>
                <dd className="font-mono text-2xl font-semibold tracking-widest text-ink-950">{clave.clave}</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs leading-relaxed text-sand-600">
              Sirve una sola vez hasta el {vence}. Al entrar, la plataforma le pedirá crear su propia contraseña.
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={copiar}
                className="min-h-11 flex-1 rounded-xl bg-ink-950 px-4 text-sm font-semibold text-white hover:bg-ink-800"
              >
                {copiado ? "Copiado" : "Copiar correo y contraseña"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="min-h-11 flex-1 rounded-xl border border-sand-300 px-4 text-sm font-semibold text-sand-700 hover:bg-sand-100"
              >
                Listo
              </button>
            </div>
          </>
        ) : (
          <>
            <h3 id="clave-temporal-titulo" className="text-lg font-bold text-sand-950">
              {tieneAcceso ? "¿Generar una contraseña temporal nueva?" : "Dar acceso a la plataforma"}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-sand-600">
              {tieneAcceso
                ? `La contraseña actual de ${nombre} dejará de servir. Tendrá que entrar con la temporal y crear una nueva.`
                : `Crearemos la cuenta de ${nombre} (${correo}) con una contraseña temporal de 72 horas.`}
            </p>
            {fase === "error" && mensaje && (
              <p className="mt-4 rounded-xl border border-hint-200 bg-hint-50 p-3 text-sm text-hint-900" role="alert">
                {mensaje}
              </p>
            )}
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={fase === "generando"}
                className="min-h-11 rounded-xl border border-sand-300 px-4 text-sm font-semibold text-sand-700 hover:bg-sand-100 disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={onConfirmar}
                disabled={fase === "generando"}
                className="min-h-11 rounded-xl bg-ink-950 px-4 text-sm font-semibold text-white hover:bg-ink-800 disabled:opacity-60"
              >
                {fase === "generando" ? "Generando…" : fase === "error" ? "Intentar otra vez" : "Generar contraseña"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
