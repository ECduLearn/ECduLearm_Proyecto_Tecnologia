// Cuentas de acceso de docentes y directivos (Vercel Function). Es el único punto que usa la clave
// service_role de Supabase: crear o cambiar la contraseña de otra cuenta no se puede desde el navegador.
//
// Acciones:
// - generar-clave (solo ADMIN): crea la cuenta de Auth o reemplaza su contraseña por una temporal de 72 h.
// - estados (solo ADMIN): estado de acceso de cada usuario institucional.
// - cambiar-clave (el propio usuario): cambia la temporal por la suya y quita la marca de primer ingreso.
// - uso (solo ADMIN): usuarios activos y uso de la plataforma en los últimos 30 días, sin datos personales.

import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

type Accion = "generar-clave" | "estados" | "cambiar-clave" | "uso";
type EstadoAcceso = "activo" | "pendiente" | "vencida" | "sin_acceso";

class HttpError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

const ACCIONES: Accion[] = ["generar-clave", "estados", "cambiar-clave", "uso"];
const VIGENCIA_CLAVE_MS = 72 * 3600 * 1000;
const MAX_BODY_BYTES = 4_000;
const RATE_LIMIT = { windowMs: 60_000, max: 30 };
// Sin caracteres que se confunden al dictarlos o copiarlos a mano (0/O, 1/l/I)
const ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";

function json(status: number, body: unknown): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function isAllowedOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  if (origin === new URL(request.url).origin) return true;
  const allowed = (process.env.AI_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  return allowed.includes(origin);
}

// En memoria por instancia: frena abusos básicos, no es un límite global.
const hits = new Map<string, number[]>();

function isRateLimited(request: Request): boolean {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT.windowMs);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5_000) hits.clear();
  return recent.length > RATE_LIMIT.max;
}

function clienteServicio(): SupabaseClient {
  const url = (process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL)?.trim();
  const clave = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !clave) throw new HttpError(503, "servicio_no_configurado");
  return createClient(url, clave, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function usuarioDelToken(admin: SupabaseClient, request: Request): Promise<User> {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (!token) throw new HttpError(401, "sin_sesion");
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) throw new HttpError(401, "sesion_invalida");
  return data.user;
}

async function exigirAdmin(admin: SupabaseClient, usuario: User): Promise<void> {
  const { data } = await admin
    .from("usuarios_institucionales")
    .select("rol")
    .eq("auth_user_id", usuario.id)
    .eq("activo", true)
    .maybeSingle();
  if (data?.rol !== "ADMIN") throw new HttpError(403, "requiere_admin");
}

function claveTemporal(): string {
  for (;;) {
    let clave = "";
    while (clave.length < 10) {
      for (const byte of crypto.getRandomValues(new Uint8Array(16))) {
        // Rechazo de muestras: evita que unos caracteres salgan más que otros
        if (byte < 216 && clave.length < 10) clave += ALFABETO[byte % ALFABETO.length];
      }
    }
    if (/[A-Za-z]/.test(clave) && /\d/.test(clave)) return clave;
  }
}

async function todasLasCuentas(admin: SupabaseClient): Promise<User[]> {
  const cuentas: User[] = [];
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new HttpError(502, "auth_no_disponible");
    cuentas.push(...data.users);
    if (data.users.length < 1000) break;
  }
  return cuentas;
}

function estadoDe(cuenta: User | undefined): EstadoAcceso {
  if (!cuenta) return "sin_acceso";
  const meta = cuenta.app_metadata ?? {};
  if (!meta.debe_cambiar_clave) return "activo";
  return Date.parse(String(meta.clave_temporal_expira)) < Date.now() ? "vencida" : "pendiente";
}

function validarClaveNueva(clave: unknown): string {
  if (typeof clave !== "string") throw new HttpError(422, "clave_invalida");
  if (clave.length < 8 || clave.length > 72 || !/[A-Za-z]/.test(clave) || !/\d/.test(clave)) {
    throw new HttpError(422, "clave_debil");
  }
  return clave;
}

async function generarClave(admin: SupabaseClient, usuarioId: unknown) {
  if (typeof usuarioId !== "string" || !/^[0-9a-f-]{36}$/i.test(usuarioId)) throw new HttpError(422, "usuario_invalido");

  const { data: perfil } = await admin
    .from("usuarios_institucionales")
    .select("id, email_institucional, auth_user_id, activo")
    .eq("id", usuarioId)
    .maybeSingle();
  if (!perfil) throw new HttpError(404, "usuario_no_encontrado");
  if (!perfil.activo) throw new HttpError(409, "usuario_inactivo");

  const clave = claveTemporal();
  const expira = new Date(Date.now() + VIGENCIA_CLAVE_MS).toISOString();
  const app_metadata = { debe_cambiar_clave: true, clave_temporal_expira: expira };

  let authId: string | null = perfil.auth_user_id;
  let recienCreada = false;
  if (!authId) {
    const creada = await admin.auth.admin.createUser({
      email: perfil.email_institucional,
      password: clave,
      email_confirm: true,
      app_metadata,
    });
    if (creada.data.user) {
      authId = creada.data.user.id;
      recienCreada = true;
    } else {
      // La cuenta de Auth ya existía (creada a mano en Supabase): se reutiliza
      const correo = String(perfil.email_institucional).toLowerCase();
      authId = (await todasLasCuentas(admin)).find((c) => c.email?.toLowerCase() === correo)?.id ?? null;
      if (!authId) {
        console.error("[api/usuarios] createUser falló:", creada.error?.code ?? creada.error?.status);
        throw new HttpError(502, "auth_no_disponible");
      }
    }
  }

  const { error: errorClave } = recienCreada
    ? { error: null }
    : await admin.auth.admin.updateUserById(authId, { password: clave, email_confirm: true, app_metadata });
  if (errorClave) {
    console.error("[api/usuarios] updateUserById falló:", errorClave.code ?? errorClave.status);
    throw new HttpError(502, "auth_no_disponible");
  }

  // El trigger fn_vincular_usuario_auth vincula al crear; esto cubre cuentas que ya existían
  if (perfil.auth_user_id !== authId) {
    await admin.from("usuarios_institucionales").update({ auth_user_id: authId }).eq("id", perfil.id);
  }

  return { clave, expira };
}

async function estados(admin: SupabaseClient) {
  const [{ data: perfiles, error }, cuentas] = await Promise.all([
    admin.from("usuarios_institucionales").select("id, auth_user_id"),
    todasLasCuentas(admin),
  ]);
  if (error) throw new HttpError(502, "base_no_disponible");
  const porId = new Map(cuentas.map((c) => [c.id, c]));
  const resultado: Record<string, EstadoAcceso> = {};
  for (const perfil of perfiles ?? []) {
    resultado[perfil.id] = estadoDe(perfil.auth_user_id ? porId.get(perfil.auth_user_id) : undefined);
  }
  return { estados: resultado };
}

async function cambiarClave(admin: SupabaseClient, usuario: User, nueva: unknown) {
  const clave = validarClaveNueva(nueva);
  const estado = estadoDe(usuario);
  if (estado === "activo") throw new HttpError(409, "sin_cambio_pendiente");
  if (estado === "vencida") throw new HttpError(410, "clave_vencida");

  // Contraseña y marca cambian juntas: no se puede quitar la marca sin cambiar la contraseña
  const { error } = await admin.auth.admin.updateUserById(usuario.id, {
    password: clave,
    app_metadata: { debe_cambiar_clave: false, clave_temporal_expira: null },
  });
  if (error) {
    if (error.code === "same_password") throw new HttpError(422, "misma_clave");
    if (error.code === "weak_password") throw new HttpError(422, "clave_debil");
    console.error("[api/usuarios] cambio de clave falló:", error.code ?? error.status);
    throw new HttpError(502, "auth_no_disponible");
  }
  return { ok: true };
}

// --- Observabilidad -----------------------------------------------------------

const DIA_MS = 86_400_000;
// Ecuador continental: UTC-5 todo el año (sin horario de verano)
const ZONA_MS = 5 * 3600 * 1000;
const CONECTADO_MS = 15 * 60 * 1000;

function diaLocal(ms: number): string {
  return new Date(ms - ZONA_MS).toISOString().slice(0, 10);
}

// PostgREST devuelve como máximo 1000 filas por consulta: se pide por páginas
async function leerTodo<T>(consulta: (desde: number, hasta: number) => PromiseLike<{ data: unknown; error: unknown }>): Promise<T[]> {
  const filas: T[] = [];
  for (let pagina = 0; pagina < 50; pagina++) {
    const { data, error } = await consulta(pagina * 1000, pagina * 1000 + 999);
    if (error) throw new HttpError(502, "base_no_disponible");
    const lote = (data ?? []) as T[];
    filas.push(...lote);
    if (lote.length < 1000) break;
  }
  return filas;
}

async function uso(admin: SupabaseClient) {
  const ahora = Date.now();
  const desde = new Date(ahora - 30 * DIA_MS).toISOString();
  const inicioHoy = Date.parse(`${diaLocal(ahora)}T00:00:00Z`) + ZONA_MS;

  const [cuentas, perfiles, colegios, aulas, sesiones, ejercicios, mensajes, intentos] = await Promise.all([
    todasLasCuentas(admin),
    leerTodo<{ id: string; auth_user_id: string | null; activo: boolean; institucion_id: string }>((a, b) =>
      admin.from("usuarios_institucionales").select("id, auth_user_id, activo, institucion_id").range(a, b)
    ),
    leerTodo<{ id: string; nombre: string }>((a, b) => admin.from("instituciones").select("id, nombre").range(a, b)),
    leerTodo<{ id: string; docente_id: string; activa: boolean; expires_at: string }>((a, b) =>
      admin.from("aulas_virtuales").select("id, docente_id, activa, expires_at").range(a, b)
    ),
    leerTodo<{ aula_id: string | null; institucion_id: string | null; iniciado_en: string; ultima_actividad_en: string; estado: string }>(
      (a, b) =>
        admin
          .from("sesiones_estudiantes_anonimas")
          .select("aula_id, institucion_id, iniciado_en, ultima_actividad_en, estado")
          .gte("ultima_actividad_en", desde)
          .range(a, b)
    ),
    leerTodo<{ docente_creador_id: string | null; created_at: string }>((a, b) =>
      admin.from("ejercicios_pisa").select("docente_creador_id, created_at").gte("created_at", desde).range(a, b)
    ),
    leerTodo<{ remitente: string; tipo_interaccion: string; created_at: string }>((a, b) =>
      admin.from("mensajes_tutor_socratico").select("remitente, tipo_interaccion, created_at").gte("created_at", desde).range(a, b)
    ),
    leerTodo<{ pistas_socraticas_usadas: number; logro_resolver: boolean }>((a, b) =>
      admin.from("intentos_y_bloqueos_ejercicio").select("pistas_socraticas_usadas, logro_resolver").gte("created_at", desde).range(a, b)
    ),
  ]);

  const cuentaPorId = new Map(cuentas.map((c) => [c.id, c]));
  const colegioDeUsuario = new Map(perfiles.map((p) => [p.id, p.institucion_id]));
  const docenteDeAula = new Map(aulas.map((a) => [a.id, a.docente_id]));
  const desdeMs = (dias: number) => ahora - dias * DIA_MS;

  // Docentes y directivos: último ingreso con contraseña (Supabase Auth)
  const ultimoIngreso = (perfilAuth: string | null) => {
    const cuenta = perfilAuth ? cuentaPorId.get(perfilAuth) : undefined;
    return cuenta?.last_sign_in_at ? Date.parse(cuenta.last_sign_in_at) : 0;
  };
  const activos = perfiles.filter((p) => p.activo);
  const ingresaronDesde = (ms: number) => activos.filter((p) => ultimoIngreso(p.auth_user_id) >= ms).length;

  // Estudiantes: cada sesión anónima es un dispositivo dentro de un aula (sin datos personales)
  const ultimaActividad = (s: (typeof sesiones)[number]) => Date.parse(s.ultima_actividad_en);
  const colegioDeSesion = (s: (typeof sesiones)[number]) =>
    s.institucion_id ?? colegioDeUsuario.get(docenteDeAula.get(s.aula_id ?? "") ?? "") ?? null;

  const serie = Array.from({ length: 30 }, (_, i) => ({
    fecha: diaLocal(ahora - (29 - i) * DIA_MS),
    sesiones: 0,
    ejercicios: 0,
    mensajesTutor: 0,
  }));
  const porDia = new Map(serie.map((d) => [d.fecha, d]));
  for (const s of sesiones) {
    const d = porDia.get(diaLocal(Date.parse(s.iniciado_en)));
    if (d) d.sesiones++;
  }
  for (const e of ejercicios) {
    const d = porDia.get(diaLocal(Date.parse(e.created_at)));
    if (d) d.ejercicios++;
  }
  for (const m of mensajes) {
    if (m.remitente !== "TUTOR_IA") continue;
    const d = porDia.get(diaLocal(Date.parse(m.created_at)));
    if (d) d.mensajesTutor++;
  }

  const filasColegio = new Map(
    colegios.map((c) => [c.id, { id: c.id, nombre: c.nombre, docentes: 0, docentesActivos: 0, sesiones: 0, ejercicios: 0 }])
  );
  for (const p of activos) {
    const fila = filasColegio.get(p.institucion_id);
    if (!fila) continue;
    fila.docentes++;
    if (ultimoIngreso(p.auth_user_id) >= desdeMs(7)) fila.docentesActivos++;
  }
  for (const s of sesiones) {
    const fila = filasColegio.get(colegioDeSesion(s) ?? "");
    if (fila && Date.parse(s.iniciado_en) >= desdeMs(30)) fila.sesiones++;
  }
  for (const e of ejercicios) {
    const fila = filasColegio.get(colegioDeUsuario.get(e.docente_creador_id ?? "") ?? "");
    if (fila) fila.ejercicios++;
  }

  return {
    generadoEn: new Date(ahora).toISOString(),
    docentes: {
      total: activos.length,
      hoy: ingresaronDesde(inicioHoy),
      semana: ingresaronDesde(desdeMs(7)),
      mes: ingresaronDesde(desdeMs(30)),
      pendientes: activos.filter((p) => p.auth_user_id && estadoDe(cuentaPorId.get(p.auth_user_id)) === "pendiente").length,
    },
    estudiantes: {
      ahora: sesiones.filter((s) => s.estado === "EN_PROGRESO" && ultimaActividad(s) >= ahora - CONECTADO_MS).length,
      hoy: sesiones.filter((s) => ultimaActividad(s) >= inicioHoy).length,
      semana: sesiones.filter((s) => ultimaActividad(s) >= desdeMs(7)).length,
      mes: sesiones.length,
    },
    ultimos30: {
      ejercicios: ejercicios.length,
      mensajesTutor: mensajes.filter((m) => m.remitente === "TUTOR_IA").length,
      copiasBloqueadas: mensajes.filter((m) => m.tipo_interaccion === "INTENTO_COPIA_BLOQUEADO").length,
      pistas: intentos.reduce((total, i) => total + Number(i.pistas_socraticas_usadas ?? 0), 0),
      retosResueltos: intentos.filter((i) => i.logro_resolver).length,
    },
    aulasActivas: aulas.filter((a) => a.activa && Date.parse(a.expires_at) > ahora).length,
    serie,
    colegios: [...filasColegio.values()].sort((a, b) => b.sesiones - a.sesiones || b.ejercicios - a.ejercicios),
  };
}

export async function POST(request: Request): Promise<Response> {
  try {
    if (!isAllowedOrigin(request)) throw new HttpError(403, "origin_not_allowed");
    if (isRateLimited(request)) throw new HttpError(429, "rate_limited");

    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) throw new HttpError(413, "payload_too_large");
    let body: Record<string, unknown>;
    try {
      body = JSON.parse(raw);
    } catch {
      throw new HttpError(400, "invalid_json");
    }

    const accion = body.accion as Accion;
    if (!ACCIONES.includes(accion)) throw new HttpError(422, "accion_invalida");

    const admin = clienteServicio();
    const usuario = await usuarioDelToken(admin, request);

    if (accion === "cambiar-clave") return json(200, await cambiarClave(admin, usuario, body.nueva));

    await exigirAdmin(admin, usuario);
    if (accion === "generar-clave") return json(200, await generarClave(admin, body.usuarioId));
    if (accion === "uso") return json(200, await uso(admin));
    return json(200, await estados(admin));
  } catch (error) {
    if (error instanceof HttpError) return json(error.status, { error: error.code });
    console.error("[api/usuarios] error inesperado:", (error as Error).name);
    return json(500, { error: "internal_error" });
  }
}
