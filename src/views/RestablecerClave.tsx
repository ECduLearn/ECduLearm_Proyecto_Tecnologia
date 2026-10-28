import { FormEvent, useEffect, useState } from "react"
import { authController } from "@/services/dbService"
import { getSupabaseClient } from "@/services/supabaseClient"

type Estado = "verificando" | "formulario" | "guardando" | "listo" | "invalido"

// Destino del enlace que envía Supabase Auth para crear una contraseña nueva
export default function RestablecerClave({ onIrAlPortal }: { onIrAlPortal: () => void }) {
  const [estado, setEstado] = useState<Estado>("verificando")
  const [clave, setClave] = useState("")
  const [confirmacion, setConfirmacion] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    // El cliente lee el token del enlace al crearse y abre una sesión de recuperación
    const client = getSupabaseClient()
    if (!client) {
      setEstado("invalido")
      return
    }
    const { data: suscripcion } = client.auth.onAuthStateChange((evento, sesion) => {
      if (evento === "PASSWORD_RECOVERY" || sesion) setEstado("formulario")
    })
    const espera = window.setTimeout(async () => {
      const { data } = await client.auth.getSession()
      setEstado((actual) => (actual === "verificando" ? (data.session ? "formulario" : "invalido") : actual))
    }, 1500)
    return () => {
      suscripcion.subscription.unsubscribe()
      window.clearTimeout(espera)
    }
  }, [])

  const guardar = async (event: FormEvent) => {
    event.preventDefault()
    if (clave.length < 8) {
      setError("Usa al menos 8 caracteres.")
      return
    }
    if (clave !== confirmacion) {
      setError("Las dos contraseñas no coinciden.")
      return
    }
    setError("")
    setEstado("guardando")
    const res = await authController.actualizarClave(clave)
    if (res.success) {
      setEstado("listo")
    } else {
      setError(res.message)
      setEstado("formulario")
    }
  }

  return (
    <div className="ui-view grid min-h-screen place-items-center bg-sand-50 px-4 py-10 text-sand-950">
      <section className="ui-pop w-full max-w-md rounded-[1.25rem] border border-sand-200 bg-white p-6 shadow-xl sm:p-8">
        <p className="text-lg font-semibold tracking-tight text-ink-950">
          EC<span className="text-hint-600">du</span>Learn
        </p>

        {estado === "verificando" && (
          <p className="mt-6 text-sm text-sand-600" role="status">
            Revisando tu enlace…
          </p>
        )}

        {estado === "invalido" && (
          <>
            <h1 className="mt-6 text-xl font-semibold">Este enlace ya no sirve</h1>
            <p className="mt-2 text-sm leading-relaxed text-sand-600">
              Puede que haya caducado o que ya lo hayas usado. Pide uno nuevo a la administración de tu colegio.
            </p>
            <button
              type="button"
              onClick={onIrAlPortal}
              className="mt-6 min-h-12 w-full rounded-xl bg-ink-950 px-5 font-semibold text-sand-50 hover:bg-ink-800"
            >
              Ir al inicio de sesión
            </button>
          </>
        )}

        {estado === "listo" && (
          <>
            <h1 className="mt-6 text-xl font-semibold">Contraseña guardada</h1>
            <p className="mt-2 text-sm leading-relaxed text-sand-600">Ya puedes entrar con tu correo y tu contraseña nueva.</p>
            <button
              type="button"
              onClick={onIrAlPortal}
              className="mt-6 min-h-12 w-full rounded-xl bg-ink-950 px-5 font-semibold text-sand-50 hover:bg-ink-800"
            >
              Iniciar sesión
            </button>
          </>
        )}

        {(estado === "formulario" || estado === "guardando") && (
          <form onSubmit={guardar} noValidate>
            <h1 className="mt-6 text-xl font-semibold">Crea tu contraseña nueva</h1>
            <p className="mt-2 text-sm text-sand-600">Usa al menos 8 caracteres.</p>

            <label htmlFor="clave-nueva" className="mt-5 block text-sm font-medium text-sand-800">
              Contraseña nueva
            </label>
            <input
              id="clave-nueva"
              type="password"
              autoComplete="new-password"
              value={clave}
              onChange={(event) => setClave(event.target.value)}
              className="mt-2 min-h-12 w-full rounded-xl border border-sand-300 px-4 focus:border-ink-700 focus:outline-none focus:ring-4 focus:ring-ink-100"
            />

            <label htmlFor="clave-confirmacion" className="mt-4 block text-sm font-medium text-sand-800">
              Repítela
            </label>
            <input
              id="clave-confirmacion"
              type="password"
              autoComplete="new-password"
              value={confirmacion}
              onChange={(event) => setConfirmacion(event.target.value)}
              className="mt-2 min-h-12 w-full rounded-xl border border-sand-300 px-4 focus:border-ink-700 focus:outline-none focus:ring-4 focus:ring-ink-100"
            />

            {error && (
              <p className="mt-4 rounded-xl border border-hint-200 bg-hint-50 p-3 text-sm text-hint-900" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={estado === "guardando"}
              className="mt-6 min-h-12 w-full rounded-xl bg-ink-950 px-5 font-semibold text-sand-50 hover:bg-ink-800 disabled:opacity-70"
            >
              {estado === "guardando" ? "Guardando…" : "Guardar contraseña"}
            </button>
          </form>
        )}
      </section>
    </div>
  )
}
