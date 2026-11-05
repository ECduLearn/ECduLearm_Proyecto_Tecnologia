import { useEffect, useRef, useState } from "react"
import ZoneIcon from "@/components/ZoneIcon"
import { copyPinToClipboard, formatPin } from "@/services/pinService"
import type { ResumenAula } from "@/services/dbService"

export default function DetalleAulaDialog({
  aula,
  actualizando,
  onActualizar,
  onClose,
}: {
  aula: ResumenAula
  actualizando: boolean
  onActualizar: () => void
  onClose: () => void
}) {
  const [copiado, setCopiado] = useState(false)
  const dialogo = useRef<HTMLElement>(null)

  useEffect(() => {
    dialogo.current?.querySelector<HTMLElement>("button")?.focus()
    const cerrarConEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", cerrarConEscape)
    return () => window.removeEventListener("keydown", cerrarConEscape)
  }, [onClose])

  const copiar = async () => {
    setCopiado(await copyPinToClipboard(aula.pin))
    setTimeout(() => setCopiado(false), 2500)
  }

  const datos = [
    { etiqueta: "Estudiantes que entraron", valor: aula.estudiantes },
    { etiqueta: "Pistas pedidas", valor: aula.pistas },
    { etiqueta: "Retos resueltos", valor: aula.intentos ? `${aula.resueltos} de ${aula.intentos} (${aula.pctResueltos} %)` : "—" },
  ]

  return (
    <div className="ui-view fixed inset-0 z-50 grid place-items-center bg-sand-950/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <section
        ref={dialogo}
        role="dialog"
        aria-modal="true"
        aria-labelledby="detalle-aula-titulo"
        onClick={(event) => event.stopPropagation()}
        className="ui-pop relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[1.25rem] border border-sand-200 bg-sand-50 p-6 shadow-2xl sm:p-8"
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

        <p className="text-sm font-medium text-ink-800">{aula.activa ? "Clase activa" : "Clase cerrada"}</p>
        <h2 id="detalle-aula-titulo" className="mt-1 pr-10 text-xl font-semibold text-sand-950">
          {aula.titulo}
        </h2>

        <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-sand-300 bg-sand-100/70 px-4 py-3">
          <p className="font-mono text-2xl font-medium tracking-[0.18em] text-ink-900">{formatPin(aula.pin)}</p>
          <button
            type="button"
            onClick={copiar}
            className="flex min-h-11 items-center gap-2 rounded-xl bg-ink-950 px-4 text-sm font-semibold text-sand-50 hover:bg-ink-800"
          >
            {copiado && <ZoneIcon name="check" className="size-4" />}
            {copiado ? "Copiado" : "Copiar PIN y enlace"}
          </button>
        </div>

        {!aula.enServidor && (
          <p className="mt-4 rounded-xl border border-hint-200 bg-hint-50 p-3 text-sm leading-relaxed text-hint-900" role="status">
            Esta clase se guardó solo en este dispositivo, así que tus estudiantes no pueden entrar desde sus celulares.
            Vuelve a publicarla cuando tengas conexión.
          </p>
        )}

        {aula.enServidor && (
          <>
            <dl className="mt-6 grid gap-3 sm:grid-cols-3">
              {datos.map((dato) => (
                <div key={dato.etiqueta} className="rounded-xl border border-sand-200 bg-white p-4">
                  <dt className="text-xs font-medium text-sand-500">{dato.etiqueta}</dt>
                  <dd className="mt-1 text-lg font-semibold tabular-nums text-ink-950">{dato.valor}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-3 rounded-xl border border-hint-200 bg-hint-50 p-4">
              <p className="text-xs font-medium text-hint-800">Paso donde más se trabaron</p>
              <p className="mt-1 font-semibold text-hint-950">{aula.pasoBloqueo || "Todavía nadie marcó un bloqueo"}</p>
            </div>
            <button
              type="button"
              onClick={onActualizar}
              disabled={actualizando}
              className="mt-5 min-h-11 w-full rounded-xl border border-sand-300 px-4 text-sm font-semibold text-sand-800 hover:bg-sand-100 disabled:opacity-60"
            >
              {actualizando ? "Actualizando…" : "Actualizar datos"}
            </button>
          </>
        )}
      </section>
    </div>
  )
}
