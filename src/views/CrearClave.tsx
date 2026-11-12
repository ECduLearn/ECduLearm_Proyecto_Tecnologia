import { FormEvent, useEffect, useState } from "react"
import { authController } from "@/services/dbService"

const REQUISITOS = [
  { texto: "Al menos 8 caracteres", cumple: (c: string) => c.length >= 8 },
  { texto: "Al menos una letra", cumple: (c: string) => /[A-Za-z]/.test(c) },
  { texto: "Al menos un número", cumple: (c: string) => /\d/.test(c) },
]

// Primer ingreso con la contraseña temporal del administrador: hay que crear la propia para seguir
export default function CrearClave({ onListo, onSalir }: { onListo: (esAdmin: boolean) => void; onSalir: () => void }) {
  const [usuario] = useState(() => authController.getCurrentUser())
  const [clave, setClave] = useState("")
  const [confirmacion, setConfirmacion] = useState("")
  const [error, setError] = useState("")
  const [guardando, setGuardando] = useState(false)

  // Sin sesión o ya configurada no hay nada que hacer aquí
  useEffect(() => {
    if (!usuario) onSalir()
    else if (!usuario.debeCambiarClave) onListo(usuario.role === "admin")
  }, [])

  const guardar = async (event: FormEvent) => {
    event.preventDefault()
    if (!REQUISITOS.every((r) => r.cumple(clave))) {
      setError("La contraseña todavía no cumple los requisitos.")
      return
    }
    if (clave !== confirmacion) {
      setError("Las dos contraseñas no coinciden.")
      return
    }
    setError("")
    setGuardando(true)
    const res = await authController.cambiarClaveTemporal(clave)
    setGuardando(false)
    if (res.success) onListo(usuario?.role === "admin")
    else setError(res.message)
  }

  const salir = async () => {
    await authController.logoutDocente()
    onSalir()
  }

  if (!usuario?.debeCambiarClave) return null

  return (
    <div className="ui-view grid min-h-screen place-items-center bg-sand-50 px-4 py-10 text-sand-950">
      <section className="ui-pop w-full max-w-md rounded-[1.25rem] border border-sand-200 bg-white p-6 shadow-xl sm:p-8">
        <p className="text-lg font-semibold tracking-tight text-ink-950">
          EC<span className="text-hint-600">du</span>Learn
        </p>

        <form onSubmit={guardar} noValidate>
          <h1 className="mt-6 text-xl font-semibold">Crea tu contraseña</h1>
          <p className="mt-2 text-sm leading-relaxed text-sand-600">
            Hola, {usuario.name.split(" ")[0]}. Entraste con una contraseña temporal. Crea la tuya para empezar a usar
            la plataforma; la temporal dejará de servir.
          </p>

          <label htmlFor="clave-propia" className="mt-5 block text-sm font-medium text-sand-800">
            Contraseña nueva
          </label>
          <input
            id="clave-propia"
            type="password"
            autoComplete="new-password"
            value={clave}
            maxLength={72}
            onChange={(event) => setClave(event.target.value)}
            aria-describedby="clave-requisitos"
            className="mt-2 min-h-12 w-full rounded-xl border border-sand-300 px-4 focus:border-ink-700 focus:outline-none focus:ring-4 focus:ring-ink-100"
          />
          <ul id="clave-requisitos" className="mt-3 space-y-1 text-sm">
            {REQUISITOS.map((r) => {
              const ok = r.cumple(clave)
              return (
                <li key={r.texto} className={`flex items-center gap-2 ${ok ? "text-ink-800" : "text-sand-500"}`}>
                  <span aria-hidden="true">{ok ? "✓" : "○"}</span>
                  {r.texto}
                  <span className="sr-only">{ok ? "(cumple)" : "(pendiente)"}</span>
                </li>
              )
            })}
          </ul>

          <label htmlFor="clave-propia-confirmacion" className="mt-4 block text-sm font-medium text-sand-800">
            Repítela
          </label>
          <input
            id="clave-propia-confirmacion"
            type="password"
            autoComplete="new-password"
            value={confirmacion}
            maxLength={72}
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
            disabled={guardando}
            className="mt-6 min-h-12 w-full rounded-xl bg-ink-950 px-5 font-semibold text-sand-50 hover:bg-ink-800 disabled:opacity-70"
          >
            {guardando ? "Guardando…" : "Guardar y entrar"}
          </button>
          <button
            type="button"
            onClick={salir}
            className="mt-2 min-h-11 w-full rounded-xl px-5 text-sm font-semibold text-sand-600 hover:bg-sand-100"
          >
            Cerrar sesión
          </button>
        </form>
      </section>
    </div>
  )
}
