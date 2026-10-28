import { FormEvent, useEffect, useState } from "react"
import {
  adminController,
  authController,
  CATALOGO_ASIGNATURAS,
  DbAuditLog,
  DbInstitucion,
  UsuarioConDetalles,
} from "./services/dbService"

interface AdminDashboardProps {
  onExit: () => void
  onNavigateTeacher?: () => void
  onNavigateLanding?: () => void
}

export function AdminDashboard({
  onExit,
  onNavigateTeacher,
  onNavigateLanding,
}: AdminDashboardProps) {
  // Estados de datos
  const [usuarios, setUsuarios] = useState<UsuarioConDetalles[]>([])
  const [instituciones, setInstituciones] = useState<DbInstitucion[]>([])
  const [auditLogs, setAuditLogs] = useState<DbAuditLog[]>([])
  const [stats, setStats] = useState({
    totalUsuarios: 0,
    docentesActivos: 0,
    coordinadores: 0,
    administradores: 0,
    usuariosInactivos: 0,
    totalInstituciones: 0,
    totalCupos: 0,
    cuposUtilizados: 0,
    pctUtilizacion: 0,
  })

  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] =
    useState<"usuarios" | "instituciones" | "auditoria">("usuarios")

  // Filtros de búsqueda para usuarios
  const [searchQuery, setSearchQuery] = useState("")
  const [filterRole, setFilterRole] = useState<string>("TODOS")
  const [filterInstitution, setFilterInstitution] = useState<string>("TODAS")
  const [filterStatus, setFilterStatus] = useState<string>("TODOS")

  // Modales
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UsuarioConDetalles | null>(
    null,
  )
  const [schoolModalOpen, setSchoolModalOpen] = useState(false)
  const [pinModalOpen, setPinModalOpen] = useState(false)
  const [pinModalData, setPinModalData] = useState<{
    pin: string
    email: string
    name: string
  } | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<UsuarioConDetalles | null>(
    null,
  )

  // Formulario nuevo usuario
  const [newNombre, setNewNombre] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newRol, setNewRol] =
    useState<"DOCENTE" | "COORDINADOR_RECTOR" | "ADMIN">("DOCENTE")
  const [newInstitucionId, setNewInstitucionId] = useState("")
  const [newAsignaturaId, setNewAsignaturaId] = useState<number>(1)
  const [newActivo, setNewActivo] = useState(true)
  const [formError, setFormError] = useState("")
  const [formSubmitting, setFormSubmitting] = useState(false)

  // Formulario nueva institución
  const [newSchoolNombre, setNewSchoolNombre] = useState("")
  const [newSchoolAmie, setNewSchoolAmie] = useState("")
  const [newSchoolTipo, setNewSchoolTipo] =
    useState<"PARTICULAR" | "FISCOMISIONAL" | "FISCAL" | "MUNICIPAL">(
      "PARTICULAR",
    )
  const [newSchoolPlan, setNewSchoolPlan] =
    useState<"ACTIVA" | "PILOTO" | "CONVENIO">("PILOTO")
  const [newSchoolLimite, setNewSchoolLimite] = useState(15)
  const [newSchoolCiudad, setNewSchoolCiudad] = useState("Quito")
  const [schoolError, setSchoolError] = useState("")
  const [schoolSubmitting, setSchoolSubmitting] = useState(false)

  // Alerta flotante tipo Toast
  const [toastMessage, setToastMessage] = useState<{
    text: string
    type: "success" | "error" | "info"
  } | null>(null)

  const showToast = (
    text: string,
    type: "success" | "error" | "info" = "success",
  ) => {
    setToastMessage({ text, type })
    setTimeout(() => setToastMessage(null), 3800)
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const [userList, instList, statsData] = await Promise.all([
        adminController.getUsuarios(),
        adminController.getInstituciones(),
        adminController.getAdminStats(),
      ])
      setUsuarios(userList)
      setInstituciones(instList)
      setStats(statsData)
      setAuditLogs(adminController.getAuditLogs())

      if (instList.length > 0 && !newInstitucionId) {
        setNewInstitucionId(instList[0].id)
      }
    } catch (err) {
      console.error("[AdminDashboard] Error cargando datos:", err)
      showToast("Error al sincronizar datos con el servidor", "error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const currentUser = authController.getCurrentUser()

  // Filtrado de usuarios en tiempo real
  const filteredUsuarios = usuarios.filter((u) => {
    const q = searchQuery.toLowerCase().trim()
    const matchQuery =
      !q ||
      u.nombre_completo.toLowerCase().includes(q) ||
      u.email_institucional.toLowerCase().includes(q) ||
      (u.institucion_nombre && u.institucion_nombre.toLowerCase().includes(q))

    const matchRole = filterRole === "TODOS" || u.rol === filterRole
    const matchInst =
      filterInstitution === "TODAS" || u.institucion_id === filterInstitution
    const matchStatus =
      filterStatus === "TODOS" ||
      (filterStatus === "ACTIVO" && u.activo) ||
      (filterStatus === "INACTIVO" && !u.activo)

    return matchQuery && matchRole && matchInst && matchStatus
  })

  // Manejador: Crear Usuario
  const handleCreateUser = async (e: FormEvent) => {
    e.preventDefault()
    setFormError("")
    setFormSubmitting(true)

    try {
      const res = await adminController.createUsuario({
        nombre_completo: newNombre,
        email_institucional: newEmail,
        rol: newRol,
        institucion_id: newInstitucionId,
        asignatura_principal_id:
          newRol === "COORDINADOR_RECTOR" ? null : newAsignaturaId,
        activo: newActivo,
      })

      if (res.success) {
        showToast(res.message, "success")
        setCreateModalOpen(false)
        setNewNombre("")
        setNewEmail("")
        setNewRol("DOCENTE")
        setNewActivo(true)
        await loadData()
      } else {
        setFormError(res.message)
      }
    } catch {
      setFormError("Error al procesar la solicitud con el servidor.")
    } finally {
      setFormSubmitting(false)
    }
  }

  // Manejador: Toggle de Permiso Activo / Inactivo
  const handleToggleActivo = async (user: UsuarioConDetalles) => {
    const nextStatus = !user.activo
    try {
      const res = await adminController.toggleUsuarioActivo(user.id, nextStatus)
      if (res.success) {
        showToast(res.message, nextStatus ? "success" : "info")
        await loadData()
      } else {
        showToast(res.message, "error")
      }
    } catch {
      showToast("Error de comunicación al actualizar permisos.", "error")
    }
  }

  // Manejador: Cambio rápido de Rol
  const handleQuickRoleChange = async (
    user: UsuarioConDetalles,
    nextRole: "DOCENTE" | "COORDINADOR_RECTOR" | "ADMIN",
  ) => {
    if (user.rol === nextRole) return
    try {
      const res = await adminController.updateUsuario(user.id, {
        rol: nextRole,
      })
      if (res.success) {
        showToast(
          `Rol actualizado a ${nextRole} para ${user.nombre_completo}`,
          "success",
        )
        await loadData()
      } else {
        showToast(res.message, "error")
      }
    } catch {
      showToast("Error al modificar rol institucional.", "error")
    }
  }

  // Manejador: Guardar Edición de Usuario
  const handleSaveEditUser = async (e: FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return
    setFormSubmitting(true)
    setFormError("")

    try {
      const res = await adminController.updateUsuario(selectedUser.id, {
        nombre_completo: selectedUser.nombre_completo,
        email_institucional: selectedUser.email_institucional,
        rol: selectedUser.rol,
        institucion_id: selectedUser.institucion_id,
        asignatura_principal_id:
          selectedUser.rol === "COORDINADOR_RECTOR"
            ? null
            : selectedUser.asignatura_principal_id,
        activo: selectedUser.activo,
      })

      if (res.success) {
        showToast(res.message, "success")
        setEditModalOpen(false)
        setSelectedUser(null)
        await loadData()
      } else {
        setFormError(res.message)
      }
    } catch {
      setFormError("Error al guardar modificaciones.")
    } finally {
      setFormSubmitting(false)
    }
  }

  // Manejador: Generar PIN / Clave provisional
  const handleGeneratePin = async (user: UsuarioConDetalles) => {
    const res = await adminController.resetPassword(user.id)
    if (res.success) {
      setPinModalData({
        pin: res.pinProvisional,
        email: user.email_institucional,
        name: user.nombre_completo,
      })
      setPinModalOpen(true)
      await loadData()
    }
  }

  // Manejador: Eliminar Usuario
  const handleDeleteUser = async () => {
    if (!userToDelete) return
    try {
      const res = await adminController.deleteUsuario(userToDelete.id)
      if (res.success) {
        showToast(res.message, "info")
        setDeleteConfirmOpen(false)
        setUserToDelete(null)
        await loadData()
      } else {
        showToast(res.message, "error")
      }
    } catch {
      showToast("Error al eliminar usuario.", "error")
    }
  }

  // Manejador: Registrar Nuevo Colegio
  const handleCreateSchool = async (e: FormEvent) => {
    e.preventDefault()
    setSchoolError("")
    setSchoolSubmitting(true)

    try {
      const res = await adminController.createInstitucion({
        nombre: newSchoolNombre,
        codigo_amie: newSchoolAmie,
        tipo_institucion: newSchoolTipo,
        plan_suscripcion: newSchoolPlan,
        limite_docentes: newSchoolLimite,
        ciudad: newSchoolCiudad,
        provincia: "Pichincha",
        pin_grado_autonomo: null,
      })

      if (res.success) {
        showToast(res.message, "success")
        setSchoolModalOpen(false)
        setNewSchoolNombre("")
        setNewSchoolAmie("")
        await loadData()
      } else {
        setSchoolError(res.message)
      }
    } catch {
      setSchoolError("Error al crear el colegio.")
    } finally {
      setSchoolSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-sand-100 text-sand-950 font-sans selection:bg-hint-200 selection:text-sand-950">
      {/* Toast Alert Flotante */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl bg-ink-950 px-5 py-3 text-white shadow-2xl ring-1 ring-ink-700/60 animate-in fade-in slide-in-from-bottom-4">
          <span className="text-base">
            {toastMessage.type === "success"
              ? "✅"
              : toastMessage.type === "error"
                ? "❌"
                : "ℹ️"}
          </span>
          <p className="text-xs font-semibold text-sand-100">
            {toastMessage.text}
          </p>
        </div>
      )}

      {/* 1. Header Superior de Administración */}
      <header className="sticky top-0 z-40 border-b border-sand-300 bg-sand-50/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3.5">
            <span className="grid size-10 place-items-center rounded-xl bg-ink-950 text-white shadow-sm">
              <svg
                className="size-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-extrabold tracking-tight text-sand-950">
                  EC<span className="text-hint-600">du</span>Learm
                </span>
                <span className="rounded-md bg-ink-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-hint-300">
                  Admin Central
                </span>
              </div>
              <p className="text-[11px] text-sand-600 font-medium">
                Panel Maestro de Usuarios y Control B2B · Ecuador
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {onNavigateTeacher && (
              <button
                type="button"
                onClick={onNavigateTeacher}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-sand-300 bg-white px-3 py-1.5 text-xs font-semibold text-sand-700 transition hover:bg-sand-100 hover:text-ink-950"
              >
                <span>📊</span>
                <span>Vista Docente</span>
              </button>
            )}

            <div className="hidden md:flex items-center gap-2 rounded-xl border border-sand-300 bg-white px-3 py-1.5 text-xs">
              <span className="inline-block size-2 rounded-full bg-ink-600 animate-pulse" />
              <span className="font-semibold text-sand-800">
                {currentUser?.name || "Administrador"}
              </span>
              {(!currentUser || currentUser.isDemo) && (
                <span className="rounded-full bg-hint-50 px-2 py-0.5 font-bold text-hint-700 ring-1 ring-hint-200">
                  Modo demo
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={async () => {
                await authController.logoutDocente()
                onExit()
              }}
              className="flex items-center gap-1.5 rounded-xl border border-hint-300/60 bg-hint-50 px-3 py-1.5 text-xs font-bold text-hint-800 transition hover:bg-hint-100"
              title="Cerrar Sesión Administrativa"
            >
              <span>🚪</span>
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Banner / Título de la Sección */}
      <section className="border-b border-sand-200 bg-sand-50 py-7">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-hint-100 px-2.5 py-0.5 text-[11px] font-bold text-hint-800 uppercase tracking-wider">
                  Acceso Restringido
                </span>
                <span className="text-xs text-sand-500 font-mono">
                  B2B SaaS Security
                </span>
              </div>
              <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-sand-950 sm:text-3xl">
                Administración de Usuarios y Permisos
              </h1>
              <p className="mt-1 text-sm text-sand-600 max-w-2xl">
                Los docentes y rectores no pueden autoregistrarse: únicamente
                los administradores autorizan credenciales, asignan colegios y
                configuran los roles del sistema.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={() => setCreateModalOpen(true)}
                className="btn-pop-ink flex items-center gap-2 rounded-xl bg-ink-950 px-4 py-2.5 text-sm font-bold text-white transition focus:outline-none focus:ring-4 focus:ring-ink-200"
              >
                <svg
                  className="size-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
                <span>Crear Nuevo Usuario</span>
              </button>

              <button
                type="button"
                onClick={() => setSchoolModalOpen(true)}
                className="flex items-center gap-2 rounded-xl border border-sand-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-sand-800 transition hover:bg-sand-100"
              >
                <span>🏫</span>
                <span>Nuevo Colegio</span>
              </button>
            </div>
          </div>

          {/* 3. Cinta de Métricas Globales (KPIs) */}
          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
            {/* Card 1: Total Usuarios */}
            <div className="rounded-2xl border border-sand-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sand-600 uppercase tracking-wide">
                  Usuarios Totales
                </span>
                <span className="grid size-7 place-items-center rounded-lg bg-ink-50 text-ink-700 text-xs">
                  👥
                </span>
              </div>
              <p className="mt-2 text-3xl font-extrabold text-ink-950">
                {stats.totalUsuarios}
              </p>
              <div className="mt-2 flex items-center gap-1.5 flex-wrap text-[11px] text-sand-600">
                <span className="font-semibold text-ink-800">
                  {stats.docentesActivos} docentes
                </span>
                <span>·</span>
                <span>{stats.coordinadores} directivos</span>
                <span>·</span>
                <span>{stats.administradores} admins</span>
              </div>
            </div>

            {/* Card 2: Cupos de Docentes */}
            <div className="rounded-2xl border border-sand-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sand-600 uppercase tracking-wide">
                  Licencias de Docentes
                </span>
                <span className="grid size-7 place-items-center rounded-lg bg-hint-50 text-hint-700 text-xs">
                  🎟️
                </span>
              </div>
              <p className="mt-2 text-3xl font-extrabold text-sand-950">
                {stats.cuposUtilizados}
                <span className="text-base font-semibold text-sand-500">
                  {" "}
                  / {stats.totalCupos}
                </span>
              </p>
              <div className="mt-2 w-full bg-sand-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-ink-600 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(stats.pctUtilizacion, 100)}%` }}
                />
              </div>
              <p className="mt-1 text-[11px] text-sand-600">
                {stats.pctUtilizacion}% cupos asignados
              </p>
            </div>

            {/* Card 3: Instituciones */}
            <div className="rounded-2xl border border-sand-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sand-600 uppercase tracking-wide">
                  Colegios Asociados
                </span>
                <span className="grid size-7 place-items-center rounded-lg bg-sand-100 text-sand-700 text-xs">
                  🏫
                </span>
              </div>
              <p className="mt-2 text-3xl font-extrabold text-ink-950">
                {stats.totalInstituciones}
              </p>
              <p className="mt-2 text-[11px] text-sand-600">
                Pichincha · Quito (PISA & ERCA)
              </p>
            </div>

            {/* Card 4: Seguridad & Auditoría */}
            <div className="rounded-2xl border border-sand-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sand-600 uppercase tracking-wide">
                  Seguridad B2B
                </span>
                <span className="grid size-7 place-items-center rounded-lg bg-ink-50 text-ink-700 text-xs">
                  🛡️
                </span>
              </div>
              <p className="mt-2 text-base font-extrabold text-ink-900">
                Zero-PII Estricto
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-sand-600">
                Aislamiento por colegio. Cumplimiento con LOPDP Ecuador.
              </p>
            </div>
          </div>

          {/* 4. Selector de Pestañas Principales */}
          <div className="mt-7 flex items-center gap-2 border-b border-sand-300 pb-px">
            <button
              type="button"
              onClick={() => setActiveTab("usuarios")}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition border-b-2 ${
                activeTab === "usuarios"
                  ? "border-ink-950 text-ink-950"
                  : "border-transparent text-sand-600 hover:text-sand-900"
              }`}
            >
              <span>👥 Usuarios y Permisos</span>
              <span className="rounded-full bg-sand-200 px-2 py-0.5 text-[10px] font-semibold">
                {usuarios.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("instituciones")}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition border-b-2 ${
                activeTab === "instituciones"
                  ? "border-ink-950 text-ink-950"
                  : "border-transparent text-sand-600 hover:text-sand-900"
              }`}
            >
              <span>🏫 Colegios & Capacidad</span>
              <span className="rounded-full bg-sand-200 px-2 py-0.5 text-[10px] font-semibold">
                {instituciones.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("auditoria")}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition border-b-2 ${
                activeTab === "auditoria"
                  ? "border-ink-950 text-ink-950"
                  : "border-transparent text-sand-600 hover:text-sand-900"
              }`}
            >
              <span>📜 Registro de Auditoría</span>
              <span className="rounded-full bg-sand-200 px-2 py-0.5 text-[10px] font-semibold">
                {auditLogs.length}
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* 5. Contenido Dinámico de Pestañas */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {activeTab === "usuarios" && (
          <div>
            {/* Barra de Filtros */}
            <div className="rounded-2xl border border-sand-200 bg-white p-4 shadow-sm mb-6">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {/* Búsqueda por texto */}
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sand-400">
                    🔍
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por nombre, correo o colegio..."
                    className="w-full rounded-xl border border-sand-300 bg-sand-50 py-2 pl-9 pr-3 text-xs font-semibold text-sand-900 outline-none placeholder:text-sand-400 focus:border-ink-600 focus:bg-white focus:ring-2 focus:ring-ink-100"
                  />
                </div>

                {/* Filtro por Rol */}
                <div>
                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="w-full rounded-xl border border-sand-300 bg-sand-50 py-2 px-3 text-xs font-semibold text-sand-900 outline-none focus:border-ink-600 focus:bg-white"
                  >
                    <option value="TODOS">Todos los roles</option>
                    <option value="DOCENTE">Solo Docentes (Aula)</option>
                    <option value="COORDINADOR_RECTOR">
                      Solo Rectores / Directivos
                    </option>
                    <option value="ADMIN">Solo Administradores</option>
                  </select>
                </div>

                {/* Filtro por Institución */}
                <div>
                  <select
                    value={filterInstitution}
                    onChange={(e) => setFilterInstitution(e.target.value)}
                    className="w-full rounded-xl border border-sand-300 bg-sand-50 py-2 px-3 text-xs font-semibold text-sand-900 outline-none focus:border-ink-600 focus:bg-white"
                  >
                    <option value="TODAS">Todas las instituciones</option>
                    {instituciones.map((inst) => (
                      <option key={inst.id} value={inst.id}>
                        {inst.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtro por Estado */}
                <div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full rounded-xl border border-sand-300 bg-sand-50 py-2 px-3 text-xs font-semibold text-sand-900 outline-none focus:border-ink-600 focus:bg-white"
                  >
                    <option value="TODOS">Todos los estados</option>
                    <option value="ACTIVO">Activos (Con Permiso)</option>
                    <option value="INACTIVO">Inactivos / Revocados</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Tabla de Usuarios */}
            <div className="overflow-hidden rounded-2xl border border-sand-300 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-sand-200 bg-sand-50/70 text-[11px] font-bold uppercase tracking-wider text-sand-600">
                      <th className="px-5 py-3.5">Usuario & Correo</th>
                      <th className="px-4 py-3.5">Institución Educativa</th>
                      <th className="px-4 py-3.5">Rol y Permisos</th>
                      <th className="px-4 py-3.5">Asignatura</th>
                      <th className="px-4 py-3.5">Estado de Acceso</th>
                      <th className="px-5 py-3.5 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sand-200 text-xs">
                    {filteredUsuarios.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-6 py-12 text-center text-sand-500"
                        >
                          <p className="text-2xl mb-2">🔍</p>
                          <p className="font-semibold text-sand-800">
                            No se encontraron usuarios institucionales
                          </p>
                          <p className="text-xs text-sand-500 mt-1">
                            Prueba cambiando los filtros de búsqueda o agrega un
                            nuevo usuario.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredUsuarios.map((u) => {
                        const initials = u.nombre_completo
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()

                        return (
                          <tr
                            key={u.id}
                            className="transition hover:bg-sand-50/80"
                          >
                            {/* Usuario */}
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <span
                                  className={`grid size-9 shrink-0 place-items-center rounded-xl font-bold text-xs ${
                                    u.rol === "ADMIN"
                                      ? "bg-ink-950 text-white"
                                      : u.rol === "COORDINADOR_RECTOR"
                                        ? "bg-hint-700 text-white"
                                        : "bg-sand-200 text-sand-800"
                                  }`}
                                >
                                  {initials}
                                </span>
                                <div>
                                  <p className="font-bold text-sand-950">
                                    {u.nombre_completo}
                                  </p>
                                  <p className="font-mono text-[11px] text-sand-500">
                                    {u.email_institucional}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Institución */}
                            <td className="px-4 py-4">
                              <p className="font-semibold text-sand-900">
                                {u.institucion_nombre || "Institución Demo"}
                              </p>
                              <span className="text-[10px] text-sand-500 font-mono">
                                AMIE: {u.codigo_amie || "17H00000"}
                              </span>
                            </td>

                            {/* Rol con cambio rápido */}
                            <td className="px-4 py-4">
                              <div className="inline-flex items-center gap-1.5">
                                <span
                                  className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${
                                    u.rol === "ADMIN"
                                      ? "bg-ink-900 text-hint-300 ring-1 ring-ink-700"
                                      : u.rol === "COORDINADOR_RECTOR"
                                        ? "bg-hint-100 text-hint-800 ring-1 ring-hint-300"
                                        : "bg-ink-50 text-ink-800 ring-1 ring-ink-200"
                                  }`}
                                >
                                  {u.rol === "ADMIN"
                                    ? "👑 Admin Global"
                                    : u.rol === "COORDINADOR_RECTOR"
                                      ? "🏛️ Rector / Coord."
                                      : "👨‍🏫 Docente"}
                                </span>
                              </div>
                            </td>

                            {/* Asignatura */}
                            <td className="px-4 py-4">
                              <span className="font-medium text-sand-700">
                                {u.asignatura_nombre ||
                                  (u.rol === "COORDINADOR_RECTOR"
                                    ? "Directivo"
                                    : "Sin Asignar")}
                              </span>
                            </td>

                            {/* Estado y Toggle */}
                            <td className="px-4 py-4">
                              <button
                                type="button"
                                onClick={() => handleToggleActivo(u)}
                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold transition ${
                                  u.activo
                                    ? "bg-ink-100 text-ink-900 hover:bg-ink-200"
                                    : "bg-rose-100 text-rose-800 hover:bg-rose-200"
                                }`}
                                title="Clic para alternar permiso activo/inactivo"
                              >
                                <span
                                  className={`size-1.5 rounded-full ${
                                    u.activo ? "bg-ink-600" : "bg-rose-600"
                                  }`}
                                />
                                <span>
                                  {u.activo ? "Con Permiso" : "Sin Acceso"}
                                </span>
                              </button>
                            </td>

                            {/* Acciones */}
                            <td className="px-5 py-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleGeneratePin(u)}
                                  className="rounded-lg border border-sand-300 bg-sand-50 px-2 py-1 text-[11px] font-semibold text-sand-700 transition hover:bg-sand-200"
                                  title="Generar clave provisional de bienvenida"
                                >
                                  🔑 PIN
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedUser(u)
                                    setEditModalOpen(true)
                                  }}
                                  className="rounded-lg border border-sand-300 bg-sand-50 px-2 py-1 text-[11px] font-semibold text-sand-700 transition hover:bg-sand-200 hover:text-ink-950"
                                  title="Editar datos y permisos"
                                >
                                  ✏️ Editar
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setUserToDelete(u)
                                    setDeleteConfirmOpen(true)
                                  }}
                                  className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-semibold text-rose-700 transition hover:bg-rose-100"
                                  title="Eliminar usuario"
                                >
                                  🗑️
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-sand-200 bg-sand-50/60 px-5 py-3 text-xs text-sand-500 flex items-center justify-between">
                <span>
                  Mostrando {filteredUsuarios.length} de {usuarios.length}{" "}
                  usuarios registrados
                </span>
                <span className="font-semibold text-ink-900">
                  Total B2B Activos:{" "}
                  {stats.docentesActivos + stats.coordinadores}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Pestaña 2: Colegios & Capacidad */}
        {activeTab === "instituciones" && (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-sand-950">
                  Instituciones Educativas Asociadas
                </h2>
                <p className="text-xs text-sand-600">
                  Colegios bajo contrato B2B en Ecuador con límites de docentes.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSchoolModalOpen(true)}
                className="btn-pop-ink flex items-center gap-2 rounded-xl bg-ink-950 px-4 py-2 text-xs font-bold text-white"
              >
                <span>+ Registrar Colegio</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {instituciones.map((inst) => {
                const docentesCount = usuarios.filter(
                  (u) => u.institucion_id === inst.id && u.rol === "DOCENTE",
                ).length
                const pct =
                  inst.limite_docentes > 0
                    ? Math.round((docentesCount / inst.limite_docentes) * 100)
                    : 0

                return (
                  <div
                    key={inst.id}
                    className="rounded-2xl border border-sand-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="rounded-md bg-sand-100 px-2 py-0.5 text-[10px] font-bold text-sand-700 uppercase">
                          {inst.tipo_institucion}
                        </span>
                        <h3 className="mt-2 text-base font-bold text-sand-950 leading-snug">
                          {inst.nombre}
                        </h3>
                        <p className="text-xs font-mono text-sand-500 mt-1">
                          AMIE: {inst.codigo_amie || "N/A"}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          inst.plan_suscripcion === "ACTIVA"
                            ? "bg-ink-100 text-ink-900"
                            : inst.plan_suscripcion === "CONVENIO"
                              ? "bg-hint-100 text-hint-900"
                              : "bg-sand-100 text-sand-800"
                        }`}
                      >
                        {inst.plan_suscripcion}
                      </span>
                    </div>

                    <div className="mt-4 border-t border-sand-100 pt-3">
                      <div className="flex items-center justify-between text-xs font-semibold text-sand-700">
                        <span>Docentes contratados</span>
                        <span>
                          {docentesCount} de {inst.limite_docentes}
                        </span>
                      </div>
                      <div className="mt-2 h-2 w-full bg-sand-200 rounded-full overflow-hidden">
                        <div
                          className={`h-2 rounded-full ${
                            pct >= 100
                              ? "bg-rose-500"
                              : pct >= 75
                                ? "bg-hint-500"
                                : "bg-ink-600"
                          }`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      <p className="mt-1 text-[11px] text-sand-500 text-right">
                        {pct}% utilizado
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-[11px] text-sand-500 pt-2 border-t border-sand-100">
                      <span>
                        {inst.ciudad}, {inst.provincia}
                      </span>
                      <span className="font-semibold text-ink-800">
                        {
                          usuarios.filter((u) => u.institucion_id === inst.id)
                            .length
                        }{" "}
                        cuentas activas
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Pestaña 3: Auditoría & Cumplimiento */}
        {activeTab === "auditoria" && (
          <div className="rounded-2xl border border-sand-300 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-sand-200 pb-4 mb-4">
              <div>
                <h2 className="text-base font-bold text-sand-950">
                  Bitácora de Auditoría y Trazabilidad (LOPDP)
                </h2>
                <p className="text-xs text-sand-600">
                  Registro inmutable de altas, bajas y modificaciones de
                  permisos.
                </p>
              </div>
              <span className="rounded-full bg-sand-100 px-3 py-1 text-xs font-mono text-sand-700">
                Total eventos: {auditLogs.length}
              </span>
            </div>

            <div className="space-y-3">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 rounded-xl border border-sand-200 bg-sand-50/60 p-3 text-xs"
                >
                  <span className="mt-0.5 text-base">
                    {log.accion === "CREACION_USUARIO"
                      ? "👤"
                      : log.accion === "CAMBIO_ROL"
                        ? "🔄"
                        : log.accion === "ACTIVACION_USUARIO"
                          ? "🟢"
                          : log.accion === "DESACTIVACION_USUARIO"
                            ? "🔴"
                            : log.accion === "RESET_PASSWORD"
                              ? "🔑"
                              : "📝"}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sand-900">
                        {log.autor}
                      </span>
                      <span className="text-[11px] font-mono text-sand-500">
                        {log.timestamp}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sand-700">{log.detalle}</p>
                    {log.target_email && (
                      <span className="mt-1 inline-block text-[10px] font-mono text-sand-500 bg-white px-2 py-0.5 rounded border border-sand-200">
                        {log.target_email}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* MODAL 1: Crear Usuario */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-sand-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-sand-300 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-sand-200 pb-3">
              <div>
                <h3 className="text-lg font-bold text-sand-950">
                  Crear Nuevo Usuario Institucional
                </h3>
                <p className="text-xs text-sand-600">
                  Dar de alta a un docente o directivo autorizado.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="grid size-8 place-items-center rounded-full text-sand-500 hover:bg-sand-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="mt-4 space-y-4">
              {formError && (
                <div className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs font-semibold text-rose-900">
                  ⚠️ {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-sand-800 uppercase tracking-wide">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={newNombre}
                  onChange={(e) => setNewNombre(e.target.value)}
                  placeholder="Ej. Lic. María Elena Torres"
                  className="mt-1.5 w-full rounded-xl border border-sand-300 bg-sand-50 px-3 py-2 text-xs font-semibold text-sand-900 outline-none focus:border-ink-600 focus:bg-white focus:ring-2 focus:ring-ink-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-sand-800 uppercase tracking-wide">
                  Correo Electrónico Institucional *
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Ej. maria.torres@sangabriel.edu.ec"
                  className="mt-1.5 w-full rounded-xl border border-sand-300 bg-sand-50 px-3 py-2 text-xs font-semibold text-sand-900 outline-none focus:border-ink-600 focus:bg-white focus:ring-2 focus:ring-ink-100"
                />
                <p className="mt-1 text-[11px] text-sand-500">
                  Debe ser el correo con dominio del colegio.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-sand-800 uppercase tracking-wide">
                  Institución Educativa Asignada *
                </label>
                <select
                  value={newInstitucionId}
                  onChange={(e) => setNewInstitucionId(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-sand-300 bg-sand-50 px-3 py-2 text-xs font-semibold text-sand-900 outline-none focus:border-ink-600 focus:bg-white"
                >
                  {instituciones.map((inst) => {
                    const count = usuarios.filter(
                      (u) =>
                        u.institucion_id === inst.id && u.rol === "DOCENTE",
                    ).length
                    return (
                      <option key={inst.id} value={inst.id}>
                        {inst.nombre} ({count}/{inst.limite_docentes} cupos
                        usados)
                      </option>
                    )
                  })}
                </select>
              </div>

              {/* Selector de Rol */}
              <div>
                <label className="block text-xs font-bold text-sand-800 uppercase tracking-wide">
                  Rol y Nivel de Permisos *
                </label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <label
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border cursor-pointer text-center transition ${
                      newRol === "DOCENTE"
                        ? "border-ink-600 bg-ink-50 text-ink-950 font-bold"
                        : "border-sand-300 hover:bg-sand-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="rol"
                      value="DOCENTE"
                      checked={newRol === "DOCENTE"}
                      onChange={() => setNewRol("DOCENTE")}
                      className="sr-only"
                    />
                    <span className="text-lg">👨‍🏫</span>
                    <span className="text-xs mt-1">Docente</span>
                    <span className="text-[10px] text-sand-500 font-normal">
                      Crea aulas PISA
                    </span>
                  </label>

                  <label
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border cursor-pointer text-center transition ${
                      newRol === "COORDINADOR_RECTOR"
                        ? "border-hint-600 bg-hint-50 text-hint-950 font-bold"
                        : "border-sand-300 hover:bg-sand-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="rol"
                      value="COORDINADOR_RECTOR"
                      checked={newRol === "COORDINADOR_RECTOR"}
                      onChange={() => setNewRol("COORDINADOR_RECTOR")}
                      className="sr-only"
                    />
                    <span className="text-lg">🏛️</span>
                    <span className="text-xs mt-1">Directivo</span>
                    <span className="text-[10px] text-sand-500 font-normal">
                      Supervisa colegio
                    </span>
                  </label>

                  <label
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border cursor-pointer text-center transition ${
                      newRol === "ADMIN"
                        ? "border-ink-950 bg-sand-200 text-sand-950 font-bold"
                        : "border-sand-300 hover:bg-sand-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="rol"
                      value="ADMIN"
                      checked={newRol === "ADMIN"}
                      onChange={() => setNewRol("ADMIN")}
                      className="sr-only"
                    />
                    <span className="text-lg">👑</span>
                    <span className="text-xs mt-1">Admin</span>
                    <span className="text-[10px] text-sand-500 font-normal">
                      Control total
                    </span>
                  </label>
                </div>
              </div>

              {/* Asignatura (si es Docente) */}
              {newRol === "DOCENTE" && (
                <div>
                  <label className="block text-xs font-bold text-sand-800 uppercase tracking-wide">
                    Asignatura Principal
                  </label>
                  <select
                    value={newAsignaturaId}
                    onChange={(e) => setNewAsignaturaId(Number(e.target.value))}
                    className="mt-1.5 w-full rounded-xl border border-sand-300 bg-sand-50 px-3 py-2 text-xs font-semibold text-sand-900 outline-none focus:border-ink-600 focus:bg-white"
                  >
                    {CATALOGO_ASIGNATURAS.map((asig) => (
                      <option key={asig.id} value={asig.id}>
                        {asig.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Estado Inicial */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="new-activo-checkbox"
                  checked={newActivo}
                  onChange={(e) => setNewActivo(e.target.checked)}
                  className="size-4 rounded text-ink-600 focus:ring-ink-500"
                />
                <label
                  htmlFor="new-activo-checkbox"
                  className="text-xs font-semibold text-sand-800"
                >
                  Activar permisos de acceso inmediatamente
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-sand-200">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-sand-700 hover:bg-sand-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="btn-pop-ink rounded-xl bg-ink-950 px-5 py-2 text-xs font-bold text-white transition disabled:opacity-50"
                >
                  {formSubmitting ? "Creando usuario..." : "Crear y Autorizar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Editar Usuario y Permisos */}
      {editModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-sand-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-sand-300 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-sand-200 pb-3">
              <div>
                <h3 className="text-lg font-bold text-sand-950">
                  Modificar Usuario y Permisos
                </h3>
                <p className="text-xs text-sand-600">
                  {selectedUser.email_institucional}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="grid size-8 place-items-center rounded-full text-sand-500 hover:bg-sand-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-sand-800">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  value={selectedUser.nombre_completo}
                  onChange={(e) =>
                    setSelectedUser({
                      ...selectedUser,
                      nombre_completo: e.target.value,
                    })
                  }
                  className="mt-1 w-full rounded-xl border border-sand-300 bg-sand-50 px-3 py-2 text-xs font-semibold text-sand-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-sand-800">
                  Institución
                </label>
                <select
                  value={selectedUser.institucion_id}
                  onChange={(e) =>
                    setSelectedUser({
                      ...selectedUser,
                      institucion_id: e.target.value,
                    })
                  }
                  className="mt-1 w-full rounded-xl border border-sand-300 bg-sand-50 px-3 py-2 text-xs font-semibold"
                >
                  {instituciones.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-sand-800">
                  Rol del Usuario
                </label>
                <select
                  value={selectedUser.rol}
                  onChange={(e) =>
                    setSelectedUser({
                      ...selectedUser,
                      rol: e.target.value as any,
                    })
                  }
                  className="mt-1 w-full rounded-xl border border-sand-300 bg-sand-50 px-3 py-2 text-xs font-semibold"
                >
                  <option value="DOCENTE">
                    DOCENTE (Acceso a aulas y generador)
                  </option>
                  <option value="COORDINADOR_RECTOR">
                    COORDINADOR_RECTOR (Supervisión institucional)
                  </option>
                  <option value="ADMIN">
                    ADMIN (Acceso al panel de administración)
                  </option>
                </select>
              </div>

              {selectedUser.rol === "DOCENTE" && (
                <div>
                  <label className="block text-xs font-bold text-sand-800">
                    Asignatura
                  </label>
                  <select
                    value={selectedUser.asignatura_principal_id || 1}
                    onChange={(e) =>
                      setSelectedUser({
                        ...selectedUser,
                        asignatura_principal_id: Number(e.target.value),
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-sand-300 bg-sand-50 px-3 py-2 text-xs font-semibold"
                  >
                    {CATALOGO_ASIGNATURAS.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="edit-activo-cb"
                  checked={selectedUser.activo}
                  onChange={(e) =>
                    setSelectedUser({
                      ...selectedUser,
                      activo: e.target.checked,
                    })
                  }
                  className="size-4 rounded text-ink-600"
                />
                <label
                  htmlFor="edit-activo-cb"
                  className="text-xs font-semibold text-sand-800"
                >
                  Permiso de acceso habilitado (Activo)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-sand-200">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-sand-700 hover:bg-sand-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="btn-pop-ink rounded-xl bg-ink-950 px-5 py-2 text-xs font-bold text-white disabled:opacity-50"
                >
                  {formSubmitting ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Registrar Colegio */}
      {schoolModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-sand-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-sand-300 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-sand-200 pb-3">
              <div>
                <h3 className="text-lg font-bold text-sand-950">
                  Registrar Nueva Institución Educativa
                </h3>
                <p className="text-xs text-sand-600">
                  Nuevo plantel socio para la plataforma ECduLearm.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSchoolModalOpen(false)}
                className="grid size-8 place-items-center rounded-full text-sand-500 hover:bg-sand-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSchool} className="mt-4 space-y-4">
              {schoolError && (
                <div className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs font-semibold text-rose-900">
                  ⚠️ {schoolError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-sand-800">
                  Nombre del Plantel *
                </label>
                <input
                  type="text"
                  required
                  value={newSchoolNombre}
                  onChange={(e) => setNewSchoolNombre(e.target.value)}
                  placeholder="Ej. Unidad Educativa Juan Montalvo"
                  className="mt-1 w-full rounded-xl border border-sand-300 bg-sand-50 px-3 py-2 text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-sand-800">
                    Código AMIE
                  </label>
                  <input
                    type="text"
                    value={newSchoolAmie}
                    onChange={(e) => setNewSchoolAmie(e.target.value)}
                    placeholder="17H00099"
                    className="mt-1 w-full rounded-xl border border-sand-300 bg-sand-50 px-3 py-2 text-xs font-semibold uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-sand-800">
                    Límite de Docentes
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={newSchoolLimite}
                    onChange={(e) => setNewSchoolLimite(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-sand-300 bg-sand-50 px-3 py-2 text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-sand-800">
                    Tipo de Institución
                  </label>
                  <select
                    value={newSchoolTipo}
                    onChange={(e) => setNewSchoolTipo(e.target.value as any)}
                    className="mt-1 w-full rounded-xl border border-sand-300 bg-sand-50 px-3 py-2 text-xs font-semibold"
                  >
                    <option value="PARTICULAR">PARTICULAR</option>
                    <option value="FISCOMISIONAL">FISCOMISIONAL</option>
                    <option value="FISCAL">FISCAL</option>
                    <option value="MUNICIPAL">MUNICIPAL</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-sand-800">
                    Plan de Suscripción
                  </label>
                  <select
                    value={newSchoolPlan}
                    onChange={(e) => setNewSchoolPlan(e.target.value as any)}
                    className="mt-1 w-full rounded-xl border border-sand-300 bg-sand-50 px-3 py-2 text-xs font-semibold"
                  >
                    <option value="PILOTO">PILOTO</option>
                    <option value="ACTIVA">ACTIVA</option>
                    <option value="CONVENIO">CONVENIO</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-sand-800">
                  Ciudad
                </label>
                <input
                  type="text"
                  value={newSchoolCiudad}
                  onChange={(e) => setNewSchoolCiudad(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-sand-300 bg-sand-50 px-3 py-2 text-xs font-semibold"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-sand-200">
                <button
                  type="button"
                  onClick={() => setSchoolModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-sand-700 hover:bg-sand-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={schoolSubmitting}
                  className="btn-pop-ink rounded-xl bg-ink-950 px-5 py-2 text-xs font-bold text-white disabled:opacity-50"
                >
                  {schoolSubmitting ? "Registrando..." : "Registrar Colegio"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: PIN de Acceso / Bienvenida */}
      {pinModalOpen && pinModalData && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-sand-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-sand-300 bg-white p-6 shadow-2xl text-center">
            <span className="grid size-14 place-items-center rounded-full bg-hint-100 text-hint-800 text-2xl mx-auto">
              🔑
            </span>
            <h3 className="mt-4 text-lg font-bold text-sand-950">
              Clave Provisional Generada
            </h3>
            <p className="mt-1 text-xs text-sand-600">
              Entrega esta clave al docente para su primer ingreso al sistema
              ECduLearm:
            </p>

            <div className="my-5 rounded-2xl bg-sand-100 p-4 border border-sand-300">
              <p className="text-xs text-sand-500 font-semibold">
                Docente: {pinModalData.name}
              </p>
              <p className="text-xs font-mono text-sand-600">
                {pinModalData.email}
              </p>
              <div className="mt-3 text-3xl font-extrabold font-mono tracking-widest text-ink-950">
                {pinModalData.pin}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(
                  `Hola ${pinModalData.name}, tu cuenta docente en ECduLearm ha sido autorizada. Ingresa con tu correo ${pinModalData.email} y clave provisional: ${pinModalData.pin}`,
                )
                showToast("Mensaje copiado al portapapeles", "success")
                setPinModalOpen(false)
              }}
              className="btn-pop-ink w-full rounded-xl bg-ink-950 py-2.5 text-xs font-bold text-white"
            >
              Copiar Mensaje de Bienvenida
            </button>

            <button
              type="button"
              onClick={() => setPinModalOpen(false)}
              className="mt-3 text-xs font-semibold text-sand-600 hover:text-sand-900"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* MODAL 5: Confirmar Eliminación */}
      {deleteConfirmOpen && userToDelete && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-sand-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-sand-300 bg-white p-6 shadow-2xl text-center">
            <span className="grid size-12 place-items-center rounded-full bg-rose-100 text-rose-700 text-xl mx-auto">
              ⚠️
            </span>
            <h3 className="mt-3 text-base font-bold text-sand-950">
              ¿Eliminar usuario?
            </h3>
            <p className="mt-2 text-xs text-sand-600">
              Esta acción eliminará a{" "}
              <strong>{userToDelete.nombre_completo}</strong> (
              {userToDelete.email_institucional}) y revocará todos sus accesos a
              la plataforma.
            </p>

            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(false)}
                className="rounded-xl border border-sand-300 px-4 py-2 text-xs font-semibold text-sand-700 hover:bg-sand-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700"
              >
                Confirmar Eliminación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
