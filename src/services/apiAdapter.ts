import {
  FullPisaExercise,
  AulaActiva,
  SEED_EJERCICIOS_PISA,
  SEED_AULA_ACTIVA,
} from "../models/seedData";
import { Exercise } from "../models/types";

const LOCAL_STORAGE_KEYS = {
  EJERCICIOS: "ecdulearn_ejercicios",
  AULAS: "ecdulearn_aulas",
  INTERACCIONES: "ecdulearn_interacciones_socratica",
  METRICAS: "ecdulearn_metricas_docente",
};

function getUseMockApi(): boolean {
  return import.meta.env.VITE_USE_MOCK_API !== "false";
}

function getBackendUrl(): string {
  return (import.meta.env.VITE_BACKEND_URL || "http://localhost:3000/api").replace(/\/+$/, "");
}

/**
 * Inicializa el almacenamiento local con los datos semilla si no existen previamente.
 */
function initializeLocalSeedStorage(): void {
  if (typeof window === "undefined") return;

  if (!localStorage.getItem(LOCAL_STORAGE_KEYS.EJERCICIOS)) {
    localStorage.setItem(LOCAL_STORAGE_KEYS.EJERCICIOS, JSON.stringify(SEED_EJERCICIOS_PISA));
  }

  if (!localStorage.getItem(LOCAL_STORAGE_KEYS.AULAS)) {
    const initialAulas: Record<string, AulaActiva> = {
      [SEED_AULA_ACTIVA.pin]: SEED_AULA_ACTIVA,
    };
    localStorage.setItem(LOCAL_STORAGE_KEYS.AULAS, JSON.stringify(initialAulas));
  }

  if (!localStorage.getItem(LOCAL_STORAGE_KEYS.METRICAS)) {
    localStorage.setItem(
      LOCAL_STORAGE_KEYS.METRICAS,
      JSON.stringify(SEED_AULA_ACTIVA.metricas)
    );
  }
}

// Inicializar al cargar el adaptador
initializeLocalSeedStorage();

/**
 * ADAPTADOR DE API REST / PERSISTENCIA LOCAL (Patrón Adaptador)
 * Desacopla la interfaz de usuario de la base de datos o servidor backend.
 */
export const apiAdapter = {
  /**
   * Obtiene la lista completa de ejercicios PISA contextualizados.
   */
  async getEjercicios(): Promise<FullPisaExercise[]> {
    if (getUseMockApi()) {
      initializeLocalSeedStorage();
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEYS.EJERCICIOS);
        return stored ? JSON.parse(stored) : SEED_EJERCICIOS_PISA;
      } catch {
        return SEED_EJERCICIOS_PISA;
      }
    }

    try {
      const response = await fetch(`${getBackendUrl()}/ejercicios`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
      return await response.json();
    } catch (err) {
      console.warn("[apiAdapter] Fallo en API remota, usando respaldo local:", err);
      const stored = localStorage.getItem(LOCAL_STORAGE_KEYS.EJERCICIOS);
      return stored ? JSON.parse(stored) : SEED_EJERCICIOS_PISA;
    }
  },

  /**
   * Obtiene un ejercicio específico por su identificador.
   */
  async getEjercicioById(id: string): Promise<FullPisaExercise | null> {
    const list = await this.getEjercicios();
    return list.find((e) => e.id === id) || null;
  },

  /**
   * Guarda o actualiza un ejercicio PISA.
   */
  async saveEjercicio(ejercicio: Partial<FullPisaExercise> | Exercise): Promise<FullPisaExercise> {
    const normalized: FullPisaExercise = {
      id: ejercicio.id || `pisa-custom-${Date.now()}`,
      topic: ejercicio.topic || "Razonamiento cuantitativo",
      context: ejercicio.context || "Cotidianidad y ciencia",
      level: ejercicio.level || "2do BGU",
      difficulty: (ejercicio.difficulty as any) || "Intermedia",
      questions: ejercicio.questions || (ejercicio.questionList?.length || 3),
      version: (ejercicio.version || 0) + 1,
      situation: ejercicio.situation || "Situación contextualizada de aplicación matemática.",
      questionList: ejercicio.questionList || [
        "1. Identifica las variables principales del texto.",
        "2. Plantea la relación matemática correspondiente.",
        "3. Interpreta la solución en el contexto del problema.",
      ],
      rubric: ejercicio.rubric || "Evaluación formativa estándar PISA.",
      teacherSolution: (ejercicio as FullPisaExercise).teacherSolution || {
        steps: [
          {
            stepNumber: 1,
            title: "Identificación de variables",
            explanation: "Extracción cuantitativa de datos iniciales y relaciones.",
            mathResult: "Variables declaradas.",
          },
        ],
        finalAnswer: "Resultado numérico contextualizado.",
        pedagogicalNotes: "Guía metodológica paso a paso exclusiva para el docente.",
      },
      socraticHints: (ejercicio as FullPisaExercise).socraticHints || {
        level1: "¿Qué magnitudes conocidas y desconocidas menciona el texto?",
        level2: "¿Qué fórmula o relación matemática conecta estas dos variables?",
        level3: "Revisa si tus unidades coinciden antes de operar.",
      },
      ercaStructure: (ejercicio as FullPisaExercise).ercaStructure || {
        experience: {
          id: "experience",
          tag: "Experiencia concreta",
          duration: "10 min",
          title: "Contacto con el entorno",
          body: "Observación de un fenómeno cotidiano.",
        },
        reflection: {
          id: "reflection",
          tag: "Reflexión crítica",
          duration: "10 min",
          title: "Preguntas desafiantes",
          body: "Discusión grupal sobre el fenómeno.",
        },
        conceptualization: {
          id: "conceptualization",
          tag: "Conceptualización",
          duration: "15 min",
          title: "Formalización teórica",
          body: "Estructuración algebraica o geométrica formal.",
        },
        application: {
          id: "application",
          tag: "Aplicación y Transferencia",
          duration: "10 min",
          title: "Desafío PISA",
          body: "Resolución del ejercicio en el aula.",
        },
      },
    };

    if (getUseMockApi()) {
      const list = await this.getEjercicios();
      const index = list.findIndex((e) => e.id === normalized.id);
      if (index >= 0) {
        list[index] = normalized;
      } else {
        list.unshift(normalized);
      }
      localStorage.setItem(LOCAL_STORAGE_KEYS.EJERCICIOS, JSON.stringify(list));
      return normalized;
    }

    try {
      const response = await fetch(`${getBackendUrl()}/ejercicios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(normalized),
      });
      if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
      return await response.json();
    } catch (err) {
      console.warn("[apiAdapter] Guardando en respaldo local tras fallo de red:", err);
      const list = await this.getEjercicios();
      list.unshift(normalized);
      localStorage.setItem(LOCAL_STORAGE_KEYS.EJERCICIOS, JSON.stringify(list));
      return normalized;
    }
  },

  /**
   * Crea o activa una sesión de aula mediante código PIN de 6 caracteres.
   */
  async createAulaPin(
    ejercicioId: string,
    metadata?: Partial<AulaActiva>
  ): Promise<AulaActiva> {
    const pin = (metadata?.pin || "PISA26").toUpperCase().trim();
    const nuevaAula: AulaActiva = {
      pin,
      ejercicioId,
      schoolName: metadata?.schoolName || "Colegio Experimental San Gabriel de Quito",
      teacherName: metadata?.teacherName || "Docente Titular de Matemáticas",
      subject: metadata?.subject || "Matemáticas BGU",
      course: metadata?.course || "2do BGU",
      createdAt: new Date().toISOString(),
      active: true,
      metricas: metadata?.metricas || {
        totalEstudiantes: 35,
        estudiantesActivos: 1,
        pistasSolicitadas: 0,
        ejerciciosCompletados: 0,
        pasoMasDificil: "Planteamiento inicial del modelo",
        tasaResolucionSinCopia: "100%",
        tiempoPromedioMinutos: 0,
        distribucionDificultad: {
          comprensionLectora: 25,
          planteamientoEcuacion: 50,
          resolucionAritmetica: 25,
        },
      },
    };

    if (getUseMockApi()) {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.AULAS) || "{}";
      const aulas = JSON.parse(raw);
      aulas[pin] = nuevaAula;
      localStorage.setItem(LOCAL_STORAGE_KEYS.AULAS, JSON.stringify(aulas));
      return nuevaAula;
    }

    try {
      const response = await fetch(`${getBackendUrl()}/aulas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevaAula),
      });
      if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
      return await response.json();
    } catch {
      return nuevaAula;
    }
  },

  /**
   * Consulta una sesión de aula activa a partir de un código PIN (acceso de estudiantes).
   */
  async getAulaByPin(pin: string): Promise<AulaActiva | null> {
    const cleanPin = (pin || "").toUpperCase().trim();
    if (!cleanPin) return null;

    if (getUseMockApi()) {
      initializeLocalSeedStorage();
      const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.AULAS) || "{}";
      const aulas: Record<string, AulaActiva> = JSON.parse(raw);
      if (aulas[cleanPin]) {
        return aulas[cleanPin];
      }
      // Si el PIN coincide con el demo semilla
      if (cleanPin === SEED_AULA_ACTIVA.pin) {
        return SEED_AULA_ACTIVA;
      }
      return null;
    }

    try {
      const response = await fetch(`${getBackendUrl()}/aulas/${cleanPin}`);
      if (!response.ok) {
        if (cleanPin === SEED_AULA_ACTIVA.pin) return SEED_AULA_ACTIVA;
        return null;
      }
      return await response.json();
    } catch {
      if (cleanPin === SEED_AULA_ACTIVA.pin) return SEED_AULA_ACTIVA;
      return null;
    }
  },

  /**
   * Registra una interacción socrática (pista pedida o avance) para alimentar las métricas docentes.
   */
  async registrarInteraccionSocratica(
    pin: string,
    datos: {
      tipo: "pista" | "pregunta" | "bloqueo" | "completado";
      paso?: number;
      detalle?: string;
    }
  ): Promise<boolean> {
    const cleanPin = (pin || "PISA26").toUpperCase().trim();

    if (getUseMockApi()) {
      try {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.AULAS) || "{}";
        const aulas: Record<string, AulaActiva> = JSON.parse(raw);
        if (aulas[cleanPin]) {
          if (datos.tipo === "pista") {
            aulas[cleanPin].metricas.pistasSolicitadas += 1;
          } else if (datos.tipo === "completado") {
            aulas[cleanPin].metricas.ejerciciosCompletados += 1;
          }
          localStorage.setItem(LOCAL_STORAGE_KEYS.AULAS, JSON.stringify(aulas));
        }

        // Registrar en historial de interacciones
        const rawInter = localStorage.getItem(LOCAL_STORAGE_KEYS.INTERACCIONES) || "[]";
        const interacciones = JSON.parse(rawInter);
        interacciones.push({
          pin: cleanPin,
          ...datos,
          timestamp: Date.now(),
        });
        localStorage.setItem(LOCAL_STORAGE_KEYS.INTERACCIONES, JSON.stringify(interacciones));
        return true;
      } catch {
        return false;
      }
    }

    try {
      const res = await fetch(`${getBackendUrl()}/interacciones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: cleanPin, ...datos, timestamp: Date.now() }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  /**
   * Obtiene las métricas globales para el panel docente.
   */
  async getMetricasDocente(pin = "PISA26"): Promise<AulaActiva["metricas"]> {
    const aula = await this.getAulaByPin(pin);
    if (aula?.metricas) return aula.metricas;
    return SEED_AULA_ACTIVA.metricas;
  },
};
