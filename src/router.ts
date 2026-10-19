import { useCallback, useEffect, useState } from "react";

export type AppView =
  | "landing"
  | "portal"
  | "student"
  | "dashboard"
  | "planner"
  | "simulator"
  | "chat"
  | "editor";

export const VIEW_PATHS: Record<AppView, string> = {
  landing: "/",
  portal: "/portal",
  student: "/estudiante",
  dashboard: "/docente",
  chat: "/chat",
  planner: "/planificador",
  simulator: "/simulador",
  editor: "/editor",
};

export const VIEW_TITLES: Record<AppView, string> = {
  landing: "ECduLearm - Plataforma EdTech SaaS B2B Ecuador",
  portal: "Portal de Acceso | ECduLearm",
  student: "Aula Virtual & Tutor Socrático | ECduLearm",
  dashboard: "Panel de Gestión Docente | ECduLearm",
  chat: "Generador de Problemas PISA | ECduLearm",
  planner: "Planificador Curricular ERCA | ECduLearm",
  simulator: "Simulador de Admisión Universitaria | ECduLearm",
  editor: "Editor de Ejercicio | ECduLearm",
};

/**
 * Normaliza y resuelve la vista de la aplicación según la ruta amigable de la URL.
 */
export function getViewFromPath(pathname: string): AppView {
  if (!pathname) return "landing";

  // Normalizar ruta: minúsculas, sin barra final repetida
  const clean = pathname.toLowerCase().replace(/\/+$/, "") || "/";

  switch (clean) {
    case "/":
    case "/landing":
    case "/inicio":
      return "landing";

    case "/portal":
    case "/acceso":
    case "/login":
      return "portal";

    case "/estudiante":
    case "/aula":
    case "/student":
    case "/zona-estudiante":
      return "student";

    case "/docente":
    case "/panel":
    case "/dashboard":
    case "/panel-docente":
      return "dashboard";

    case "/chat":
    case "/generador":
    case "/docente/chat":
    case "/ia":
      return "chat";

    case "/planificador":
    case "/planner":
    case "/docente/planificador":
    case "/planificacion":
      return "planner";

    case "/simulador":
    case "/admision":
    case "/simulator":
      return "simulator";

    case "/editor":
      return "editor";

    default:
      return "landing";
  }
}

/**
 * Obtiene la URL canónica (Friendly URL) para una vista específica.
 */
export function getPathForView(view: AppView): string {
  return VIEW_PATHS[view] || "/";
}

/**
 * Hook para la gestión de rutas amigables en el cliente (SPA Friendly URLs)
 * con sincronización con HTML5 History API y control de eventos popstate.
 */
export function useAppRouter() {
  const [view, setViewState] = useState<AppView>(() => {
    if (typeof window !== "undefined") {
      return getViewFromPath(window.location.pathname);
    }
    return "landing";
  });

  const navigateTo = useCallback(
    (next: AppView | string, options?: { replace?: boolean }) => {
      // Si se pasa un path directo como "/portal" o "/estudiante", resolver la vista correspondiente
      const targetView: AppView =
        typeof next === "string" && next in VIEW_PATHS
          ? (next as AppView)
          : typeof next === "string" && next.startsWith("/")
          ? getViewFromPath(next)
          : (next as AppView);

      const targetPath = getPathForView(targetView);

      if (typeof window !== "undefined") {
        if (window.location.pathname !== targetPath) {
          if (options?.replace) {
            window.history.replaceState({ view: targetView }, "", targetPath);
          } else {
            window.history.pushState({ view: targetView }, "", targetPath);
          }
        }

        // Actualizar título de la pestaña del navegador
        document.title = VIEW_TITLES[targetView] || "ECduLearm";

        // Scroll al tope al navegar
        window.scrollTo({ top: 0, behavior: "instant" });
      }

      setViewState(targetView);
    },
    []
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Sincronización inicial
    const initialView = getViewFromPath(window.location.pathname);
    setViewState(initialView);
    document.title = VIEW_TITLES[initialView] || "ECduLearm";

    // Si la ruta escrita fue un alias como /acceso o /inicio, normalizar a la URL canónica
    const canonical = getPathForView(initialView);
    if (window.location.pathname !== canonical && window.location.pathname !== "/") {
      window.history.replaceState({ view: initialView }, "", canonical);
    }

    // Escuchar botones de Atrás y Adelante del navegador
    const handlePopState = () => {
      const currentView = getViewFromPath(window.location.pathname);
      setViewState(currentView);
      document.title = VIEW_TITLES[currentView] || "ECduLearm";
      window.scrollTo({ top: 0, behavior: "instant" });
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return {
    view,
    setView: navigateTo,
    navigateTo,
  };
}
