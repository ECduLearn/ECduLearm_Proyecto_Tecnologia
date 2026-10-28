import { Suspense, lazy, useEffect } from "react";
import { LandingPage } from "./LandingPage";

// Vistas con carga diferida: la landing no descarga el código del portal, el panel ni la zona del estudiante
const cargarPortal = () => import("./Portal");
const cargarZonaEstudiante = () => import("./AutonomousZone");
const AccessPortal = lazy(() => cargarPortal().then((m) => ({ default: m.AccessPortal })));
const TeacherDashboard = lazy(() => cargarPortal().then((m) => ({ default: m.TeacherDashboard })));
const AutonomousZone = lazy(cargarZonaEstudiante);
const PlanningWorkspace = lazy(() => import("./AdvancedModules").then((m) => ({ default: m.PlanningWorkspace })));
const AdmissionSimulator = lazy(() => import("./views/SimuladorAdmision"));
const AsistenteDocente = lazy(() => import("./views/AsistenteDocente"));
const EditorGuia = lazy(() => import("./views/EditorGuia"));
const BarraEvaluador = lazy(() => import("./components/BarraEvaluador").then((m) => ({ default: m.EvaluatorTopBar })));
const BotonEvaluador = lazy(() => import("./components/BarraEvaluador").then((m) => ({ default: m.EvaluatorPill })));
const ReporteInstitucional = lazy(() => import("./views/ReporteInstitucional"));
const RestablecerClave = lazy(() => import("./views/RestablecerClave"));
const AdminDashboard = lazy(() => import("./AdminDashboard").then((m) => ({ default: m.AdminDashboard })));
import { AppView, useAppRouter } from "./router";
export type { AppView } from "./router";

// La barra del evaluador se carga aparte; mientras llega no se muestra nada en su lugar
function EvaluatorTopBar(props: { currentView: AppView; onViewChange: (v: AppView) => void }) {
  return (
    <Suspense fallback={null}>
      <BarraEvaluador {...props} />
    </Suspense>
  )
}

function EvaluatorPill(props: { currentView: AppView; onViewChange: (v: AppView) => void }) {
  return (
    <Suspense fallback={null}>
      <BotonEvaluador {...props} />
    </Suspense>
  )
}

function App() {
  // Con la landing ya pintada y el navegador libre, se precargan los siguientes pasos habituales
  useEffect(() => {
    const precargar = () => {
      cargarPortal()
      cargarZonaEstudiante()
    }
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(precargar, { timeout: 3000 })
      return () => window.cancelIdleCallback(id)
    }
    const id = setTimeout(precargar, 1500)
    return () => clearTimeout(id)
  }, [])

  const { view, setView } = useAppRouter()

  if (view === "landing") {
    return (
      <LandingPage
        onEnterApp={() => setView("portal")}
        onNavigate={(target) => setView(target as AppView)}
        onStudentEnter={(pin) => {
          if (pin) localStorage.setItem("ecdulearm_active_pin", pin)

          setView("student")
        }}
      />
    )
  }

  if (view === "portal") {
    return (
      <>
        <EvaluatorTopBar currentView={view} onViewChange={setView} />
        <AccessPortal
          onStudentEnter={() => setView("student")}
          onTeacherEnter={() => setView("dashboard")}
          onAdminEnter={() => setView("admin")}
          onBackToLanding={() => setView("landing")}
        />
        <EvaluatorPill currentView={view} onViewChange={setView} />
      </>
    )
  }

  if (view === "student") {
    return (
      <>
        <EvaluatorTopBar currentView={view} onViewChange={setView} />
        <AutonomousZone
          onExit={() => setView("portal")}
          onSimulator={() => setView("simulator")}
        />
        <EvaluatorPill currentView={view} onViewChange={setView} />
      </>
    )
  }

  if (view === "dashboard") {
    return (
      <>
        <EvaluatorTopBar currentView={view} onViewChange={setView} />
        <TeacherDashboard
          onExit={() => setView("portal")}
          onCreateContent={() => setView("chat")}
          onOpenPlanner={() => setView("planner")}
          onOpenAdmin={() => setView("admin")}
          onOpenReporte={() => setView("reporte")}
        />
        <EvaluatorPill currentView={view} onViewChange={setView} />
      </>
    )
  }

  if (view === "reporte") {
    return (
      <>
        <EvaluatorTopBar currentView={view} onViewChange={setView} />
        <ReporteInstitucional onVolver={() => setView("dashboard")} />
        <EvaluatorPill currentView={view} onViewChange={setView} />
      </>
    )
  }

  if (view === "restablecer") {
    return <RestablecerClave onIrAlPortal={() => setView("portal")} />
  }

  if (view === "admin") {
    return (
      <>
        <EvaluatorTopBar currentView={view} onViewChange={setView} />
        <AdminDashboard
          onExit={() => setView("portal")}
          onNavigateTeacher={() => setView("dashboard")}
          onNavigateLanding={() => setView("landing")}
        />
        <EvaluatorPill currentView={view} onViewChange={setView} />
      </>
    )
  }

  if (view === "planner") {
    return (
      <>
        <EvaluatorTopBar currentView={view} onViewChange={setView} />
        <PlanningWorkspace onBack={() => setView("dashboard")} />
        <EvaluatorPill currentView={view} onViewChange={setView} />
      </>
    )
  }

  if (view === "simulator") {
    return (
      <>
        <EvaluatorTopBar currentView={view} onViewChange={setView} />
        <AdmissionSimulator onBack={() => setView("student")} />
        <EvaluatorPill currentView={view} onViewChange={setView} />
      </>
    )
  }

  if (view === "editor") {
    return (
      <>
        <EvaluatorTopBar currentView={view} onViewChange={setView} />
        <EditorGuia onBack={() => setView("chat")} />
        <EvaluatorPill currentView={view} onViewChange={setView} />
      </>
    )
  }

  return <AsistenteDocente view={view} setView={setView} />
}

export default App
