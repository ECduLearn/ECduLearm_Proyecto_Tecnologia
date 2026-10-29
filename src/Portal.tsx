import { FormEvent, ReactNode, useEffect, useState } from "react"

import {
  authController,
  estudianteSocraticoController,
  metricasController,
  DbMetricasDocente,
} from "./services/dbService"

import type { TeacherUser } from "./models/types"

import PublicarAulaDialog from "./components/PublicarAulaDialog"

type PortalIconName = "arrow" | "book" | "chart" | "check" | "chevron" | "clock" | "copy" | "grid" | "help" | "link" | "lock" | "logout" | "menu" | "plus" | "send" | "shield" | "sparkles" | "users" | "x"

const portalIconPaths: Record<PortalIconName, ReactNode> = {
  arrow: <path d="m9 18 6-6-6-6" />,

  book: (
    <>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
      <path d="M8 7h8M8 11h6" />
    </>
  ),

  chart: (
    <>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </>
  ),

  check: <path d="m5 12 4 4L19 6" />,

  chevron: <path d="m9 18 6-6-6-6" />,

  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),

  copy: (
    <>
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </>
  ),

  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),

  help: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.8 9a2.4 2.4 0 1 1 3.7 2c-1 .6-1.5 1.1-1.5 2.2M12 17h.01" />
    </>
  ),

  link: (
    <>
      <path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.1 1.1" />
      <path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.1-1.1" />
    </>
  ),

  lock: (
    <>
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" />
    </>
  ),

  logout: (
    <>
      <path d="M10 17l5-5-5-5M15 12H3" />
      <path d="M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5" />
    </>
  ),

  menu: <path d="M4 7h16M4 12h16M4 17h16" />,

  plus: <path d="M12 5v14M5 12h14" />,

  send: (
    <>
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </>
  ),

  shield: (
    <>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),

  sparkles: (
    <>
      <path d="m12 3-1.1 3.1A4.3 4.3 0 0 1 8.3 8.7L5 10l3.3 1.3a4.3 4.3 0 0 1 2.6 2.6L12 17l1.1-3.1a4.3 4.3 0 0 1 2.6-2.6L19 10l-3.3-1.3a4.3 4.3 0 0 1-2.6-2.6L12 3Z" />
      <path d="m5 3-.4 1.1a1.6 1.6 0 0 1-1 1L2.5 5.5l1.1.4a1.6 1.6 0 0 1 1 1L5 8l.4-1.1a1.6 1.6 0 0 1 1-1l1.1-.4-1.1-.4a1.6 1.6 0 0 1-1-1L5 3Z" />
    </>
  ),

  users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />
    </>
  ),

  x: <path d="m6 6 12 12M18 6 6 18" />,
}

function PortalIcon({
  name,
  className = "size-5",
}: {
  name: PortalIconName
  className?: string
}) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {portalIconPaths[name]}
    </svg>
  )
}

function Brand({ dark = false }: { dark?: boolean }) {
  return (
    <div className="flex items-center gap-3" aria-label="ECduLearn">
      <span
        className={`grid size-10 place-items-center rounded-xl ${
          dark ? "bg-ink-950 text-white" : "bg-white text-ink-950"
        }`}
      >
        <PortalIcon name="book" className="size-5" />
      </span>
      <span
        className={`text-lg font-bold tracking-tight ${
          dark ? "text-ink-950" : "text-white"
        }`}
      >
        EC<span className="text-hint-600">du</span>Learn
      </span>
    </div>
  )
}

export function AccessPortal({
  onStudentEnter,

  onTeacherEnter,

  onAdminEnter,

  onBackToLanding,
}: {
  onStudentEnter: () => void

  onTeacherEnter: () => void

  onAdminEnter?: () => void

  onBackToLanding?: () => void
}) {
  const [pin, setPin] = useState("")

  const [loginOpen, setLoginOpen] = useState(false)

  const [pinError, setPinError] = useState("")

  const [pinLoading, setPinLoading] = useState(false)

  // Estados de Login Docente

  const [teacherEmail, setTeacherEmail] = useState("")

  const [teacherPassword, setTeacherPassword] = useState("")

  const [loginLoading, setLoginLoading] = useState(false)

  const [loginError, setLoginError] = useState("")

  const enterSession = async (event: FormEvent) => {
    event.preventDefault()

    const cleanPin = pin.trim().replace(/\s+/g, "").toUpperCase()

    if (!cleanPin) {
      setPinError("Escribe el PIN que te dio tu docente.")

      return
    }

    setPinLoading(true)

    setPinError("")

    try {
      const resultado = await estudianteSocraticoController.ingresarConPin(cleanPin)

      if (resultado.estado === "no_encontrada") {
        setPinError(
          `No encontramos una clase con el PIN ${cleanPin}. Revísalo con tu docente o prueba con PISA26.`,
        )
      } else if (resultado.estado === "aula_llena") {
        setPinError("Esta clase ya está completa. Avísale a tu docente.")
      } else {
        localStorage.setItem("ecdulearm_active_pin", cleanPin)

        onStudentEnter()
      }
    } catch {
      setPinError("No pudimos revisar el PIN. Revisa tu internet y vuelve a intentarlo.")
    } finally {
      setPinLoading(false)
    }
  }

  const handleTeacherLogin = async (event: FormEvent) => {
    event.preventDefault()

    setLoginLoading(true)

    setLoginError("")

    try {
      const res = await authController.loginDocente(
        teacherEmail,
        teacherPassword,
      )

      if (res.success) {
        setLoginOpen(false)

        if (res.user?.role === "admin" && onAdminEnter) {
          onAdminEnter()
        } else {
          onTeacherEnter()
        }
      } else {
        setLoginError(res.message)
      }
    } catch {
      setLoginError(
        "No pudimos conectarnos para revisar tus datos. Revisa tu internet y vuelve a intentarlo.",
      )
    } finally {
      setLoginLoading(false)
    }
  }

  const handleAutofillDemo = async () => {
    setTeacherEmail("docente@puce.edu.ec")

    setTeacherPassword("demo123")

    setLoginLoading(true)

    setLoginError("")

    try {
      const res = await authController.loginDocente(
        "docente@puce.edu.ec",
        "demo123",
      )

      if (res.success) {
        setLoginOpen(false)

        onTeacherEnter()
      } else {
        setLoginError(res.message)
      }
    } catch {
      setLoginError("No pudimos abrir la cuenta de prueba. Vuelve a intentarlo en unos segundos.")
    } finally {
      setLoginLoading(false)
    }
  }

  const handleAutofillAdmin = async () => {
    setTeacherEmail("admin@ecdulearn.edu.ec")

    setTeacherPassword("admin123")

    setLoginLoading(true)

    setLoginError("")

    try {
      const res = await authController.loginDocente(
        "admin@ecdulearn.edu.ec",
        "admin123",
      )

      if (res.success) {
        setLoginOpen(false)

        if (onAdminEnter) {
          onAdminEnter()
        } else {
          onTeacherEnter()
        }
      } else {
        setLoginError(res.message)
      }
    } catch {
      setLoginError(
        "No pudimos abrir la cuenta de administración. Vuelve a intentarlo en unos segundos.",
      )
    } finally {
      setLoginLoading(false)
    }
  }

  return (
    <div className="ui-view relative min-h-screen overflow-hidden bg-sand-50 text-sand-950 font-sans">
      <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-ink-100/70 blur-3xl" />
      <header className="relative z-10 flex items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onBackToLanding}
            className="rounded-xl text-left transition hover:opacity-85 focus:outline-none focus:ring-2 focus:ring-ink-400"
            title="Volver a Inicio"
          >
            <Brand dark />
          </button>
          {onBackToLanding && (
            <button
              type="button"
              onClick={onBackToLanding}
              className="hidden sm:inline-flex items-center gap-1 rounded-lg border border-sand-200 bg-sand-50 px-2.5 py-1 text-xs font-semibold text-sand-600 transition hover:bg-sand-100 hover:text-sand-900"
            >
              <span>←</span>
              <span>Inicio</span>
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            setLoginError("")

            setLoginOpen(true)
          }}
          className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-sand-600 transition hover:bg-sand-100 hover:text-ink-950 focus:outline-none focus:ring-4 focus:ring-ink-100"
        >
          <PortalIcon name="lock" className="size-4" />
          Acceso Docentes
        </button>
      </header>

      <main className="relative z-10 grid min-h-[calc(100vh-10rem)] place-items-center px-5 py-12">
        <div className="w-full max-w-xl text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-ink-800 text-white shadow-sm">
            <PortalIcon name="arrow" className="size-6" />
          </span>
          <p className="mt-6 text-sm font-bold uppercase tracking-[0.18em] text-ink-800">
            Acceso para estudiantes
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-sand-950 sm:text-4xl">
            ¿Cuál es el código de tu clase?
          </h1>
          <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-sand-600">
            Escribe el PIN que compartió tu docente. No necesitas cuenta ni
            datos personales.
          </p>

          <form
            onSubmit={enterSession}
            className="mt-9 rounded-2xl border border-sand-300 bg-white p-3 text-left shadow-lg shadow-sand-900/5 sm:flex sm:items-center sm:gap-3"
          >
            <label htmlFor="class-pin" className="sr-only">
              PIN o enlace de la clase
            </label>
            <div className="flex min-h-14 flex-1 items-center gap-3 px-3">
              <PortalIcon
                name="link"
                className="size-5 shrink-0 text-ink-800"
              />
              <input
                id="class-pin"
                value={pin}
                disabled={pinLoading}
                onChange={(event) => {
                  setPin(event.target.value.toUpperCase())

                  setPinError("")
                }}
                placeholder="Ej. PISA26 o RETO26"
                className="min-w-0 flex-1 bg-transparent text-base font-semibold text-sand-900 outline-none placeholder:font-normal placeholder:text-sand-400 uppercase tracking-wider"
                autoComplete="off"
              />
            </div>
            <button
              type="submit"
              disabled={pinLoading}
              className="flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-ink-950 px-6 text-sm font-bold text-white transition hover:bg-ink-900 focus:outline-none focus:ring-4 focus:ring-ink-200 sm:w-auto disabled:opacity-60"
            >
              {pinLoading ? (
                <span>Buscando tu clase…</span>
              ) : (
                <>
                  <span>Entrar a la clase</span>
                  <PortalIcon name="arrow" className="size-4" />
                </>
              )}
            </button>
          </form>

          {pinError && (
            <div
              className="mt-4 rounded-xl border border-hint-300 bg-hint-50 p-3 text-sm font-medium text-hint-900 text-left"
              role="alert"
            >
              <p className="flex items-center gap-2">
                <span>⚠️</span>
                <span>{pinError}</span>
              </p>
            </div>
          )}

          <div className="mt-8 border-t border-sand-300 pt-5">
            <p className="flex items-center justify-center gap-2 text-sm font-semibold text-ink-900">
              <PortalIcon name="shield" className="size-5 text-ink-800" />
              Tu privacidad primero
            </p>
            <p className="mt-2 text-center text-xs leading-relaxed text-sand-600">
              Tu colegio administra esta experiencia. No solicitamos nombres,
              correos ni teléfonos a menores de edad.
            </p>
          </div>
        </div>
      </main>

      <footer className="relative z-10 px-5 pb-6 text-center text-xs text-sand-500">
        Tu colegio administra esta experiencia. ECduLearn no solicita datos
        personales ni crea perfiles de estudiantes.
      </footer>

      {loginOpen && (
        <div className="ui-view fixed inset-0 z-50 grid place-items-center bg-sand-950/50 p-4 backdrop-blur-sm">
          <button
            type="button"
            className="absolute inset-0"
            onClick={() => setLoginOpen(false)}
            aria-label="Cerrar acceso docente"
          />
          <section
            className="ui-pop relative w-full max-w-md rounded-2xl border border-sand-300 bg-sand-50 p-6 shadow-2xl sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-labelledby="teacher-login-title"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="grid size-11 place-items-center rounded-xl bg-ink-950 text-white">
                  <PortalIcon name="lock" className="size-5" />
                </span>
                <h2
                  id="teacher-login-title"
                  className="mt-5 text-2xl font-bold text-sand-950"
                >
                  Acceso institucional
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-sand-600">
                  Entra con el correo y la contraseña que te dio tu colegio.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLoginOpen(false)}
                className="grid size-11 shrink-0 place-items-center rounded-xl text-sand-500 hover:bg-sand-100 focus:outline-none focus:ring-4 focus:ring-ink-100"
                aria-label="Cerrar"
              >
                <PortalIcon name="x" />
              </button>
            </div>

            {loginError && (
              <div
                className="mt-4 rounded-xl border border-hint-300 bg-hint-50 p-3 text-xs font-semibold text-hint-900"
                role="alert"
              >
                ⚠️ {loginError}
              </div>
            )}

            <form className="mt-6 space-y-4" onSubmit={handleTeacherLogin}>
              <div>
                <label
                  htmlFor="institutional-email"
                  className="text-xs font-bold uppercase tracking-wider text-sand-700"
                >
                  Correo institucional
                </label>
                <input
                  id="institutional-email"
                  type="email"
                  required
                  value={teacherEmail}
                  onChange={(e) => setTeacherEmail(e.target.value)}
                  placeholder="docente@puce.edu.ec"
                  className="mt-1.5 min-h-12 w-full rounded-xl border border-sand-300 bg-white px-4 text-sm text-sand-900 outline-none placeholder:text-sand-400 focus:border-ink-700 focus:ring-4 focus:ring-ink-100"
                />
              </div>
              <div>
                <label
                  htmlFor="teacher-password"
                  className="text-xs font-bold uppercase tracking-wider text-sand-700"
                >
                  Contraseña
                </label>
                <input
                  id="teacher-password"
                  type="password"
                  required
                  value={teacherPassword}
                  onChange={(e) => setTeacherPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1.5 min-h-12 w-full rounded-xl border border-sand-300 bg-white px-4 text-sm text-sand-900 outline-none placeholder:text-sand-400 focus:border-ink-700 focus:ring-4 focus:ring-ink-100"
                />
              </div>
              <button
                type="submit"
                disabled={loginLoading}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-ink-950 px-5 text-sm font-bold text-white transition hover:bg-ink-900 focus:outline-none focus:ring-4 focus:ring-ink-200 disabled:opacity-60"
              >
                {loginLoading ? (
                  <span>Entrando…</span>
                ) : (
                  <>
                    <span>Ingresar al panel</span>
                    <PortalIcon name="arrow" className="size-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleAutofillAdmin}
                disabled={loginLoading}
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-hint-500/60 bg-hint-100 px-4 text-xs font-bold text-hint-950 transition hover:bg-hint-200 focus:outline-none focus:ring-4 focus:ring-hint-100"
              >
                <PortalIcon name="shield" className="size-4 text-hint-800" />
                🛡️ Autocompletar como Administrador (admin@ecdulearn.edu.ec)
              </button>

              <button
                type="button"
                onClick={handleAutofillDemo}
                disabled={loginLoading}
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-ink-500/50 bg-ink-50 px-4 text-xs font-bold text-ink-900 transition hover:bg-ink-100 focus:outline-none focus:ring-4 focus:ring-ink-100"
              >
                <PortalIcon name="sparkles" className="size-4 text-ink-700" />
                👨‍🏫 Autocompletar como Docente (docente@puce.edu.ec)
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}

const rooms = [
  {
    name: "Admisión · Razonamiento Numérico",

    subject: "Simulador universitario",

    status: "Activa",

    students: 30,

    updated: "Hace 4 min",
  },

  {
    name: "Funciones y ecuaciones",

    subject: "Matemática · 2do BGU",

    status: "Programada",

    students: 0,

    updated: "Mañana, 08:00",
  },

  {
    name: "Estática aplicada",

    subject: "Ingeniería civil",

    status: "Borrador",

    students: 0,

    updated: "Editada ayer",
  },
]

function saludoDelDia(): string {
  const hora = new Date().getHours()
  if (hora < 12) return "Buenos días"
  if (hora < 19) return "Buenas tardes"
  return "Buenas noches"
}

export function TeacherDashboard({
  onExit,

  onCreateContent,

  onOpenPlanner,

  onOpenAdmin,

  onOpenReporte,
}: {
  onExit: () => void

  onCreateContent: () => void

  onOpenPlanner: () => void

  onOpenAdmin?: () => void

  onOpenReporte?: () => void
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [pinOpen, setPinOpen] = useState(false)

  // Estados UX: loading | active | empty | error

  const [uxState, setUxState] =
    useState<"loading" | "active" | "empty" | "error">("loading")

  const [metricas, setMetricas] = useState<DbMetricasDocente | null>(null)

  const [currentUser, setCurrentUser] = useState<TeacherUser | null>(null)

  const [roomsList, setRoomsList] = useState<any[]>(rooms)

  const loadDashboardData = async () => {
    setUxState("loading")

    try {
      const user = await authController.restoreSession()

      setCurrentUser(user)

      const data = await metricasController.getMetricasEnVivo()

      setMetricas(data)

      // Si no hay salas registradas, se puede reflejar el estado 'empty'

      if (!roomsList || roomsList.length === 0) {
        setUxState("empty")
      } else {
        setUxState("active")
      }
    } catch {
      setUxState("error")
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])


  const teacherName = currentUser?.name || "Docente Demo PUCE"

  const isDemoSession = !currentUser || Boolean(currentUser.isDemo)

  const institutionName =
    currentUser?.institution || "Colegio Experimental San Gabriel de Quito"

  return (
    <div className="ui-view min-h-screen bg-sand-50 text-sand-950 font-sans">
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-sand-950/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Cerrar navegación"
        />
      )}
      <aside
        className={`fixed top-[var(--barra-evaluador,0px)] bottom-0 left-0 z-50 flex w-72 flex-col bg-ink-950 p-4 text-white transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-1">
          <Brand />
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="grid size-11 place-items-center rounded-xl text-ink-100 hover:bg-white/10 lg:hidden"
            aria-label="Cerrar menú"
          >
            <PortalIcon name="x" />
          </button>
        </div>
        <nav className="mt-8 space-y-1" aria-label="Panel docente">
          <button
            type="button"
            className="flex min-h-12 w-full items-center gap-3 rounded-lg border-l-2 border-hint-300 bg-white/10 px-3 text-left text-sm font-bold"
          >
            <PortalIcon name="grid" className="size-5 text-ink-300" />
            Resumen en vivo
          </button>
          <button
            type="button"
            className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold text-ink-100 hover:bg-white/10"
          >
            <PortalIcon name="book" className="size-5" />
            Salas y sesiones
          </button>
          <button
            type="button"
            onClick={onCreateContent}
            className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold text-ink-100 hover:bg-white/10"
          >
            <PortalIcon name="sparkles" className="size-5" />
            Crear con IA
          </button>
          <button
            type="button"
            onClick={onOpenPlanner}
            className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold text-ink-100 hover:bg-white/10"
          >
            <PortalIcon name="book" className="size-5" />
            Planificador ERCA
          </button>
          <button
            type="button"
            onClick={onOpenReporte}
            className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold text-ink-100 hover:bg-white/10"
          >
            <PortalIcon name="chart" className="size-5" />
            Reporte institucional
          </button>
          {onOpenAdmin && currentUser?.role === "admin" && (
            <button
              type="button"
              onClick={onOpenAdmin}
              className="flex min-h-12 w-full items-center gap-3 rounded-xl border border-hint-400/40 bg-hint-950/40 px-3 text-left text-sm font-bold text-hint-300 hover:bg-hint-900/60 transition"
            >
              <PortalIcon name="shield" className="size-5 text-hint-400" />
              Panel Administración
            </button>
          )}
        </nav>
        <div className="mt-auto rounded-2xl border border-white/10 bg-white/10 p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-ink-200">
            <PortalIcon name="shield" className="size-4" />
            Datos protegidos
          </div>
          <p className="mt-2 text-xs leading-relaxed text-ink-100">
            Tus estudiantes son anónimos: aquí solo ves resultados del grupo.
            Cumplimos la LOPDP de Ecuador.
          </p>
        </div>
        <button
          type="button"
          onClick={async () => {
            await authController.logoutDocente()

            onExit()
          }}
          className="mt-3 flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-ink-100 hover:bg-white/10"
        >
          <PortalIcon name="logout" className="size-5" />
          Cerrar sesión
        </button>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-sand-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="grid size-11 shrink-0 place-items-center rounded-xl text-sand-600 hover:bg-sand-100 lg:hidden"
                aria-label="Abrir menú"
              >
                <PortalIcon name="menu" />
              </button>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-ink-950">
                  {institutionName}
                </p>
                <p className="truncate text-xs text-sand-500">
                  {teacherName} ·{" "}
                  {currentUser?.role === "admin" ? "Administración" : currentUser?.role === "coordinador" ? "Coordinación" : "Docente"}
                  {isDemoSession && (
                    <span className="ml-1.5 rounded-full bg-hint-50 px-2 py-0.5 font-bold text-hint-700 ring-1 ring-hint-200">
                      Modo demo
                    </span>
                  )}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPinOpen(true)}
              className="flex min-h-11 items-center gap-2 rounded-xl bg-ink-800 px-3 text-sm font-bold text-white hover:bg-ink-900 focus:outline-none focus:ring-4 focus:ring-ink-200 sm:px-5"
            >
              <PortalIcon name="link" className="size-4" />
              <span className="hidden sm:inline">
                Asignar a Clase (Generar PIN)
              </span>
              <span className="sm:hidden">Generar PIN</span>
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-block size-2 rounded-full bg-ink-600 animate-pulse" />
                <p className="text-sm font-bold text-ink-700">
                  Panel del Docente y Coordinador
                </p>
              </div>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-sand-950">
                {saludoDelDia()}, {teacherName.split(" ")[0]}
              </h1>
              <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-sand-600">
                Así va tu clase hoy.
                {metricas?.isOffline && (
                  <span className="rounded-full bg-hint-50 px-2.5 py-0.5 text-xs font-semibold text-hint-800 ring-1 ring-hint-200">
                    Datos de ejemplo
                  </span>
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={onCreateContent}
              className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-sand-300 bg-white px-4 text-sm font-bold text-sand-700 hover:bg-sand-100 focus:outline-none focus:ring-4 focus:ring-ink-100"
            >
              <PortalIcon name="sparkles" className="size-4 text-ink-700" />
              Crear ejercicio con IA
            </button>
          </div>

          {/* Estado de Error Suave */}
          {uxState === "error" && (
            <div
              className="mt-6 rounded-2xl border border-hint-300 bg-hint-50 p-4 text-hint-900 flex items-center justify-between gap-4"
              role="alert"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">⚠️</span>
                <div>
                  <p className="text-sm font-bold">
                    Aviso de sincronización de métricas
                  </p>
                  <p className="text-xs text-hint-800">
                    No fue posible conectar con las vistas analíticas de la base
                    de datos remota. Se están mostrando métricas de contingencia
                    en caché local.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={loadDashboardData}
                className="shrink-0 rounded-lg bg-hint-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-hint-900"
              >
                Reintentar
              </button>
            </div>
          )}

          {/* Métricas Rápidas: Estado Loading (Skeleton) vs Active */}
          <section
            className="ui-stagger mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
            aria-label="Métricas rápidas"
          >
            {uxState === "loading"
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse rounded-2xl border border-sand-200 bg-white p-5 space-y-3"
                  >
                    <div className="h-3 w-24 bg-sand-200 rounded" />
                    <div className="h-8 w-16 bg-sand-300 rounded" />
                    <div className="h-2 w-32 bg-sand-200 rounded" />
                  </div>
                ))
              : [
                  {
                    label: "Estudiantes Conectados",

                    value: `${metricas?.estudiantesConectados ?? "—"}`,

                    detail: "alumnos activos anónimos",

                    icon: "users" as const,
                  },

                  {
                    label: "Tiempo Docente Ahorrado",

                    value: metricas ? `${metricas.horasAhorradasEstimadas} h` : "—",

                    detail: "vs. 45 min manuales por guía",

                    icon: "clock" as const,
                  },

                  {
                    label: "Resolución con Tutor IA",

                    value: metricas ? `${metricas.pctResueltosConAyuda} %` : "—",

                    detail: "completados sin regalar respuesta",

                    icon: "check" as const,
                  },

                  {
                    label: "Ejercicios y Guías PISA",

                    value: `${metricas?.ejerciciosGenerados ?? "—"}`,

                    detail: "creados y guardados",

                    icon: "chart" as const,
                  },
                ].map((metric) => (
                  <article
                    key={metric.label}
                    className="rounded-2xl border border-sand-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-sand-500">
                          {metric.label}
                        </p>
                        <p className="mt-3 text-3xl font-semibold text-sand-950">
                          {metric.value}
                        </p>
                        <p className="mt-1 text-xs text-sand-500">
                          {metric.detail}
                        </p>
                      </div>
                      <span className="grid size-10 place-items-center rounded-full bg-ink-100 text-ink-900">
                        <PortalIcon name={metric.icon} className="size-5" />
                      </span>
                    </div>
                  </article>
                ))}
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_22rem]">
            <div className="overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sand-200 p-5 sm:p-6">
                <div>
                  <h2 className="text-lg font-semibold text-sand-950">
                    Aulas Virtuales y Sesiones por PIN
                  </h2>
                  <p className="mt-1 text-sm text-sand-500">
                    Sesiones vinculadas a ejercicios PISA en base de datos.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPinOpen(true)}
                  className="flex min-h-11 items-center gap-2 rounded-xl border border-sand-300 px-4 text-sm font-bold text-sand-700 hover:bg-sand-50"
                >
                  <PortalIcon name="plus" className="size-4" />
                  Nueva sesión PIN
                </button>
              </div>

              {uxState === "empty" ? (
                <div className="p-8 text-center">
                  <span className="mx-auto grid size-12 place-items-center rounded-full bg-sand-100 text-sand-600">
                    <PortalIcon name="book" className="size-6" />
                  </span>
                  <h3 className="mt-3 text-base font-bold text-sand-950">
                    No hay aulas activas
                  </h3>
                  <p className="mt-1 text-xs text-sand-500 max-w-sm mx-auto">
                    Crea tu primer reto PISA o asigna una sesión para que tus
                    alumnos ingresen con su PIN.
                  </p>
                  <button
                    type="button"
                    onClick={onCreateContent}
                    className="mt-4 rounded-xl bg-ink-800 px-4 py-2 text-xs font-bold text-white hover:bg-ink-900"
                  >
                    Crear primer reto
                  </button>
                </div>
              ) : (
                <div className="ui-stagger divide-y divide-sand-200">
                  {roomsList.map((room) => (
                    <button
                      key={room.name}
                      type="button"
                      onClick={() => setPinOpen(true)}
                      className="grid w-full gap-3 p-5 text-left transition hover:bg-sand-50 sm:grid-cols-[1fr_auto_auto] sm:items-center sm:px-6"
                    >
                      <span>
                        <span className="block text-sm font-bold text-sand-900">
                          {room.name}
                        </span>
                        <span className="mt-1 block text-xs text-sand-500">
                          {room.subject}
                        </span>
                      </span>
                      <span className="flex items-center gap-2 text-xs text-sand-500 sm:min-w-24">
                        <PortalIcon name="users" className="size-4" />
                        {room.students} alumnos
                      </span>
                      <span className="flex items-center justify-between gap-4 sm:min-w-36">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                            room.status === "Activa"
                              ? "bg-ink-100 text-ink-900"
                              : room.status === "Programada"
                                ? "bg-ink-100 text-ink-900"
                                : "bg-sand-100 text-sand-600"
                          }`}
                        >
                          {room.status}
                        </span>
                        <PortalIcon
                          name="chevron"
                          className="size-4 text-sand-400"
                        />
                      </span>
                      <span className="text-xs text-sand-400 sm:col-start-3">
                        {room.updated}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <aside className="space-y-5">
              <div className="rounded-2xl border border-hint-200 bg-hint-50 p-6 text-sand-900 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-widest text-hint-800">
                  Atención Pedagógica Requerida
                </p>
                <h2 className="mt-3 text-lg font-bold">
                  Paso con mayor bloqueo cognitivo
                </h2>
                <p className="mt-2 text-xl font-bold text-hint-950">
                  {metricas?.pasoBloqueoFrecuente || "Todavía no hay datos"}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-sand-700">
                  {metricas?.pasoBloqueoFrecuente
                    ? `${metricas.estudiantesBloqueados} ${metricas.estudiantesBloqueados === 1 ? "estudiante se trabó" : "estudiantes se trabaron"} en este paso (${metricas.pctBloqueo} % de los intentos).`
                    : "Cuando tus estudiantes marquen en qué parte se trabaron, aquí verás el paso que más cuesta."}
                </p>
                <button
                  type="button"
                  onClick={onCreateContent}
                  className="mt-5 min-h-11 w-full rounded-xl bg-ink-950 px-4 text-sm font-bold text-white hover:bg-ink-900"
                >
                  Generar refuerzo adaptativo con IA
                </button>
              </div>

              <div className="rounded-2xl border border-sand-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-bold text-sand-800">
                  <PortalIcon name="shield" className="size-5 text-ink-700" />
                  Métricas Agregadas y Éticas
                </div>
                <p className="mt-2 text-xs leading-relaxed text-sand-500">
                  Los datos describen patrones colectivos de razonamiento
                  lógico, jamás perfiles individuales ni datos identificables de
                  estudiantes.
                </p>
              </div>
            </aside>
          </section>
        </main>
      </div>

      {pinOpen && (
        <PublicarAulaDialog onClose={() => setPinOpen(false)} onIrAlAsistente={onCreateContent} />
      )}
    </div>
  )
}
