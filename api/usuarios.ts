// Cuentas de acceso de docentes y directivos (Vercel Function). Es el único punto que usa la clave
// service_role de Supabase: crear o cambiar la contraseña de otra cuenta no se puede desde el navegador.
//
// Acciones:
// - generar-clave (solo ADMIN): crea la cuenta de Auth o reemplaza su contraseña por una temporal de 72 h.
// - estados (solo ADMIN): estado de acceso de cada usuario institucional.
// - cambiar-clave (el propio usuario): cambia la temporal por la suya y quita la marca de primer ingreso.

import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

type Accion = "generar-clave" | "estados" | "cambiar-clave";
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

const ACCIONES: Accion[] = ["generar-clave", "estados", "cambiar-clave"];
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
    return json(200, await estados(admin));
  } catch (error) {
    if (error instanceof HttpError) return json(error.status, { error: error.code });
    console.error("[api/usuarios] error inesperado:", (error as Error).name);
    return json(500, { error: "internal_error" });
  }
}
