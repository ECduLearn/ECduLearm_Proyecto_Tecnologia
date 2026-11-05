import { Suspense, lazy } from "react"
import type { AppView } from "@/router"

// Atajos entre vistas para el equipo: solo existen con `pnpm dev`. En el build de producción
// import.meta.env.DEV es false y el chunk de la barra ni siquiera se genera.
const Barra = import.meta.env.DEV ? lazy(() => import("./BarraEvaluador").then((m) => ({ default: m.EvaluatorTopBar }))) : null
const Boton = import.meta.env.DEV ? lazy(() => import("./BarraEvaluador").then((m) => ({ default: m.EvaluatorPill }))) : null

type Props = { currentView: AppView; onViewChange: (v: AppView) => void }

export function BarraDesarrollo(props: Props) {
  if (!Barra) return null
  return (
    <Suspense fallback={null}>
      <Barra {...props} />
    </Suspense>
  )
}

export function BotonDesarrollo(props: Props) {
  if (!Boton) return null
  return (
    <Suspense fallback={null}>
      <Boton {...props} />
    </Suspense>
  )
}
