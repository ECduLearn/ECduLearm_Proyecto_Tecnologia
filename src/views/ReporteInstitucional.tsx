import { useEffect, useState } from "react"
import { reporteController, type ResultadoReporte } from "@/services/dbService"

export default function ReporteInstitucional({ onVolver }: { onVolver: () => void }) {
  const [resultado, setResultado] = useState<ResultadoReporte | null>(null)

  const cargar = () => {
    setResultado(null)
    reporteController.getReporteInstitucional().then(setResultado)
  }

  useEffect(cargar, [])

  return (
    <div className="ui-view min-h-screen bg-sand-50 text-sand-950">
      <header className="sticky top-0 z-30 border-b border-sand-200 bg-white/95 backdrop-blur print:hidden">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <button
            type="button"
            onClick={onVolver}
            className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-sand-700 hover:bg-sand-100"
          >
            <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Panel docente
          </button>
          {resultado && "reporte" in resultado && (
            <button
              type="button"
              onClick={() => window.print()}
              className="min-h-11 rounded-xl bg-ink-950 px-4 text-sm font-semibold text-sand-50 hover:bg-ink-800"
            >
              Imprimir reporte
            </button>
          )}
        </div>
      </header>

      <main id="reporte-institucional" className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <p className="text-sm font-medium text-ink-800">Coordinación académica</p>
        <h1 className="mt-1 text-[clamp(1.6rem,3vw,2.25rem)] font-semibold tracking-tight">Reporte institucional</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-sand-600">
          Uso de la plataforma y progreso de razonamiento de todo el colegio. Son datos agregados: no identifican a
          ningún estudiante.
        </p>

        {resultado === null && (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
            <p className="sr-only" role="status">
              Cargando el reporte…
            </p>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-sand-200/70" />
            ))}
          </div>
        )}

        {resultado?.estado === "sin_permiso" && (
          <section className="mt-8 rounded-2xl border border-sand-200 bg-white p-6 sm:p-8">
            <h2 className="text-lg font-semibold">Este reporte es para coordinación</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-sand-600">
              Lo ven el rector y la coordinación académica. Tus propias métricas están en el resumen del panel docente.
            </p>
            <button
              type="button"
              onClick={onVolver}
              className="mt-5 min-h-11 rounded-xl border border-sand-300 px-4 text-sm font-semibold text-sand-800 hover:bg-sand-100"
            >
              Ir a mi resumen
            </button>
          </section>
        )}

        {resultado?.estado === "error" && (
          <section className="mt-8 rounded-2xl border border-hint-200 bg-hint-50 p-6" role="alert">
            <h2 className="font-semibold text-hint-900">No pudimos cargar el reporte</h2>
            <p className="mt-1 text-sm text-hint-900">Revisa tu conexión y vuelve a intentarlo.</p>
            <button
              type="button"
              onClick={cargar}
              className="mt-4 min-h-11 rounded-xl bg-hint-600 px-4 text-sm font-semibold text-white hover:bg-hint-700"
            >
              Reintentar
            </button>
          </section>
        )}

        {resultado && "reporte" in resultado && (
          <>
            {resultado.estado === "demo" && (
              <p className="mt-6 inline-block rounded-full bg-hint-50 px-3 py-1 text-xs font-semibold text-hint-800 ring-1 ring-hint-200">
                Datos de ejemplo
              </p>
            )}

            <section className="ui-stagger mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Resumen del colegio">
              {[
                { etiqueta: "Docentes activos", valor: resultado.reporte.docentesActivos, detalle: "con cuenta habilitada" },
                { etiqueta: "Ejercicios creados", valor: resultado.reporte.ejerciciosGenerados, detalle: "por todo el colegio" },
                { etiqueta: "Horas docentes ahorradas", valor: `${resultado.reporte.horasAhorradas} h`, detalle: "frente a 45 min por guía hecha a mano" },
                { etiqueta: "Aulas activas", valor: resultado.reporte.aulasActivas, detalle: "con PIN vigente" },
                { etiqueta: "Sesiones de estudiantes", valor: resultado.reporte.sesionesAnonimas, detalle: "anónimas" },
                { etiqueta: "Resueltos con ayuda del tutor", valor: `${resultado.reporte.pctResueltosConAyuda} %`, detalle: "de los intentos registrados" },
              ].map((dato) => (
                <article key={dato.etiqueta} className="rounded-2xl border border-sand-200 bg-white p-5">
                  <p className="text-sm font-medium text-sand-600">{dato.etiqueta}</p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight text-ink-950 tabular-nums">{dato.valor}</p>
                  <p className="mt-1 text-xs text-sand-500">{dato.detalle}</p>
                </article>
              ))}
            </section>

            <section className="mt-6 rounded-2xl border border-hint-200 bg-hint-50 p-5 sm:p-6">
              <p className="text-sm font-medium text-hint-800">Paso donde más se traban los estudiantes</p>
              <p className="mt-1 text-xl font-semibold text-hint-950">
                {resultado.reporte.pasoBloqueoFrecuente || "Todavía no hay bloqueos registrados"}
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-lg font-semibold">Por docente</h2>
              {resultado.reporte.docentes.length === 0 ? (
                <p className="mt-2 text-sm text-sand-600">Aún no hay docentes con ejercicios creados.</p>
              ) : (
                <div className="mt-3 overflow-x-auto rounded-2xl border border-sand-200 bg-white">
                  <table className="w-full min-w-[28rem] text-left text-sm">
                    <thead className="border-b border-sand-200 text-xs font-semibold text-sand-500">
                      <tr>
                        <th scope="col" className="px-5 py-3">Docente</th>
                        <th scope="col" className="px-5 py-3 text-right">Ejercicios</th>
                        <th scope="col" className="px-5 py-3 text-right">Horas ahorradas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sand-100">
                      {resultado.reporte.docentes.map((docente) => (
                        <tr key={docente.nombre}>
                          <td className="px-5 py-3 font-medium text-sand-900">{docente.nombre}</td>
                          <td className="px-5 py-3 text-right tabular-nums">{docente.ejercicios}</td>
                          <td className="px-5 py-3 text-right tabular-nums">{docente.horas} h</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  )
}
