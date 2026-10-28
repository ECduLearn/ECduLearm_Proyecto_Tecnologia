import { useSyncExternalStore } from "react"
import type { Exercise } from "./types"

// Estado del asistente docente compartido por el chat y el editor A4. Vive fuera de los componentes
// para conservar la conversación y el ejercicio al ir del chat al editor y volver.
export type MensajeChat = {
  id: number

  role: "user" | "assistant"

  text: string

  exercise?: Exercise
}

export interface EstadoDocente {
  mensajes: MensajeChat[]

  ejercicio: Exercise

  versiones: Exercise[]

  tieneEjercicio: boolean
}

type Actualizacion<T> = T | ((anterior: T) => T)

let estado: EstadoDocente | null = null
const oyentes = new Set<() => void>()

function suscribir(oyente: () => void) {
  oyentes.add(oyente)
  return () => oyentes.delete(oyente)
}

function leer(): EstadoDocente {
  if (!estado) throw new Error("La sesión docente no se ha iniciado")
  return estado
}

/** Devuelve el estado compartido; `inicial` solo se usa la primera vez que alguien lo pide. */
export function useSesionDocente(inicial: () => EstadoDocente): EstadoDocente {
  if (!estado) estado = inicial()
  return useSyncExternalStore(suscribir, leer)
}

export function actualizarSesionDocente(cambio: (actual: EstadoDocente) => Partial<EstadoDocente>) {
  const actual = leer()
  estado = { ...actual, ...cambio(actual) }
  oyentes.forEach((oyente) => oyente())
}

/** Setter con la misma firma que el de useState, para un campo del estado compartido. */
export function setterSesion<K extends keyof EstadoDocente>(clave: K) {
  return (valor: Actualizacion<EstadoDocente[K]>) =>
    actualizarSesionDocente((actual) => ({
      [clave]: typeof valor === "function" ? (valor as (anterior: EstadoDocente[K]) => EstadoDocente[K])(actual[clave]) : valor,
    }))
}
