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
