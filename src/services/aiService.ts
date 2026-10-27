import { Exercise, ErcaPhase } from "../models/types";

// Modelos ordenados por eficiencia de cuota y velocidad (Flash-Lite no quema thinking tokens y tiene mayor cuota diaria gratuita)
export const CANDIDATE_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-flash-lite-latest",
  "gemini-3.1-flash-lite",
  "gemini-3.5-flash",
  "gemini-3.7-flash",
  "gemini-3.8-flash",
];

const TIMEOUT_MS = 12000;

export interface AIResult<T> {
  data: T;
  isOfflineFallback: boolean;
  message?: string;
}

export function getGeminiApiKey(): string {
  if (typeof window !== "undefined") {
    const local = localStorage.getItem("ecdulearm_gemini_key");
    if (local && local.trim()) return local.trim();
  }
  return (import.meta.env.VITE_GEMINI_API_KEY || "").trim();
}

export function setGeminiApiKey(key: string): void {
  if (typeof window !== "undefined") {
    if (key.trim()) {
      localStorage.setItem("ecdulearm_gemini_key", key.trim());
    } else {
      localStorage.removeItem("ecdulearm_gemini_key");
    }
  }
}

export async function testGeminiConnection(customKey?: string): Promise<{ success: boolean; message: string }> {
  const apiKey = (customKey !== undefined ? customKey : getGeminiApiKey()).trim();
  if (!apiKey) {
    return {
      success: false,
      message: "No hay API Key configurada. El sistema está operando en Modo Fallback Offline Inteligente.",
    };
  }

  // Probar secuencialmente los modelos disponibles para verificar cuál tiene cuota activa
  for (const model of CANDIDATE_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: "Responde brevemente 'CONEXION_OK' si recibes este mensaje." }],
            },
          ],
          generationConfig: {
            maxOutputTokens: 50,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        return {
          success: true,
          message: `¡Conexión verificada con Google Gemini (${model})! Respuesta: ${text.trim().slice(0, 50)}`,
        };
      }
    } catch {
      // Probar siguiente modelo
    }
  }

  return {
    success: false,
    message: "No se pudo verificar la conexión con los modelos de Gemini. Es posible que hayas alcanzado el límite de cuota (Rate Limit) o la API Key sea inválida.",
  };
}

async function callGemini(systemInstruction: string, prompt: string): Promise<string> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error("No API key configured");
  }

  let lastError: Error | null = null;

  // Multi-model fallback: si un modelo supera cuota (429) o no responde, pasa inmediatamente al siguiente
  for (const model of CANDIDATE_MODELS) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: `${systemInstruction}\n\nInstrucción / Mensaje del usuario:\n${prompt}` }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1200, // Optimizado para ahorrar tokens y evitar agotar cuota
          },
        }),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errText = await response.text();
        console.warn(`[ECduLearm AI] Modelo ${model} respondió con error ${response.status}:`, errText.slice(0, 150));
        lastError = new Error(`HTTP error ${response.status} en ${model}`);
        continue; // Intentar con el siguiente modelo en la lista de candidatos
      }

      const json = await response.json();
      const candidateText = json.candidates?.[0]?.content?.parts?.[0]?.text || "";
      if (!candidateText) {
        lastError = new Error(`Empty response from ${model}`);
        continue;
      }
      return candidateText;
    } catch (error) {
      clearTimeout(timeoutId);
      console.warn(`[ECduLearm AI] Excepción al llamar a ${model}:`, (error as Error).message);
      lastError = error as Error;
    }
  }

  throw lastError || new Error("Todos los modelos de Gemini fallaron o agotaron cuota");
}

export async function generateExerciseAI(
  prompt: string,
  currentExercise?: Exercise
): Promise<AIResult<{ exercise: Exercise; reply: string }>> {
  const systemPrompt = `Eres el asistente pedagógico inteligente de ECduLearm para docentes de bachillerato en Ecuador.
Objetivos y comportamiento:
1. Si el docente te saluda (ej: "Hola", "Buenas tardes", "¿Cómo estás?"), hace una pregunta pedagógica general o conversa, responde como un colega pedagógico cercano, profesional y amable, presentándote y sugiriendo temas (como Metro de Quito, Galápagos, finanzas, funciones, etc.) para crear actividades. No necesitas generar un ejercicio si solo es un saludo o consulta.
2. Si el docente te pide crear, adaptar o contextualizar un ejercicio (o menciona un tema, dificultad o nivel como "Metro de Quito", "física", "más difícil", "agrega una pregunta"), genera o adapta la actividad con enfoque PISA para Ecuador.

Si tu respuesta genera o modifica un ejercicio, responde OBLIGATORIAMENTE incluyendo un bloque JSON con esta estructura exacta:
\`\`\`json
{
  "topic": "Título conciso del tema",
  "context": "Contexto vocacional o de la vida real (ej. Transporte, Biología, Ingeniería, Finanzas)",
  "level": "Nivel educativo (ej. 1ro BGU, 2do BGU, 3ro BGU)",
  "difficulty": "Básica | Intermedia | Avanzada",
  "questions": 3,
  "situation": "Párrafo completo descriptivo de la situación problemática contextualizada en Ecuador",
  "questionList": ["Pregunta 1", "Pregunta 2", "Pregunta 3"],
  "reply": "Tu mensaje conversacional explicando la propuesta o los cambios pedagógicos aplicados"
}
\`\`\`

Si es solo un saludo o conversación sin generar un ejercicio nuevo, puedes responder con texto conversacional directo sin bloque JSON.`;

  try {
    const raw = await callGemini(
      systemPrompt,
      `Ejercicio actual en pantalla: ${JSON.stringify(currentExercise || null)}\nMensaje del docente: ${prompt}`
    );

    // Check if Gemini returned a JSON block (for exercises)
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.topic && (parsed.situation || parsed.questionList)) {
          const exercise: Exercise = {
            id: `ex-${Date.now()}`,
            topic: parsed.topic || currentExercise?.topic || "Desafío de Razonamiento",
            context: parsed.context || currentExercise?.context || "Ciencia Aplicada",
            level: parsed.level || currentExercise?.level || "2do BGU",
            difficulty: parsed.difficulty || currentExercise?.difficulty || "Intermedia",
            questions: parsed.questions || parsed.questionList?.length || 3,
            version: (currentExercise?.version || 0) + 1,
            situation: parsed.situation || currentExercise?.situation || "",
            questionList: parsed.questionList || currentExercise?.questionList || [],
            rubric: "Estándar PISA: Modelado de situaciones reales y razonamiento cuantitativo.",
          };

          return {
            data: {
              exercise,
              reply: parsed.reply || "He estructurado el ejercicio contextualizado según tus indicaciones.",
            },
            isOfflineFallback: false,
          };
        }
      } catch {
        // Continue to conversational return below
      }
    }

    // If no JSON block or it's a conversational greeting like "Hola":
    // Clean raw text in case it had markdown code wrappers
    const cleanReply = raw.replace(/```json[\s\S]*?```/g, "").trim() || raw.trim();
    return {
      data: {
        exercise: currentExercise || defaultInitialExercise(),
        reply: cleanReply,
      },
      isOfflineFallback: false,
    };
  } catch (err) {
    // Intelligent dynamic contextual fallback
    return {
      data: generateFallbackExercise(prompt, currentExercise),
      isOfflineFallback: true,
      message: (err as Error).message,
    };
  }
}

function defaultInitialExercise(): Exercise {
  return {
    id: "ex-default",
    topic: "Estabilidad de estructuras",
    context: "Ingeniería civil",
    level: "2do BGU",
    difficulty: "Intermedia",
    questions: 3,
    version: 1,
    situation:
      "Un equipo de estudiantes de bachillerato analiza la estabilidad de una estructura para un nuevo centro comunitario. El diseño utiliza módulos triangulares de 4m de base y 3m de altura.",
    questionList: [
      "Calcula el área de uno de los módulos triangulares utilizados en la estructura.",
      "Si el diseño requiere 12 módulos, ¿qué superficie total representan?",
      "Explica qué alternativa elegirías y sustenta tu decisión con los datos.",
    ],
    rubric: "Criterios PISA: Razonamiento cuantitativo y formulación de modelos.",
  };
}

function generateFallbackExercise(
  prompt: string,
  currentExercise?: Exercise
): { exercise: Exercise; reply: string } {
  const norm = prompt.toLowerCase();

  // Caso especial: Saludo en modo offline
  if (norm.startsWith("hola") || norm === "buenas" || norm.includes("saludos") || norm.includes("buenos dias") || norm.includes("buenas tardes")) {
    return {
      exercise: currentExercise || defaultInitialExercise(),
      reply: "¡Hola, colega docente! Es un gusto saludarte. Soy tu asistente pedagógico en ECduLearm. ¿En qué tema te gustaría que enfoquemos la actividad de hoy? Puedes pedirme, por ejemplo: 'Crea un ejercicio sobre el Metro de Quito', 'Funciones en Galápagos', o 'Economía familiar en Ecuador'.",
    };
  }

  const isAdjustment = Boolean(
    currentExercise &&
      (norm.includes("fácil") ||
        norm.includes("facil") ||
        norm.includes("difícil") ||
        norm.includes("dificil") ||
        norm.includes("pregunta") ||
        norm.includes("agrega") ||
        norm.includes("quita") ||
        norm.includes("nivel") ||
        norm.includes("bgu") ||
        norm.includes("cambia"))
  );

  // 1. Si es un ajuste a un ejercicio existente:
  if (isAdjustment && currentExercise) {
    let diff = currentExercise.difficulty;
    let questions = [...(currentExercise.questionList || [])];
    let level = currentExercise.level;
    let reply = "He ajustado el ejercicio según tu indicación.";

    if (norm.includes("fácil") || norm.includes("facil") || norm.includes("básica") || norm.includes("basica")) {
      diff = "Básica";
      reply = "Simplifiqué los parámetros numéricos y orienté la primera pregunta hacia un cálculo directo paso a paso.";
    } else if (norm.includes("difícil") || norm.includes("dificil") || norm.includes("avanzad")) {
      diff = "Avanzada";
      reply = "Añadí restricciones de optimización y análisis de sensibilidad para elevar la exigencia cognitiva a PISA Nivel 5.";
    }

    if (norm.includes("pregunta") || norm.includes("agrega")) {
      questions.push("Formula una conclusión argumentada sobre cómo optimizar la solución ante un escenario de recursos limitados.");
      reply += " Además, agregué una nueva pregunta de argumentación crítica.";
    }

    if (norm.includes("1ro") || norm.includes("primero")) level = "1ro BGU";
    if (norm.includes("2do") || norm.includes("segundo")) level = "2do BGU";
    if (norm.includes("3ro") || norm.includes("tercero")) level = "3ro BGU";

    return {
      exercise: {
        ...currentExercise,
        version: currentExercise.version + 1,
        difficulty: diff,
        level,
        questions: questions.length,
        questionList: questions,
      },
      reply,
    };
  }

  // 2. Generación dinámica de un NUEVO ejercicio basado en el tema solicitado:
  let topic = "Modelado Matemático Aplicado";
  let context = "Ciencia y Sociedad";
  let level = "2do BGU";
  let difficulty = "Intermedia";
  let situation = "";
  let questionList: string[] = [];
  let reply = "";

  if (norm.includes("metro") || norm.includes("quito") || norm.includes("tren") || norm.includes("transporte") || norm.includes("velocidad")) {
    topic = "Cinemática y Frecuencias en el Metro de Quito";
    context = "Transporte y Movilidad Urbana";
    level = "2do BGU";
    difficulty = norm.includes("difícil") ? "Avanzada" : "Intermedia";
    situation =
      "Los trenes del Metro de Quito recorren 22 km entre las estaciones Quitumbe y El Labrador en 34 minutos, realizando 15 paradas intermedias de 30 segundos cada una. Un equipo de estudiantes de bachillerato analiza las curvas de velocidad y consumo energético para planificar la frecuencia de trenes requerida durante la hora pico matutina.";
    questionList = [
      "Calcula la velocidad media comercial de un tren en km/h descontando el tiempo de permanencia en andenes.",
      "Si en hora pico se busca una frecuencia de paso de 5 minutos entre trenes, determina la flota mínima activa necesaria en la línea completa.",
      "Evalúa matemáticamente si un incremento del 10% en la velocidad máxima reduce de forma significativa el tiempo total frente a la optimización de los tiempos de embarque.",
    ];
    reply = "He generado un nuevo desafío PISA contextualizado en el Metro de Quito, analizando cinemática, frecuencias y optimización de transporte público.";
  } else if (norm.includes("galapagos") || norm.includes("galápagos") || norm.includes("tortuga") || norm.includes("biodiversidad") || norm.includes("ecolog")) {
    topic = "Modelado Exponencial de Poblaciones en Galápagos";
    context = "Biología y Conservación Ambiental";
    level = "3ro BGU";
    difficulty = "Intermedia";
    situation =
      "Científicos en la Estación Charles Darwin monitorean la repoblación de una especie de tortuga gigante en la Isla Santa Cruz. La colonia comenzó con 120 individuos y ha crecido a una tasa anual aproximada del 6.5% bajo un programa de conservación asistida.";
    questionList = [
      "Plantea el modelo de crecimiento exponencial P(t) que describe el tamaño poblacional tras t años.",
      "Calcula cuántos años tomará a la colonia superar los 300 individuos si la tasa de crecimiento se mantiene constante.",
      "Argumenta con base en el modelo el impacto ecológico si eventos climáticos de El Niño reducen la tasa de natalidad al 3% anual.",
    ];
    reply = "He creado una situación PISA interdisciplinaria sobre conservación de tortugas gigantes en Galápagos con modelos exponenciales.";
  } else if (norm.includes("canasta") || norm.includes("inflacion") || norm.includes("inflación") || norm.includes("salario") || norm.includes("econom") || norm.includes("finanz")) {
    topic = "Variación de la Canasta Básica Familiar en Ecuador";
    context = "Economía Doméstica y Estadística";
    level = "1ro BGU";
    difficulty = "Básica";
    situation =
      "Según reportes del INEC, la canasta básica familiar alcanzó los $795 mensuales, mientras que el ingreso de un hogar promedio con 1.6 perceptores del salario básico unificado se analiza para medir la cobertura del gasto. Los rubros se distribuyen entre alimentos (34%), vivienda (26%), educación y servicios.";
    questionList = [
      "Calcula el porcentaje de cobertura del ingreso familiar mensual respecto al costo de la canasta básica.",
      "Determina el monto en dólares destinado a los rubros de alimentos y vivienda a partir de sus ponderaciones porcentuales.",
      "Elabora una propuesta de presupuesto familiar equilibrado justificando la reducción del 15% en gastos no esenciales.",
    ];
    reply = "Diseñé una actividad aplicada sobre economía familiar en Ecuador, integrando porcentajes, proporciones y toma de decisiones.";
  } else if (norm.includes("volcan") || norm.includes("volcán") || norm.includes("cotopaxi") || norm.includes("sismo") || norm.includes("ceniza") || norm.includes("geolog")) {
    topic = "Dispersión de Ceniza del Volcán Cotopaxi";
    context = "Geofísica y Gestión de Riesgos";
    level = "2do BGU";
    difficulty = "Intermedia";
    situation =
      "El Instituto Geofísico de la EPN detecta una columna de emisión continua en el cráter del Cotopaxi a 5,897 msnm. Con vientos sostenidos del sureste a 32 km/h, se requiere delimitar la trayectoria cónica de caída de material piroclástico sobre los valles de Los Chillos y Machachi.";
    questionList = [
      "Calcula la distancia recorrida por el frente de la nube de ceniza tras 45 minutos de emisión constante.",
      "Si la zona de alerta máxima es un sector circular de 12 km de radio con centro en el cráter, calcula el área en riesgo directo.",
      "Evalúa qué medidas de evacuación son prioritarias según la velocidad de avance de la nube y la densidad poblacional.",
    ];
    reply = "Estructuré una situación de modelado geométrico y cinemático aplicada a la prevención de riesgos ante actividad volcánica.";
  } else if (norm.includes("parabola") || norm.includes("parábola") || norm.includes("cuadratica") || norm.includes("cuadrática") || norm.includes("funcion") || norm.includes("función")) {
    topic = "Modelado Parabólico en Puentes Colgantes";
    context = "Ingeniería Estructural";
    level = "2do BGU";
    difficulty = "Intermedia";
    situation =
      "En el diseño de un puente vehicular en la provincia de Morona Santiago, el cable principal describe una parábola con 60 metros de distancia entre las torres de soporte y una altura mínima de 4 metros en el centro respecto a la calzada. Las torres tienen una altura de 19 metros.";
    questionList = [
      "Determina la ecuación de la parábola situando el vértice en el punto más bajo del cable.",
      "Calcula la longitud del tensor vertical ubicado a 15 metros del centro del puente.",
      "Explica la razón física por la cual la tensión en el cable varía a lo largo de la parábola y en qué punto es máxima.",
    ];
    reply = "Diseñé un ejercicio de funciones cuadráticas aplicadas al diseño estructural de puentes en la Amazonía ecuatoriana.";
  } else if (norm.includes("futbol") || norm.includes("fútbol") || norm.includes("tiro") || norm.includes("deporte")) {
    topic = "Cinemática del Tiro Libre en la Liga Pro";
    context = "Física y Deportes";
    level = "1ro BGU";
    difficulty = "Básica";
    situation =
      "En un partido en el estadio Rodrigo Paz Delgado a 2,800 msnm, un jugador patea un tiro libre a 26 metros de la portería con una velocidad de 24 m/s y un ángulo de tiro de 30° respecto al césped horizontal.";
    questionList = [
      "Calcula las componentes horizontal y vertical de la velocidad inicial del balón.",
      "Determina la altura que alcanza el balón al cruzar la barrera situada a 9.15 metros de distancia.",
      "Concluye si el disparo ingresará en el arco de 2.44 metros de altura o pasará por encima del travesaño.",
    ];
    reply = "He adaptado la física cinemática y trigonometría a una jugada clásica de tiro libre en la altura de Quito.";
  } else {
    // Extractor semántico dinámico universal
    const cleanedTopic = prompt
      .replace(/^(crea|crear|haz|hacer|diseña|diseñar|genera|generar|un|una|ejercicio|problema|actividad|sobre|de|para)\s+/gi, "")
      .replace(/\s+(para|con|en)\s+(1ro|2do|3ro|primero|segundo|tercero|bgu|colegio).*$/gi, "")
      .trim();

    const displayTopic = cleanedTopic.length > 2
      ? cleanedTopic.charAt(0).toUpperCase() + cleanedTopic.slice(1)
      : "Modelado Cuantitativo";

    topic = `Análisis y Optimización: ${displayTopic}`;
    context = "Ciencia y Aplicación Tecnológica";
    level = norm.includes("3ro") ? "3ro BGU" : norm.includes("1ro") ? "1ro BGU" : "2do BGU";
    difficulty = norm.includes("difícil") ? "Avanzada" : norm.includes("fácil") ? "Básica" : "Intermedia";
    situation = `Un grupo de estudiantes de ${level} analiza un problema real enfocado en “${displayTopic}” en el contexto ecuatoriano. A partir de una serie de mediciones y variables recopiladas en campo, el equipo debe modelar cuantitativamente la situación para tomar decisiones fundamentadas en evidencia.`;
    questionList = [
      `Identifica y define las variables clave (magnitudes y unidades) que intervienen en el análisis de ${displayTopic}.`,
      `Formula la expresión matemática o relación cuantitativa que permite predecir el comportamiento del sistema.`,
      `Con base en los resultados, elabora una justificación técnica comparando dos alternativas de solución al problema planteado.`,
    ];
    reply = `He generado una situación ERCA completamente nueva sobre “${displayTopic}” contextualizada para ${level} con enfoque PISA.`;
  }

  return {
    exercise: {
      id: `ex-${Date.now()}`,
      topic,
      context,
      level,
      difficulty,
      questions: questionList.length,
      version: (currentExercise?.version || 0) + 1,
      situation,
      questionList,
      rubric: "Criterios PISA: Formulación, Empleo de conceptos e Interpretación de resultados.",
    },
    reply,
  };
}

export async function socraticTutorAI(
  userMessage: string,
  history: { role: string; text: string }[],
  exerciseContext?: string
): Promise<AIResult<string>> {
  const systemPrompt = `Eres el Tutor Socrático Anti-Copia de ECduLearm para estudiantes de bachillerato en Ecuador.
REGLA CARDINAL ESTRICTA:
- El agente tiene TERMINANTEMENTE PROHIBIDO dar la respuesta final, la solución numérica o resolver el cálculo por el estudiante.
- Solo puedes responder con preguntas guía reflexivas, pistas graduales (andamiaje cognitivo) y validación lógica de los pasos que el estudiante proponga.
- Si el estudiante te pide la respuesta directa o que le hagas la tarea, recuérdale con calidez que tu labor es ayudarlo a razonar para que sea capaz de resolver cualquier problema por sí mismo.
- Emplea un tono cercano, motivador, empático y respetuoso (español de Ecuador/Latinoamérica).`;

  try {
    const conversation = history
      .map((h) => `${h.role === "student" || h.role === "user" ? "Estudiante" : "Tutor"}: ${h.text}`)
      .join("\n");

    const prompt = `Contexto del reto actual: ${exerciseContext || "Razonamiento lógico aplicado"}\nHistorial:\n${conversation}\nEstudiante: ${userMessage}\n\nResponde como Tutor Socrático:`;

    const raw = await callGemini(systemPrompt, prompt);
    return {
      data: raw.trim(),
      isOfflineFallback: false,
    };
  } catch {
    return {
      data: socraticFallbackReply(userMessage, exerciseContext),
      isOfflineFallback: true,
    };
  }
}

function socraticFallbackReply(prompt: string, context?: string): string {
  const norm = prompt.toLowerCase();
  if (norm.includes("no entiendo el enunciado") || norm.includes("no entiendo")) {
    return `Vamos a desglosarlo juntos: ¿de qué situación real habla el problema (${context || "del reto actual"}) y cuáles son los datos conocidos que te entrega?`;
  }
  if (norm.includes("pista del primer paso") || norm.includes("primer paso")) {
    return "Para el primer paso: identifica qué magnitud te piden encontrar (área, tiempo, velocidad o cantidad) y escribe la relación básica entre las variables.";
  }
  if (norm.includes("revisa mi procedimiento") || norm.includes("procedimiento")) {
    return "¡Excelente iniciativa! Cuéntame qué cálculo realizaste primero y por qué elegiste ese camino lógico. ¿Llegaste a una cifra intermedia?";
  }
  if (norm.includes("regla de tres")) {
    return "Antes de aplicar una regla de tres automática, observa las variables: ¿si una aumenta, la otra necesariamente aumenta en la misma proporción lineal, o existe una relación cuadrática o geométrica?";
  }
  if (norm.includes("no sé") || norm.includes("no se") || norm.includes("ayuda") || norm.includes("difícil")) {
    return "¡Tranquilo, es normal sentirse desafiado al inicio! Vamos paso a paso: ¿cuáles son los datos numéricos explícitos que te brinda el texto?";
  }
  if (
    norm.includes("respuesta") ||
    norm.includes("resultado") ||
    norm.includes("cuánto da") ||
    norm.includes("cuanto da") ||
    norm.includes("dame el numero") ||
    norm.includes("dame el número") ||
    norm.includes("dime la solucion") ||
    norm.includes("dime la solución")
  ) {
    return "🛡️ Como Tutor Socrático, mi misión es que tú desarrolles la destreza cognitiva, por lo que nunca te daré el número servido. Si calculamos primero el punto de partida de la ecuación, ¿qué operación crees que debemos aplicar?";
  }
  if (norm.includes("fórmula") || norm.includes("formula")) {
    return "En lugar de memorizar la fórmula completa, piensa en el fenómeno físico o geométrico: ¿puedes descomponerlo en figuras o relaciones elementales?";
  }
  return "¿Qué ocurre si comparas el estado inicial con el estado final? Identifica qué valor o magnitud se mantiene constante en todo el proceso para poder igualar las expresiones.";
}

export async function planErcaAI(
  objective: string,
  duration: string,
  context?: string
): Promise<AIResult<ErcaPhase[]>> {
  const systemPrompt = `Eres un asesor metodológico experto en el modelo ERCA (Experiencia, Reflexión, Conceptualización, Aplicación) para el Ministerio de Educación de Ecuador.
Tu labor es estructurar un plan de clase de 4 fases para docentes de bachillerato.
Responde estrictamente con un array JSON de 4 fases con las claves: "id", "tag", "duration", "title", "body".
Los IDs deben ser exactamente: "experience", "reflection", "conceptualization", "application".`;

  try {
    const raw = await callGemini(
      systemPrompt,
      `Objetivo: ${objective}\nDuración total: ${duration}\nContexto: ${context || "General"}`
    );

    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        data: parsed,
        isOfflineFallback: false,
      };
    }
    throw new Error("Could not parse ERCA JSON");
  } catch {
    return {
      data: [
        {
          id: "experience",
          tag: "Experiencia concreta",
          duration: "10 min",
          title: "Observación de puentes y techumbres locales",
          body: "Los estudiantes observan fotografías del puente del Chiche y estructuras patrimoniales para identificar patrones de vigas triangulares.",
        },
        {
          id: "reflection",
          tag: "Reflexión guiada",
          duration: "10 min",
          title: "¿Por qué triángulos y no cuadrados?",
          body: "Discusión en parejas: ¿Por qué una estructura de 4 lados se deforma fácilmente al empujar un vértice, mientras que una de 3 lados permanece rígida?",
        },
        {
          id: "conceptualization",
          tag: "Conceptualización",
          duration: "15 min",
          title: "Teorema de rigidez triangular y cálculo de áreas",
          body: "Formalización matemática del área de triángulos isósceles y descomposición de fuerzas coplanares en nodos.",
        },
        {
          id: "application",
          tag: "Aplicación y Transferencia",
          duration: "10 min",
          title: "Desafío de optimización para centro comunitario",
          body: "Aplicar el modelo para calcular la cantidad de material y justificar el diseño ante un escenario real de ingeniería comunitaria.",
        },
      ],
      isOfflineFallback: true,
    };
  }
}

export async function reviewExamAI(
  questionTitle: string,
  questionPrompt: string,
  studentChoice: string,
  studentMessage: string
): Promise<AIResult<string>> {
  const systemPrompt = `Eres el Tutor Socrático de Revisión de Examen de ECduLearm.
El estudiante acaba de rendir un simulador de admisión universitaria y falló una pregunta.
Tu meta es ayudarlo a descubrir DÓNDE estuvo la falacia en su procedimiento sin darle la respuesta servida.
Sé conciso, empático y formula una pregunta reflexiva que despierte el '¡Ajá!' cognitivo.`;

  try {
    const raw = await callGemini(
      systemPrompt,
      `Pregunta: ${questionTitle}\nEnunciado: ${questionPrompt}\nOpción que eligió el estudiante: ${studentChoice}\nComentario del estudiante: ${studentMessage}`
    );
    return {
      data: raw.trim(),
      isOfflineFallback: false,
    };
  } catch {
    return {
      data: "Observa con detenimiento la opción que elegiste: ¿sumaste directamente los catetos al cuadrado para hallar la hipotenusa, o la hipotenusa era en realidad el lado conocido de la escalera? ¿Qué lado representa la distancia máxima?",
      isOfflineFallback: true,
    };
  }
}

/**
 * Función oficial de generación o adaptación PISA (Workflow 2)
 */
export async function generarOAdaptarEjercicioPISA(params: {
  nivel: string;
  tema: string;
  contexto: string;
  ejercicioBase?: string;
  accionRapida?: string;
}): Promise<AIResult<{ exercise: Exercise; reply: string }>> {
  const prompt = `Nivel: ${params.nivel}. Tema: ${params.tema}. Contexto de aplicación: ${params.contexto}. ${
    params.ejercicioBase ? `Ejercicio base mecánico a transformar: ${params.ejercicioBase}.` : ""
  } ${params.accionRapida ? `Acción solicitada: ${params.accionRapida}.` : ""}`;

  return await generateExerciseAI(prompt);
}

/**
 * Función oficial del Tutor Socrático con candado anti-copia (Workflow 2)
 */
export async function consultarTutorSocratico(params: {
  enunciadoProblema: string;
  historialChat?: { role: string; text: string }[];
  mensajeEstudiante: string;
}): Promise<AIResult<string>> {
  return await socraticTutorAI(
    params.enunciadoProblema,
    params.mensajeEstudiante,
    params.historialChat?.map((h) => ({
      id: Date.now(),
      role: h.role === "assistant" || h.role === "tutor" ? "tutor" : "student",
      text: h.text,
    })) || []
  );
}

