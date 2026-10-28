// Estado de carga mientras llega el código de una vista. Aparece con 150 ms de retraso para no
// parpadear cuando la vista ya está en caché o la conexión es rápida.
export default function CargandoVista() {
  return (
    <div className="grid min-h-screen place-items-center bg-sand-50">
      <p
        className="ui-enter flex items-center gap-3 text-sm font-medium text-sand-600"
        style={{ "--delay": "150ms" } as React.CSSProperties}
        role="status"
      >
        <span className="ui-typing flex items-center gap-1" aria-hidden="true">
          <span className="size-2 rounded-full bg-ink-600" />
          <span className="size-2 rounded-full bg-ink-600" />
          <span className="size-2 rounded-full bg-ink-600" />
        </span>
        Cargando…
      </p>
    </div>
  )
}
