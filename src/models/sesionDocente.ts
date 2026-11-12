import { useSyncExternalStore } from "react"
import { ejerciciosController, isValidUuid } from "@/services/dbService"
import type { Exercise } from "./types"

// Estado del asistente docente compartido por el chat y el editor A4. Vive fuera de los componentes
// para conservar la conversación y los ejercicios al ir del chat al editor y volver, y se guarda en
// el navegador para que una recarga no borre la lista. Hay un único chat: «Nuevo chat» lo reinicia.

export type LetraParalelo = "A" | "B" | "C"

export type MensajeChat = {
  id: number

  role: "user" | "assistant"

  text: string

  // Copia fija del ejercicio en ese momento (ajustes, versiones, «Versión anterior»)
  exercise?: Exercise

  // Tarjetas vivas: muestran el estado actual de esos ejercicios de la lista del chat
  claves?: string[]

  // La respuesta salió del respaldo local porque la IA no respondió
  sinConexion?: boolean
}

export type EstadoItem = "generando" | "listo" | "fallo"

/** Un ejercicio de la lista del chat, con sus propias versiones para paralelos e historial. */
export interface ItemEjercicio {
  // Identificador local estable: el id de la base cambia al editar o regenerar
  clave: string

  estado: EstadoItem

  // Motivo visible cuando estado = "fallo"
  error?: string

  // Se está regenerando: conserva el contenido anterior hasta que llegue el nuevo
  ocupado?: boolean

  // Pedido con el que se generó; «Regenerar» lo repite
  instruccion: string

  // UUID del primer «Original»: punto de partida del borrado en cascada al descartar
  raizId?: string

  // Versiones equivalentes para paralelos (A = original); la activa es la que se edita y se publica
  paralelos: Partial<Record<LetraParalelo, Exercise>>

  paraleloActivo: LetraParalelo

  // Pila de «Versión anterior» de la pestaña activa
  versiones: Exercise[]

  // Está vinculado a un aula (aula_ejercicios): ya no se puede descartar
  publicado: boolean
}

export interface EstadoChat {
  mensajes: MensajeChat[]

  items: ItemEjercicio[]

  seleccionado: string | null
}

/** Estado del chat más los datos del ejercicio seleccionado, que leen el chat, el editor y el planificador. */
export interface EstadoDocente extends EstadoChat {
  // Ejercicio seleccionado, solo si está listo
  item: ItemEjercicio | null

  ejercicio: Exercise

  versiones: Exercise[]

  tieneEjercicio: boolean

  paralelos: Partial<Record<LetraParalelo, Exercise>>

  paraleloActivo: LetraParalelo
}

// Marcador mientras el docente no tiene ejercicio: nunca se muestra ni se publica
export const EJERCICIO_VACIO: Exercise = {
  topic: "",

  context: "",

  level: "2do BGU",

  difficulty: "Intermedia",

  questions: 0,

  version: 1,

  questionList: [],
}

const CHAT_KEY = "ecdulearn_chat_docente"

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

/** Versión activa de un ejercicio de la lista (la de su pestaña de paralelo). */
export function ejercicioDeItem(item: ItemEjercicio): Exercise | undefined {
  return item.paralelos[item.paraleloActivo] ?? item.paralelos.A
}

/** Ids de las versiones conocidas de un ejercicio (también los locales): sirven para saber si alguna está en un aula. */
export function idsDeItem(item: ItemEjercicio): string[] {
  const ids = [item.raizId, ...Object.values(item.paralelos).map((e) => e?.id)]
  return [...new Set(ids.filter((id): id is string => typeof id === "string" && id.length > 0))]
}

/** Ids de todo lo que el chat conoce de un ejercicio, incluido el historial: se borran al descartarlo. */
export function idsParaDescartar(item: ItemEjercicio): string[] {
  const ids = [...idsDeItem(item), ...item.versiones.map((e) => e.id)]
  return [...new Set(ids.filter((id): id is string => typeof id === "string" && id.length > 0))]
}

function derivar(base: EstadoChat): EstadoDocente {
  const item = base.items.find((i) => i.clave === base.seleccionado && i.estado === "listo") ?? null
  const ejercicio = item ? ejercicioDeItem(item) : undefined
  return {
    mensajes: base.mensajes,
    items: base.items,
    seleccionado: base.seleccionado,
    item: ejercicio ? item : null,
    ejercicio: ejercicio ?? EJERCICIO_VACIO,
    versiones: item?.versiones ?? [],
    tieneEjercicio: Boolean(ejercicio),
    paralelos: item?.paralelos ?? {},
    paraleloActivo: item?.paraleloActivo ?? "A",
  }
}

function guardarChat(base: EstadoChat) {
  try {
    localStorage.setItem(CHAT_KEY, JSON.stringify({ mensajes: base.mensajes, items: base.items, seleccionado: base.seleccionado }))
  } catch {
    // Sin almacenamiento el chat dura lo que la pestaña.
  }
}

/** Chat guardado en este navegador; lo que se estaba generando al recargar queda como fallido. */
export function leerChatGuardado(): EstadoChat | null {
  try {
    const raw = localStorage.getItem(CHAT_KEY)
    if (!raw) return null
    const datos = JSON.parse(raw) as Partial<EstadoChat>
    if (!Array.isArray(datos.mensajes) || !Array.isArray(datos.items)) return null
    const items = datos.items
      .filter((i): i is ItemEjercicio => Boolean(i && typeof i.clave === "string" && i.paralelos))
      .map((i) =>
        i.estado === "generando"
          ? { ...i, estado: "fallo" as const, error: "Se interrumpió al recargar la página.", ocupado: false }
          : { ...i, ocupado: false },
      )
    const seleccionado = items.some((i) => i.clave === datos.seleccionado) ? (datos.seleccionado as string) : null
    return { mensajes: datos.mensajes, items, seleccionado }
  } catch {
    return null
  }
}

/** Devuelve el estado compartido; `inicial` solo se usa la primera vez que alguien lo pide. */
export function useSesionDocente(inicial: () => EstadoChat): EstadoDocente {
  if (!estado) estado = derivar(inicial())
  return useSyncExternalStore(suscribir, leer)
}

/** Lectura puntual del estado, para callbacks asíncronos que necesitan el valor más reciente. */
export function leerSesionDocente(): EstadoDocente {
  return leer()
}

export function actualizarSesionDocente(cambio: (actual: EstadoDocente) => Partial<EstadoChat>) {
  const actual = leer()
  const siguiente = derivar({ ...actual, ...cambio(actual) })
  estado = siguiente
  guardarChat(siguiente)
  // El planificador y el editor leen el ejercicio activo guardado: siempre es el seleccionado
  if (siguiente.ejercicio !== actual.ejercicio) {
    if (siguiente.tieneEjercicio) ejerciciosController.guardarActivoLocal(siguiente.ejercicio)
    else ejerciciosController.limpiarActivo()
  }
  oyentes.forEach((oyente) => oyente())
}

/** Cambia un ejercicio de la lista; si ya no existe (se descartó), no hace nada. */
export function actualizarItem(clave: string, cambio: (item: ItemEjercicio) => Partial<ItemEjercicio>) {
  actualizarSesionDocente((actual) => ({
    items: actual.items.map((i) => (i.clave === clave ? { ...i, ...cambio(i) } : i)),
  }))
}

/** Cambia el ejercicio seleccionado (chips, versiones, editor); sin selección lista, no hace nada. */
export function actualizarSeleccionado(cambio: (item: ItemEjercicio, ejercicio: Exercise) => Partial<ItemEjercicio>) {
  const { item } = leer()
  if (!item) return
  actualizarItem(item.clave, (actual) => {
    const ejercicio = ejercicioDeItem(actual)
    return ejercicio ? cambio(actual, ejercicio) : {}
  })
}

/** Reemplaza el ejercicio de la pestaña activa; el anterior queda en la pila de «Versión anterior». */
export function reemplazarEnItem(item: ItemEjercicio, nuevo: Exercise, { conservarAnterior = true } = {}): Partial<ItemEjercicio> {
  const actual = ejercicioDeItem(item)
  return {
    versiones: conservarAnterior && actual ? [...item.versiones, actual] : item.versiones,
    paralelos: { ...item.paralelos, [item.paraleloActivo]: nuevo },
  }
}

export function nuevaClave(): string {
  try {
    return crypto.randomUUID()
  } catch {
    return `item-${Date.now()}-${Math.random().toString(36).slice(2)}`
  }
}

/** Instrucción para regenerar un ejercicio que no se creó en este chat (abierto desde «Tus ejercicios»). */
export function instruccionDesdeEjercicio(ejercicio: Exercise): string {
  return `Crea un ejercicio tipo PISA para ${ejercicio.level}, dificultad ${ejercicio.difficulty}, sobre ${ejercicio.topic}, con un contexto real de Ecuador.`
}

export function itemDesdeEjercicio(ejercicio: Exercise, opciones: { instruccion?: string; publicado?: boolean } = {}): ItemEjercicio {
  return {
    clave: nuevaClave(),
    estado: "listo",
    instruccion: opciones.instruccion ?? instruccionDesdeEjercicio(ejercicio),
    raizId: isValidUuid(ejercicio.id) ? ejercicio.id : undefined,
    paralelos: { A: ejercicio },
    paraleloActivo: "A",
    versiones: [],
    publicado: opciones.publicado ?? false,
  }
}
