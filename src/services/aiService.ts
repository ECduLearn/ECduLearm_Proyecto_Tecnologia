import { Exercise, ErcaPhase } from "../models/types";

// La clave de IA y los system prompts viven en el servidor (api/ai.ts).
const AI_ENDPOINT = "/api/ai";
const CLIENT_TIMEOUT_MS = 18000;

export interface AIResult<T> {
  data: T;
  isOfflineFallback: boolean;
  message?: string;
}

type AITask = "ping" | "exercise" | "tutor" | "erca" | "exam-review";

// Versiones anteriores guardaban la clave de Gemini en el navegador; se elimina para no dejar secretos ahí.
try {
  localStorage.removeItem("ecdulearm_gemini_key");
} catch {
  // Almacenamiento no disponible (modo privado o SSR): no hay nada que limpiar.
}

async function requestAI(task: AITask, input: Record<string, unknown> = {}): Promise<string> {
  const response = await fetch(AI_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(CLIENT_TIMEOUT_MS),
    body: JSON.stringify({ task, input }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error || `HTTP ${response.status}`);
  }
  if (typeof payload?.text !== "string" || !payload.text.trim()) {
    throw new Error("empty_response");
  }
  return payload.text;
}

export async function getAIStatus(): Promise<{ online: boolean }> {
  try {
    const response = await fetch(AI_ENDPOINT, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) return { online: false };
    const payload = await response.json();
    return { online: Boolean(payload?.online) };
  } catch {
    return { online: false };
  }
}

const AI_ERROR_MESSAGES: Record<string, string> = {
  ai_not_configured: "La IA todavía no está configurada en el servidor (falta GEMINI_API_KEY). Mientras tanto, la plataforma usa ejercicios y pistas preparados de antemano.",
  ai_unavailable: "La IA está tardando demasiado en responder, quizá por exceso de uso. Mientras tanto, la plataforma usa ejercicios y pistas preparados.",
  rate_limited: "Hubo demasiadas pruebas seguidas. Espera un minuto y vuelve a intentarlo.",
};

export async function testAIConnection(): Promise<{ success: boolean; message: string }> {
  try {
    await requestAI("ping");
    return { success: true, message: "La IA está conectada y respondiendo." };
  } catch (error) {
    const code = (error as Error).message;
    return {
      success: false,
      message: AI_ERROR_MESSAGES[code] || "No pudimos comunicarnos con la IA. La plataforma sigue funcionando con ejercicios y pistas preparados.",
    };
  }
}

function textoValido(valor: unknown): string | undefined {
  return typeof valor === "string" && valor.trim() ? valor.trim().slice(0, 4000) : undefined;
}

// El modelo a veces escribe los 5 pasos en una sola línea: cada "N. Paso:" empieza una línea nueva
function pasosEnLineas(texto: string | undefined): string | undefined {
  return texto?.replace(/\s+(?=[2-9]\.\s+[A-ZÁÉÍÓÚ])/g, "\n");
}

function listaValida(valor: unknown): string[] | undefined {
  if (!Array.isArray(valor)) return undefined;
  const lista = valor.filter((v): v is string => typeof v === "string" && v.trim().length > 0).map((v) => v.trim());
  return lista.length ? lista.slice(0, 5) : undefined;
}

export async function generateExerciseAI(
  prompt: string,
  currentExercise?: Exercise
): Promise<AIResult<{ exercise: Exercise; reply: string }>> {
  try {
    // La solución anterior no se reenvía: el modelo la vuelve a escribir para el ejercicio ajustado
    const actual = currentExercise
      ? { ...currentExercise, solucionDocente: undefined, respuestaCorrecta: undefined, pistasSocraticas: undefined }
      : null;
    const raw = await requestAI("exercise", { message: prompt, currentExercise: actual });

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
            solucionDocente: pasosEnLineas(textoValido(parsed.solucionDocente)),
            respuestaCorrecta: textoValido(parsed.respuestaCorrecta),
            pistasSocraticas: listaValida(parsed.pistasSocraticas),
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

function pasos(lista: string[]): string {
  return lista.map((paso, i) => `${i + 1}. ${paso}`).join("\n");
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
    solucionDocente: pasos([
      "Comprensión: cada módulo es un triángulo de 4 m de base y 3 m de altura.",
      "Variables: b = 4 m; h = 3 m; número de módulos = 12.",
      "Modelo: área del triángulo A = b · h / 2.",
      "Cálculo: A = 4 · 3 / 2 = 6 m² por módulo; 12 módulos = 72 m².",
      "Interpretación: la tercera pregunta es abierta; valora que el estudiante use los 72 m² para justificar su elección.",
    ]),
    respuestaCorrecta: "6 m² por módulo y 72 m² en total.",
    pistasSocraticas: [
      "¿Qué figura forma cada módulo y qué datos tienes de ella?",
      "¿Cómo se calcula el área de esa figura?",
      "Si ya sabes el área de uno, ¿cómo obtienes la de 12?",
    ],
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
      reply: "¡Hola, colega docente! Es un gusto saludarte. Soy tu asistente pedagógico en ECduLearn. ¿En qué tema te gustaría que enfoquemos la actividad de hoy? Puedes pedirme, por ejemplo: 'Crea un ejercicio sobre el Metro de Quito', 'Funciones en Galápagos', o 'Economía familiar en Ecuador'.",
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
  let solucionDocente = "";
  let respuestaCorrecta = "";
  let pistasSocraticas: string[] = [];

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
    solucionDocente = pasos(["Comprensión: el tren recorre 22 km en 34 min, pero 15 paradas de 30 s suman 7,5 min detenido.","Variables: distancia d = 22 km; tiempo en movimiento t = 34 − 7,5 = 26,5 min = 0,4417 h.","Modelo: v = d / t.","Cálculo: v = 22 / 0,4417 ≈ 49,8 km/h. Para la flota: una vuelta completa dura 2 × 34 = 68 min; con un tren cada 5 min se necesitan 68 / 5 = 13,6 → 14 trenes.","Interpretación: subir 10 % la velocidad máxima solo acorta el tramo en movimiento (≈ 2,4 min por sentido); reducir el tiempo en andenes ahorra en proporción parecida sin exigir más a los trenes."]);
    respuestaCorrecta = "Velocidad media en movimiento ≈ 49,8 km/h; flota mínima de 14 trenes.";
    pistasSocraticas = ["¿Cuánto tiempo pasa el tren detenido en las 15 paradas?","Si quitas ese tiempo, ¿cuánto dura realmente el recorrido en movimiento?","¿Cuántos trenes caben en una vuelta completa si sale uno cada 5 minutos?"];
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
    solucionDocente = pasos(["Comprensión: la colonia empieza con 120 tortugas y crece 6,5 % cada año.","Variables: P₀ = 120; tasa r = 0,065; t en años.","Modelo: P(t) = 120 · 1,065^t.","Cálculo: 120 · 1,065^t > 300 → 1,065^t > 2,5 → t > ln 2,5 / ln 1,065 ≈ 14,6; la colonia supera 300 en el año 15.","Interpretación: con una tasa del 3 %, t > ln 2,5 / ln 1,03 ≈ 31 años; el crecimiento se demora más del doble."]);
    respuestaCorrecta = "P(t) = 120 · 1,065^t; supera los 300 individuos en el año 15 (≈ 31 años si la tasa baja al 3 %).";
    pistasSocraticas = ["¿Qué significa que crezca 6,5 % cada año: se suma lo mismo o se multiplica?","¿Por qué número multiplicas la población cada año?","¿Cómo despejarías un exponente desconocido?"];
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
    solucionDocente = pasos(["Comprensión: hay que comparar el ingreso del hogar con el costo de la canasta ($795).","Variables: ingreso = 1,6 × SBU vigente (completa el valor oficial del año); alimentos 34 %; vivienda 26 %.","Modelo: cobertura = ingreso / 795 × 100; gasto por rubro = 795 × porcentaje.","Cálculo: alimentos = 795 × 0,34 = $270,30; vivienda = 795 × 0,26 = $206,70. La cobertura depende del SBU que uses.","Interpretación: el presupuesto debe justificar qué gastos no esenciales bajan 15 % y cuánto dinero libera."]);
    respuestaCorrecta = "Alimentos $270,30 y vivienda $206,70; la cobertura = 1,6 × SBU / 795 × 100 con el SBU vigente.";
    pistasSocraticas = ["¿Qué dos cantidades necesitas comparar para saber si el ingreso alcanza?","¿Cómo calculas el 34 % de una cantidad?","¿Qué gasto reducirías primero y por qué?"];
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
    solucionDocente = pasos(["Comprensión: el viento lleva la ceniza a 32 km/h y se analiza lo que ocurre en 45 min.","Variables: v = 32 km/h; t = 45 min = 0,75 h; radio de alerta r = 12 km.","Modelo: d = v · t; área del círculo A = π r².","Cálculo: d = 32 × 0,75 = 24 km; A = π × 12² ≈ 452,4 km².","Interpretación: a los 45 minutos la nube ya pasó el radio de 12 km, así que la evacuación debe empezar antes en las zonas a favor del viento."]);
    respuestaCorrecta = "La nube avanza 24 km en 45 min; el área de alerta es ≈ 452,4 km².";
    pistasSocraticas = ["¿En qué unidades está la velocidad y en cuáles el tiempo?","¿Qué fracción de hora son 45 minutos?","¿Qué fórmula da el área de un círculo?"];
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
    solucionDocente = pasos(["Comprensión: el cable forma una parábola con su punto más bajo en el centro, a 4 m de la calzada.","Variables: vértice (0, 4); torres en x = ±30 m con altura 19 m.","Modelo: y = a·x² + 4; con (30, 19): 19 = 900a + 4 → a = 1/60.","Cálculo: y = x²/60 + 4; en x = 15: y = 225/60 + 4 = 7,75 m.","Interpretación: la tensión es mínima en el vértice y máxima en las torres, donde el cable soporta el peso de todo el tramo."]);
    respuestaCorrecta = "y = x²/60 + 4; el tensor a 15 m del centro mide 7,75 m.";
    pistasSocraticas = ["¿Dónde conviene ubicar el origen para que la ecuación sea sencilla?","¿Qué punto conocido de la parábola te permite encontrar a?","¿Qué valor de x corresponde a 15 m del centro?"];
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
    solucionDocente = pasos(["Comprensión: el balón sale a 24 m/s con 30°; hay barrera a 9,15 m y arco a 26 m.","Variables: vx = 24 cos 30° ≈ 20,78 m/s; vy = 24 sen 30° = 12 m/s; g = 9,8 m/s².","Modelo: x = vx·t; y = vy·t − 4,9 t².","Cálculo: en la barrera t = 9,15 / 20,78 ≈ 0,44 s → y ≈ 4,3 m. En el arco t = 26 / 20,78 ≈ 1,25 s → y ≈ 15,0 − 7,7 ≈ 7,3 m.","Interpretación: a 7,3 m de altura el balón pasa muy por encima del travesaño (2,44 m); hay que bajar el ángulo o la velocidad."]);
    respuestaCorrecta = "Supera la barrera (≈ 4,3 m) pero pasa a ≈ 7,3 m sobre el arco: no es gol.";
    pistasSocraticas = ["¿Cómo separas la velocidad inicial en una parte horizontal y otra vertical?","¿Cuánto tarda el balón en llegar a la barrera?","Con ese tiempo, ¿a qué altura está el balón?"];
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
    solucionDocente = pasos([
      `Comprensión: identifica la situación real sobre ${displayTopic} y qué decisión hay que tomar.`,
      "Variables: lista las magnitudes con sus unidades y marca la incógnita.",
      "Modelo: elige la relación matemática que conecta las variables.",
      "Cálculo: completa los datos numéricos del enunciado y resuelve.",
      "Interpretación: compara las dos alternativas y justifica con los resultados.",
    ]);
    respuestaCorrecta = "Depende de los datos que fijes en el enunciado; completa la solución antes de publicar.";
    pistasSocraticas = [
      "¿Qué te pide decidir o calcular el problema?",
      "¿Qué datos del texto tienen unidades y cuál es la incógnita?",
      "¿Qué relación entre esas magnitudes conoces?",
    ];
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
      solucionDocente,
      respuestaCorrecta,
      pistasSocraticas,
    },
    reply,
  };
}

export async function socraticTutorAI(
  userMessage: string,
  history: { role: string; text: string }[],
  exerciseContext?: string
): Promise<AIResult<string>> {
  try {
    const raw = await requestAI("tutor", { message: userMessage, history, context: exerciseContext });
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
  try {
    const raw = await requestAI("erca", { objective, duration, context });

    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const isValidPlan =
        Array.isArray(parsed) &&
        parsed.length === 4 &&
        parsed.every((phase) => typeof phase?.id === "string" && typeof phase?.title === "string" && typeof phase?.body === "string");
      if (!isValidPlan) throw new Error("Invalid ERCA JSON shape");
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
  try {
    const raw = await requestAI("exam-review", { questionTitle, questionPrompt, studentChoice, studentMessage });
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
    params.mensajeEstudiante,
    params.historialChat?.map((h) => ({
      role: h.role === "assistant" || h.role === "tutor" ? "tutor" : "student",
      text: h.text,
    })) || [],
    params.enunciadoProblema
  );
}

