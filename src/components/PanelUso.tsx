import { useEffect, useState } from "react"
import { adminController, type UsoPlataforma } from "@/services/dbService"

type Metrica = "sesiones" | "ejercicios" | "mensajesTutor"

const METRICAS: { id: Metrica; etiqueta: string }[] = [
  { id: "sesiones", etiqueta: "Estudiantes que entraron" },
  { id: "ejercicios", etiqueta: "Ejercicios creados" },
  { id: "mensajesTutor", etiqueta: "Respuestas del tutor" },
]

const REFRESCO_MS = 60_000

function fechaCorta(iso: string): string {
  // iso es una fecha local (AAAA-MM-DD): se lee a mediodía para no saltar de día por la zona horaria
  return new Date(`${iso}T12:00:00`).toLocaleDateString("es-EC", { day: "numeric", month: "short" })
}

function Tarjeta({ etiqueta, valor, detalle }: { etiqueta: string; valor: number | string; detalle?: string }) {
  return (
    <article className="rounded-2xl border border-sand-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-sand-600">{etiqueta}</p>
      <p className="mt-1.5 text-2xl font-semibold tabular-nums text-ink-950">{valor}</p>
      {detalle && <p className="mt-0.5 text-xs text-sand-500">{detalle}</p>}
    </article>
  )
}

export default function PanelUso() {
  const [uso, setUso] = useState<UsoPlataforma | null>(null)
  const [error, setError] = useState("")
  const [cargando, setCargando] = useState(true)
  const [metrica, setMetrica] = useState<Metrica>("sesiones")

  const cargar = async () => {
    setCargando(true)
    const res = await adminController.getUsoPlataforma()
    if (res.estado === "ok") {
      setUso(res.uso)
      setError("")
    } else {
      setError(res.mensaje)
    }
    setCargando(false)
  }

  // Se actualiza solo cada minuto mientras la pestaña del navegador está a la vista
  useEffect(() => {
    cargar()
    const intervalo = setInterval(() => {
      if (document.visibilityState === "visible") cargar()
    }, REFRESCO_MS)
    return () => clearInterval(intervalo)
  }, [])

  if (!uso && cargando) {
    return (
      <div className="space-y-4" aria-busy="true">
        <p className="sr-only" role="status">
          Cargando el uso de la plataforma…
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-sand-200/70" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-2xl bg-sand-200/70" />
      </div>
    )
  }

  if (!uso) {
    return (
      <section className="rounded-2xl border border-hint-200 bg-hint-50 p-6" role="alert">
        <h2 className="font-semibold text-hint-900">No pudimos cargar el uso de la plataforma</h2>
        <p className="mt-1 text-sm text-hint-900">{error}</p>
        <button
          type="button"
          onClick={cargar}
          className="mt-4 min-h-11 rounded-xl bg-hint-600 px-4 text-sm font-semibold text-white hover:bg-hint-700"
        >
          Reintentar
        </button>
      </section>
    )
  }

  const valores = uso.serie.map((d) => d[metrica])
  const maximo = Math.max(1, ...valores)
  const totalSerie = valores.reduce((t, v) => t + v, 0)
  const etiquetaMetrica = METRICAS.find((m) => m.id === metrica)?.etiqueta ?? ""
  const actualizado = new Date(uso.generadoEn).toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-sand-950">Uso de la plataforma</h2>
          <p className="mt-0.5 text-xs text-sand-600">
            Cifras agregadas de todos los colegios, sin datos personales. Actualizado a las {actualizado}; se refresca cada
            minuto.
          </p>
        </div>
        <button
          type="button"
          onClick={cargar}
          disabled={cargando}
          className="min-h-11 rounded-xl border border-sand-300 bg-white px-4 text-sm font-semibold text-sand-800 hover:bg-sand-100 disabled:opacity-60"
        >
          {cargando ? "Actualizando…" : "Actualizar"}
        </button>
      </div>

      {error && (
        <p className="rounded-xl border border-hint-200 bg-hint-50 p-3 text-sm text-hint-900" role="status">
          No pudimos actualizar: {error} Se muestran los últimos datos.
        </p>
      )}

      <section aria-labelledby="uso-ahora">
        <h3 id="uso-ahora" className="text-xs font-bold uppercase tracking-widest text-ink-800">
          En este momento
        </h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Tarjeta etiqueta="Estudiantes conectados" valor={uso.estudiantes.ahora} detalle="con actividad en los últimos 15 minutos" />
          <Tarjeta etiqueta="Aulas abiertas" valor={uso.aulasActivas} detalle="con PIN vigente" />
        </div>
      </section>

      <section aria-labelledby="uso-activos">
        <h3 id="uso-activos" className="text-xs font-bold uppercase tracking-widest text-ink-800">
          Usuarios activos
        </h3>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-sand-200 bg-white shadow-sm">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead className="border-b border-sand-200 text-xs font-semibold text-sand-500">
              <tr>
                <th scope="col" className="px-5 py-3"></th>
                <th scope="col" className="px-4 py-3 text-right">Hoy</th>
                <th scope="col" className="px-4 py-3 text-right">7 días</th>
                <th scope="col" className="px-4 py-3 text-right">30 días</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-100 tabular-nums">
              <tr>
                <th scope="row" className="px-5 py-3 font-semibold text-sand-900">
                  Docentes y directivos
                  <span className="block text-xs font-normal text-sand-500">
                    iniciaron sesión, de {uso.docentes.total} con permiso
                    {uso.docentes.pendientes ? ` · ${uso.docentes.pendientes} pendientes de primer ingreso` : ""}
                  </span>
                </th>
                <td className="px-4 py-3 text-right">{uso.docentes.hoy}</td>
                <td className="px-4 py-3 text-right">{uso.docentes.semana}</td>
                <td className="px-4 py-3 text-right">{uso.docentes.mes}</td>
              </tr>
              <tr>
                <th scope="row" className="px-5 py-3 font-semibold text-sand-900">
                  Estudiantes
                  <span className="block text-xs font-normal text-sand-500">sesiones anónimas con actividad</span>
                </th>
                <td className="px-4 py-3 text-right">{uso.estudiantes.hoy}</td>
                <td className="px-4 py-3 text-right">{uso.estudiantes.semana}</td>
                <td className="px-4 py-3 text-right">{uso.estudiantes.mes}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="uso-30">
        <h3 id="uso-30" className="text-xs font-bold uppercase tracking-widest text-ink-800">
          Últimos 30 días
        </h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Tarjeta etiqueta="Ejercicios creados" valor={uso.ultimos30.ejercicios} />
          <Tarjeta etiqueta="Respuestas del tutor" valor={uso.ultimos30.mensajesTutor} detalle="uso de la IA con estudiantes" />
          <Tarjeta etiqueta="Pistas pedidas" valor={uso.ultimos30.pistas} />
          <Tarjeta etiqueta="Retos resueltos" valor={uso.ultimos30.retosResueltos} />
          <Tarjeta etiqueta="Copias bloqueadas" valor={uso.ultimos30.copiasBloqueadas} detalle="pidieron la respuesta directa" />
        </div>
      </section>

      <section aria-labelledby="uso-diario" className="rounded-2xl border border-sand-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 id="uso-diario" className="text-sm font-bold text-sand-950">
            Actividad diaria
          </h3>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Qué mostrar en el gráfico">
            {METRICAS.map((m) => (
              <button
                key={m.id}
                type="button"
                aria-pressed={metrica === m.id}
                onClick={() => setMetrica(m.id)}
                className={`min-h-11 rounded-full px-4 text-sm font-semibold transition-colors duration-150 ${
                  metrica === m.id ? "bg-ink-950 text-white" : "border border-sand-300 text-sand-700 hover:bg-sand-50"
                }`}
              >
                {m.etiqueta}
              </button>
            ))}
          </div>
        </div>

        {totalSerie === 0 ? (
          <p className="mt-6 rounded-xl bg-sand-50 p-6 text-center text-sm text-sand-600">
            Todavía no hay actividad de este tipo en los últimos 30 días.
          </p>
        ) : (
          <>
            <div
              className="mt-6 flex h-48 items-end gap-1"
              role="img"
              aria-label={`${etiquetaMetrica} por día en los últimos 30 días: ${totalSerie} en total, máximo ${maximo} en un día.`}
            >
              {uso.serie.map((d) => (
                <div
                  key={d.fecha}
                  title={`${fechaCorta(d.fecha)}: ${d[metrica]}`}
                  className="flex-1 rounded-t-sm bg-ink-600 transition-[height] duration-300"
                  style={{ height: `${Math.max(d[metrica] ? 4 : 1, (d[metrica] / maximo) * 100)}%`, opacity: d[metrica] ? 1 : 0.25 }}
                />
              ))}
            </div>
            <div className="mt-2 flex justify-between text-xs text-sand-500" aria-hidden="true">
              <span>{fechaCorta(uso.serie[0].fecha)}</span>
              <span>{fechaCorta(uso.serie[14].fecha)}</span>
              <span>Hoy</span>
            </div>
            <details className="mt-4 text-sm">
              <summary className="min-h-11 cursor-pointer py-2 font-semibold text-ink-800">Ver los datos por día</summary>
              <table className="mt-2 w-full max-w-sm text-left tabular-nums">
                <thead className="text-xs text-sand-500">
                  <tr>
                    <th scope="col" className="py-1">Día</th>
                    <th scope="col" className="py-1 text-right">{etiquetaMetrica}</th>
                  </tr>
                </thead>
                <tbody>
                  {[...uso.serie].reverse().map((d) => (
                    <tr key={d.fecha} className="border-t border-sand-100">
                      <td className="py-1">{fechaCorta(d.fecha)}</td>
                      <td className="py-1 text-right">{d[metrica]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          </>
        )}
      </section>

      <section aria-labelledby="uso-colegios">
        <h3 id="uso-colegios" className="text-xs font-bold uppercase tracking-widest text-ink-800">
          Por colegio
        </h3>
        {uso.colegios.length === 0 ? (
          <p className="mt-3 text-sm text-sand-600">Aún no hay colegios registrados.</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-2xl border border-sand-200 bg-white shadow-sm">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead className="border-b border-sand-200 text-xs font-semibold text-sand-500">
                <tr>
                  <th scope="col" className="px-5 py-3">Colegio</th>
                  <th scope="col" className="px-4 py-3 text-right">Docentes activos (7 días)</th>
                  <th scope="col" className="px-4 py-3 text-right">Estudiantes (30 días)</th>
                  <th scope="col" className="px-4 py-3 text-right">Ejercicios (30 días)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-100 tabular-nums">
                {uso.colegios.map((c) => (
                  <tr key={c.id}>
                    <th scope="row" className="px-5 py-3 font-semibold text-sand-900">{c.nombre}</th>
                    <td className="px-4 py-3 text-right">
                      {c.docentesActivos} de {c.docentes}
                    </td>
                    <td className="px-4 py-3 text-right">{c.sesiones}</td>
                    <td className="px-4 py-3 text-right">{c.ejercicios}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="text-xs leading-relaxed text-sand-500">
        Las visitas a la página (cuántas personas abren la web, desde qué dispositivo y de dónde llegan) se ven en el panel
        de Vercel, sección Analytics. Un docente cuenta como activo el día que inicia sesión con su contraseña.
      </p>
    </div>
  )
}
