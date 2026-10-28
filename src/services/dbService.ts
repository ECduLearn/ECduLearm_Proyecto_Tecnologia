/**
 * SERVICIO CENTRAL DE BASE DE DATOS Y PERSISTENCIA (MVC / N-CAPAS)
 * Conexión cliente-servidor a PostgreSQL (Supabase) con mapeo 1:1 a 'schema.sql' v2.0.0
 * Incluye sanitización OWASP, autenticación JWT/roles, Zero-PII y fallback offline inquebrantable.
 */

import { isAuthRetryableFetchError, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseClient, getSupabaseConfig } from "./supabaseClient";
import {
  SEED_EJERCICIOS_PISA,
  FullPisaExercise,
  RETO_LOCAL_DEMO,
} from "../models/seedData";
import { Exercise, PasoBloqueo, RetoEstudiante, SesionEstudiante, TeacherUser } from "../models/types";

// ==============================================================================
// 1. SEGURIDAD, OWASP Y SANITIZACIÓN DE ENTRADAS
// ==============================================================================

/**
 * Sanitiza cadenas de texto para prevenir ataques XSS e inyecciones básicas.
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== "string") return "";
  return input
    .trim()
    .replace(/[<>]/g, "") // Eliminar etiquetas HTML
    .slice(0, 4000); // Limitar longitud defensiva
}

/**
 * Genera un hash SHA-256 en formato hexadecimal para tokens anónimos de dispositivo.
 */
export async function generateDeviceTokenHash(): Promise<string> {
  const raw =
    typeof window !== "undefined"
      ? localStorage.getItem("ecdulearn_device_entropy") ||
        `${Date.now()}-${Math.random()}-${navigator.userAgent}`
      : `${Date.now()}-${Math.random()}`;

  if (typeof window !== "undefined" && !localStorage.getItem("ecdulearn_device_entropy")) {
    localStorage.setItem("ecdulearn_device_entropy", raw);
  }

  // Si SubtleCrypto está disponible (HTTPS / localhost seguro)
  if (typeof window !== "undefined" && window.crypto?.subtle) {
    try {
      const msgBuffer = new TextEncoder().encode(raw);
      const hashBuffer = await window.crypto.subtle.digest("SHA-256", msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    } catch {
      // Continuar al fallback
    }
  }

  // Fallback determinista de 64 caracteres hex
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = (hash << 5) - hash + raw.charCodeAt(i);
    hash |= 0;
  }
  const hexPart = Math.abs(hash).toString(16).padStart(8, "0");
  return (hexPart.repeat(8)).slice(0, 64);
}

// ==============================================================================
// 2. MODELOS Y TIPOS DERIVADOS DEL ESQUEMA SQL (schema.sql)
// ==============================================================================

export interface DbInstitucion {
  id: string;
  nombre: string;
  codigo_amie: string | null;
  tipo_institucion: "PARTICULAR" | "FISCOMISIONAL" | "FISCAL" | "MUNICIPAL";
  plan_suscripcion: "ACTIVA" | "PILOTO" | "CONVENIO" | "SUSPENDIDA";
  pin_grado_autonomo: string | null;
  limite_docentes: number;
  ciudad: string;
  provincia: string;
}

export interface DbUsuarioInstitucional {
  id: string;
  institucion_id: string;
  nombre_completo: string;
  email_institucional: string;
  rol: "DOCENTE" | "COORDINADOR_RECTOR" | "ADMIN";
  asignatura_principal_id: number | null;
  activo: boolean;
}

export interface DbEjercicioPisa {
  id: string;
  docente_creador_id: string | null;
  ejercicio_padre_id: string | null;
  etiqueta_version: string;
  curso_bgu: "1ro BGU" | "2do BGU" | "3ro BGU";
  asignatura_id: number;
  tema_curricular: string;
  contexto_pisa: string;
  nivel_dificultad: "Básica" | "Intermedia" | "Avanzada";
  nivel_pisa: number | null;
  enunciado_contexto: string;
  pregunta_razonamiento: string;
  opciones_respuesta: any[] | null;
  respuesta_correcta: string;
  solucion_paso_a_paso_docente: string;
  pistas_socraticas_base: string[];
  es_publico: boolean;
  generado_por_ia: boolean;
  tiempo_creacion_segundos: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface DbPlanificacionErca {
  id: string;
  docente_id: string;
  titulo_guia: string;
  curso_bgu: "1ro BGU" | "2do BGU" | "3ro BGU";
  asignatura_id: number;
  destreza_dcd: string;
  duracion_minutos: number;
  fase_experiencia: string;
  fase_reflexion: string;
  fase_conceptualizacion: string;
  fase_aplicacion_texto: string;
  archivo_silabo_url?: string | null;
}

export interface DbAulaVirtual {
  id: string;
  pin_acceso: string;
  docente_id: string;
  planificacion_id: string | null;
  titulo_sesion: string;
  modo_aula: "RETO_CLASE" | "PRACTICA_LIBRE" | "SIMULADOR_ADMISION";
  tiempo_limite_minutos: number | null;
  max_estudiantes: number;
  activa: boolean;
  expires_at: string;
}

export interface DbSesionEstudianteAnonima {
  id: string;
  aula_id: string | null;
  institucion_id: string | null;
  alias_temporal: string; // 'Estudiante #N' (Zero-PII)
  token_dispositivo_hash: string;
  estado: "EN_PROGRESO" | "COMPLETADO" | "ABANDONADO";
  iniciado_en: string;
  tiempo_total_segundos: number | null;
  puntaje_simulador: number | null;
}

export interface DbMetricasDocente {
  ejerciciosGenerados: number;
  promedioSegundos: number;
  horasAhorradasEstimadas: number;
  pctResueltosConAyuda: number;
  estudiantesConectados: number;
  aulasActivas: number;
  pasoBloqueoFrecuente: string;
  estudiantesBloqueados: number;
  pctBloqueo: number;
  isOffline: boolean;
}

// ==============================================================================
// 3. PERSISTENCIA LOCAL (CACHE / FALLBACK OFFLINE)
// ==============================================================================

const STORAGE_KEYS = {
  USER_SESSION: "ecdulearn_auth_user",
  LEGACY_JWT_TOKEN: "ecdulearn_jwt_token",
  LOCAL_EJERCICIOS: "ecdulearn_db_ejercicios",
  LOCAL_PLANIFICACIONES: "ecdulearn_db_planificaciones",
  LOCAL_AULAS: "ecdulearn_db_aulas",
  LOCAL_SESIONES: "ecdulearn_db_sesiones_anonimas",
  LOCAL_INTENTOS: "ecdulearn_db_intentos",
  LOCAL_USUARIOS: "ecdulearn_db_usuarios_institucionales",
  LOCAL_INSTITUCIONES: "ecdulearn_db_instituciones",
  LOCAL_AUDITORIA: "ecdulearn_db_auditoria_admin",
};

// Usuario semilla pre-aprobado para el Evaluador/Jurado
export const DEMO_DOCENTE_USER: DbUsuarioInstitucional = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  institucion_id: "11111111-1111-4111-8111-111111111111",
  nombre_completo: "Docente Demo PUCE",
  email_institucional: "docente@puce.edu.ec",
  rol: "DOCENTE",
  asignatura_principal_id: 1, // Matemáticas
  activo: true,
};

// ==============================================================================
// 4. CONTROLADOR DE AUTENTICACIÓN Y ROLES (usuarios_institucionales)
// ==============================================================================

// Cuentas demo públicas: solo operan con datos locales (sin sesión de Supabase, RLS bloquea la base).
const DEMO_ACCOUNTS: Record<string, { password: string; user: TeacherUser }> = {
  "docente@puce.edu.ec": {
    password: "demo123",
    user: {
      id: DEMO_DOCENTE_USER.id,
      name: DEMO_DOCENTE_USER.nombre_completo,
      email: "docente@puce.edu.ec",
      institution: "Unidad Educativa Demo ECduLearn",
      role: "docente",
      isDemo: true,
    },
  },
  "admin@ecdulearn.edu.ec": {
    password: "admin123",
    user: {
      id: "99999999-9999-4999-8999-999999999999",
      name: "Administrador Demo ECduLearn",
      email: "admin@ecdulearn.edu.ec",
      institution: "ECduLearn · Administración Central",
      role: "admin",
      isDemo: true,
    },
  },
};

type LoginResult = { success: boolean; user: TeacherUser | null; message: string };

function saveCurrentUser(user: TeacherUser): void {
  try {
    localStorage.setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify(user));
    localStorage.removeItem(STORAGE_KEYS.LEGACY_JWT_TOKEN);
  } catch {
    // Sin almacenamiento la sesión dura lo que la pestaña.
  }
}

function clearCurrentUser(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.USER_SESSION);
    localStorage.removeItem(STORAGE_KEYS.LEGACY_JWT_TOKEN);
  } catch {
    // Nada que limpiar.
  }
}

function demoLogin(email: string): LoginResult {
  const user = DEMO_ACCOUNTS[email].user;
  saveCurrentUser(user);
  return { success: true, user, message: "Entraste en modo demo con datos de ejemplo." };
}

function mapRol(rol: string): TeacherUser["role"] {
  if (rol === "ADMIN") return "admin";
  if (rol === "COORDINADOR_RECTOR") return "coordinador";
  return "docente";
}

// El perfil solo es visible si el colegio pre-registró el correo y la institución está activa (RLS).
async function fetchTeacherProfile(client: SupabaseClient, authUserId: string): Promise<TeacherUser | null> {
  const { data, error } = await client
    .from("usuarios_institucionales")
    .select("id, nombre_completo, email_institucional, rol, instituciones(nombre)")
    .eq("auth_user_id", authUserId)
    .eq("activo", true)
    .maybeSingle();

  if (error || !data) {
    console.warn(
      error
        ? `[auth] Error al leer el perfil docente (${error.code}): ${error.message}`
        : "[auth] Sin perfil docente visible: falta vincular auth_user_id, el usuario está inactivo o la institución está suspendida."
    );
    return null;
  }
  const institucion = Array.isArray(data.instituciones) ? data.instituciones[0] : data.instituciones;
  return {
    id: data.id,
    name: data.nombre_completo,
    email: data.email_institucional,
    institution: (institucion as { nombre?: string } | null)?.nombre || "Institución educativa",
    role: mapRol(data.rol),
  };
}

export const authController = {
  /**
   * Inicia sesión con Supabase Auth (correo + contraseña); el rol sale del perfil en la base.
   * Sin Supabase o sin red, solo se admiten las cuentas demo públicas, marcadas como tales en la UI.
   */
  async loginDocente(email: string, password: string): Promise<LoginResult> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      return { success: false, user: null, message: "Escribe tu correo institucional y tu contraseña." };
    }
    const isDemoCredentials = DEMO_ACCOUNTS[cleanEmail]?.password === password;

    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client.auth.signInWithPassword({ email: cleanEmail, password });

        if (!error && data.user) {
          const profile = await fetchTeacherProfile(client, data.user.id);
          if (!profile) {
            await client.auth.signOut();
            return {
              success: false,
              user: null,
              message: "Tu cuenta existe, pero tu institución aún no la ha habilitado. Contacta con la coordinación de tu colegio.",
            };
          }
          saveCurrentUser(profile);
          return { success: true, user: profile, message: `Bienvenido, ${profile.name}.` };
        }

        if (error && !isAuthRetryableFetchError(error)) {
          // Las cuentas demo siguen funcionando aunque no existan en Supabase Auth.
          if (isDemoCredentials) {
            console.info(
              `[auth] Modo demo: ${new URL(getSupabaseConfig().url).host} rechazó las credenciales demo (${error.code ?? error.status}).`
            );
            return demoLogin(cleanEmail);
          }
          if (error.code === "email_not_confirmed") {
            return { success: false, user: null, message: "Confirma tu correo institucional con el enlace que te enviamos y vuelve a intentarlo." };
          }
          return { success: false, user: null, message: "Correo o contraseña incorrectos." };
        }
      } catch {
        // Fallo de red: se evalúan las cuentas demo más abajo.
      }
    }

    if (isDemoCredentials) return demoLogin(cleanEmail);
    let message = "La base de datos no está configurada: solo están disponibles las cuentas demo.";
    if (client) message = "No pudimos conectar con el servidor. Revisa tu internet e inténtalo de nuevo.";
    else if (DEMO_ACCOUNTS[cleanEmail]) message = "Correo o contraseña incorrectos.";
    return { success: false, user: null, message };
  },

  getCurrentUser(): TeacherUser | null {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER_SESSION);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  },

  /** Devuelve el usuario solo si su sesión de Supabase sigue vigente (o si es una cuenta demo). */
  async restoreSession(): Promise<TeacherUser | null> {
    const cached = this.getCurrentUser();
    if (!cached || cached.isDemo) return cached;

    const client = getSupabaseClient();
    const { data } = client ? await client.auth.getSession() : { data: { session: null } };
    if (!data.session) {
      clearCurrentUser();
      return null;
    }
    return cached;
  },

  /** Cambia la contraseña de la sesión abierta por el enlace de recuperación de Supabase Auth. */
  async actualizarClave(nueva: string): Promise<{ success: boolean; message: string }> {
    const client = getSupabaseClient();
    if (!client) return { success: false, message: "La base de datos no está configurada." };
    const { data } = await client.auth.getSession();
    if (!data.session) {
      return { success: false, message: "El enlace ya no es válido. Pide uno nuevo a la administración de tu colegio." };
    }
    const { error } = await client.auth.updateUser({ password: nueva });
    if (error) {
      console.warn(`[auth] No se pudo actualizar la contraseña (${error.code}): ${error.message}`);
      return {
        success: false,
        message: error.code === "weak_password" ? "Esa contraseña es muy débil. Usa al menos 8 caracteres." : "No pudimos guardar la contraseña. Inténtalo otra vez.",
      };
    }
    await client.auth.signOut();
    return { success: true, message: "Listo, tu contraseña quedó guardada. Ya puedes iniciar sesión." };
  },

  async logoutDocente(): Promise<void> {
    clearCurrentUser();
    const client = getSupabaseClient();
    if (!client) return;
    try {
      await client.auth.signOut();
    } catch {
      // Sin red el token se borra igualmente en local.
    }
  },
};

/**
 * Validador de formato UUID v4
 */
export function isValidUuid(val?: string | null): boolean {
  if (!val || typeof val !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val.trim());
}

// ==============================================================================
// 5. CONTROLADOR CRUD DE EJERCICIOS PISA (ejercicios_pisa)
// ==============================================================================

// Las escrituras de contenido docente solo van a la base con una sesión real: la cuenta demo
// trabaja en este navegador y no depende de que RLS rechace la escritura
function clienteDocente(): SupabaseClient | null {
  const client = getSupabaseClient();
  const user = authController.getCurrentUser();
  return client && user && !user.isDemo && isValidUuid(user.id) ? client : null;
}

const ACTIVE_EXERCISE_KEY = "ecdulearm_active_exercise";

/**
 * Primera etiqueta libre a partir de la deseada: Versión B → C → D…; Iteración 2 → 3 → 4…
 */
function etiquetaLibre(deseada: string, usadas: string[]): string {
  if (!usadas.includes(deseada)) return deseada;
  const letra = /^Versión ([A-Z])$/.exec(deseada)?.[1];
  if (letra) {
    for (let c = letra.charCodeAt(0) + 1; c <= 90; c++) {
      const candidata = `Versión ${String.fromCharCode(c)}`;
      if (!usadas.includes(candidata)) return candidata;
    }
  }
  const numeros = usadas.map((u) => Number(/^Iteración (\d+)$/.exec(u)?.[1] ?? 1));
  return `Iteración ${Math.min(999, Math.max(1, ...numeros) + 1)}`;
}

export const ejerciciosController = {
  /**
   * Guarda el ejercicio y lo deja como activo del docente, con el UUID real si la base lo aceptó,
   * para que las versiones y la publicación en un aula apunten al registro correcto.
   */
  async guardarComoActivo(
    ejercicio: Exercise,
    opciones: { ejercicioPadreId?: string; etiquetaVersion?: string; tiempoCreacionSegundos?: number } = {}
  ): Promise<Exercise> {
    const guardado = await this.createEjercicio({ ...ejercicio, ...opciones });
    const activo: Exercise = { ...ejercicio, id: guardado.isOffline ? ejercicio.id : guardado.data.id };
    try {
      localStorage.setItem(ACTIVE_EXERCISE_KEY, JSON.stringify(activo));
    } catch {
      // Sin almacenamiento el ejercicio activo vive solo en memoria.
    }
    return activo;
  },

  /** Guarda el ejercicio activo solo en este navegador (ediciones manuales aún sin enviar a la base). */
  guardarActivoLocal(ejercicio: Exercise): void {
    try {
      localStorage.setItem(ACTIVE_EXERCISE_KEY, JSON.stringify(ejercicio));
    } catch {
      // Sin almacenamiento la edición vive solo en memoria.
    }
  },

  getEjercicioActivo(): Exercise | null {
    try {
      const raw = localStorage.getItem(ACTIVE_EXERCISE_KEY);
      return raw ? (JSON.parse(raw) as Exercise) : null;
    } catch {
      return null;
    }
  },

  /**
   * Guarda un nuevo ejercicio contextualizado generado con IA o manual.
   */
  async createEjercicio(
    ejercicio: Partial<Exercise> & {
      solucionDocente?: string;
      pistasSocraticas?: string[];
      tiempoCreacionSegundos?: number;
      ejercicioPadreId?: string | null;
      etiquetaVersion?: string;
    }
  ): Promise<{ success: boolean; data: FullPisaExercise; isOffline: boolean }> {
    const id = isValidUuid(ejercicio.id) ? (ejercicio.id as string) : `ex-${Date.now()}`;
    const user = authController.getCurrentUser();
    const docenteId = isValidUuid(user?.id) ? (user!.id) : DEMO_DOCENTE_USER.id;

    // Normalizar etiqueta de versión según el constraint de base de datos:
    // ck_ejercicios_etiqueta: '^(Original|Iteración [0-9]{1,3}|Versión [A-Z])$'
    let etiqueta = ejercicio.etiquetaVersion;
    if (!etiqueta || !/^(Original|Iteración [0-9]{1,3}|Versión [A-Z])$/.test(etiqueta)) {
      if (!ejercicio.version || ejercicio.version === 1) {
        etiqueta = "Original";
      } else if (ejercicio.version === 2) {
        etiqueta = "Versión A";
      } else if (ejercicio.version === 3) {
        etiqueta = "Versión B";
      } else if (ejercicio.version === 4) {
        etiqueta = "Versión C";
      } else {
        etiqueta = `Iteración ${Math.min(999, ejercicio.version)}`;
      }
    }

    const record: FullPisaExercise = {
      id,
      topic: sanitizeInput(ejercicio.topic || "Razonamiento Lógico Cuantitativo"),
      context: sanitizeInput(ejercicio.context || "Situación Real"),
      level: ejercicio.level || "2do BGU",
      difficulty: (ejercicio.difficulty as any) || "Intermedia",
      questions: ejercicio.questions || (ejercicio.questionList?.length || 3),
      version: ejercicio.version || 1,
      situation: sanitizeInput(ejercicio.situation || ""),
      questionList: ejercicio.questionList || [
        "1. Identifica las variables principales del texto.",
        "2. Plantea el modelo matemático correspondiente.",
        "3. Justifica la solución en el contexto del problema.",
      ],
      rubric: sanitizeInput(ejercicio.rubric || "Estándar PISA Nivel 4"),
      teacherSolution: {
        steps: [
          {
            stepNumber: 1,
            title: "Resolución analítica oficial para el docente",
            explanation: ejercicio.solucionDocente || "Modelado algebraico y resolución guiada.",
            mathResult: "Verificación de razonamiento.",
          },
        ],
        finalAnswer: "Consultar procedimiento paso a paso.",
        pedagogicalNotes: "Procedimiento oficial exclusivo del docente.",
      },
      socraticHints: {
        level1: ejercicio.pistasSocraticas?.[0] || "¿Qué datos conocidos identificas en el enunciado?",
        level2: ejercicio.pistasSocraticas?.[1] || "¿Qué relación o fórmula vincula las variables?",
        level3: ejercicio.pistasSocraticas?.[2] || "Plantea la ecuación antes de operar numéricamente.",
      },
      solucionDocente: ejercicio.solucionDocente,
      respuestaCorrecta: ejercicio.respuestaCorrecta,
      pistasSocraticas: ejercicio.pistasSocraticas,
    };

    // Intentar persistir en Supabase en la tabla 'ejercicios_pisa'
    const client = clienteDocente();
    let savedInDb = false;

    if (client) {
      try {
        // uq_ejercicios_version: un mismo padre no puede repetir etiqueta
        if (isValidUuid(ejercicio.ejercicioPadreId)) {
          const { data: hermanos } = await client
            .from("ejercicios_pisa")
            .select("etiqueta_version")
            .eq("ejercicio_padre_id", ejercicio.ejercicioPadreId as string);
          etiqueta = etiquetaLibre(etiqueta, (hermanos ?? []).map((h) => String(h.etiqueta_version)));
        }

        const payload: any = {
          docente_creador_id: docenteId,
          ejercicio_padre_id: isValidUuid(ejercicio.ejercicioPadreId) ? ejercicio.ejercicioPadreId : null,
          etiqueta_version: etiqueta,
          curso_bgu: record.level,
          asignatura_id: 1, // 1 = Matemáticas
          tema_curricular: record.topic,
          contexto_pisa: record.context,
          nivel_dificultad: record.difficulty,
          nivel_pisa: 4,
          enunciado_contexto: record.situation,
          pregunta_razonamiento: record.questionList.join("\n"),
          respuesta_correcta: ejercicio.respuestaCorrecta || "Revisa la solución paso a paso.",
          solucion_paso_a_paso_docente:
            ejercicio.solucionDocente || "Solución pendiente: complétala antes de publicar el ejercicio.",
          pistas_socraticas_base: ejercicio.pistasSocraticas || [
            record.socraticHints.level1,
            record.socraticHints.level2,
            record.socraticHints.level3,
          ],
          es_publico: false,
          generado_por_ia: true,
          tiempo_creacion_segundos: Math.max(1, ejercicio.tiempoCreacionSegundos || 8),
        };

        if (isValidUuid(id)) {
          payload.id = id;
          const { data, error } = await client.from("ejercicios_pisa").upsert(payload).select().single();
          if (!error && data) {
            record.id = data.id;
            savedInDb = true;
          } else if (error) {
            console.warn(`[dbService] ejercicios_pisa rechazó el guardado (${error.code}): ${error.message}`);
          }
        } else {
          // Dejar que PostgreSQL gen_random_uuid() asigne el UUID
          const { data, error } = await client.from("ejercicios_pisa").insert(payload).select().single();
          if (!error && data) {
            record.id = data.id;
            savedInDb = true;
          } else if (error) {
            console.warn(`[dbService] ejercicios_pisa rechazó el guardado (${error.code}): ${error.message}`);
          }
        }
      } catch (err) {
        console.warn("[dbService] Fallo al guardar en ejercicios_pisa de Supabase:", err);
      }
    }

    // Persistencia en caché local
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.LOCAL_EJERCICIOS);
        const list: FullPisaExercise[] = raw ? JSON.parse(raw) : [...SEED_EJERCICIOS_PISA];
        const existingIdx = list.findIndex((e) => e.id === record.id || e.id === id);
        if (existingIdx >= 0) {
          list[existingIdx] = record;
        } else {
          list.unshift(record);
        }
        localStorage.setItem(STORAGE_KEYS.LOCAL_EJERCICIOS, JSON.stringify(list));
      } catch {
        // Fallback no bloqueante
      }
    }

    return {
      success: true,
      data: record,
      isOffline: !savedInDb,
    };
  },

  /**
   * Actualiza un ejercicio PISA existente (Chips de iteración rápida o edición a mano).
   */
  async updateEjercicio(
    id: string,
    cambios: Partial<Exercise>
  ): Promise<{ success: boolean; data: FullPisaExercise | null; isOffline: boolean }> {
    const list = await this.getEjercicios();
    const existing = list.find((e) => e.id === id);
    if (!existing) {
      return { success: false, data: null, isOffline: true };
    }

    const updated: FullPisaExercise = {
      ...existing,
      topic: cambios.topic || existing.topic,
      difficulty: (cambios.difficulty as any) || existing.difficulty,
      situation: cambios.situation || existing.situation,
      context: cambios.context || existing.context,
      level: cambios.level || existing.level,
      version: (existing.version || 1) + 1,
      questionList: cambios.questionList || existing.questionList,
    };

    let savedInDb = false;
    const client = clienteDocente();
    if (client && isValidUuid(id)) {
      try {
        const { error } = await client
          .from("ejercicios_pisa")
          .update({
            tema_curricular: updated.topic,
            nivel_dificultad: updated.difficulty,
            enunciado_contexto: updated.situation,
            pregunta_razonamiento: updated.questionList.join("\n"),
            contexto_pisa: updated.context,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id);
        if (!error) savedInDb = true;
      } catch (err) {
        console.warn("[dbService] Error actualizando en Supabase:", err);
      }
    }

    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.LOCAL_EJERCICIOS);
        const storedList: FullPisaExercise[] = raw ? JSON.parse(raw) : [...list];
        const idx = storedList.findIndex((e) => e.id === id);
        if (idx >= 0) {
          storedList[idx] = updated;
          localStorage.setItem(STORAGE_KEYS.LOCAL_EJERCICIOS, JSON.stringify(storedList));
        }
      } catch {}
    }

    return { success: true, data: updated, isOffline: !savedInDb };
  },

  /**
   * Elimina o archiva un ejercicio creado.
   */
  async deleteEjercicio(id: string): Promise<boolean> {
    const client = clienteDocente();
    if (client && isValidUuid(id)) {
      try {
        await client.from("ejercicios_pisa").delete().eq("id", id);
      } catch {}
    }
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.LOCAL_EJERCICIOS);
        if (raw) {
          const list: FullPisaExercise[] = JSON.parse(raw);
          const filtered = list.filter((e) => e.id !== id);
          localStorage.setItem(STORAGE_KEYS.LOCAL_EJERCICIOS, JSON.stringify(filtered));
        }
      } catch {}
    }
    return true;
  },

  /**
   * Carga el historial de ejercicios del docente y el banco base ministerial.
   */
  async getEjercicios(): Promise<FullPisaExercise[]> {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client
          .from("ejercicios_pisa")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(25);

        if (data && !error && data.length > 0) {
          return data.map((d: any) => ({
            id: d.id,
            topic: d.tema_curricular,
            context: d.contexto_pisa,
            level: d.curso_bgu,
            difficulty: d.nivel_dificultad,
            questions: 3,
            version: d.etiqueta_version === "Original" ? 1 : 2,
            situation: d.enunciado_contexto,
            questionList: d.pregunta_razonamiento ? d.pregunta_razonamiento.split("\n").filter(Boolean) : [],
            rubric: `Estándar PISA Nivel ${d.nivel_pisa || 4}`,
            teacherSolution: {
              steps: [
                {
                  stepNumber: 1,
                  title: "Solución Docente",
                  explanation: d.solucion_paso_a_paso_docente || "",
                  mathResult: d.respuesta_correcta || "",
                },
              ],
              finalAnswer: d.respuesta_correcta || "",
              pedagogicalNotes: "Procedimiento oficial.",
            },
            socraticHints: {
              level1: d.pistas_socraticas_base?.[0] || "¿Qué variables reconoces?",
              level2: d.pistas_socraticas_base?.[1] || "¿Qué ecuación se puede plantear?",
              level3: d.pistas_socraticas_base?.[2] || "Despeja paso a paso.",
            },
          }));
        }
      } catch (err) {
        console.warn("[dbService] Usando banco de datos local:", err);
      }
    }

    // Fallback a almacenamiento local o semillas
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.LOCAL_EJERCICIOS);
        if (raw) return JSON.parse(raw);
      } catch {}
    }

    return SEED_EJERCICIOS_PISA;
  },
};

// ==============================================================================
// 6. CONTROLADOR DE PLANIFICACIONES ERCA (planificaciones_erca)
// ==============================================================================

export interface BorradorPlanificacion {
  planId?: string;
  duracion: string;
  objetivo: string;
  curso: "1ro BGU" | "2do BGU" | "3ro BGU";
  destreza: string;
  fases: { key: string; label: string; time: string; title: string; body: string }[];
  ejercicio: Exercise | null;
}

const BORRADOR_PLAN_KEY = "ecdulearn_borrador_planificacion";

export const planificacionesController = {
  /** Borrador del planificador: sobrevive a salir de la vista y a recargar la página. */
  getBorrador(): BorradorPlanificacion | null {
    try {
      const raw = localStorage.getItem(BORRADOR_PLAN_KEY);
      return raw ? (JSON.parse(raw) as BorradorPlanificacion) : null;
    } catch {
      return null;
    }
  },

  guardarBorrador(borrador: BorradorPlanificacion): void {
    try {
      localStorage.setItem(BORRADOR_PLAN_KEY, JSON.stringify(borrador));
    } catch {
      // Sin almacenamiento el borrador vive solo mientras la vista está abierta.
    }
  },

  /**
   * Guarda una guía de clase bajo las 4 fases ERCA en la base de datos.
   * Vincula automáticamente el ejercicio PISA en la fase de Aplicación si se especifica.
   */
  async savePlanificacion(plan: {
    id?: string;
    titulo: string;
    curso: "1ro BGU" | "2do BGU" | "3ro BGU";
    destreza: string;
    duracionMinutos?: number;
    experiencia: string;
    reflexion: string;
    conceptualizacion: string;
    aplicacion: string;
    ejercicioPisaId?: string;
  }): Promise<{ success: boolean; id: string; isOffline: boolean }> {
    let finalId = isValidUuid(plan.id) ? (plan.id as string) : `plan-${Date.now()}`;
    const user = authController.getCurrentUser();
    const docenteId = isValidUuid(user?.id) ? (user!.id) : DEMO_DOCENTE_USER.id;

    const client = clienteDocente();
    let savedInDb = false;

    if (client) {
      try {
        const payload: any = {
          docente_id: docenteId,
          titulo_guia: sanitizeInput(plan.titulo || "Planificación Microcurricular ERCA"),
          curso_bgu: plan.curso || "2do BGU",
          asignatura_id: 1, // Matemáticas
          destreza_dcd: sanitizeInput(plan.destreza || "M.5.2.3 Resolver problemas en contextos reales."),
          duracion_minutos: plan.duracionMinutos || 45,
          fase_experiencia: sanitizeInput(plan.experiencia || "Contacto con el entorno y vivencia directa."),
          fase_reflexion: sanitizeInput(plan.reflexion || "Preguntas socráticas desafiantes."),
          fase_conceptualizacion: sanitizeInput(plan.conceptualizacion || "Formalización de modelos matemáticos."),
          fase_aplicacion_texto: sanitizeInput(plan.aplicacion || "Resolución del reto PISA contextualizado."),
        };

        if (isValidUuid(finalId)) {
          payload.id = finalId;
          const { data, error } = await client.from("planificaciones_erca").upsert(payload).select().single();
          if (!error && data) {
            finalId = data.id;
            savedInDb = true;
          }
        } else {
          const { data, error } = await client.from("planificaciones_erca").insert(payload).select().single();
          if (!error && data) {
            finalId = data.id;
            savedInDb = true;
          }
        }

        // Vincular ejercicio en planificacion_ejercicios si hay ID válido
        if (savedInDb && isValidUuid(plan.ejercicioPisaId)) {
          await client.from("planificacion_ejercicios").upsert({
            planificacion_id: finalId,
            ejercicio_id: plan.ejercicioPisaId,
            orden: 1,
          }, { onConflict: "planificacion_id,ejercicio_id" });
        }
      } catch (err) {
        console.warn("[dbService] Fallo al guardar planificación ERCA:", err);
      }
    }

    // Caché local
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.LOCAL_PLANIFICACIONES);
        const list = raw ? JSON.parse(raw) : [];
        list.unshift({ ...plan, id: finalId, savedAt: Date.now() });
        localStorage.setItem(STORAGE_KEYS.LOCAL_PLANIFICACIONES, JSON.stringify(list));
      } catch {}
    }

    return { success: true, id: finalId, isOffline: !savedInDb };
  },

  /**
   * Obtiene las planificaciones ERCA registradas por el docente.
   */
  async getPlanificaciones(): Promise<any[]> {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client
          .from("planificaciones_erca")
          .select("*, planificacion_ejercicios(ejercicio_id, ejercicios_pisa(tema_curricular))")
          .order("created_at", { ascending: false })
          .limit(10);
        if (data && !error && data.length > 0) return data;
      } catch {}
    }
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.LOCAL_PLANIFICACIONES);
        if (raw) return JSON.parse(raw);
      } catch {}
    }
    return [];
  },
};

// ==============================================================================
// 7. CONTROLADOR DE AULAS VIRTUALES POR PIN (aulas_virtuales)
// ==============================================================================

export const aulasController = {
  /**
   * Publica un aula con PIN y le vincula el ejercicio en aula_ejercicios, para que el estudiante lo
   * reciba en fn_iniciar_sesion_anonima. Si el ejercicio aún no está en la base, lo guarda primero.
   */
  async publicarAula(
    pin: string,
    titulo: string,
    ejercicio: Exercise
  ): Promise<{
    success: boolean;
    pin: string;
    isOffline: boolean;
    ejercicioId?: string;
    motivo?: "pin_ocupado" | "sin_sesion" | "error";
  }> {
    const clean = sanitizeInput(pin).toUpperCase().replace(/\s+/g, "");
    const user = authController.getCurrentUser();
    const client = getSupabaseClient();
    let ejercicioId = isValidUuid(ejercicio.id) ? (ejercicio.id as string) : undefined;
    let savedInDb = false;
    let motivo: "pin_ocupado" | "sin_sesion" | "error" | undefined;

    // RLS exige una sesión real de docente: la cuenta demo solo publica en este navegador
    if (client && user && !user.isDemo && isValidUuid(user.id)) {
      try {
        if (!ejercicioId) {
          const creado = await ejerciciosController.createEjercicio(ejercicio);
          if (!creado.isOffline) ejercicioId = creado.data.id;
        }

        if (!ejercicioId) {
          motivo = "error";
        } else {
          const { data: aula, error } = await client
            .from("aulas_virtuales")
            .upsert(
              {
                pin_acceso: clean,
                docente_id: user.id,
                titulo_sesion: sanitizeInput(titulo).slice(0, 150),
                modo_aula: "RETO_CLASE",
                max_estudiantes: 45,
                activa: true,
                expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
              },
              { onConflict: "pin_acceso" }
            )
            .select("id")
            .single();

          if (error || !aula) {
            // 23505: el PIN ya es de grado; 42501: el PIN pertenece al aula de otro docente
            motivo = error?.code === "23505" || error?.code === "42501" ? "pin_ocupado" : "error";
            if (error) console.warn(`[dbService] aulas_virtuales rechazó el PIN (${error.code}): ${error.message}`);
          } else {
            // Un aula, un reto: el vínculo anterior se reemplaza
            await client.from("aula_ejercicios").delete().eq("aula_id", aula.id);
            const { error: errorVinculo } = await client
              .from("aula_ejercicios")
              .insert({ aula_id: aula.id, ejercicio_id: ejercicioId, orden: 1 });
            if (errorVinculo) {
              motivo = "error";
              console.warn(`[dbService] aula_ejercicios rechazó el vínculo (${errorVinculo.code}): ${errorVinculo.message}`);
            } else {
              savedInDb = true;
            }
          }
        }
      } catch (err) {
        motivo = "error";
        console.warn("[dbService] Fallo al publicar el aula:", (err as Error).message);
      }
    } else {
      motivo = "sin_sesion";
    }

    // Respaldo local (modo demo u offline)
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.LOCAL_AULAS);
      const aulas = raw ? JSON.parse(raw) : {};
      aulas[clean] = {
        pin: clean,
        titulo,
        ejercicio: { ...ejercicio, id: ejercicioId ?? ejercicio.id },
        docente: user?.name || "Docente",
        createdAt: Date.now(),
        active: true,
      };
      localStorage.setItem(STORAGE_KEYS.LOCAL_AULAS, JSON.stringify(aulas));
    } catch {
      // Sin almacenamiento: el aula solo existe en la base de datos.
    }

    return { success: savedInDb || motivo === "sin_sesion", pin: clean, isOffline: !savedInDb, ejercicioId, motivo: savedInDb ? undefined : motivo };
  },
};

// ==============================================================================
// 8. CONTROLADOR DE ACCESO ESTUDIANTIL Y TUTOR SOCRÁTICO (CERO-PII)
// ==============================================================================

const SESION_ESTUDIANTE_KEY = "ecdulearn_sesion_estudiante";

type EjercicioJson = {
  id: string;
  tema?: string;
  contexto?: string;
  curso_bgu?: string;
  dificultad?: string;
  enunciado?: string;
  pregunta?: string;
  total_pistas?: number;
  opciones?: unknown;
};

function mapEjercicio(e: EjercicioJson): RetoEstudiante {
  return {
    id: e.id,
    tema: e.tema || "Reto de razonamiento",
    contexto: e.contexto || "",
    curso: e.curso_bgu || "",
    dificultad: e.dificultad || "",
    enunciado: e.enunciado || "",
    pregunta: e.pregunta || "",
    totalPistas: e.total_pistas ?? 0,
    opciones: Array.isArray(e.opciones) ? e.opciones.map(String) : undefined,
  };
}

function guardarSesion(sesion: SesionEstudiante): void {
  try {
    localStorage.setItem(SESION_ESTUDIANTE_KEY, JSON.stringify(sesion));
    // Claves sueltas que aún leen otras vistas
    localStorage.setItem("ecdulearn_sesion_id", sesion.sesionId);
    localStorage.setItem("ecdulearn_alias_temporal", sesion.alias);
  } catch {
    // Sin almacenamiento la sesión dura lo que la pestaña.
  }
}

function aulaLocal(pin: string): SesionEstudiante | null {
  try {
    const aulas = JSON.parse(localStorage.getItem(STORAGE_KEYS.LOCAL_AULAS) || "{}");
    const aula = aulas[pin];
    const ej: Exercise | undefined = aula?.ejercicio;
    if (!ej) return null;
    const pistas = ej.pistasSocraticas ?? [];
    return {
      sesionId: `ses-anon-${Date.now()}`,
      pin,
      alias: `Estudiante #${Math.floor(10 + Math.random() * 89)}`,
      titulo: aula.titulo || ej.topic,
      ejercicios: [
        {
          id: ej.id || `local-${pin}`,
          tema: ej.topic,
          contexto: ej.context,
          curso: ej.level,
          dificultad: String(ej.difficulty),
          enunciado: ej.situation || "",
          pregunta: (ej.questionList ?? []).join("\n"),
          totalPistas: pistas.length,
          pistasLocales: pistas,
        },
      ],
      isOffline: true,
    };
  } catch {
    return null;
  }
}

function sesionLocal(pin: string): SesionEstudiante {
  return {
    sesionId: `ses-anon-${Date.now()}`,
    pin,
    alias: `Estudiante #${Math.floor(10 + Math.random() * 89)}`,
    titulo: "Reto de práctica",
    ejercicios: [RETO_LOCAL_DEMO],
    isOffline: true,
  };
}

// Las RPC del estudiante exigen sesión real (UUID) y el hash del dispositivo que la abrió.
async function rpcEstudiante<T>(fn: string, sesion: SesionEstudiante, params: Record<string, unknown>): Promise<T | null> {
  const client = getSupabaseClient();
  if (!client || sesion.isOffline || !isValidUuid(sesion.sesionId)) return null;
  const { data, error } = await client.rpc(fn, {
    p_sesion_id: sesion.sesionId,
    p_token_hash: await generateDeviceTokenHash(),
    ...params,
  });
  if (error) {
    console.warn(`[estudiante] ${fn} falló (${error.code}): ${error.message}`);
    return null;
  }
  return data as T;
}

export type ResultadoIngreso =
  | { estado: "activa" | "practica"; sesion: SesionEstudiante }
  | { estado: "no_encontrada" | "aula_llena" };

export const estudianteSocraticoController = {
  /**
   * Valida el PIN con fn_iniciar_sesion_anonima (el rol anon no puede leer aulas_virtuales) y crea o
   * retoma la sesión anónima. Distingue PIN inexistente, aula llena y falta de conexión.
   */
  async ingresarConPin(pin: string): Promise<ResultadoIngreso> {
    const cleanPin = sanitizeInput(pin).toUpperCase().replace(/\s+/g, "");
    if (!/^[A-Z0-9]{6}$/.test(cleanPin)) return { estado: "no_encontrada" };

    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client.rpc("fn_iniciar_sesion_anonima", {
          p_pin: cleanPin,
          p_token_hash: await generateDeviceTokenHash(),
        });

        if (error?.code === "P0001") return { estado: "aula_llena" };
        if (error) {
          console.warn(`[estudiante] fn_iniciar_sesion_anonima falló (${error.code}): ${error.message}`);
        } else if (data?.sesion_id) {
          const sesion: SesionEstudiante = {
            sesionId: data.sesion_id,
            pin: cleanPin,
            alias: data.alias || "Estudiante anónimo",
            titulo: data.contenido?.titulo || "Reto del colegio",
            modo: data.contenido?.modo,
            tiempoLimiteMinutos: data.contenido?.tiempo_limite_minutos ?? undefined,
            ejercicios: (data.contenido?.ejercicios ?? []).map(mapEjercicio),
            isOffline: false,
          };
          guardarSesion(sesion);
          return { estado: "activa", sesion };
        } else if (cleanPin !== "PISA26") {
          // La función respondió sin sesión: el PIN no existe en la base (puede ser un aula de la cuenta demo)
          const local = aulaLocal(cleanPin);
          if (!local) return { estado: "no_encontrada" };
          guardarSesion(local);
          return { estado: "practica", sesion: local };
        }
      } catch {
        // Fallo de red: se continúa en modo práctica.
      }
    }

    // Sin conexión (o PISA26 sin datos semilla): aula de este navegador o reto de ejemplo
    const sesion = aulaLocal(cleanPin) ?? sesionLocal(cleanPin);
    guardarSesion(sesion);
    return { estado: "practica", sesion };
  },

  getSesionActual(): SesionEstudiante | null {
    try {
      const raw = localStorage.getItem(SESION_ESTUDIANTE_KEY);
      return raw ? (JSON.parse(raw) as SesionEstudiante) : null;
    } catch {
      return null;
    }
  },

  /**
   * Entrega la siguiente pista del ejercicio, en orden, y la cuenta en la base.
   * Devuelve null si no hay sesión real (la vista usa entonces las pistas locales o el tutor IA).
   */
  async solicitarPista(
    sesion: SesionEstudiante,
    ejercicioId: string
  ): Promise<{ pista: string | null; numero: number; restantes: number } | null> {
    return rpcEstudiante("fn_solicitar_pista", sesion, { p_ejercicio_id: ejercicioId });
  },

  /**
   * Registra en qué fase se trabó, si logró resolverlo o, en simuladores, la opción elegida
   * (la nota la pone el servidor). Devuelve si el intento quedó resuelto, o null sin sesión real.
   */
  async registrarIntento(
    sesion: SesionEstudiante,
    params: {
      ejercicioId: string;
      logroResolver?: boolean;
      pasoBloqueo?: PasoBloqueo;
      opcionSeleccionada?: number;
      marcadaConBandera?: boolean;
    }
  ): Promise<{ logro_resolver: boolean } | null> {
    return rpcEstudiante("fn_registrar_intento", sesion, {
      p_ejercicio_id: params.ejercicioId,
      p_logro_resolver: params.logroResolver ?? false,
      p_paso_bloqueo: params.pasoBloqueo ?? null,
      p_opcion_seleccionada: params.opcionSeleccionada ?? null,
      p_marcada_con_bandera: params.marcadaConBandera ?? false,
    });
  },

  /** Cierra la sesión; en un aula de simulador el servidor calcula el puntaje. */
  async finalizarSesion(sesion: SesionEstudiante): Promise<{ puntaje_simulador: number | null } | null> {
    return rpcEstudiante("fn_finalizar_sesion", sesion, {});
  },

  /** Guarda un mensaje de la conversación con el tutor (no bloquea la UI si falla). */
  async registrarMensaje(
    sesion: SesionEstudiante,
    params: {
      ejercicioId: string;
      remitente: "ESTUDIANTE" | "TUTOR_IA";
      tipo?: "TEXTO_LIBRE" | "CHIP_RAPIDO" | "INTENTO_COPIA_BLOQUEADO" | "REVISION_POST_SIMULADOR";
      contenido: string;
    }
  ): Promise<void> {
    const contenido = sanitizeInput(params.contenido).slice(0, 4000);
    if (!contenido) return;
    await rpcEstudiante("fn_registrar_mensaje", sesion, {
      p_ejercicio_id: params.ejercicioId,
      p_remitente: params.remitente,
      p_tipo_interaccion: params.tipo ?? "TEXTO_LIBRE",
      p_contenido: contenido,
    });
  },

  /**
   * Compatibilidad con vistas antiguas: registra el mensaje contra el primer reto de la sesión.
   */
  async registrarInteraccionSocratica(params: {
    pin: string;
    sesionId: string;
    role: "student" | "tutor";
    mensaje: string;
    isBlockedAttempt?: boolean;
    pasoBloqueo?: string;
    pistasUsadas?: number;
  }): Promise<void> {
    const sesion = this.getSesionActual();
    const ejercicioId = sesion?.ejercicios[0]?.id;
    if (!sesion || !ejercicioId) return;
    await this.registrarMensaje(sesion, {
      ejercicioId,
      remitente: params.role === "student" ? "ESTUDIANTE" : "TUTOR_IA",
      tipo: params.isBlockedAttempt ? "INTENTO_COPIA_BLOQUEADO" : "TEXTO_LIBRE",
      contenido: params.mensaje,
    });
  },
};

// ==============================================================================
// 9. CONTROLADOR DE MÉTRICAS ANALÍTICAS EN VIVO (DASHBOARD DOCENTE & RECTOR)
// ==============================================================================

// Vocabulario cerrado de ck_intentos_paso en lenguaje del docente
const ETIQUETAS_PASO: Record<string, string> = {
  COMPRENSION_LECTORA: "Entender el enunciado",
  IDENTIFICACION_VARIABLES: "Identificar los datos",
  PLANTEAMIENTO_ECUACION: "Plantear la ecuación",
  CALCULO: "Hacer los cálculos",
  INTERPRETACION_RESULTADO: "Interpretar el resultado",
};

export interface ReporteInstitucional {
  docentesActivos: number;
  ejerciciosGenerados: number;
  horasAhorradas: number;
  aulasActivas: number;
  sesionesAnonimas: number;
  pctResueltosConAyuda: number;
  pasoBloqueoFrecuente: string;
  docentes: { nombre: string; ejercicios: number; horas: number }[];
}

export type ResultadoReporte =
  | { estado: "ok" | "demo"; reporte: ReporteInstitucional }
  | { estado: "sin_permiso" | "error" };

const REPORTE_DE_EJEMPLO: ReporteInstitucional = {
  docentesActivos: 6,
  ejerciciosGenerados: 48,
  horasAhorradas: 34.5,
  aulasActivas: 9,
  sesionesAnonimas: 214,
  pctResueltosConAyuda: 58,
  pasoBloqueoFrecuente: "Plantear la ecuación",
  docentes: [
    { nombre: "Docente de Matemáticas A", ejercicios: 14, horas: 10.2 },
    { nombre: "Docente de Matemáticas B", ejercicios: 11, horas: 8.1 },
    { nombre: "Docente de Física", ejercicios: 9, horas: 6.6 },
  ],
};

export const reporteController = {
  /**
   * Reporte agregado del colegio (fn_dashboard_institucion): solo coordinación o administración.
   * Nunca expone datos por estudiante.
   */
  async getReporteInstitucional(): Promise<ResultadoReporte> {
    const client = getSupabaseClient();
    const user = authController.getCurrentUser();
    if (!client || !user || user.isDemo || !isValidUuid(user.id)) {
      return { estado: "demo", reporte: REPORTE_DE_EJEMPLO };
    }

    try {
      const [resumen, porDocente] = await Promise.all([
        client.rpc("fn_dashboard_institucion"),
        client
          .from("vw_tiempo_ahorrado_docente")
          .select("nombre_completo, ejercicios_generados, horas_ahorradas_estimadas")
          .order("ejercicios_generados", { ascending: false }),
      ]);

      if (resumen.error?.code === "42501") return { estado: "sin_permiso" };
      if (resumen.error || !resumen.data) {
        console.warn(`[reporte] fn_dashboard_institucion falló (${resumen.error?.code}): ${resumen.error?.message}`);
        return { estado: "error" };
      }

      const d = resumen.data as Record<string, unknown>;
      const paso = d.paso_bloqueo_mas_frecuente ? String(d.paso_bloqueo_mas_frecuente) : "";
      return {
        estado: "ok",
        reporte: {
          docentesActivos: Number(d.docentes_activos ?? 0),
          ejerciciosGenerados: Number(d.ejercicios_generados ?? 0),
          horasAhorradas: Number(d.horas_ahorradas_estimadas ?? 0),
          aulasActivas: Number(d.aulas_activas ?? 0),
          sesionesAnonimas: Number(d.sesiones_anonimas ?? 0),
          pctResueltosConAyuda: Number(d.pct_resueltos_con_ayuda ?? 0),
          pasoBloqueoFrecuente: paso ? ETIQUETAS_PASO[paso] ?? paso : "",
          docentes: (porDocente.data ?? []).map((fila) => ({
            nombre: String(fila.nombre_completo),
            ejercicios: Number(fila.ejercicios_generados ?? 0),
            horas: Number(fila.horas_ahorradas_estimadas ?? 0),
          })),
        },
      };
    } catch (err) {
      console.warn("[reporte] Error al cargar el reporte:", (err as Error).message);
      return { estado: "error" };
    }
  },
};

// Muestra para la cuenta demo o sin conexión: la UI la marca como «Datos de ejemplo»
const METRICAS_DE_EJEMPLO: DbMetricasDocente = {
  ejerciciosGenerados: 12,
  promedioSegundos: 8.5,
  horasAhorradasEstimadas: 8.4,
  pctResueltosConAyuda: 62,
  estudiantesConectados: 36,
  aulasActivas: 1,
  pasoBloqueoFrecuente: "Plantear la ecuación",
  estudiantesBloqueados: 14,
  pctBloqueo: 39,
  isOffline: true,
};

export const metricasController = {
  /**
   * Métricas del docente que inició sesión, sumando todas sus aulas. Las vistas vw_* usan
   * security_invoker, así que RLS ya limita los datos a lo que el docente puede ver.
   */
  async getMetricasEnVivo(): Promise<DbMetricasDocente> {
    const client = getSupabaseClient();
    const user = authController.getCurrentUser();

    if (client && user && !user.isDemo && isValidUuid(user.id)) {
      try {
        const [ahorro, aulas, bloqueos] = await Promise.all([
          client
            .from("vw_tiempo_ahorrado_docente")
            .select("ejercicios_generados, promedio_segundos_creacion, horas_ahorradas_estimadas")
            .eq("docente_id", user.id)
            .maybeSingle(),
          client
            .from("vw_completitud_socratica_aula")
            .select("estudiantes_anonimos, intentos_totales, resueltos_con_ayuda")
            .eq("docente_id", user.id),
          client
            .from("vw_pasos_bloqueo_aula")
            .select("paso_bloqueo_detectado, estudiantes_bloqueados, intentos_totales")
            .not("paso_bloqueo_detectado", "is", null),
        ]);

        const fallo = ahorro.error || aulas.error || bloqueos.error;
        if (fallo) {
          console.warn(`[dbService] No se pudieron leer las métricas (${fallo.code}): ${fallo.message}`);
        } else {
          const filasAulas = aulas.data ?? [];
          const intentos = filasAulas.reduce((t, a) => t + Number(a.intentos_totales ?? 0), 0);
          const conAyuda = filasAulas.reduce((t, a) => t + Number(a.resueltos_con_ayuda ?? 0), 0);

          // Un mismo paso puede repetirse en varias aulas y ejercicios: se suman
          const porPaso = new Map<string, number>();
          for (const fila of bloqueos.data ?? []) {
            const paso = String(fila.paso_bloqueo_detectado);
            porPaso.set(paso, (porPaso.get(paso) ?? 0) + Number(fila.estudiantes_bloqueados ?? 0));
          }
          const [pasoTop, bloqueadosTop] = [...porPaso.entries()].sort((a, b) => b[1] - a[1])[0] ?? [];

          return {
            ejerciciosGenerados: Number(ahorro.data?.ejercicios_generados ?? 0),
            promedioSegundos: Number(ahorro.data?.promedio_segundos_creacion ?? 0),
            horasAhorradasEstimadas: Number(ahorro.data?.horas_ahorradas_estimadas ?? 0),
            pctResueltosConAyuda: intentos ? Math.round((1000 * conAyuda) / intentos) / 10 : 0,
            estudiantesConectados: filasAulas.reduce((t, a) => t + Number(a.estudiantes_anonimos ?? 0), 0),
            aulasActivas: filasAulas.length,
            pasoBloqueoFrecuente: pasoTop ? ETIQUETAS_PASO[pasoTop] ?? pasoTop : "",
            estudiantesBloqueados: bloqueadosTop ?? 0,
            pctBloqueo: intentos && bloqueadosTop ? Math.round((100 * bloqueadosTop) / intentos) : 0,
            isOffline: false,
          };
        }
      } catch (err) {
        console.warn("[dbService] Error al cargar las métricas:", (err as Error).message);
      }
    }

    return METRICAS_DE_EJEMPLO;
  },
};

// ==============================================================================
// 10. CONTROLADOR DE ADMINISTRACIÓN B2B Y GESTIÓN DE USUARIOS (adminController)
// ==============================================================================

export interface DbAuditLog {
  id: string;
  timestamp: string;
  autor: string;
  accion:
    | "CREACION_USUARIO"
    | "MODIFICACION_PERMISOS"
    | "CAMBIO_ROL"
    | "DESACTIVACION_USUARIO"
    | "ACTIVACION_USUARIO"
    | "ELIMINACION_USUARIO"
    | "CREACION_COLEGIO"
    | "RESET_PASSWORD";
  detalle: string;
  target_email?: string;
}

export const CATALOGO_ASIGNATURAS: { id: number; nombre: string }[] = [
  { id: 1, nombre: "Matemáticas" },
  { id: 2, nombre: "Física" },
  { id: 3, nombre: "Química" },
  { id: 4, nombre: "Biología" },
  { id: 5, nombre: "Razonamiento Lógico y Verbal" },
];

export const SEED_INSTITUCIONES: DbInstitucion[] = [
  {
    id: "00000000-0000-4000-8000-000000000000",
    nombre: "ECduLearn HQ · Administración Central",
    codigo_amie: "17H99999",
    tipo_institucion: "PARTICULAR",
    plan_suscripcion: "ACTIVA",
    pin_grado_autonomo: "ADM001",
    limite_docentes: 50,
    ciudad: "Quito",
    provincia: "Pichincha",
  },
  {
    id: "11111111-1111-4111-8111-111111111111",
    nombre: "Unidad Educativa Demo ECduLearn (PUCE)",
    codigo_amie: "17H00000",
    tipo_institucion: "PARTICULAR",
    plan_suscripcion: "PILOTO",
    pin_grado_autonomo: "GRADO1",
    limite_docentes: 15,
    ciudad: "Quito",
    provincia: "Pichincha",
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    nombre: "Colegio Experimental 24 de Mayo",
    codigo_amie: "17H00024",
    tipo_institucion: "FISCAL",
    plan_suscripcion: "CONVENIO",
    pin_grado_autonomo: "24MAYO",
    limite_docentes: 25,
    ciudad: "Quito",
    provincia: "Pichincha",
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    nombre: "Unidad Educativa Manuela Cañizares",
    codigo_amie: "17H00035",
    tipo_institucion: "FISCAL",
    plan_suscripcion: "ACTIVA",
    pin_grado_autonomo: "MANUEL",
    limite_docentes: 20,
    ciudad: "Quito",
    provincia: "Pichincha",
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    nombre: "Colegio San Gabriel de Quito",
    codigo_amie: "17H00048",
    tipo_institucion: "FISCOMISIONAL",
    plan_suscripcion: "ACTIVA",
    pin_grado_autonomo: "SANGAB",
    limite_docentes: 30,
    ciudad: "Quito",
    provincia: "Pichincha",
  },
];

export interface UsuarioConDetalles extends DbUsuarioInstitucional {
  institucion_nombre?: string;
  codigo_amie?: string;
  asignatura_nombre?: string;
  created_at?: string;
  ultimo_acceso_en?: string;
}

export const SEED_USUARIOS_INSTITUCIONALES: UsuarioConDetalles[] = [
  {
    id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    institucion_id: "00000000-0000-4000-8000-000000000000",
    nombre_completo: "Joan Sebastian Santacruz",
    email_institucional: "joan.santacruz@ecdulearn.edu.ec",
    rol: "ADMIN",
    asignatura_principal_id: 1,
    activo: true,
    institucion_nombre: "ECduLearn HQ · Administración Central",
    codigo_amie: "17H99999",
    asignatura_nombre: "Matemáticas y Algoritmos",
    created_at: "2026-09-01T08:00:00Z",
    ultimo_acceso_en: "Hace 5 minutos",
  },
  {
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    institucion_id: "00000000-0000-4000-8000-000000000000",
    nombre_completo: "Ariel Fabricio Chacha",
    email_institucional: "ariel.chacha@ecdulearn.edu.ec",
    rol: "ADMIN",
    asignatura_principal_id: 1,
    activo: true,
    institucion_nombre: "ECduLearn HQ · Administración Central",
    codigo_amie: "17H99999",
    asignatura_nombre: "Matemáticas y Arquitectura",
    created_at: "2026-09-01T08:00:00Z",
    ultimo_acceso_en: "Hace 12 minutos",
  },
  {
    id: "99999999-9999-4999-8999-999999999999",
    institucion_id: "00000000-0000-4000-8000-000000000000",
    nombre_completo: "Super Administrador ECduLearn",
    email_institucional: "admin@ecdulearn.edu.ec",
    rol: "ADMIN",
    asignatura_principal_id: 1,
    activo: true,
    institucion_nombre: "ECduLearn HQ · Administración Central",
    codigo_amie: "17H99999",
    asignatura_nombre: "Administración General",
    created_at: "2026-08-15T08:00:00Z",
    ultimo_acceso_en: "Activo ahora",
  },
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    institucion_id: "11111111-1111-4111-8111-111111111111",
    nombre_completo: "Docente Demo PUCE",
    email_institucional: "docente@puce.edu.ec",
    rol: "DOCENTE",
    asignatura_principal_id: 1,
    activo: true,
    institucion_nombre: "Unidad Educativa Demo ECduLearn (PUCE)",
    codigo_amie: "17H00000",
    asignatura_nombre: "Matemáticas",
    created_at: "2026-10-01T08:00:00Z",
    ultimo_acceso_en: "Hace 1 hora",
  },
  {
    id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
    institucion_id: "11111111-1111-4111-8111-111111111111",
    nombre_completo: "Mgs. Roberto Paredes (Rectorado PUCE)",
    email_institucional: "rector@puce.edu.ec",
    rol: "COORDINADOR_RECTOR",
    asignatura_principal_id: null,
    activo: true,
    institucion_nombre: "Unidad Educativa Demo ECduLearn (PUCE)",
    codigo_amie: "17H00000",
    asignatura_nombre: "Coordinación Pedagógica",
    created_at: "2026-10-01T08:00:00Z",
    ultimo_acceso_en: "Ayer",
  },
  {
    id: "55555555-5555-4555-8555-555555555555",
    institucion_id: "22222222-2222-4222-8222-222222222222",
    nombre_completo: "Prof. Marco Andrade",
    email_institucional: "marco.andrade@24demayo.edu.ec",
    rol: "DOCENTE",
    asignatura_principal_id: 1,
    activo: true,
    institucion_nombre: "Colegio Experimental 24 de Mayo",
    codigo_amie: "17H00024",
    asignatura_nombre: "Matemáticas",
    created_at: "2026-10-05T08:00:00Z",
    ultimo_acceso_en: "Hace 3 horas",
  },
  {
    id: "66666666-6666-4666-8666-666666666666",
    institucion_id: "33333333-3333-4333-8333-333333333333",
    nombre_completo: "Lcda. Patricia Morales",
    email_institucional: "patricia.morales@manuela.edu.ec",
    rol: "DOCENTE",
    asignatura_principal_id: 2,
    activo: true,
    institucion_nombre: "Unidad Educativa Manuela Cañizares",
    codigo_amie: "17H00035",
    asignatura_nombre: "Física",
    created_at: "2026-10-08T08:00:00Z",
    ultimo_acceso_en: "Hace 2 días",
  },
  {
    id: "77777777-7777-4777-8777-777777777777",
    institucion_id: "44444444-4444-4444-8444-444444444444",
    nombre_completo: "Lic. Carlos Mendoza",
    email_institucional: "carlos.mendoza@sangabriel.edu.ec",
    rol: "DOCENTE",
    asignatura_principal_id: 1,
    activo: true,
    institucion_nombre: "Colegio San Gabriel de Quito",
    codigo_amie: "17H00048",
    asignatura_nombre: "Matemáticas",
    created_at: "2026-10-10T08:00:00Z",
    ultimo_acceso_en: "Hace 4 horas",
  },
  {
    id: "88888888-8888-4888-8888-888888888888",
    institucion_id: "44444444-4444-4444-8444-444444444444",
    nombre_completo: "Dra. Carmen Salazar",
    email_institucional: "carmen.salazar@sangabriel.edu.ec",
    rol: "COORDINADOR_RECTOR",
    asignatura_principal_id: null,
    activo: false,
    institucion_nombre: "Colegio San Gabriel de Quito",
    codigo_amie: "17H00048",
    asignatura_nombre: "Vicerrectorado Académico",
    created_at: "2026-10-10T08:00:00Z",
    ultimo_acceso_en: "Hace 5 días",
  },
];

function recordAuditLog(
  accion: DbAuditLog["accion"],
  detalle: string,
  targetEmail?: string
) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOCAL_AUDITORIA);
    const logs: DbAuditLog[] = raw ? JSON.parse(raw) : [];
    const currentUser = authController.getCurrentUser();
    const newEntry: DbAuditLog = {
      id: "log-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      timestamp:
        new Date().toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) +
        " · " +
        new Date().toLocaleDateString("es-EC"),
      autor: currentUser?.name || "Administrador Central",
      accion,
      detalle,
      target_email: targetEmail,
    };
    logs.unshift(newEntry);
    localStorage.setItem(STORAGE_KEYS.LOCAL_AUDITORIA, JSON.stringify(logs.slice(0, 100)));
  } catch (err) {
    console.warn("[adminController] Error guardando log de auditoría:", err);
  }
}

// Las escrituras de administración van a la base solo con una sesión real; la cuenta demo trabaja en este navegador
function clienteAdmin(): SupabaseClient | null {
  const client = getSupabaseClient();
  const user = authController.getCurrentUser();
  return client && user && user.role === "admin" && !user.isDemo && isValidUuid(user.id) ? client : null;
}

// Las escrituras de administración exigen rol admin también en modo demo (no tocan ni el localStorage)
function esAdmin(): boolean {
  return authController.getCurrentUser()?.role === "admin";
}

const ACCESO_DENEGADO_ADMIN = "Acceso denegado: se requiere perfil de Administrador.";

function sufijoDemo(): string {
  return clienteAdmin() ? "" : " (modo demo: solo en este navegador)";
}

function mensajeErrorAdmin(error: { code?: string; message: string }, accion: string): string {
  console.warn(`[adminController] ${accion} rechazado (${error.code}): ${error.message}`);
  if (error.code === "42501") {
    return "La base de datos no permite esta acción para tu cuenta. Revisa que tengas rol de administrador y que el SQL de administración esté aplicado.";
  }
  if (error.code === "23505") return "Ya existe un registro con esos datos (por ejemplo, el mismo correo).";
  return "No pudimos guardar el cambio en la base de datos. Inténtalo otra vez.";
}

export const adminController = {
  /**
   * Obtiene la lista de usuarios institucionales (con nombres de colegio y asignatura).
   */
  async getUsuarios(): Promise<UsuarioConDetalles[]> {
    const client = clienteAdmin();
    if (client) {
      try {
        const { data, error } = await client
          .from("usuarios_institucionales")
          .select("*, instituciones(nombre, codigo_amie), asignaturas(nombre)")
          .order("created_at", { ascending: false });

        if (!error && data) {
          return data.map((u: any) => ({
            id: u.id,
            institucion_id: u.institucion_id,
            nombre_completo: u.nombre_completo,
            email_institucional: u.email_institucional,
            rol: u.rol,
            asignatura_principal_id: u.asignatura_principal_id,
            activo: u.activo,
            institucion_nombre: u.instituciones?.nombre || "Institución Educativa",
            codigo_amie: u.instituciones?.codigo_amie || "N/A",
            asignatura_nombre: u.asignaturas?.nombre || "Sin Asignar",
            created_at: u.created_at,
            ultimo_acceso_en: u.ultimo_acceso_en || "No registrado",
          }));
        }
      } catch (err) {
        console.warn("[adminController] Consulta a Supabase no disponible, usando fallback local:", err);
      }
    }

    // Fallback LocalStorage
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.LOCAL_USUARIOS);
        if (raw) return JSON.parse(raw);
        localStorage.setItem(STORAGE_KEYS.LOCAL_USUARIOS, JSON.stringify(SEED_USUARIOS_INSTITUCIONALES));
      } catch {}
    }
    return SEED_USUARIOS_INSTITUCIONALES;
  },

  /**
   * Crea un nuevo usuario institucional (docente, directivo o admin).
   * Valida unicidad de correo y respeta límite de docentes contratado por la institución.
   */
  async createUsuario(data: {
    nombre_completo: string;
    email_institucional: string;
    rol: "DOCENTE" | "COORDINADOR_RECTOR" | "ADMIN";
    institucion_id: string;
    asignatura_principal_id?: number | null;
    activo?: boolean;
  }): Promise<{ success: boolean; usuario?: UsuarioConDetalles; message: string }> {
    if (!esAdmin()) return { success: false, message: ACCESO_DENEGADO_ADMIN };
    const cleanEmail = sanitizeInput(data.email_institucional).toLowerCase();
    const cleanNombre = sanitizeInput(data.nombre_completo);

    if (!cleanNombre || cleanNombre.length < 3) {
      return { success: false, message: "El nombre completo debe tener al menos 3 caracteres." };
    }

    const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return { success: false, message: "El correo electrónico institucional no tiene un formato válido." };
    }

    const currentUsers = await this.getUsuarios();
    if (currentUsers.some((u) => u.email_institucional.toLowerCase() === cleanEmail)) {
      return { success: false, message: `Ya existe un usuario registrado con el correo "${cleanEmail}".` };
    }

    // Validar límite de docentes de la institución (regla de negocio SQL fn_validar_limite_docentes)
    const instituciones = await this.getInstituciones();
    const inst = instituciones.find((i) => i.id === data.institucion_id);
    if (inst && data.rol === "DOCENTE") {
      const docentesInst = currentUsers.filter((u) => u.institucion_id === inst.id && u.rol === "DOCENTE" && u.activo);
      if (docentesInst.length >= inst.limite_docentes) {
        return {
          success: false,
          message: `La institución "${inst.nombre}" ha alcanzado su límite de ${inst.limite_docentes} docentes contratados. Por favor amplía la suscripción del colegio.`,
        };
      }
    }

    const newId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : "usr-" + Date.now() + "-" + Math.random().toString(36).substring(2, 8);

    const asig = CATALOGO_ASIGNATURAS.find((a) => a.id === data.asignatura_principal_id);

    const newUser: UsuarioConDetalles = {
      id: newId,
      institucion_id: data.institucion_id,
      nombre_completo: cleanNombre,
      email_institucional: cleanEmail,
      rol: data.rol,
      asignatura_principal_id: data.asignatura_principal_id || null,
      activo: data.activo !== undefined ? data.activo : true,
      institucion_nombre: inst?.nombre || "Institución Educativa",
      codigo_amie: inst?.codigo_amie || "N/A",
      asignatura_nombre: asig?.nombre || (data.rol === "COORDINADOR_RECTOR" ? "Directivo Institucional" : "Sin Asignar"),
      created_at: new Date().toISOString(),
      ultimo_acceso_en: "Pendiente de primer ingreso",
    };

    // Intentar inserción en Supabase
    const client = clienteAdmin();
    if (client) {
      const { error } = await client.from("usuarios_institucionales").insert({
          id: newUser.id,
          institucion_id: newUser.institucion_id,
          nombre_completo: newUser.nombre_completo,
          email_institucional: newUser.email_institucional,
          rol: newUser.rol,
          asignatura_principal_id: newUser.asignatura_principal_id,
          activo: newUser.activo,
        });
      if (error) return { success: false, message: mensajeErrorAdmin(error, "Crear usuario") };
    }

    // Persistir localmente
    const updatedList = [newUser, ...currentUsers];
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.LOCAL_USUARIOS, JSON.stringify(updatedList));
    }

    recordAuditLog(
      "CREACION_USUARIO",
      `Se creó el usuario "${cleanNombre}" con rol ${data.rol} en "${newUser.institucion_nombre}".`,
      cleanEmail
    );

    return {
      success: true,
      usuario: newUser,
      message: `Usuario «${cleanNombre}» registrado${sufijoDemo()}. Para que pueda entrar, crea su acceso con este mismo correo en Supabase (Authentication → Users).`,
    };
  },

  /**
   * Modifica un usuario institucional y sus permisos/roles.
   */
  async updateUsuario(
    id: string,
    updates: Partial<UsuarioConDetalles>
  ): Promise<{ success: boolean; usuario?: UsuarioConDetalles; message: string }> {
    if (!esAdmin()) return { success: false, message: ACCESO_DENEGADO_ADMIN };
    const list = await this.getUsuarios();
    const index = list.findIndex((u) => u.id === id);
    if (index === -1) {
      return { success: false, message: "El usuario no fue encontrado en la base de datos." };
    }

    const previous = list[index];
    const cleanNombre = updates.nombre_completo ? sanitizeInput(updates.nombre_completo) : previous.nombre_completo;
    const cleanEmail = updates.email_institucional ? sanitizeInput(updates.email_institucional).toLowerCase() : previous.email_institucional;

    let instNombre = previous.institucion_nombre;
    let amie = previous.codigo_amie;
    if (updates.institucion_id && updates.institucion_id !== previous.institucion_id) {
      const instituciones = await this.getInstituciones();
      const inst = instituciones.find((i) => i.id === updates.institucion_id);
      if (inst) {
        instNombre = inst.nombre;
        amie = inst.codigo_amie || "N/A";
      }
    }

    let asigNombre = previous.asignatura_nombre;
    if (updates.asignatura_principal_id !== undefined) {
      const asig = CATALOGO_ASIGNATURAS.find((a) => a.id === updates.asignatura_principal_id);
      asigNombre = asig ? asig.nombre : "Sin Asignar";
    }

    const updatedUser: UsuarioConDetalles = {
      ...previous,
      ...updates,
      nombre_completo: cleanNombre,
      email_institucional: cleanEmail,
      institucion_nombre: instNombre,
      codigo_amie: amie,
      asignatura_nombre: asigNombre,
    };

    list[index] = updatedUser;

    const client = clienteAdmin();
    if (client) {
      const { error } = await client
          .from("usuarios_institucionales")
          .update({
            nombre_completo: updatedUser.nombre_completo,
            email_institucional: updatedUser.email_institucional,
            rol: updatedUser.rol,
            institucion_id: updatedUser.institucion_id,
            asignatura_principal_id: updatedUser.asignatura_principal_id,
            activo: updatedUser.activo,
          })
          .eq("id", id);
      if (error) return { success: false, message: mensajeErrorAdmin(error, "Editar usuario") };
    }

    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.LOCAL_USUARIOS, JSON.stringify(list));
    }

    const rolCambio = previous.rol !== updatedUser.rol;
    recordAuditLog(
      rolCambio ? "CAMBIO_ROL" : "MODIFICACION_PERMISOS",
      `Se actualizaron datos del usuario "${updatedUser.nombre_completo}". Rol anterior: ${previous.rol} -> Nuevo rol: ${updatedUser.rol}.`,
      updatedUser.email_institucional
    );

    return {
      success: true,
      usuario: updatedUser,
      message: `Usuario «${updatedUser.nombre_completo}» actualizado${sufijoDemo()}.`,
    };
  },

  /**
   * Concede o revoca permisos de acceso de un usuario con un clic (toggle activo).
   */
  async toggleUsuarioActivo(id: string, activo: boolean): Promise<{ success: boolean; message: string }> {
    if (!esAdmin()) return { success: false, message: ACCESO_DENEGADO_ADMIN };
    const list = await this.getUsuarios();
    const user = list.find((u) => u.id === id);
    if (!user) return { success: false, message: "Usuario no encontrado." };

    user.activo = activo;

    const client = clienteAdmin();
    if (client) {
      const { error } = await client.from("usuarios_institucionales").update({ activo }).eq("id", id);
      if (error) return { success: false, message: mensajeErrorAdmin(error, "Activar o desactivar usuario") };
    }

    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.LOCAL_USUARIOS, JSON.stringify(list));
    }

    recordAuditLog(
      activo ? "ACTIVACION_USUARIO" : "DESACTIVACION_USUARIO",
      activo
        ? `Se reactivaron los permisos y acceso de "${user.nombre_completo}".`
        : `Se suspendieron los permisos y revocó el acceso de "${user.nombre_completo}".`,
      user.email_institucional
    );

    return {
      success: true,
      message: activo
        ? `Permisos activados: "${user.nombre_completo}" ahora puede ingresar.`
        : `Permisos revocados: "${user.nombre_completo}" no podrá acceder a la plataforma.`,
    };
  },

  /**
   * Elimina un usuario de la lista de gestión institucional.
   */
  async deleteUsuario(id: string): Promise<{ success: boolean; message: string }> {
    if (!esAdmin()) return { success: false, message: ACCESO_DENEGADO_ADMIN };
    const list = await this.getUsuarios();
    const user = list.find((u) => u.id === id);
    if (!user) return { success: false, message: "Usuario no encontrado." };

    const remaining = list.filter((u) => u.id !== id);

    const client = clienteAdmin();
    if (client) {
      const { error } = await client.from("usuarios_institucionales").delete().eq("id", id);
      if (error) return { success: false, message: mensajeErrorAdmin(error, "Eliminar usuario") };
    }

    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.LOCAL_USUARIOS, JSON.stringify(remaining));
    }

    recordAuditLog(
      "ELIMINACION_USUARIO",
      `Se eliminó permanentemente el usuario "${user.nombre_completo}" (${user.email_institucional}).`,
      user.email_institucional
    );

    return {
      success: true,
      message: `Usuario «${user.nombre_completo}» eliminado${sufijoDemo()}.`,
    };
  },

  /**
   * Genera una clave provisional / PIN de bienvenida para el docente.
   */
  /**
   * Envía al usuario un enlace de Supabase Auth para crear una contraseña nueva (/restablecer).
   * El navegador no puede cambiar la contraseña de otra cuenta: eso solo lo hace el propio usuario.
   */
  async resetPassword(id: string): Promise<{ success: boolean; message: string }> {
    const list = await this.getUsuarios();
    const user = list.find((u) => u.id === id);
    if (!user) return { success: false, message: "Usuario no encontrado." };

    const client = clienteAdmin();
    if (!client) {
      return {
        success: false,
        message: "En modo demo no se envían correos. Con una cuenta real, el usuario recibe un enlace para crear su contraseña.",
      };
    }

    const { error } = await client.auth.resetPasswordForEmail(user.email_institucional, {
      redirectTo: `${window.location.origin}/restablecer`,
    });
    if (error) {
      console.warn(`[adminController] Envío de restablecimiento rechazado (${error.code}): ${error.message}`);
      return { success: false, message: "No pudimos enviar el correo. Inténtalo de nuevo en unos minutos." };
    }

    recordAuditLog(
      "RESET_PASSWORD",
      `Se envió un enlace para restablecer la contraseña de "${user.nombre_completo}".`,
      user.email_institucional
    );
    return { success: true, message: `Enviamos a ${user.email_institucional} un enlace para crear una contraseña nueva.` };
  },

  /**
   * Obtiene la lista de instituciones educativas / colegios B2B.
   */
  async getInstituciones(): Promise<DbInstitucion[]> {
    const client = clienteAdmin();
    if (client) {
      try {
        const { data, error } = await client
          .from("instituciones")
          .select("*")
          .order("nombre", { ascending: true });

        if (!error && data) {
          return data;
        }
      } catch (err) {
        console.warn("[adminController] Supabase instituciones no disponible:", err);
      }
    }

    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.LOCAL_INSTITUCIONES);
        if (raw) return JSON.parse(raw);
        localStorage.setItem(STORAGE_KEYS.LOCAL_INSTITUCIONES, JSON.stringify(SEED_INSTITUCIONES));
      } catch {}
    }
    return SEED_INSTITUCIONES;
  },

  /**
   * Registra una nueva institución educativa asociada.
   */
  async createInstitucion(
    data: Omit<DbInstitucion, "id">
  ): Promise<{ success: boolean; institucion?: DbInstitucion; message: string }> {
    if (!esAdmin()) return { success: false, message: ACCESO_DENEGADO_ADMIN };
    const cleanNombre = sanitizeInput(data.nombre);
    const cleanAmie = sanitizeInput(data.codigo_amie || "").toUpperCase();

    const newInst: DbInstitucion = {
      id:
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : "inst-" + Date.now(),
      nombre: cleanNombre,
      codigo_amie: cleanAmie || null,
      tipo_institucion: data.tipo_institucion,
      plan_suscripcion: data.plan_suscripcion,
      pin_grado_autonomo: data.pin_grado_autonomo || null,
      limite_docentes: Number(data.limite_docentes) || 15,
      ciudad: data.ciudad || "Quito",
      provincia: data.provincia || "Pichincha",
    };

    const client = clienteAdmin();
    if (client) {
      const { error } = await client.from("instituciones").insert(newInst);
      if (error) return { success: false, message: mensajeErrorAdmin(error, "Crear colegio") };
    }

    const list = await this.getInstituciones();
    const updated = [...list, newInst];
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.LOCAL_INSTITUCIONES, JSON.stringify(updated));
    }

    recordAuditLog(
      "CREACION_COLEGIO",
      `Se registró la nueva institución educativa "${newInst.nombre}" con cupo para ${newInst.limite_docentes} docentes.`
    );

    return {
      success: true,
      institucion: newInst,
      message: `Colegio «${newInst.nombre}» registrado${sufijoDemo()}.`,
    };
  },

  /**
   * Obtiene los registros de auditoría de acciones administrativas.
   */
  getAuditLogs(): DbAuditLog[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.LOCAL_AUDITORIA);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [
      {
        id: "log-seed-1",
        timestamp: "2026-10-27 19:30:00 · Hoy",
        autor: "Joan Sebastian Santacruz (Fundador)",
        accion: "CREACION_USUARIO",
        detalle: "Se dio de alta al Docente Demo PUCE con asignación a Matemáticas.",
        target_email: "docente@puce.edu.ec",
      },
      {
        id: "log-seed-2",
        timestamp: "2026-10-27 18:45:00 · Hoy",
        autor: "Ariel Fabricio Chacha (Tech Lead)",
        accion: "MODIFICACION_PERMISOS",
        detalle: "Se activaron políticas de aislamiento relacional Cero-PII para colegios de Quito.",
      },
    ];
  },

  /**
   * Obtiene métricas globales del tenant para el dashboard de administración.
   */
  async getAdminStats() {
    const usuarios = await this.getUsuarios();
    const instituciones = await this.getInstituciones();

    const totalUsuarios = usuarios.length;
    const docentesActivos = usuarios.filter((u) => u.rol === "DOCENTE" && u.activo).length;
    const coordinadores = usuarios.filter((u) => u.rol === "COORDINADOR_RECTOR").length;
    const administradores = usuarios.filter((u) => u.rol === "ADMIN").length;
    const usuariosInactivos = usuarios.filter((u) => !u.activo).length;

    const totalCupos = instituciones.reduce((acc, curr) => acc + (curr.limite_docentes || 0), 0);
    const cuposUtilizados = usuarios.filter((u) => u.rol === "DOCENTE").length;
    const pctUtilizacion = totalCupos > 0 ? Math.round((cuposUtilizados / totalCupos) * 100) : 0;

    return {
      totalUsuarios,
      docentesActivos,
      coordinadores,
      administradores,
      usuariosInactivos,
      totalInstituciones: instituciones.length,
      totalCupos,
      cuposUtilizados,
      pctUtilizacion,
    };
  },

  /**
   * Obtiene el reporte institucional agregado por paralelo para coordinadores y rectores (HU-10).
   * Llama a la función RPC public.fn_reporte_institucional_paralelos en Supabase v2.
   */
  async getReporteParalelos(cursoBgu?: string) {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client.rpc("fn_reporte_institucional_paralelos", {
          p_curso_bgu: cursoBgu || null,
        });
        if (!error && data) {
          return data;
        }
      } catch (err) {
        console.warn("[dbService] Fallo en fn_reporte_institucional_paralelos, usando fallback:", err);
      }
    }

    // Fallback con datos deterministas locales
    return [
      {
        curso_bgu: cursoBgu || "2do BGU",
        paralelo: "A",
        docente_nombre: "Lic. Carlos Mendoza",
        docente_email: "carlos.mendoza@ecdulearn.edu.ec",
        asignatura: "Matemáticas",
        total_aulas: 1,
        aulas_activas: 1,
        estudiantes_participantes: 38,
        total_intentos: 74,
        ejercicios_resueltos: 52,
        pct_resueltos_con_ayuda: 91.3,
        promedio_pistas: 2.4,
        promedio_tiempo_segundos: 828,
        paso_bloqueo_mas_frecuente: "PLANTEAMIENTO_ECUACION",
        desglose_bloqueos: {
          COMPRENSION_LECTORA: 4,
          IDENTIFICACION_VARIABLES: 8,
          PLANTEAMIENTO_ECUACION: 15,
          CALCULO: 5,
          INTERPRETACION_RESULTADO: 2,
        },
      },
    ];
  },
};


