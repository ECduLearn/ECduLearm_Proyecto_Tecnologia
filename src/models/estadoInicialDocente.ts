import { ejerciciosController } from "@/services/dbService"
import type { EstadoDocente, MensajeChat } from "./sesionDocente"
import type { Exercise } from "./types"

export const initialExercise: Exercise = {
  topic: "Estabilidad de estructuras",

  context: "Ingeniería civil",

  level: "2do BGU",

  difficulty: "Intermedia",

  questions: 3,

  version: 1,

  situation:
    "Un equipo de estudiantes analiza la estabilidad de una estructura para un nuevo centro comunitario. El diseño utiliza módulos triangulares de 4 metros de base y 3 metros de altura. Antes de construir, deben comparar alternativas y justificar cuál distribuye mejor las cargas.",

  questionList: [
    "Calcula el área de uno de los módulos triangulares utilizados en la estructura.",

    "Si el diseño requiere 12 módulos, ¿qué superficie total representan?",

    "Explica qué alternativa elegirías y sustenta tu decisión con los datos.",
  ],
}

const initialMessages: MensajeChat[] = [
  {
    id: 1,

    role: "assistant",

    text: "¡Hola! Soy tu asistente para preparar clases.\n\nTe dejé lista una guía de ejemplo con enfoque PISA. Puedes pedirme que la ajuste («hazla más fácil», «agrega una pregunta»), que cree otra sobre un tema distinto («Metro de Quito», «Galápagos», «finanzas») o consultarme cualquier duda sobre cómo plantear un ejercicio.",

    exercise: initialExercise,
  },
]

// Retoma el último ejercicio trabajado (chat, editor o planificador), también tras recargar
export function estadoInicialDocente(): EstadoDocente {
  return {
    mensajes: initialMessages,
    ejercicio: ejerciciosController.getEjercicioActivo() ?? initialExercise,
    versiones: [],
    tieneEjercicio: true,
  }
}
