import { ReactNode, Suspense, lazy, useEffect } from "react";
import { LandingPage } from "./LandingPage";
import { BarraDesarrollo, BotonDesarrollo } from "./components/BarraDesarrollo";

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
const ReporteInstitucional = lazy(() => import("./views/ReporteInstitucional"));
const RestablecerClave = lazy(() => import("./views/RestablecerClave"));
const AdminDashboard = lazy(() => import("./AdminDashboard").then((m) => ({ default: m.AdminDashboard })));
// Las guardas usan dbService: se cargan junto con la vista protegida, no con la landing
const RutaDocente = lazy(() => import("./components/RutasProtegidas").then((m) => ({ default: m.RutaDocente })));
const RutaEstudiante = lazy(() => import("./components/RutasProtegidas").then((m) => ({ default: m.RutaEstudiante })));
import { AppView, useAppRouter } from "./router";
export type { AppView } from "./router";

const VISTAS_DOCENTE: AppView[] = ["dashboard", "chat", "editor", "planner", "reporte"];
const VISTAS_ESTUDIANTE: AppView[] = ["student", "simulator"];

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
        onStudentEnter={(pin) => {
          if (pin) localStorage.setItem("ecdulearm_active_pin", pin)
          setView("student")
        }}
      />
    )
  }

  if (view === "restablecer") {
    return <RestablecerClave onIrAlPortal={() => setView("portal")} />
  }

  let contenido: ReactNode
  switch (view) {
    case "portal":
      contenido = (
        <AccessPortal
          onStudentEnter={() => setView("student")}
          onTeacherEnter={() => setView("dashboard")}
          onAdminEnter={() => setView("admin")}
          onBackToLanding={() => setView("landing")}
        />
      )
      break
    case "student":
      contenido = <AutonomousZone onExit={() => setView("landing")} onSimulator={() => setView("simulator")} />
      break
    case "simulator":
      contenido = <AdmissionSimulator onBack={() => setView("student")} />
      break
    case "dashboard":
      contenido = (
        <TeacherDashboard
          onExit={() => setView("portal")}
          onCreateContent={() => setView("chat")}
          onOpenPlanner={() => setView("planner")}
          onOpenAdmin={() => setView("admin")}
          onOpenReporte={() => setView("reporte")}
        />
      )
      break
    case "reporte":
      contenido = <ReporteInstitucional onVolver={() => setView("dashboard")} />
      break
    case "planner":
      contenido = <PlanningWorkspace onBack={() => setView("dashboard")} />
      break
    case "editor":
      contenido = <EditorGuia onBack={() => setView("chat")} />
      break
    case "admin":
      contenido = (
        <AdminDashboard
          onExit={() => setView("portal")}
          onNavigateTeacher={() => setView("dashboard")}
          onNavigateLanding={() => setView("landing")}
        />
      )
      break
    default:
      contenido = <AsistenteDocente setView={setView} />
  }

  if (VISTAS_DOCENTE.includes(view)) {
    contenido = (
      <Suspense fallback={null}>
        <RutaDocente onSinSesion={() => setView("portal")}>{contenido}</RutaDocente>
      </Suspense>
    )
  } else if (VISTAS_ESTUDIANTE.includes(view)) {
    contenido = (
      <Suspense fallback={null}>
        <RutaEstudiante onSinSesion={() => setView("landing")}>{contenido}</RutaEstudiante>
      </Suspense>
    )
  }

  return (
    <>
      <BarraDesarrollo currentView={view} onViewChange={setView} />
      {contenido}
      <BotonDesarrollo currentView={view} onViewChange={setView} />
    </>
  )
}

export default App
