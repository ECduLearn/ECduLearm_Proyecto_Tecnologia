import { useEffect, useRef, useState } from "react"
import type { AppView } from "@/router"
import { getAIStatus, testAIConnection } from "@/services/aiService"
import { getSupabaseClient, getSupabaseConfig, getSupabaseOverride, setSupabaseConfig } from "@/services/supabaseClient"

// Import dinámico: dbService (y supabase-js) no entra en el chunk de la barra
async function irComoAdmin(onViewChange: (view: AppView) => void) {
  const { authController } = await import("@/services/dbService")
  if (authController.getCurrentUser()?.role !== "admin") {
    await authController.loginDocente("admin@ecdulearn.edu.ec", "admin123")
  }
  onViewChange("admin")
}

export function EvaluatorTopBar({
  currentView,

  onViewChange,
}: {
  currentView: AppView

  onViewChange: (v: AppView) => void
}) {
  const [copied, setCopied] = useState(false)

  const [collapsed, setCollapsed] = useState(false)

  const [keyModalOpen, setKeyModalOpen] = useState(false)

  const [modalTab, setModalTab] = useState<"ai" | "database">("ai")

  // Estado de la IA (la clave vive en el servidor)
  const [aiOnline, setAiOnline] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  // Supabase state

  const [supabaseUrl, setSupabaseUrl] = useState("")

  const [supabaseKey, setSupabaseKey] = useState("")

  const [isDbConnected, setIsDbConnected] = useState(false)

  const [dbTestResult, setDbTestResult] = useState<{
    success: boolean
    message: string
  } | null>(null)

  const [isDbTesting, setIsDbTesting] = useState(false)

  const [supabaseOverride, setSupabaseOverride] = useState(getSupabaseOverride())

  // Publica la altura de la barra en --barra-evaluador para que las barras laterales fijas empiecen debajo
  const barraRef = useRef<HTMLElement>(null)
  useEffect(() => {
    const raiz = document.documentElement
    const barra = barraRef.current
    if (collapsed || !barra) {
      raiz.style.setProperty("--barra-evaluador", "0px")
      return
    }
    const medir = () => raiz.style.setProperty("--barra-evaluador", `${barra.offsetHeight}px`)
    medir()
    const observador = new ResizeObserver(medir)
    observador.observe(barra)
    return () => {
      observador.disconnect()
      raiz.style.setProperty("--barra-evaluador", "0px")
    }
  }, [collapsed])

  useEffect(() => {
    let active = true;
    getAIStatus().then((status) => {
      if (active) setAiOnline(status.online);
    });

    const dbConfig = getSupabaseConfig();
    setSupabaseUrl(dbConfig.url);
    setSupabaseKey(dbConfig.anonKey);
    setIsDbConnected(Boolean(dbConfig.url && dbConfig.anonKey));
    setSupabaseOverride(getSupabaseOverride());
    return () => {
      active = false;
    };
  }, [keyModalOpen]);

  const handleTestAI = async () => {
    setIsTesting(true);
    setTestResult(null);
    const result = await testAIConnection();
    setTestResult(result);
    setAiOnline(result.success);
    setIsTesting(false);
  };

  const handleSaveAndTestDb = async () => {
    setIsDbTesting(true)

    setDbTestResult(null)

    setSupabaseConfig(supabaseUrl, supabaseKey)

    setIsDbConnected(Boolean(supabaseUrl.trim() && supabaseKey.trim()))

    setSupabaseOverride(getSupabaseOverride())

    const client = getSupabaseClient()

    if (!client) {
      setDbTestResult({
        success: false,

        message:
          "Falta la dirección del proyecto o su clave pública. Las encuentras en Supabase, en Project Settings → API.",
      })

      setIsDbTesting(false)

      return
    }

    try {
      // Probar conexión contra esquema v2 (aulas_virtuales) o v1 (pin_sessions)

      let tableName = "aulas_virtuales"

      let testQuery = await client
        .from("aulas_virtuales")
        .select("pin_acceso, activa")
        .limit(5)

      // PostgREST responde PGRST205 cuando la tabla no existe (esquema v1)
      if (
        testQuery.error &&
        (testQuery.error.code === "PGRST205" ||
          testQuery.error.code === "42P01")
      ) {
        tableName = "pin_sessions"

        testQuery = await client
          .from("pin_sessions")
          .select("pin_acceso:pin, activa:active")
          .limit(5)
      }

      const { data, error } = testQuery

      if (error) {
        setDbTestResult({
          success: false,

          message: `Nos conectamos, pero la base de datos todavía no tiene las tablas de ECduLearn. Ejecuta supabase/schema.sql en el SQL Editor de Supabase y vuelve a probar. (Detalle: ${error.code})`,
        })
      } else {
        const pinList = data
          ?.map((d) => d.pin_acceso)
          .filter(Boolean)
          .join(", ")

        setDbTestResult({
          success: true,

          message: data?.length
            ? `Todo bien: la base de datos responde y tiene ${data.length === 1 ? "1 aula" : `${data.length} aulas`} (${pinList}).`
            : `Todo bien: la base de datos responde, aunque todavía no tiene aulas creadas.${tableName === "pin_sessions" ? " Usa el esquema antiguo (v1)." : ""}`,
        })
      }
    } catch (err) {
      setDbTestResult({
        success: false,

        message: "No pudimos conectar con la base de datos. Revisa la dirección y la clave, o tu conexión a internet.",
      })
    } finally {
      setIsDbTesting(false)
    }
  }

  const handleClearDb = () => {
    setSupabaseConfig("", "")

    // Al quitar la configuración manual vuelve a regir la del despliegue
    const dbConfig = getSupabaseConfig()

    setSupabaseUrl(dbConfig.url)

    setSupabaseKey(dbConfig.anonKey)

    setIsDbConnected(Boolean(dbConfig.url && dbConfig.anonKey))

    setSupabaseOverride(null)

    setDbTestResult({
      success: true,

      message: dbConfig.url
        ? `Listo. Volvimos a la base de datos del despliegue (${new URL(dbConfig.url).host}).`
        : "Listo. Sin base de datos configurada, la información se guarda solo en este navegador.",
    })
  }

  const copyPin = async () => {
    try {
      await navigator.clipboard.writeText("PISA26")

      setCopied(true)

      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(true)

      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (collapsed) {
    return (
      <div className="fixed top-2 right-2 z-50 print:hidden font-sans">
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="flex items-center gap-1.5 rounded-full bg-sand-950/90 border border-hint-400/60 px-3 py-1 text-[11px] font-bold text-hint-300 shadow-lg backdrop-blur hover:bg-sand-900"
          title="Mostrar barra de evaluación rápida"
        >
          <span>⚖️ Barra Evaluador</span>
        </button>
      </div>
    )
  }

  return (
    <>
      <aside
        ref={barraRef}
        aria-label="Barra de evaluación rápida para el jurado"
        className="sticky top-0 z-50 w-full bg-sand-950/95 border-b border-sand-800 text-white backdrop-blur-md px-3 py-1.5 text-xs font-sans print:hidden shadow-md"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 font-bold text-hint-300">
              <span className="inline-block size-2 rounded-full bg-ink-400 animate-pulse" />
              ⚖️ Modo Demo Evaluador
            </span>
            <span className="hidden sm:inline text-sand-400 text-[11px]">
              | Control 1
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => onViewChange("landing")}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                currentView === "landing"
                  ? "bg-ink-500 text-sand-950 shadow-sm font-bold ring-1 ring-ink-300"
                  : "bg-sand-800/80 text-sand-200 hover:bg-sand-700"
              }`}
            >
              🏠 Inicio / Landing
            </button>
            <button
              type="button"
              onClick={() => onViewChange("chat")}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                currentView === "chat" || currentView === "editor"
                  ? "bg-ink-600 text-white shadow-sm font-bold ring-1 ring-ink-400"
                  : "bg-sand-800/80 text-sand-200 hover:bg-sand-700"
              }`}
            >
              💬 Chat Docente (Gemini IA)
            </button>
            <button
              type="button"
              onClick={() => onViewChange("dashboard")}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                currentView === "dashboard"
                  ? "bg-ink-600 text-white shadow-sm font-bold ring-1 ring-ink-400"
                  : "bg-sand-800/80 text-sand-200 hover:bg-sand-700"
              }`}
            >
              📊 Panel Métricas
            </button>
            <button
              type="button"
              onClick={() => {
                localStorage.setItem("ecdulearm_active_pin", "PISA26")

                onViewChange("student")
              }}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                currentView === "student"
                  ? "bg-ink-500 text-sand-950 shadow-sm font-bold ring-1 ring-ink-300"
                  : "bg-sand-800/80 text-sand-200 hover:bg-sand-700"
              }`}
            >
              🎓 Vista Estudiante (PIN: PISA26)
            </button>
            <button
              type="button"
              onClick={() => onViewChange("portal")}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                currentView === "portal"
                  ? "bg-sand-700 text-white font-bold"
                  : "text-sand-300 hover:bg-sand-800"
              }`}
            >
              🚪 Portal Acceso
            </button>
            <button
              type="button"
              onClick={() => onViewChange("planner")}
              className={`hidden md:inline-block rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                currentView === "planner"
                  ? "bg-sand-700 text-white font-bold"
                  : "text-sand-300 hover:bg-sand-800"
              }`}
            >
              📋 Planificador ERCA
            </button>
            <button
              type="button"
              onClick={() => onViewChange("simulator")}
              className={`hidden md:inline-block rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                currentView === "simulator"
                  ? "bg-sand-700 text-white font-bold"
                  : "text-sand-300 hover:bg-sand-800"
              }`}
            >
              🎯 Simulador Admisión
            </button>
            <button
              type="button"
              onClick={() => irComoAdmin(onViewChange)}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                currentView === "admin"
                  ? "bg-hint-600 text-white shadow-sm ring-1 ring-hint-300"
                  : "bg-hint-950/70 text-hint-300 border border-hint-700/50 hover:bg-hint-900/80"
              }`}
              title="Panel de Administración y Control de Usuarios"
            >
              🛡️ Admin / Usuarios
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setModalTab("ai")

                setKeyModalOpen(true)
              }}
              className={`flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-[11px] font-semibold transition ${
                aiOnline
                  ? "border-ink-500/60 bg-ink-950/70 text-ink-300 hover:bg-ink-900/60"
                  : "border-sand-700 bg-sand-900 text-sand-300 hover:bg-sand-800"
              }`}
              title="Ver o probar la conexión con Google Gemini"
            >
              <span className={`inline-block size-1.5 rounded-full ${aiOnline ? "bg-ink-400" : "bg-hint-400"}`} />
              <span>{aiOnline ? "IA conectada" : "IA sin conexión"}</span>
              <span className="text-[10px]">⚙️</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setModalTab("database")

                setKeyModalOpen(true)
              }}
              className={`flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-[11px] font-semibold transition ${
                isDbConnected
                  ? "border-ink-500/60 bg-ink-950/70 text-ink-300 hover:bg-ink-900/60"
                  : "border-sand-700 bg-sand-900 text-sand-300 hover:bg-sand-800"
              }`}
              title="Configurar o probar persistencia en base de datos Supabase PostgreSQL"
            >
              <span
                className={`inline-block size-1.5 rounded-full ${
                  isDbConnected ? "bg-ink-400" : "bg-hint-400"
                }`}
              />
              <span>
                {supabaseOverride
                  ? "Base de datos manual ⚠️"
                  : isDbConnected
                    ? "Base de datos en línea"
                    : "Solo este navegador"}
              </span>
              <span className="text-[10px]">🗄️</span>
            </button>

            <button
              type="button"
              onClick={copyPin}
              className="flex items-center gap-1 rounded bg-ink-950/80 border border-ink-500/40 px-2 py-0.5 text-[11px] font-mono text-ink-300 hover:bg-ink-900/80 transition"
              title="Copiar PIN PISA26 al portapapeles"
            >
              <span>
                PIN: <strong>PISA26</strong>
              </span>
              <span className="text-[10px] text-ink-400">
                {copied ? "✓ Copiado" : "📋"}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              className="text-sand-400 hover:text-sand-200 px-1 py-0.5 text-xs"
              title="Ocultar barra evaluador"
              aria-label="Ocultar barra evaluador"
            >
              ✕
            </button>
          </div>
        </div>
      </aside>

      {keyModalOpen && (
        <div className="ui-view fixed inset-0 z-50 grid place-items-center bg-sand-950/60 p-4 backdrop-blur-sm print:hidden font-sans">
          <div className="ui-pop w-full max-w-lg rounded-2xl border border-sand-700 bg-sand-900 p-6 text-white shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-sand-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-hint-300 flex items-center gap-2">
                  <span>Conexiones de la plataforma</span>
                </h3>
                <p className="mt-1 text-xs text-sand-400">
                  Gestión para el jurado / evaluador: Inteligencia Artificial y
                  Base de Datos
                </p>
              </div>
              <button
                type="button"
                onClick={() => setKeyModalOpen(false)}
                className="text-sand-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {/* Pestañas Modal */}
            <div className="flex items-center gap-2 border-b border-sand-800 pt-3 pb-2 text-xs">
              <button
                type="button"
                onClick={() => setModalTab("ai")}
                className={`rounded-lg px-3 py-1.5 font-bold transition ${
                  modalTab === "ai"
                    ? "bg-ink-600 text-white shadow"
                    : "text-sand-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                Inteligencia artificial
              </button>
              <button
                type="button"
                onClick={() => setModalTab("database")}
                className={`rounded-lg px-3 py-1.5 font-bold transition ${
                  modalTab === "database"
                    ? "bg-hint-500 text-sand-950 shadow"
                    : "text-sand-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                Base de datos
              </button>
            </div>

            {modalTab === "ai" ? (
              <div className="mt-4 space-y-4 text-xs">
                <div className="rounded-xl border border-sand-800 bg-sand-950/80 p-3">
                  <p className="text-sand-300 font-semibold mb-1">Estado de la IA en este momento:</p>
                  {aiOnline ? (
                    <p className="text-ink-400 flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-ink-400" />
                      <strong>Conectada.</strong> El asistente docente y el tutor responden con Google Gemini.
                    </p>
                  ) : (
                    <p className="text-hint-400 flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-hint-400" />
                      <strong>Sin conexión.</strong> Mientras tanto, la plataforma responde con ejercicios y pistas preparados de antemano.
                    </p>
                  )}
                </div>

                <p className="text-[11px] leading-relaxed text-sand-400">
                  La clave de Gemini se configura en el servidor (variable <code className="font-mono text-sand-200">GEMINI_API_KEY</code> en
                  Vercel o en <code className="font-mono text-sand-200">.env</code> en local). El navegador nunca la recibe.
                </p>

                {testResult && (
                  <div
                    role="status"
                    className={`rounded-xl border p-3 ${
                      testResult.success
                        ? "border-ink-500/50 bg-ink-950/50 text-ink-200"
                        : "border-hint-500/50 bg-hint-950/50 text-hint-200"
                    }`}
                  >
                    <p className="font-semibold">
                      {testResult.success ? "Funciona" : "Algo no salió bien"}
                    </p>
                    <p className="mt-0.5 text-[11px] leading-relaxed">
                      {testResult.message}
                    </p>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    disabled={isTesting}
                    onClick={handleTestAI}
                    className="flex-1 min-h-[44px] rounded-xl bg-ink-600 px-4 py-2.5 font-bold text-white transition hover:bg-ink-500 disabled:opacity-50"
                  >
                    {isTesting ? "Probando…" : "Probar la IA"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-4 text-xs">
                {supabaseOverride && (
                  <div
                    role="alert"
                    className="rounded-xl border border-hint-500/50 bg-hint-950/60 p-3 text-hint-100"
                  >
                    <p className="font-semibold">
                      ⚠️ Este navegador usa una base de datos distinta a la del despliegue
                    </p>
                    <p className="mt-1 text-[11px] leading-relaxed text-hint-200">
                      Guardada aquí:{" "}
                      <code className="font-mono">
                        {new URL(supabaseOverride.url).host}
                      </code>
                      <br />
                      Del despliegue:{" "}
                      <code className="font-mono">
                        {new URL(supabaseOverride.buildUrl).host}
                      </code>
                    </p>
                    <button
                      type="button"
                      onClick={handleClearDb}
                      className="mt-2 min-h-[44px] w-full rounded-lg bg-hint-500 px-3 font-bold text-sand-950 transition hover:bg-hint-400"
                    >
                      Usar la del despliegue
                    </button>
                  </div>
                )}

                <div className="rounded-xl border border-sand-800 bg-sand-950/80 p-3">
                  <p className="text-sand-300 font-semibold mb-1">
                    Estado de la Base de Datos:
                  </p>
                  {isDbConnected ? (
                    <p className="text-hint-400 flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-hint-400" />
                      <strong>En línea.</strong> Las aulas, los PIN y los ejercicios se comparten entre computadoras y celulares.
                    </p>
                  ) : (
                    <p className="text-hint-400 flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-hint-400" />
                      <strong>Solo este navegador.</strong> Las aulas y los PIN se guardan aquí y no se ven desde otros equipos.
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="supabase-url-input"
                    className="block font-semibold text-sand-200 mb-1"
                  >
                    Project URL de Supabase:
                  </label>
                  <input
                    id="supabase-url-input"
                    type="text"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    placeholder="https://xyzcompany.supabase.co"
                    className="w-full rounded-xl border border-sand-700 bg-sand-950 px-3 py-2 text-xs text-white outline-none focus:border-hint-400 font-mono"
                  />
                </div>

                <div>
                  <label
                    htmlFor="supabase-key-input"
                    className="block font-semibold text-sand-200 mb-1"
                  >
                    Anon Public Key (Clave Pública Anónima):
                  </label>
                  <input
                    id="supabase-key-input"
                    type="password"
                    value={supabaseKey}
                    onChange={(e) => setSupabaseKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full rounded-xl border border-sand-700 bg-sand-950 px-3 py-2 text-xs text-white outline-none focus:border-hint-400 font-mono"
                  />
                  <p className="mt-1.5 text-[11px] text-sand-400">
                    Crea tu proyecto gratuito en{" "}
                    <a
                      href="https://supabase.com"
                      target="_blank"
                      rel="noreferrer"
                      className="text-hint-400 underline hover:text-hint-300"
                    >
                      supabase.com
                    </a>{" "}
                    y ejecuta el script disponible en{" "}
                    <span className="font-mono text-hint-300">
                      supabase/schema.sql
                    </span>
                    .
                  </p>
                </div>

                {dbTestResult && (
                  <div
                    className={`rounded-xl border p-3 ${
                      dbTestResult.success
                        ? "border-emerald-500/50 bg-emerald-950/50 text-emerald-200"
                        : "border-hint-500/50 bg-hint-950/50 text-hint-200"
                    }`}
                  >
                    <p className="font-semibold">
                      {dbTestResult.success
                        ? "✅ Conexión Exitosa"
                        : "⚠️ Aviso de Base de Datos"}
                    </p>
                    <p className="mt-0.5 text-[11px] leading-relaxed">
                      {dbTestResult.message}
                    </p>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    disabled={isDbTesting}
                    onClick={handleSaveAndTestDb}
                    className="flex-1 rounded-xl bg-hint-500 px-4 py-2.5 font-bold text-sand-950 transition hover:bg-hint-400 disabled:opacity-50"
                  >
                    {isDbTesting
                      ? "Comprobando..."
                      : "Guardar y Probar Conexión BD"}
                  </button>
                  {isDbConnected && (
                    <button
                      type="button"
                      onClick={handleClearDb}
                      className="rounded-xl border border-sand-700 bg-sand-800 px-3 py-2.5 font-semibold text-sand-300 hover:bg-sand-700"
                    >
                      Usar Solo Local
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export function EvaluatorPill({
  currentView,
  onViewChange,
}: {
  currentView: AppView
  onViewChange: (v: AppView) => void
}) {
  const [open, setOpen] = useState(false)

  const viewsList: [AppView, string][] = [
    ["landing", "🏠 Inicio / Landing"],

    ["portal", "Portal Acceso"],

    ["dashboard", "Panel Docente"],

    ["chat", "Chat IA Docente"],

    ["editor", "Editor de Guía"],

    ["planner", "Planificador ERCA"],

    ["student", "Zona Estudiante"],

    ["simulator", "Simulador Admisión"],

    ["admin", "🛡️ Administración"],
  ]

  return (
    <div className="fixed bottom-3 right-3 z-50 print:hidden font-sans">
      {open ? (
        <div className="rounded-2xl border border-sand-700 bg-sand-950/95 p-3 text-white shadow-2xl backdrop-blur-md text-xs">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-2 mb-2">
            <span className="font-bold text-hint-300">
              ⚖️ Modo Jurado / Evaluador
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-sand-400 hover:text-white px-1"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {viewsList.map(([v, label]) => (
              <button
                key={v}
                type="button"
                onClick={() => {
                  if (v === "admin") irComoAdmin(onViewChange)
                  else onViewChange(v)
                  setOpen(false)
                }}
                className={`rounded-lg px-2.5 py-1.5 text-left font-medium transition ${
                  currentView === v
                    ? "bg-ink-500 text-sand-950 font-bold"
                    : "hover:bg-white/10 text-sand-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 rounded-full bg-sand-900/90 border border-hint-400/50 px-3 py-1.5 text-xs font-bold text-hint-300 shadow-xl backdrop-blur hover:bg-sand-800"
          title="Menú rápido para jurado / evaluador"
        >
          <span>⚖️ Evaluador</span>
        </button>
      )}
    </div>
  )
}
