import { ReactNode, useEffect, useState } from "react"
import { authController, estudianteSocraticoController } from "@/services/dbService"

/** Vistas del docente: sin sesión (o con la de Supabase vencida) vuelve al portal de acceso. */
export function RutaDocente({ children, onSinSesion }: { children: ReactNode; onSinSesion: () => void }) {
  const [usuario] = useState(() => authController.getCurrentUser())

  useEffect(() => {
    if (!usuario) {
      onSinSesion()
      return
    }
    let activo = true
    authController.restoreSession().then((vigente) => {
      if (activo && !vigente) onSinSesion()
    })
    return () => {
      activo = false
    }
  }, [])

  return usuario ? <>{children}</> : null
}

/** Vistas del estudiante: solo con una sesión abierta con el PIN de su clase. */
export function RutaEstudiante({ children, onSinSesion }: { children: ReactNode; onSinSesion: () => void }) {
  const [sesion] = useState(() => estudianteSocraticoController.getSesionActual())

  useEffect(() => {
    if (!sesion) onSinSesion()
  }, [])

  return sesion ? <>{children}</> : null
}
