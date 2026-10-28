import { createClient, SupabaseClient } from "@supabase/supabase-js";

function cleanSupabaseUrl(raw: string): string {
  return raw.trim().replace(/\/rest\/v1\/?$/i, "").replace(/\/+$/, "");
}

const DEFAULT_SUPABASE_URL = "https://ihnrldouoqhglskszsoe.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "";

export function getBuildSupabaseUrl(): string {
  return cleanSupabaseUrl(import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL);
}

/** Configuración guardada en este navegador que apunta a otro proyecto distinto al del despliegue. */
export function getSupabaseOverride(): { url: string; buildUrl: string } | null {
  try {
    const local = localStorage.getItem("ecdulearm_supabase_url");
    if (!local?.trim()) return null;
    const url = cleanSupabaseUrl(local);
    const buildUrl = getBuildSupabaseUrl();
    return url === buildUrl ? null : { url, buildUrl };
  } catch {
    return null;
  }
}

// Claves de entorno o configuración manual desde UI
export function getSupabaseConfig(): { url: string; anonKey: string } {
  let url = getBuildSupabaseUrl();
  let anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY).trim();

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
    // Si coincide con el despliegue no se guarda: así no queda una copia que se desactualice.
    if (url.trim() && cleanSupabaseUrl(url) === getBuildSupabaseUrl()) {
      localStorage.removeItem("ecdulearm_supabase_url");
      localStorage.removeItem("ecdulearm_supabase_key");
      return;
    }

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
    console.warn("[ECduLearn Supabase] Error al inicializar cliente:", error);
    return null;
  }
}

export function isSupabaseConnected(): boolean {
  return getSupabaseClient() !== null;
}
