import { ejerciciosController } from "@/services/dbService"
import type { EstadoDocente } from "./sesionDocente"
import type { Exercise } from "./types"

// Marcador mientras el docente no tiene ejercicio: nunca se muestra ni se publica
export const initialExercise: Exercise = {
  topic: "",

  context: "",

  level: "2do BGU",

  difficulty: "Intermedia",

  questions: 0,

  version: 1,

  questionList: [],
}

export const SALUDO_ASISTENTE =
  "¡Hola! Soy tu asistente para preparar clases. Elige el curso y el tema, o pega un ejercicio del libro para convertirlo en un problema tipo PISA."

// Retoma el último ejercicio trabajado (chat, editor o planificador), también tras recargar
export function estadoInicialDocente(): EstadoDocente {
  const activo = ejerciciosController.getEjercicioActivo()
  if (!activo) {
    return {
      mensajes: [{ id: 1, role: "assistant", text: SALUDO_ASISTENTE }],
      ejercicio: initialExercise,
      versiones: [],
      tieneEjercicio: false,
      paralelos: {},
      paraleloActivo: "A",
    }
  }
  return {
    mensajes: [
      {
        id: 1,
        role: "assistant",
        text: `Retomé tu último ejercicio: «${activo.topic}». Puedes ajustarlo con los atajos de abajo, crear versiones para otros paralelos o empezar uno nuevo.`,
        exercise: activo,
      },
    ],
    ejercicio: activo,
    versiones: [],
    tieneEjercicio: true,
    paralelos: { A: activo },
    paraleloActivo: "A",
  }
}
