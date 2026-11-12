import { ReactNode, useEffect, useState } from "react"
import { authController, estudianteSocraticoController } from "@/services/dbService"

/** Vistas del docente: sin sesión (o con la de Supabase vencida) vuelve al portal de acceso. */
export function RutaDocente({
  children,
  onSinSesion,
  onCambiarClave,
}: {
  children: ReactNode
  onSinSesion: () => void
  onCambiarClave: () => void
}) {
  const [usuario] = useState(() => authController.getCurrentUser())

  useEffect(() => {
    if (!usuario) {
      onSinSesion()
      return
    }
    // Con la contraseña temporal no se entra a ninguna vista hasta crear la propia
    if (usuario.debeCambiarClave) {
      onCambiarClave()
      return
    }
    let activo = true
    authController.restoreSession().then((vigente) => {
      if (!activo) return
      if (!vigente) onSinSesion()
      else if (vigente.debeCambiarClave) onCambiarClave()
    })
    return () => {
      activo = false
    }
  }, [])

  return usuario && !usuario.debeCambiarClave ? <>{children}</> : null
}

/** Vistas del estudiante: solo con una sesión abierta con el PIN de su clase. */
export function RutaEstudiante({ children, onSinSesion }: { children: ReactNode; onSinSesion: () => void }) {
  const [sesion] = useState(() => estudianteSocraticoController.getSesionActual())

  useEffect(() => {
    if (!sesion) onSinSesion()
  }, [])

  return sesion ? <>{children}</> : null
}
