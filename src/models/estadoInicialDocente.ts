import { ejerciciosController } from "@/services/dbService"
import { EJERCICIO_VACIO, itemDesdeEjercicio, leerChatGuardado, type EstadoChat } from "./sesionDocente"
import type { Exercise } from "./types"

// Marcador mientras el docente no tiene ejercicio: nunca se muestra ni se publica
export const initialExercise: Exercise = EJERCICIO_VACIO

export const SALUDO_ASISTENTE =
  "¡Hola! Soy tu asistente para preparar clases. Elige el curso y el tema, o pega un ejercicio del libro para convertirlo en un problema tipo PISA. Puedes pedir hasta 3 ejercicios a la vez."

export function chatVacio(): EstadoChat {
  return {
    mensajes: [{ id: Date.now(), role: "assistant", text: SALUDO_ASISTENTE }],
    items: [],
    seleccionado: null,
  }
}

// Retoma el chat guardado en este navegador; si no hay, el último ejercicio trabajado (chat, editor o planificador)
export function estadoInicialDocente(): EstadoChat {
  const guardado = leerChatGuardado()
  if (guardado) return guardado

  const activo = ejerciciosController.getEjercicioActivo()
  if (!activo) return chatVacio()

  const item = itemDesdeEjercicio(activo)
  return {
    mensajes: [
      {
        id: 1,
        role: "assistant",
        text: `Retomé tu último ejercicio: «${activo.topic}». Puedes ajustarlo con los atajos de abajo, crear versiones para otros paralelos o generar más ejercicios.`,
        claves: [item.clave],
      },
    ],
    items: [item],
    seleccionado: item.clave,
  }
}
