export interface Exercise {
  id?: string

  topic: string

  context: string

  level: string

  difficulty: "Básica" | "Intermedia" | "Avanzada" | string

  questions: number

  version: number

  situation?: string

  questionList?: string[]

  rubric?: string
}

export interface ChatMessage {
  id: number | string

  role: "user" | "assistant" | "student" | "tutor"

  text: string

  timestamp?: number

  isOfflineFallback?: boolean
}

export interface PinSession {
  pin: string

  exercise: Exercise

  createdAt: number

  schoolName: string

  teacherName: string

  subject: string

  active: boolean
}

export interface ErcaPhase {
  id: "experience" | "reflection" | "conceptualization" | "application"

  tag: string

  duration: string

  title: string

  body: string

  pisaExercise?: Exercise
}

export type ViewType = "portal" | "teacher-dashboard" | "teacher-chat" | "teacher-editor" | "teacher-planner" | "student-hub" | "student-free" | "student-school" | "student-simulator" | "admin"

export interface SimQuestion {
  id: number

  subject: string

  title: string

  prompt: string

  options: { id: string; text: string }[]

  correct: string

  explanation?: string
}

export interface TeacherUser {
  id: string

  name: string

  email: string

  institution: string

  role: "docente" | "coordinador" | "admin"

  isDemo?: boolean
}

// Vocabulario cerrado de schema.sql (ck_intentos_paso): fases donde se traba el estudiante
export type PasoBloqueo =
  | "COMPRENSION_LECTORA"
  | "IDENTIFICACION_VARIABLES"
  | "PLANTEAMIENTO_ECUACION"
  | "CALCULO"
  | "INTERPRETACION_RESULTADO"

// Ejercicio tal como lo ve el estudiante (fn_ejercicio_json_estudiante): nunca incluye la respuesta
export interface RetoEstudiante {
  id: string

  tema: string

  contexto: string

  curso: string

  dificultad: string

  enunciado: string

  pregunta: string

  totalPistas: number

  // Solo en el reto local de respaldo; con sesión real las pistas las entrega fn_solicitar_pista
  pistasLocales?: string[]
}

export interface SesionEstudiante {
  sesionId: string

  pin: string

  alias: string

  titulo: string

  ejercicios: RetoEstudiante[]

  isOffline: boolean
}
