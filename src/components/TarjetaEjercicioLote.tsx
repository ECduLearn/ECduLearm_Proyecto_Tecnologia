import { useState } from "react"
import Icon from "./Icon"
import ExerciseCard from "./ExerciseCard"
import { ejercicioDeItem, type ItemEjercicio } from "@/models/sesionDocente"

const botonSecundario =
  "flex min-h-11 items-center gap-1.5 rounded-xl border border-sand-200 bg-white px-3 text-sm font-semibold text-sand-700 transition hover:bg-sand-50 focus:outline-none focus:ring-4 focus:ring-ink-100 disabled:opacity-50"

/**
 * Un ejercicio de la lista del chat: se puede seleccionar (los atajos, las versiones y el editor actúan
 * sobre el seleccionado), regenerar o descartar sin tocar los demás.
 */
export default function TarjetaEjercicioLote({
  item,
  numero,
  seleccionado,
  bloqueado,
  expandidoInicial,
  onSeleccionar,
  onRegenerar,
  onDescartar,
}: {
  item: ItemEjercicio
  numero: number
  seleccionado: boolean
  // Hay una generación en curso: las acciones esperan
  bloqueado: boolean
  expandidoInicial: boolean
  onSeleccionar: () => void
  onRegenerar: () => void
  onDescartar: () => void
}) {
  const [expandido, setExpandido] = useState(expandidoInicial)
  const ejercicio = ejercicioDeItem(item)
  const ocupado = bloqueado || Boolean(item.ocupado)

  if (item.estado === "generando") {
    return (
      <div className="rounded-2xl border border-ink-200 bg-ink-50/70 p-4 sm:ml-12" role="status" aria-busy="true">
        <p className="flex items-center gap-2 text-sm font-semibold text-ink-900">
          <span className="ui-typing flex items-center gap-1" aria-hidden="true">
            <span className="size-1.5 rounded-full bg-ink-600" />
            <span className="size-1.5 rounded-full bg-ink-600" />
            <span className="size-1.5 rounded-full bg-ink-600" />
          </span>
          Generando el ejercicio {numero}…
        </p>
        <div className="mt-3 space-y-2" aria-hidden="true">
          <div className="h-4 w-2/3 animate-pulse rounded bg-ink-100" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-ink-100" />
        </div>
      </div>
    )
  }

  if (item.estado === "fallo" || !ejercicio) {
    return (
      <div className="rounded-2xl border border-hint-200 bg-hint-50 p-4 sm:ml-12" role="alert">
        <p className="text-sm font-semibold text-hint-900">No se pudo generar el ejercicio {numero}</p>
        <p className="mt-1 text-sm text-hint-900">{item.error ?? "La IA no respondió."}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={onRegenerar} disabled={ocupado} className={botonSecundario}>
            <Icon name="redo" className="size-4" />
            Reintentar
          </button>
          <button type="button" onClick={onDescartar} disabled={ocupado} className={botonSecundario}>
            <Icon name="x" className="size-4" />
            Quitar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`rounded-2xl border bg-white p-4 shadow-sm transition-colors duration-150 sm:ml-12 ${
        seleccionado ? "border-ink-400 ring-2 ring-ink-100" : "border-sand-200"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-sand-500">Ejercicio {numero}</p>
          <p className="mt-0.5 font-semibold text-sand-950">{ejercicio.topic}</p>
          <p className="mt-1 text-xs text-sand-600">
            {ejercicio.level} · {String(ejercicio.difficulty)} · {ejercicio.context}
            {item.paralelos.B || item.paralelos.C ? ` · Versión ${item.paraleloActivo}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {item.publicado && (
            <span className="rounded-full bg-ink-950 px-2.5 py-1 text-xs font-bold text-white">Publicado</span>
          )}
          {seleccionado && (
            <span className="rounded-full bg-ink-100 px-2.5 py-1 text-xs font-bold text-ink-900">Trabajando en este</span>
          )}
        </div>
      </div>

      {item.ocupado && (
        <p className="mt-3 text-sm font-semibold text-ink-900" role="status">
          Regenerando este ejercicio…
        </p>
      )}
      {item.error && !item.ocupado && (
        <p className="mt-3 rounded-xl border border-hint-200 bg-hint-50 p-2.5 text-sm text-hint-900" role="alert">
          {item.error}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {!seleccionado && (
          <button
            type="button"
            onClick={onSeleccionar}
            disabled={ocupado}
            className="flex min-h-11 items-center gap-1.5 rounded-xl bg-ink-950 px-3 text-sm font-semibold text-white transition hover:bg-ink-800 focus:outline-none focus:ring-4 focus:ring-ink-200 disabled:opacity-50"
          >
            <Icon name="check" className="size-4" />
            Trabajar en este
          </button>
        )}
        <button type="button" onClick={() => setExpandido((v) => !v)} aria-expanded={expandido} className={botonSecundario}>
          <Icon name="file" className="size-4" />
          {expandido ? "Ocultar" : "Ver ejercicio"}
        </button>
        {/* Publicado: ya está en un aula, así que no se reemplaza ni se borra desde aquí */}
        {!item.publicado && (
          <>
            <button type="button" onClick={onRegenerar} disabled={ocupado} className={botonSecundario}>
              <Icon name="redo" className="size-4" />
              Regenerar
            </button>
            <button type="button" onClick={onDescartar} disabled={ocupado} className={botonSecundario}>
              <Icon name="x" className="size-4" />
              Descartar
            </button>
          </>
        )}
      </div>

      {expandido && <ExerciseCard exercise={ejercicio} documento={seleccionado} incrustado />}
    </div>
  )
}
