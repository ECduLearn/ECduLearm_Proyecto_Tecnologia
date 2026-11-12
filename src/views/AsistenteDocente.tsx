import { FormEvent, useEffect, useRef, useState } from "react"
import Icon, { Logo } from "@/components/Icon"
import ExerciseCard from "@/components/ExerciseCard"
import PublicarAulaDialog, { type OpcionPublicar } from "@/components/PublicarAulaDialog"
import TarjetaEjercicioLote from "@/components/TarjetaEjercicioLote"
import { ErrorGeneracionIA, generateExerciseAI } from "@/services/aiService"
import { aulasController, authController, ejerciciosController, isValidUuid } from "@/services/dbService"
import { chatVacio, estadoInicialDocente } from "@/models/estadoInicialDocente"
import {
  actualizarItem,
  actualizarSeleccionado,
  actualizarSesionDocente,
  ejercicioDeItem,
  idsDeItem,
  idsParaDescartar,
  itemDesdeEjercicio,
  leerSesionDocente,
  nuevaClave,
  reemplazarEnItem,
  useSesionDocente,
  type ItemEjercicio,
  type LetraParalelo,
  type MensajeChat,
} from "@/models/sesionDocente"
import { ACCIONES_EJERCICIO, instruccionVersion } from "@/models/accionesIA"
import { MAX_EJERCICIOS_LOTE } from "@/models/limites"
import type { Exercise } from "@/models/types"
import type { AppView } from "@/router"

const CURSOS = ["1ro BGU", "2do BGU", "3ro BGU"] as const
const DIFICULTADES = ["Básica", "Intermedia", "Avanzada"] as const
const CONTEXTOS = [
  "Metro de Quito y movilidad",
  "Galápagos y biodiversidad",
  "Economía familiar",
  "Deportes",
  "Agricultura y comercio local",
  "Volcanes y gestión de riesgos",
]
const CANTIDADES = Array.from({ length: MAX_EJERCICIOS_LOTE }, (_, i) => i + 1)

const selectClase =
  "mt-1.5 min-h-11 w-full rounded-xl border border-sand-300 bg-white px-3 text-sm text-sand-900 focus:border-ink-700 focus:outline-none focus:ring-4 focus:ring-ink-100"

type Reciente = { ejercicio: Exercise; creadoEn: string | null }

// Texto del indicador de progreso; burbuja = false cuando las tarjetas del lote ya muestran el avance
type Generacion = { texto: string; burbuja: boolean }

function cambioReal(nuevo: Exercise, actual: Exercise): boolean {
  const huella = (e: Exercise) => JSON.stringify([e.topic, e.situation, e.questionList, e.difficulty, e.level, e.solucionDocente])
  return nuevo.id !== "ex-default" && huella(nuevo) !== huella(actual)
}

function idMensaje(): number {
  return Date.now() + Math.random()
}

function agregarMensaje(mensaje: Omit<MensajeChat, "id">) {
  actualizarSesionDocente((actual) => ({ mensajes: [...actual.mensajes, { ...mensaje, id: idMensaje() }] }))
}

function segundosDesde(inicio: number): number {
  return Math.max(1, Math.round((Date.now() - inicio) / 1000))
}

function motivoFallo(err: unknown): string {
  return err instanceof ErrorGeneracionIA ? err.message : "No se pudo guardar el ejercicio. Inténtalo otra vez."
}

function quitarDeLaLista(clave: string) {
  actualizarSesionDocente((actual) => {
    const items = actual.items.filter((i) => i.clave !== clave)
    const seleccionado =
      actual.seleccionado === clave ? (items.find((i) => i.estado === "listo")?.clave ?? null) : actual.seleccionado
    return { items, seleccionado }
  })
}

function fechaCorta(iso: string | null): string {
  if (!iso) return "En este dispositivo"
  return new Date(iso).toLocaleDateString("es-EC", { day: "numeric", month: "short" })
}

export default function AsistenteDocente({ setView }: { setView: (next: AppView) => void }) {
  const sesion = useSesionDocente(estadoInicialDocente)
  const { mensajes, items, seleccionado, item, ejercicio, versiones, tieneEjercicio, paralelos, paraleloActivo } = sesion

  const [publicarOpen, setPublicarOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [input, setInput] = useState("")
  const [generando, setGenerando] = useState<Generacion | null>(null)
  const [recientes, setRecientes] = useState<Reciente[] | null>(null)
  const [usuario] = useState(() => authController.getCurrentUser())

  const [modoNuevo, setModoNuevo] = useState<"tema" | "transformar">("tema")
  const [curso, setCurso] = useState<(typeof CURSOS)[number]>("2do BGU")
  const [dificultad, setDificultad] = useState<(typeof DIFICULTADES)[number]>("Intermedia")
  const [cantidad, setCantidad] = useState(1)
  const [tema, setTema] = useState("")
  const [contexto, setContexto] = useState("")
  const [mecanico, setMecanico] = useState("")
  // «Generar más ejercicios»: vuelve a mostrar el formulario sin borrar el chat
  const [mostrarFormulario, setMostrarFormulario] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const listos = items.filter((i) => i.estado === "listo")
  const verFormulario = !generando && (items.length === 0 || mostrarFormulario)

  const cargarRecientes = () => {
    ejerciciosController.getMisEjercicios().then(setRecientes)
  }

  // «Publicado» sale de aula_ejercicios (o de las aulas de este navegador), no solo de esta pestaña
  const refrescarPublicados = async () => {
    const ids = [...new Set(leerSesionDocente().items.flatMap(idsDeItem))]
    if (!ids.length) return
    const publicados = await aulasController.idsPublicados(ids)
    if (!publicados) return
    actualizarSesionDocente((actual) => ({
      items: actual.items.map((i) => {
        const publicado = idsDeItem(i).some((id) => publicados.has(id))
        return publicado === i.publicado ? i : { ...i, publicado }
      }),
    }))
  }

  useEffect(cargarRecientes, [])

  useEffect(() => {
    refrescarPublicados()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }, [mensajes, generando])

  // Un ejercicio nuevo (formulario de 1, chat o «crea…»): se agrega a la lista y queda seleccionado
  const pedirNuevo = async (etiqueta: string, instruccion: string) => {
    if (generando) return
    agregarMensaje({ role: "user", text: etiqueta })
    setInput("")
    setMostrarFormulario(false)
    setGenerando({ texto: "Preparando tu ejercicio…", burbuja: true })
    const inicio = Date.now()

    try {
      const res = await generateExerciseAI(instruccion)
      // Solo un saludo o una pregunta general: la IA conversa y no hay ejercicio
      if (res.data.exercise.id === "ex-default") {
        agregarMensaje({ role: "assistant", text: res.data.reply, sinConexion: res.isOfflineFallback })
        return
      }
      const guardado = await ejerciciosController.guardarComoActivo(res.data.exercise, {
        etiquetaVersion: "Original",
        tiempoCreacionSegundos: segundosDesde(inicio),
        activo: false,
      })
      const nuevo = itemDesdeEjercicio(guardado, { instruccion })
      actualizarSesionDocente((actual) => ({
        items: [...actual.items, nuevo],
        seleccionado: nuevo.clave,
        mensajes: [
          ...actual.mensajes,
          { id: idMensaje(), role: "assistant", text: res.data.reply, claves: [nuevo.clave], sinConexion: res.isOfflineFallback },
        ],
      }))
      cargarRecientes()
    } catch {
      agregarMensaje({ role: "assistant", text: "No pude procesar tu pedido. Inténtalo otra vez en unos segundos." })
    } finally {
      setGenerando(null)
    }
  }

  // Ajuste (atajo o texto libre) del ejercicio seleccionado: los demás de la lista no cambian
  const pedirAjuste = async (etiqueta: string, instruccion: string) => {
    const elegido = leerSesionDocente().item
    const base = elegido ? ejercicioDeItem(elegido) : undefined
    if (generando || !elegido || !base) return
    agregarMensaje({ role: "user", text: `${etiqueta} · ${base.topic}` })
    setInput("")
    setGenerando({ texto: "Ajustando el ejercicio…", burbuja: true })
    const inicio = Date.now()

    try {
      const res = await generateExerciseAI(instruccion, base)
      let guardado: Exercise | undefined
      if (cambioReal(res.data.exercise, base)) {
        const padre = elegido.paralelos.A?.id
        guardado = await ejerciciosController.guardarComoActivo(res.data.exercise, {
          ejercicioPadreId: isValidUuid(padre) ? padre : undefined,
          etiquetaVersion: "Iteración 2",
          tiempoCreacionSegundos: segundosDesde(inicio),
          activo: false,
        })
        const nuevo = guardado
        actualizarItem(elegido.clave, (actual) => reemplazarEnItem(actual, nuevo))
      }
      agregarMensaje({ role: "assistant", text: res.data.reply, exercise: guardado, sinConexion: res.isOfflineFallback })
    } catch {
      agregarMensaje({ role: "assistant", text: "No pude procesar tu pedido. Inténtalo otra vez en unos segundos." })
    } finally {
      setGenerando(null)
    }
  }

  // Varios ejercicios: una llamada por ejercicio, en paralelo; si una falla, solo esa tarjeta lo muestra
  const generarLote = async (etiqueta: string, instrucciones: string[]) => {
    if (generando) return
    const nuevos: ItemEjercicio[] = instrucciones.map((instruccion) => ({
      clave: nuevaClave(),
      estado: "generando",
      instruccion,
      paralelos: {},
      paraleloActivo: "A",
      versiones: [],
      publicado: false,
    }))
    const total = nuevos.length
    const idRespuesta = idMensaje()
    actualizarSesionDocente((actual) => ({
      items: [...actual.items, ...nuevos],
      mensajes: [
        ...actual.mensajes,
        { id: idMensaje(), role: "user", text: etiqueta },
        { id: idRespuesta, role: "assistant", text: `Estoy preparando ${total} ejercicios sobre el mismo tema…`, claves: nuevos.map((n) => n.clave) },
      ],
    }))
    setMostrarFormulario(false)
    setGenerando({ texto: `Preparando ${total} ejercicios…`, burbuja: false })
    const inicio = Date.now()

    await Promise.allSettled(
      nuevos.map(async ({ clave, instruccion }) => {
        try {
          const res = await generateExerciseAI(instruccion, undefined, { sinRespaldo: true })
          const guardado = await ejerciciosController.guardarComoActivo(res.data.exercise, {
            etiquetaVersion: "Original",
            tiempoCreacionSegundos: segundosDesde(inicio),
            activo: false,
          })
          actualizarItem(clave, () => ({
            estado: "listo",
            error: undefined,
            raizId: isValidUuid(guardado.id) ? guardado.id : undefined,
            paralelos: { A: guardado },
            paraleloActivo: "A",
            versiones: [],
          }))
        } catch (err) {
          actualizarItem(clave, () => ({ estado: "fallo", error: motivoFallo(err) }))
        }
      }),
    )

    const delLote = leerSesionDocente().items.filter((i) => nuevos.some((n) => n.clave === i.clave))
    const correctos = delLote.filter((i) => i.estado === "listo")
    const resumen =
      correctos.length === total
        ? `Listo, preparé ${total} ejercicios. Elige con cuál trabajar para ajustarlo, crear versiones o editarlo; al publicar puedes escoger cuáles van a la clase.`
        : correctos.length
          ? `Preparé ${correctos.length} de ${total} ejercicios. Los que fallaron muestran el motivo y puedes reintentarlos.`
          : `No pude preparar los ejercicios. Revisa el motivo en cada uno y vuelve a intentarlo.`
    actualizarSesionDocente((actual) => ({
      // Si no había nada seleccionado, se elige el primero del lote que salió bien
      seleccionado: actual.item ? actual.seleccionado : (correctos[0]?.clave ?? actual.seleccionado),
      mensajes: actual.mensajes.map((m) => (m.id === idRespuesta ? { ...m, text: resumen } : m)),
    }))
    setGenerando(null)
    if (correctos.length) cargarRecientes()
  }

  const crearDesdeFormulario = (event: FormEvent) => {
    event.preventDefault()
    const textoTema = tema.trim()
    const textoMecanico = mecanico.trim()
    if (modoNuevo === "tema" ? !textoTema : !textoMecanico) return

    const ctxFijo = contexto ? `, en el contexto de ${contexto} en Ecuador` : ", con un contexto real de Ecuador"
    const instruccionBase = (ctx: string) =>
      modoNuevo === "tema"
        ? `Crea un ejercicio tipo PISA para ${curso}, dificultad ${dificultad}, sobre ${textoTema}${ctx}.`
        : `Transforma este ejercicio mecánico en un problema tipo PISA para ${curso}, dificultad ${dificultad}${ctx}: conserva el contenido matemático, agrega una situación real y preguntas que pidan razonar. Ejercicio: ${textoMecanico}`
    const etiqueta =
      modoNuevo === "tema" ? `${textoTema} · ${curso} · ${dificultad}` : `Transformar: ${textoMecanico.slice(0, 90)}`

    if (cantidad <= 1) {
      pedirNuevo(etiqueta, instruccionBase(ctxFijo))
      return
    }

    // Todos sobre el mismo tema; cada uno con otra situación (y otro contexto si el docente no eligió uno)
    const desfase = Math.floor(Math.random() * CONTEXTOS.length)
    const sobre = modoNuevo === "tema" ? textoTema : "el mismo contenido matemático del ejercicio original"
    const instrucciones = CANTIDADES.slice(0, cantidad).map((_, k) => {
      const ctx = contexto ? ctxFijo : `, en el contexto de ${CONTEXTOS[(desfase + k) % CONTEXTOS.length]} en Ecuador`
      const variacion = contexto
        ? "usa una situación distinta dentro de ese contexto"
        : "usa una situación y un enfoque distintos a los demás"
      return `${instruccionBase(ctx)} Es el ejercicio ${k + 1} de ${cantidad} de un mismo pedido: todos tratan sobre ${sobre}, pero este ${variacion}.`
    })
    generarLote(`${etiqueta} · ${cantidad} ejercicios`, instrucciones)
  }

  const enviarTexto = (texto: string) => {
    const limpio = texto.trim()
    if (!limpio) return
    // Con un ejercicio seleccionado, el texto libre lo ajusta; «crea…» o «transforma…» agrega otro a la lista
    const pideNuevo = !tieneEjercicio || /^(crea|genera|diseña|transforma|convierte)\b/i.test(limpio)
    if (pideNuevo) pedirNuevo(limpio, limpio)
    else pedirAjuste(limpio, limpio)
  }

  // Repite el pedido del ejercicio; el anterior se borra (con sus versiones) solo si llega uno nuevo
  const regenerar = async (clave: string) => {
    const actual = leerSesionDocente().items.find((i) => i.clave === clave)
    if (!actual || generando || actual.publicado) return
    const anterior = actual.estado === "listo" ? actual : null
    setGenerando({ texto: "Regenerando el ejercicio…", burbuja: false })
    actualizarItem(clave, () => (anterior ? { ocupado: true, error: undefined } : { estado: "generando", error: undefined }))
    const inicio = Date.now()

    try {
      const res = await generateExerciseAI(actual.instruccion, undefined, { sinRespaldo: true })
      const guardado = await ejerciciosController.guardarComoActivo(res.data.exercise, {
        etiquetaVersion: "Original",
        tiempoCreacionSegundos: segundosDesde(inicio),
        activo: false,
      })
      if (anterior) {
        const raiz = anterior.raizId ?? anterior.paralelos.A?.id
        if (raiz) await ejerciciosController.descartarConVersiones(raiz, idsParaDescartar(anterior))
      }
      actualizarItem(clave, () => ({
        estado: "listo",
        ocupado: false,
        error: undefined,
        raizId: isValidUuid(guardado.id) ? guardado.id : undefined,
        paralelos: { A: guardado },
        paraleloActivo: "A",
        versiones: [],
        publicado: false,
      }))
      cargarRecientes()
    } catch (err) {
      actualizarItem(clave, () => (anterior ? { ocupado: false, error: motivoFallo(err) } : { estado: "fallo", error: motivoFallo(err) }))
    } finally {
      setGenerando(null)
    }
  }

  // Descartar borra el ejercicio y sus versiones de la base: no llegó a un aula, no se usa
  const descartar = async (clave: string) => {
    const actual = leerSesionDocente().items.find((i) => i.clave === clave)
    if (!actual || generando || actual.publicado) return
    const raiz = actual.raizId ?? actual.paralelos.A?.id
    if (actual.estado !== "listo" || !raiz) {
      quitarDeLaLista(clave)
      return
    }

    actualizarItem(clave, () => ({ ocupado: true, error: undefined }))
    const res = await ejerciciosController.descartarConVersiones(raiz, idsParaDescartar(actual))
    if (res.ok) {
      quitarDeLaLista(clave)
      cargarRecientes()
    } else if (res.motivo === "en_uso") {
      // Está en una clase o planificación (la base no deja borrarlo): solo sale de la lista
      quitarDeLaLista(clave)
      agregarMensaje({
        role: "assistant",
        text: `«${ejercicioDeItem(actual)?.topic ?? "El ejercicio"}» se usa en una clase o en una planificación, así que sigue guardado. Lo quité de la lista de este chat.`,
      })
    } else {
      actualizarItem(clave, () => ({
        ocupado: false,
        error: "No pudimos descartar el ejercicio. Revisa tu conexión e inténtalo otra vez.",
      }))
    }
  }

  const seleccionar = (clave: string) => {
    actualizarSesionDocente(() => ({ seleccionado: clave }))
  }

  const crearVersion = async (letra: Exclude<LetraParalelo, "A">) => {
    const elegido = leerSesionDocente().item
    const original = elegido?.paralelos.A
    if (!elegido || !original || generando) return
    setGenerando({ texto: `Creando la Versión ${letra}…`, burbuja: true })
    try {
      const res = await generateExerciseAI(instruccionVersion(letra), original)
      if (res.isOfflineFallback || !cambioReal(res.data.exercise, original)) {
        agregarMensaje({
          role: "assistant",
          text: `No pude crear la Versión ${letra} ahora porque la IA no respondió a tiempo. Inténtalo de nuevo en unos segundos.`,
          sinConexion: res.isOfflineFallback,
        })
        return
      }
      const guardada = await ejerciciosController.guardarComoActivo(res.data.exercise, {
        ejercicioPadreId: isValidUuid(original.id) ? original.id : undefined,
        etiquetaVersion: `Versión ${letra}`,
        activo: false,
      })
      actualizarItem(elegido.clave, (actual) => ({
        paralelos: { ...actual.paralelos, [letra]: guardada },
        paraleloActivo: letra,
        versiones: [],
      }))
      agregarMensaje({
        role: "assistant",
        text: `Listo, la Versión ${letra} de «${original.topic}»: misma estructura matemática con otros datos y otro escenario. Su solución está actualizada.`,
        exercise: guardada,
      })
    } finally {
      setGenerando(null)
    }
  }

  const cambiarParalelo = (letra: LetraParalelo) => {
    actualizarSeleccionado((actual) => (actual.paralelos[letra] ? { paraleloActivo: letra, versiones: [] } : {}))
  }

  const versionAnterior = () => {
    const anterior = versiones.at(-1)
    if (!anterior) return
    actualizarSeleccionado((actual) => ({
      versiones: actual.versiones.slice(0, -1),
      paralelos: { ...actual.paralelos, [actual.paraleloActivo]: anterior },
    }))
    agregarMensaje({ role: "assistant", text: "Volví a la versión anterior del ejercicio.", exercise: anterior })
  }

  // Único chat: empezar otro borra la conversación y la lista (los ejercicios siguen en «Tus ejercicios»)
  const nuevoChat = () => {
    actualizarSesionDocente(() => chatVacio())
    setInput("")
    setMostrarFormulario(false)
    setSidebarOpen(false)
  }

  // Abrir uno de «Tus ejercicios» lo agrega a la lista del chat (o lo selecciona si ya está)
  const abrirReciente = ({ ejercicio: elegido }: Reciente) => {
    setSidebarOpen(false)
    const existente = leerSesionDocente().items.find((i) => elegido.id && idsDeItem(i).includes(elegido.id))
    if (existente) {
      seleccionar(existente.clave)
      return
    }
    const nuevo = itemDesdeEjercicio(elegido)
    actualizarSesionDocente((actual) => ({
      items: [...actual.items, nuevo],
      seleccionado: nuevo.clave,
      mensajes: [
        ...actual.mensajes,
        {
          id: idMensaje(),
          role: "assistant",
          text: `Agregué «${elegido.topic}» a este chat. Puedes ajustarlo o publicarlo junto con los demás.`,
          claves: [nuevo.clave],
        },
      ],
    }))
    setMostrarFormulario(false)
    refrescarPublicados()
  }

  const opcionesPublicar: OpcionPublicar[] = listos.flatMap((i) => {
    const actual = ejercicioDeItem(i)
    return actual ? [{ clave: i.clave, ejercicio: actual, publicado: i.publicado }] : []
  })

  // Tras publicar: se marcan como publicados y se guardan los ids definitivos (los editados se guardan al publicar)
  const marcarPublicados = (publicados: { clave: string; ejercicio: Exercise }[]) => {
    actualizarSesionDocente((actual) => ({
      items: actual.items.map((i) => {
        const publicado = publicados.find((p) => p.clave === i.clave)
        if (!publicado) return i
        const vigente = ejercicioDeItem(i)
        const cambioId = vigente && vigente.id !== publicado.ejercicio.id
        return {
          ...i,
          publicado: true,
          raizId: i.raizId ?? (isValidUuid(publicado.ejercicio.id) ? publicado.ejercicio.id : undefined),
          paralelos: cambioId ? { ...i.paralelos, [i.paraleloActivo]: publicado.ejercicio } : i.paralelos,
        }
      }),
    }))
  }

  return (
    <div className="ui-view min-h-screen bg-sand-100 text-sand-950">
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-sand-950/50 backdrop-blur-sm lg:hidden"
          aria-label="Cerrar navegación"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        id="app-sidebar"
        className={`fixed top-[var(--barra-evaluador,0px)] bottom-0 left-0 z-50 flex w-72 flex-col border-r border-sand-200 bg-sand-100 p-4 text-sand-900 transition-transform duration-300 print:hidden lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Navegación e historial"
      >
        <div className="flex items-center justify-between px-1">
          <Logo />
          <button
            type="button"
            className="grid size-11 place-items-center rounded-xl text-sand-700 hover:bg-sand-200 focus:outline-none focus:ring-4 focus:ring-ink-200 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Cerrar menú"
          >
            <Icon name="x" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setView("dashboard")}
          className="mt-5 flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-sand-700 transition hover:bg-sand-200 focus:outline-none focus:ring-4 focus:ring-ink-200"
        >
          <Icon name="arrow-left" className="size-4" />
          Volver al panel docente
        </button>

        <button
          type="button"
          onClick={nuevoChat}
          disabled={Boolean(generando)}
          className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-ink-950 px-4 text-sm font-bold text-white transition hover:bg-ink-800 focus:outline-none focus:ring-4 focus:ring-ink-200 disabled:opacity-60"
        >
          <Icon name="plus" className="size-5" />
          Nuevo chat
        </button>

        <nav className="mt-8 min-h-0 flex-1 overflow-y-auto" aria-label="Tus ejercicios recientes">
          <p className="px-2 text-xs font-bold uppercase tracking-widest text-sand-600">Tus ejercicios</p>
          {recientes === null ? (
            <div className="mt-3 space-y-2" aria-busy="true">
              <p className="sr-only" role="status">
                Cargando tus ejercicios…
              </p>
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-xl bg-sand-200/80" />
              ))}
            </div>
          ) : recientes.length === 0 ? (
            <p className="mt-3 px-2 text-sm leading-relaxed text-sand-600">
              Aún no has creado ejercicios. El primero que hagas aparecerá aquí.
            </p>
          ) : (
            <div className="mt-3 space-y-1">
              {recientes.map((reciente) => {
                const enChat = items.some((i) => reciente.ejercicio.id && idsDeItem(i).includes(reciente.ejercicio.id))
                return (
                  <button
                    key={reciente.ejercicio.id}
                    type="button"
                    onClick={() => abrirReciente(reciente)}
                    disabled={Boolean(generando)}
                    className={`min-h-14 w-full rounded-xl px-3 py-2.5 text-left transition hover:bg-sand-200 focus:outline-none focus:ring-4 focus:ring-ink-200 disabled:opacity-60 ${
                      enChat ? "bg-white ring-1 ring-sand-200" : ""
                    }`}
                  >
                    <span className="block truncate text-sm font-semibold text-sand-900">{reciente.ejercicio.topic}</span>
                    <span className="mt-1 block truncate text-xs text-sand-600">
                      {reciente.ejercicio.level} · {fechaCorta(reciente.creadoEn)}
                      {enChat ? " · En este chat" : ""}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </nav>

        {usuario && (
          <div className="mt-4 flex min-h-14 items-center gap-3 border-t border-sand-200 px-2 pt-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ink-100 text-ink-950">
              <Icon name="user" className="size-5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{usuario.name}</span>
              <span className="block truncate text-xs text-sand-600">{usuario.institution}</span>
            </span>
          </div>
        )}
      </aside>

      <div className="flex min-h-screen flex-col lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-sand-200 bg-white/95 backdrop-blur print:hidden">
          <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                className="grid size-11 shrink-0 place-items-center rounded-xl text-sand-700 hover:bg-sand-100 focus:outline-none focus:ring-4 focus:ring-ink-100 lg:hidden"
                onClick={() => setSidebarOpen(true)}
                aria-label="Abrir menú"
                aria-controls="app-sidebar"
                aria-expanded={sidebarOpen}
              >
                <Icon name="menu" />
              </button>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-sand-950">
                  {tieneEjercicio ? ejercicio.topic : items.length ? "Ejercicios de este chat" : "Nuevo ejercicio"}
                </p>
                <p className="flex items-center gap-1.5 text-xs text-sand-500">
                  <span className="size-1.5 rounded-full bg-ink-500" />
                  {listos.length > 1 ? `Asistente pedagógico · ${listos.length} ejercicios` : "Asistente pedagógico"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {tieneEjercicio && versiones.length > 0 && (
                <button
                  type="button"
                  onClick={versionAnterior}
                  disabled={Boolean(generando)}
                  className="flex min-h-11 items-center gap-2 rounded-xl border border-sand-200 px-3 text-sm font-semibold text-sand-700 transition hover:bg-sand-50 focus:outline-none focus:ring-4 focus:ring-ink-100 disabled:opacity-50"
                >
                  <Icon name="undo" className="size-4" />
                  <span className="hidden sm:inline">Versión anterior</span>
                </button>
              )}
              {tieneEjercicio && (
                <button
                  type="button"
                  onClick={() => setView("editor")}
                  disabled={Boolean(generando)}
                  className="flex min-h-11 items-center gap-2 rounded-xl bg-ink-950 px-3 text-sm font-semibold text-white transition hover:bg-ink-900 focus:outline-none focus:ring-4 focus:ring-ink-100 disabled:opacity-50 sm:px-4"
                >
                  <Icon name="file" className="size-4" />
                  <span className="hidden sm:inline">Editar guía</span>
                </button>
              )}
              {listos.length > 0 && (
                <button
                  type="button"
                  onClick={() => setPublicarOpen(true)}
                  disabled={Boolean(generando)}
                  className="flex min-h-11 items-center gap-2 rounded-xl border border-ink-300 bg-ink-50 px-3 text-sm font-semibold text-ink-900 transition hover:bg-ink-100 focus:outline-none focus:ring-4 focus:ring-ink-100 disabled:opacity-50 sm:px-4"
                >
                  <Icon name="send" className="size-4" />
                  <span>Publicar</span>
                </button>
              )}
            </div>
          </div>

          {tieneEjercicio && (
            <div className="mx-auto flex max-w-5xl items-center gap-2 overflow-x-auto px-4 pb-3 sm:px-6" role="group" aria-label="Versiones para paralelos">
              <span className="shrink-0 text-xs font-semibold text-sand-500">Paralelos:</span>
              {(["A", "B", "C"] as const).map((letra) =>
                paralelos[letra] ? (
                  <button
                    key={letra}
                    type="button"
                    aria-pressed={paraleloActivo === letra}
                    onClick={() => cambiarParalelo(letra)}
                    disabled={Boolean(generando)}
                    className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-semibold transition-colors duration-150 focus:outline-none focus:ring-4 focus:ring-ink-100 disabled:opacity-50 ${
                      paraleloActivo === letra ? "bg-ink-950 text-white" : "border border-sand-300 bg-white text-sand-700 hover:bg-sand-50"
                    }`}
                  >
                    Versión {letra}
                  </button>
                ) : (
                  letra !== "A" && (
                    <button
                      key={letra}
                      type="button"
                      disabled={Boolean(generando) || !paralelos.A}
                      onClick={() => crearVersion(letra)}
                      className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border border-dashed border-sand-400 px-4 text-sm font-semibold text-sand-700 transition-colors duration-150 hover:border-ink-400 hover:bg-ink-50 focus:outline-none focus:ring-4 focus:ring-ink-100 disabled:opacity-50"
                    >
                      <Icon name="plus" className="size-4" />
                      Crear versión {letra}
                    </button>
                  )
                ),
              )}
            </div>
          )}
        </header>

        <main className="flex-1">
          <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
            <div className="space-y-6 print:hidden" aria-live="polite" aria-busy={Boolean(generando)}>
              {mensajes.map((message) =>
                message.role === "user" ? (
                  <div key={message.id} className="ui-msg flex justify-end">
                    <div className="max-w-xl rounded-2xl rounded-br-md bg-ink-950 px-4 py-3 text-sm leading-relaxed text-white shadow-sm sm:px-5">
                      {message.text}
                    </div>
                  </div>
                ) : (
                  <div key={message.id} className="ui-msg space-y-4">
                    <div className="flex items-start gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-ink-100 text-ink-800 shadow-sm">
                        <Icon name="sparkles" className="size-4" />
                      </span>
                      <div className="max-w-2xl rounded-2xl rounded-tl-md border border-sand-200 bg-white px-4 py-3.5 text-sm leading-relaxed text-sand-800 shadow-sm sm:px-5">
                        <div className="whitespace-pre-line text-sand-700">{message.text}</div>
                        {message.sinConexion && (
                          <p className="mt-2 border-t border-sand-100 pt-2 text-xs text-sand-500">
                            La IA no respondió a tiempo: esta respuesta es una propuesta preparada de antemano.
                          </p>
                        )}
                      </div>
                    </div>
                    {message.claves?.map((clave, indice) => {
                      const elemento = items.find((i) => i.clave === clave)
                      if (!elemento) {
                        return (
                          <p key={clave} className="text-xs text-sand-500 sm:ml-12">
                            Ejercicio {indice + 1}: descartado.
                          </p>
                        )
                      }
                      return (
                        <TarjetaEjercicioLote
                          key={clave}
                          item={elemento}
                          numero={indice + 1}
                          seleccionado={elemento.clave === seleccionado && elemento.estado === "listo"}
                          bloqueado={Boolean(generando)}
                          expandidoInicial={(message.claves?.length ?? 0) === 1}
                          onSeleccionar={() => seleccionar(clave)}
                          onRegenerar={() => regenerar(clave)}
                          onDescartar={() => descartar(clave)}
                        />
                      )
                    })}
                    {message.exercise && <ExerciseCard exercise={message.exercise} />}
                  </div>
                ),
              )}

              {generando?.burbuja && (
                <div className="ui-msg flex items-start gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-ink-100 text-ink-800">
                    <Icon name="sparkles" className="size-4" />
                  </span>
                  <div
                    className="flex min-h-12 items-center gap-3 rounded-2xl rounded-tl-md border border-ink-200 bg-ink-50/80 px-5 text-sm font-semibold text-ink-900 shadow-sm"
                    role="status"
                  >
                    <span className="ui-typing flex items-center gap-1" aria-hidden="true">
                      <span className="size-1.5 rounded-full bg-ink-600" />
                      <span className="size-1.5 rounded-full bg-ink-600" />
                      <span className="size-1.5 rounded-full bg-ink-600" />
                    </span>
                    {generando.texto}
                  </div>
                </div>
              )}
              {generando && !generando.burbuja && (
                <p className="sr-only" role="status">
                  {generando.texto}
                </p>
              )}
              <div ref={messagesEndRef} className="h-2" />
            </div>

            {items.length > 0 && !verFormulario && !generando && (
              <div className="mt-6 flex justify-center print:hidden">
                <button
                  type="button"
                  onClick={() => setMostrarFormulario(true)}
                  className="flex min-h-11 items-center gap-2 rounded-xl border border-dashed border-sand-400 bg-white px-4 text-sm font-semibold text-sand-700 transition hover:border-ink-400 hover:bg-ink-50 focus:outline-none focus:ring-4 focus:ring-ink-100"
                >
                  <Icon name="plus" className="size-4" />
                  Generar más ejercicios
                </button>
              </div>
            )}

            {verFormulario && (
              <form onSubmit={crearDesdeFormulario} className="ui-enter mx-auto mt-8 max-w-2xl rounded-2xl border border-sand-200 bg-white p-5 shadow-sm sm:p-7 print:hidden">
                <div className="flex items-start justify-between gap-3">
                  <h1 className="text-xl font-bold tracking-tight text-ink-950">
                    {items.length ? "¿Qué más vamos a crear?" : "¿Qué vamos a crear hoy?"}
                  </h1>
                  {items.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setMostrarFormulario(false)}
                      aria-label="Cerrar formulario"
                      className="grid size-11 shrink-0 place-items-center rounded-xl text-sand-500 hover:bg-sand-100 hover:text-sand-900 focus:outline-none focus:ring-4 focus:ring-ink-100"
                    >
                      <Icon name="x" className="size-5" />
                    </button>
                  )}
                </div>
                <div className="mt-4 flex gap-2" role="tablist" aria-label="Forma de crear el ejercicio">
                  {(
                    [
                      ["tema", "Desde un tema"],
                      ["transformar", "Transformar un ejercicio"],
                    ] as const
                  ).map(([valor, etiqueta]) => (
                    <button
                      key={valor}
                      type="button"
                      role="tab"
                      aria-selected={modoNuevo === valor}
                      onClick={() => setModoNuevo(valor)}
                      className={`min-h-11 rounded-full px-4 text-sm font-semibold transition-colors duration-150 focus:outline-none focus:ring-4 focus:ring-ink-100 ${
                        modoNuevo === valor ? "bg-ink-950 text-white" : "border border-sand-300 text-sand-700 hover:bg-sand-50"
                      }`}
                    >
                      {etiqueta}
                    </button>
                  ))}
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                  <label className="text-sm font-semibold text-sand-800">
                    Curso
                    <select value={curso} onChange={(e) => setCurso(e.target.value as typeof curso)} className={selectClase}>
                      {CURSOS.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm font-semibold text-sand-800">
                    Dificultad
                    <select value={dificultad} onChange={(e) => setDificultad(e.target.value as typeof dificultad)} className={selectClase}>
                      {DIFICULTADES.map((d) => (
                        <option key={d}>{d}</option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm font-semibold text-sand-800">
                    Cantidad
                    <select value={cantidad} onChange={(e) => setCantidad(Number(e.target.value))} className={selectClase}>
                      {CANTIDADES.map((n) => (
                        <option key={n} value={n}>
                          {n === 1 ? "1 ejercicio" : `${n} ejercicios`}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {modoNuevo === "tema" ? (
                  <label className="mt-4 block text-sm font-semibold text-sand-800">
                    Tema o destreza
                    <input
                      value={tema}
                      onChange={(e) => setTema(e.target.value)}
                      required
                      maxLength={150}
                      placeholder="Ej. funciones cuadráticas, porcentajes, movimiento rectilíneo"
                      className="mt-1.5 min-h-11 w-full rounded-xl border border-sand-300 bg-white px-3 text-sm text-sand-900 placeholder:text-sand-400 focus:border-ink-700 focus:outline-none focus:ring-4 focus:ring-ink-100"
                    />
                  </label>
                ) : (
                  <label className="mt-4 block text-sm font-semibold text-sand-800">
                    Ejercicio mecánico
                    <textarea
                      value={mecanico}
                      onChange={(e) => setMecanico(e.target.value)}
                      required
                      rows={3}
                      maxLength={1500}
                      placeholder="Pega el ejercicio del libro. Ej. Resuelve x² − 5x + 6 = 0"
                      className="mt-1.5 w-full resize-none rounded-xl border border-sand-300 bg-white p-3 text-sm text-sand-900 placeholder:text-sand-400 focus:border-ink-700 focus:outline-none focus:ring-4 focus:ring-ink-100"
                    />
                  </label>
                )}

                <label className="mt-4 block text-sm font-semibold text-sand-800">
                  Contexto
                  <select value={contexto} onChange={(e) => setContexto(e.target.value)} className={selectClase}>
                    <option value="">{cantidad > 1 ? "Que el asistente proponga uno distinto para cada ejercicio" : "Que el asistente proponga uno"}</option>
                    {CONTEXTOS.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>

                <button
                  type="submit"
                  disabled={modoNuevo === "tema" ? !tema.trim() : !mecanico.trim()}
                  className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-ink-950 px-5 text-sm font-bold text-white transition hover:bg-ink-800 focus:outline-none focus:ring-4 focus:ring-ink-200 disabled:cursor-not-allowed disabled:bg-sand-300"
                >
                  <Icon name="sparkles" className="size-4" />
                  {modoNuevo === "tema"
                    ? cantidad > 1
                      ? `Crear ${cantidad} ejercicios`
                      : "Crear ejercicio"
                    : cantidad > 1
                      ? `Transformar en ${cantidad} ejercicios tipo PISA`
                      : "Transformar a tipo PISA"}
                </button>
              </form>
            )}
            <div className="h-4" />
          </div>
        </main>

        <footer className="sticky bottom-0 z-20 border-t border-sand-200 bg-white/95 px-4 py-3 backdrop-blur print:hidden sm:px-6">
          <form
            onSubmit={(event) => {
              event.preventDefault()
              enviarTexto(input)
            }}
            className="mx-auto max-w-4xl"
          >
            {tieneEjercicio && (
              <div className="mb-2.5 flex items-center gap-2 overflow-x-auto pb-1" role="group" aria-label={`Ajustes rápidos para «${ejercicio.topic}»`}>
                {ACCIONES_EJERCICIO.map((accion) => (
                  <button
                    key={accion.etiqueta}
                    type="button"
                    disabled={Boolean(generando)}
                    onClick={() => pedirAjuste(accion.etiqueta, accion.instruccion)}
                    className="min-h-11 shrink-0 rounded-full border border-sand-200 bg-sand-50 px-4 text-sm font-semibold text-sand-700 transition hover:border-ink-400 hover:bg-ink-50 focus:outline-none focus:ring-4 focus:ring-ink-100 disabled:opacity-50"
                  >
                    {accion.etiqueta}
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-end gap-2 rounded-2xl border border-sand-300 bg-white p-2 shadow-lg shadow-sand-900/5 transition focus-within:border-ink-700 focus-within:ring-4 focus-within:ring-ink-100">
              <label htmlFor="chat-input" className="sr-only">
                Escribe una instrucción para el asistente
              </label>
              <textarea
                id="chat-input"
                rows={1}
                value={input}
                disabled={Boolean(generando)}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault()
                    enviarTexto(input)
                  }
                }}
                placeholder={
                  tieneEjercicio
                    ? `Ajusta «${ejercicio.topic}». Ej. «agrega una pregunta sobre el costo total»`
                    : "O escribe directamente lo que necesitas"
                }
                className="max-h-32 min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm leading-6 text-sand-900 outline-none placeholder:text-sand-400 disabled:cursor-wait"
              />
              <button
                type="submit"
                disabled={!input.trim() || Boolean(generando)}
                className="grid size-11 shrink-0 place-items-center rounded-xl bg-ink-950 text-white transition hover:bg-ink-900 focus:outline-none focus:ring-4 focus:ring-ink-200 disabled:cursor-not-allowed disabled:bg-sand-300"
                aria-label="Enviar instrucción"
              >
                <Icon name="send" className="size-5" />
              </button>
            </div>
            <p className="mt-2 text-center text-xs text-sand-500">
              ECduLearn puede equivocarse. Revisa los resultados antes de usarlos en clase.
            </p>
          </form>
        </footer>
      </div>

      {publicarOpen && (
        <PublicarAulaDialog
          opciones={opcionesPublicar}
          seleccionInicial={item?.clave ?? null}
          onPublicado={marcarPublicados}
          onClose={() => setPublicarOpen(false)}
          onIrAlAsistente={() => setPublicarOpen(false)}
        />
      )}
    </div>
  )
}
