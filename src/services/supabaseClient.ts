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
 * Consulta un PIN de aula en la base de datos Supabase.
 * Si Supabase no está configurado o falla, devuelve null (para fallback en localStorage).
 */
export async function fetchPinFromDatabase(pin: string): Promise<PinSession | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const clean = pin.trim().replace(/\s+/g, "").toUpperCase();

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
 * Guarda una nueva sesión de aula y ejercicio en Supabase.
 */
export async function savePinSessionToDatabase(session: PinSession): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    // 1. Guardar ejercicio
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

    // 2. Guardar sesión de PIN
    const { error } = await supabase.from("pin_sessions").upsert({
      pin: session.pin.toUpperCase(),
      school_name: session.schoolName,
      teacher_name: session.teacherName,
      subject: session.subject,
      active: session.active,
      exercise_id: session.exercise?.id || null,
      exercise_data: session.exercise,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.warn("[ECduLearm DB] Error guardando sesión PIN:", error.message);
      return false;
    }

    return true;
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
