import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Exercise, PinSession } from "../models/types";

function cleanSupabaseUrl(raw: string): string {
  return raw.trim().replace(/\/rest\/v1\/?$/i, "").replace(/\/+$/, "");
}

// Claves de entorno o configuración manual desde UI
export function getSupabaseConfig(): { url: string; anonKey: string } {
  let url = cleanSupabaseUrl(import.meta.env.VITE_SUPABASE_URL || "");
  let anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();

  // Permitir configurar o sobreescribir desde localStorage para pruebas de evaluadores
  if (typeof window !== "undefined") {
    const localUrl = localStorage.getItem("ecdulearm_supabase_url");
    const localKey = localStorage.getItem("ecdulearm_supabase_key");
    if (localUrl && localUrl.trim()) url = cleanSupabaseUrl(localUrl);
    if (localKey && localKey.trim()) anonKey = localKey.trim();
  }

  return { url, anonKey };
}

export function setSupabaseConfig(url: string, anonKey: string): void {
  if (typeof window !== "undefined") {
    if (url.trim()) {
      localStorage.setItem("ecdulearm_supabase_url", url.trim());
    } else {
      localStorage.removeItem("ecdulearm_supabase_url");
    }

    if (anonKey.trim()) {
      localStorage.setItem("ecdulearm_supabase_key", anonKey.trim());
    } else {
      localStorage.removeItem("ecdulearm_supabase_key");
    }
  }
}

let cachedClient: SupabaseClient | null = null;
let lastUrl = "";
let lastKey = "";

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) {
    return null;
  }

  if (cachedClient && lastUrl === url && lastKey === anonKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    lastUrl = url;
    lastKey = anonKey;
    return cachedClient;
  } catch (error) {
    console.warn("[ECduLearm Supabase] Error al inicializar cliente:", error);
    return null;
  }
}

export function isSupabaseConnected(): boolean {
  return getSupabaseClient() !== null;
}

/**
 * Consulta un PIN de aula en la base de datos Supabase (Soporta esquema v2 'aulas_virtuales' y v1 'pin_sessions').
 * Si Supabase no está configurado o falla, devuelve null (para fallback en localStorage).
 */
export async function fetchPinFromDatabase(pin: string): Promise<PinSession | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const clean = pin.trim().replace(/\s+/g, "").toUpperCase();

  // 1. Intentar consultar en esquema v2: aulas_virtuales
  try {
    const { data: aulaV2 } = await supabase
      .from("aulas_virtuales")
      .select("pin_acceso, titulo_sesion, activa, created_at, docente_id, usuarios_institucionales(nombre_completo, instituciones(nombre))")
      .eq("pin_acceso", clean)
      .eq("activa", true)
      .single();

    if (aulaV2) {
      const teacherName = (aulaV2.usuarios_institucionales as any)?.nombre_completo || "Docente Asignado";
      const schoolName = (aulaV2.usuarios_institucionales as any)?.instituciones?.nombre || "Institución Educativa";

      // Intentar obtener el primer ejercicio vinculado a esta aula
      let exData: Exercise = {
        id: `ex-${clean.toLowerCase()}`,
        topic: aulaV2.titulo_sesion,
        context: "Razonamiento y Aplicación",
        level: "2do BGU",
        difficulty: "Intermedia",
        questions: 3,
        version: 1,
        situation: "Reto contextualizado asignado por el docente para el aula activa.",
        questionList: ["Analiza el escenario, identifica las variables y aplica el modelo."],
      };

      try {
        const { data: aeData } = await supabase
          .from("aula_ejercicios")
          .select("ejercicios_pisa(*)")
          .eq("aula_id", (aulaV2 as any).id)
          .limit(1)
          .single();

        if (aeData?.ejercicios_pisa) {
          const ep = aeData.ejercicios_pisa as any;
          exData = {
            id: ep.id,
            topic: ep.tema_curricular,
            context: ep.contexto_pisa,
            level: ep.curso_bgu,
            difficulty: ep.nivel_dificultad,
            questions: 3,
            version: 1,
            situation: ep.enunciado_contexto,
            questionList: ep.pregunta_razonamiento ? ep.pregunta_razonamiento.split("\n") : [],
            rubric: `Estándar PISA Nivel ${ep.nivel_pisa || 4}`,
          };
        }
      } catch {}

      return {
        pin: aulaV2.pin_acceso,
        schoolName,
        teacherName,
        subject: "Matemática y Razonamiento Lógico",
        active: aulaV2.activa,
        createdAt: new Date(aulaV2.created_at || Date.now()).getTime(),
        exercise: exData,
      };
    }
  } catch {}

  // 2. Consulta en tabla v1: pin_sessions
  try {
    const { data, error } = await supabase
      .from("pin_sessions")
      .select("*")
      .eq("pin", clean)
      .eq("active", true)
      .single();

    if (error || !data) {
      return null;
    }

    const session: PinSession = {
      pin: data.pin,
      schoolName: data.school_name || "Institución Educativa",
      teacherName: data.teacher_name || "Docente Asignado",
      subject: data.subject || "Razonamiento Lógico",
      active: data.active,
      createdAt: new Date(data.created_at).getTime(),
      exercise: data.exercise_data as Exercise,
    };

    return session;
  } catch (err) {
    console.warn("[ECduLearm DB] Error al consultar PIN en Supabase:", err);
    return null;
  }
}

/**
 * Guarda una nueva sesión de aula y ejercicio en Supabase (con sincronización v1 y v2).
 */
export async function savePinSessionToDatabase(session: PinSession): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  const cleanPin = session.pin.toUpperCase().trim();

  // 1. Guardar en esquema v2 (ejercicios_pisa y aulas_virtuales)
  try {
    if (session.exercise) {
      await supabase.from("ejercicios_pisa").upsert({
        tema_curricular: session.exercise.topic,
        contexto_pisa: session.exercise.context,
        curso_bgu: session.exercise.level,
        nivel_dificultad: session.exercise.difficulty,
        enunciado_contexto: session.exercise.situation || "",
        pregunta_razonamiento: session.exercise.questionList?.join("\n") || "",
        solucion_paso_a_paso_docente: "Procedimiento guiado",
        respuesta_correcta: "Solución en revisión",
        es_publico: true,
      });
    }

    await supabase.from("aulas_virtuales").upsert({
      pin_acceso: cleanPin,
      titulo_sesion: session.exercise?.topic || `Aula ${cleanPin}`,
      modo_aula: "RETO_CLASE",
      activa: session.active,
    });
  } catch {}

  // 2. Guardar en esquema v1 (pin_sessions) para compatibilidad
  try {
    if (session.exercise) {
      await supabase.from("exercises").upsert({
        id: session.exercise.id || `ex-${Date.now()}`,
        topic: session.exercise.topic,
        context: session.exercise.context,
        level: session.exercise.level,
        difficulty: session.exercise.difficulty,
        questions: session.exercise.questions,
        version: session.exercise.version,
        situation: session.exercise.situation || "",
        question_list: session.exercise.questionList || [],
        rubric: session.exercise.rubric || "",
      });
    }

    const { error } = await supabase.from("pin_sessions").upsert({
      pin: cleanPin,
      school_name: session.schoolName,
      teacher_name: session.teacherName,
      subject: session.subject,
      active: session.active,
      exercise_id: session.exercise?.id || null,
      exercise_data: session.exercise,
      updated_at: new Date().toISOString(),
    });

    return !error;
  } catch (err) {
    console.warn("[ECduLearm DB] Excepción al guardar en Supabase:", err);
    return false;
  }
}

/**
 * Registra una interacción socrática para analíticas y detección de intentos de copia.
 */
export async function recordStudentInteractionDb(
  pin: string,
  studentSessionId: string,
  role: "student" | "tutor",
  message: string,
  isBlockedAttempt: boolean = false
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    await supabase.from("student_interactions").insert({
      pin: pin.toUpperCase(),
      student_session_id: studentSessionId,
      role,
      message,
      is_blocked_attempt: isBlockedAttempt,
    });
  } catch {
    // Telemetría no bloqueante
  }
}
