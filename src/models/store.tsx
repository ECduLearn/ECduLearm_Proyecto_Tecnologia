import React, { createContext, useContext, useEffect, useState } from "react";
import { Exercise, PinSession, TeacherUser, ViewType } from "./types";

export const DEFAULT_EXERCISE: Exercise = {
  id: "ex-default-1",
  topic: "Estabilidad de estructuras",
  context: "Ingeniería civil",
  level: "2do BGU",
  difficulty: "Intermedia",
  questions: 3,
  version: 1,
  situation:
    "Un equipo de estudiantes de bachillerato analiza la estabilidad de una estructura para un nuevo centro comunitario en Quito. El diseño preliminar utiliza módulos triangulares de 4 metros de base y 3 metros de altura. Antes de iniciar la construcción, deben evaluar la resistencia geométrica, comparar alternativas y justificar cuál distribución optimiza los materiales y soporta mejor las cargas vivas y sísmicas.",
  questionList: [
    "Calcula el área frontal y el perímetro de uno de los módulos triangulares isósceles utilizados en la estructura.",
    "Si la cubierta requiere un enrejado de 12 módulos simétricos, ¿qué superficie total ocupan y qué relación existe entre rigidez y peso?",
    "Formula una recomendación técnica fundamentada para la junta cantonal que demuestre por qué la geometría triangular evita deformaciones por corte.",
  ],
  rubric: "Evaluación bajo estándar PISA: Nivel 4 - Interpretación, modelado geométrico y argumentación con evidencia técnica.",
};

const SEED_PINS: Record<string, PinSession> = {
  "482917": {
    pin: "482917",
    exercise: DEFAULT_EXERCISE,
    createdAt: Date.now() - 3600000,
    schoolName: "Colegio Experimental 24 de Mayo",
    teacherName: "Prof. Marco Andrade",
    subject: "Matemática y Razonamiento Lógico",
    active: true,
  },
  "123456": {
    pin: "123456",
    exercise: {
      ...DEFAULT_EXERCISE,
      id: "ex-default-2",
      topic: "Cinemática y Seguridad Vial",
      context: "Movilidad urbana",
      situation:
        "La Agencia Nacional de Tránsito analiza la distancia de frenado de vehículos ligeros que circulan por una avenida con pendiente a 50 km/h en pavimento mojado. Debes calcular los coeficientes de fricción y determinar el margen seguro de desaceleración.",
      questionList: [
        "Determina la distancia teórica de parada considerando el tiempo de reacción promedio de 0.75 segundos.",
        "Compara la energía cinética residual si la velocidad inicial aumenta de 50 km/h a 65 km/h.",
      ],
    },
    createdAt: Date.now() - 7200000,
    schoolName: "Unidad Educativa Manuela Cañizares",
    teacherName: "Lcda. Patricia Morales",
    subject: "Física Superior",
    active: true,
  },
};

interface AppContextType {
  currentView: ViewType;
  setView: (view: ViewType) => void;
  currentExercise: Exercise;
  updateExercise: (newExercise: Partial<Exercise>) => void;
  setFullExercise: (exercise: Exercise) => void;
  exerciseVersions: Exercise[];
  undoExerciseVersion: () => void;
  teacherUser: TeacherUser | null;
  loginTeacher: (user?: TeacherUser) => void;
  logoutTeacher: () => void;
  activePin: string;
  setActivePin: (pin: string) => void;
  pinSessions: Record<string, PinSession>;
  createPinForExercise: (exercise: Exercise) => string;
  getPinSession: (pin: string) => PinSession | null;
  evaluatorMode: boolean;
  setEvaluatorMode: (val: boolean) => void;
  resetAll: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_KEYS = {
  EXERCISE: "ecdulearm_exercise",
  VERSIONS: "ecdulearm_versions",
  PINS: "ecdulearm_pins",
  ACTIVE_PIN: "ecdulearm_active_pin",
  TEACHER: "ecdulearm_teacher",
  VIEW: "ecdulearm_view",
  EVALUATOR: "ecdulearm_evaluator_mode",
};

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [currentView, setView] = useState<ViewType>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.VIEW);
    return (saved as ViewType) || "portal";
  });

  const [currentExercise, setCurrentExercise] = useState<Exercise>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.EXERCISE);
      return saved ? JSON.parse(saved) : DEFAULT_EXERCISE;
    } catch {
      return DEFAULT_EXERCISE;
    }
  });

  const [exerciseVersions, setExerciseVersions] = useState<Exercise[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.VERSIONS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [pinSessions, setPinSessions] = useState<Record<string, PinSession>>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.PINS);
      return saved ? { ...SEED_PINS, ...JSON.parse(saved) } : SEED_PINS;
    } catch {
      return SEED_PINS;
    }
  });

  const [activePin, setActivePin] = useState<string>(() => {
    return localStorage.getItem(LOCAL_STORAGE_KEYS.ACTIVE_PIN) || "482917";
  });

  const [teacherUser, setTeacherUser] = useState<TeacherUser | null>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.TEACHER);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [evaluatorMode, setEvaluatorMode] = useState<boolean>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.EVALUATOR);
    return saved !== null ? saved === "true" : true;
  });

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.VIEW, currentView);
  }, [currentView]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.EXERCISE, JSON.stringify(currentExercise));
  }, [currentExercise]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.VERSIONS, JSON.stringify(exerciseVersions));
  }, [exerciseVersions]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.PINS, JSON.stringify(pinSessions));
  }, [pinSessions]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.ACTIVE_PIN, activePin);
  }, [activePin]);

  useEffect(() => {
    if (teacherUser) {
      localStorage.setItem(LOCAL_STORAGE_KEYS.TEACHER, JSON.stringify(teacherUser));
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEYS.TEACHER);
    }
  }, [teacherUser]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.EVALUATOR, String(evaluatorMode));
  }, [evaluatorMode]);

  const updateExercise = (newPartial: Partial<Exercise>) => {
    setExerciseVersions((prev) => [...prev, currentExercise]);
    setCurrentExercise((prev) => ({
      ...prev,
      ...newPartial,
      version: prev.version + 1,
    }));
  };

  const setFullExercise = (exercise: Exercise) => {
    setExerciseVersions((prev) => [...prev, currentExercise]);
    setCurrentExercise(exercise);
  };

  const undoExerciseVersion = () => {
    if (exerciseVersions.length === 0) return;
    const last = exerciseVersions[exerciseVersions.length - 1];
    setExerciseVersions((prev) => prev.slice(0, -1));
    setCurrentExercise(last);
  };

  const loginTeacher = (user?: TeacherUser) => {
    const defaultUser: TeacherUser = {
      id: "tea-evaluator",
      name: "Prof. Carlos Mera (Jurado / Evaluador)",
      email: "carlos.mera@ecdulearm.edu.ec",
      institution: "Unidad Educativa Bilingüe Quito",
      role: "docente",
    };
    setTeacherUser(user || defaultUser);
  };

  const logoutTeacher = () => {
    setTeacherUser(null);
  };

  const createPinForExercise = (exercise: Exercise): string => {
    // Generate 6 digit pin
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    const newSession: PinSession = {
      pin,
      exercise: { ...exercise },
      createdAt: Date.now(),
      schoolName: teacherUser?.institution || "Institución Educativa Demo",
      teacherName: teacherUser?.name || "Docente Asignado",
      subject: exercise.topic || "Razonamiento Lógico",
      active: true,
    };
    setPinSessions((prev) => ({
      ...prev,
      [pin]: newSession,
    }));
    setActivePin(pin);
    return pin;
  };

  const getPinSession = (pin: string): PinSession | null => {
    const cleanPin = pin.trim().replace(/\s+/g, "");
    return pinSessions[cleanPin] || null;
  };

  const resetAll = () => {
    localStorage.clear();
    setCurrentExercise(DEFAULT_EXERCISE);
    setExerciseVersions([]);
    setPinSessions(SEED_PINS);
    setActivePin("482917");
    setTeacherUser(null);
    setView("portal");
  };

  return (
    <AppContext.Provider
      value={{
        currentView,
        setView,
        currentExercise,
        updateExercise,
        setFullExercise,
        exerciseVersions,
        undoExerciseVersion,
        teacherUser,
        loginTeacher,
        logoutTeacher,
        activePin,
        setActivePin,
        pinSessions,
        createPinForExercise,
        getPinSession,
        evaluatorMode,
        setEvaluatorMode,
        resetAll,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useStore() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
}
