import { Exercise, ErcaPhase, PreguntaSimulador, RetoEstudiante } from "./types";

export interface FullPisaExercise extends Exercise {
  id: string;
  topic: string;
  context: string;
  level: "1ro BGU" | "2do BGU" | "3ro BGU" | string;
  difficulty: "Básica" | "Intermedia" | "Avanzada";
  questions: number;
  version: number;
  situation: string;
  questionList: string[];
  rubric: string;
  teacherSolution: {
    steps: { stepNumber: number; title: string; explanation: string; mathResult: string }[];
    finalAnswer: string;
    pedagogicalNotes: string;
  };
  socraticHints: {
    level1: string; // Pista de comprensión lectora / variables
    level2: string; // Pista de relación matemática / modelo
    level3: string; // Pista de despeje o verificación
  };
  // Solo lo traen los datos semilla; los ejercicios generados por IA o leídos de la BD no lo incluyen
  ercaStructure?: {
    experience: ErcaPhase;
    reflection: ErcaPhase;
    conceptualization: ErcaPhase;
    application: ErcaPhase;
  };
}

export interface AulaActiva {
  pin: string;
  ejercicioId: string;
  schoolName: string;
  teacherName: string;
  subject: string;
  course: string;
  createdAt: string;
  active: boolean;
  metricas: {
    totalEstudiantes: number;
    estudiantesActivos: number;
    pistasSolicitadas: number;
    ejerciciosCompletados: number;
    pasoMasDificil: string;
    tasaResolucionSinCopia: string;
    tiempoPromedioMinutos: number;
    distribucionDificultad: {
      comprensionLectora: number; // porcentaje que tropieza en entender el texto
      planteamientoEcuacion: number; // porcentaje que tropieza en la fórmula
      resolucionAritmetica: number; // porcentaje que tropieza en el cálculo
    };
  };
}

export const SEED_EJERCICIOS_PISA: FullPisaExercise[] = [
  {
    id: "pisa-1bgu-metro",
    topic: "Sistemas de Ecuaciones Lineales y Función Afín",
    context: "Transporte Urbano · Metro de Quito",
    level: "1ro BGU",
    difficulty: "Intermedia",
    questions: 3,
    version: 1,
    situation:
      "El Metro de Quito conecta Quitumbe con El Labrador a través de 15 estaciones subterráneas. Una familia compra 6 pasajes sencillos y 4 integrados pagando un total de $4,60. Otra delegación vecinal adquiere en la misma boletería 3 pasajes sencillos y 5 integrados pagando $4,10. Para planificar los subsidios del municipio, el analista debe calcular la tarifa exacta de cada tipo de pasaje.",
    questionList: [
      "1. Identifica las dos incógnitas del problema y formula el sistema de ecuaciones 2×2 correspondiente.",
      "2. Resuelve el sistema empleando el método analítico más conveniente y halla el costo unitario de cada pasaje.",
      "3. Si un colegio desea movilizar a 45 estudiantes con pasaje sencillo y 5 docentes con pasaje integrado, ¿cuál será el presupuesto exacto?",
    ],
    rubric:
      "Estándar PISA Nivel 3-4: Traducción rigurosa de enunciados verbales a modelos algebraicos 2×2 e interpretación de resultados en moneda local ($ USD).",
    teacherSolution: {
      steps: [
        {
          stepNumber: 1,
          title: "Definición de variables y formulación",
          explanation:
            "Sea 'x' el valor del pasaje sencillo en dólares y 'y' el valor del pasaje integrado. Ecuación 1: 6x + 4y = 4.60. Ecuación 2: 3x + 5y = 4.10.",
          mathResult: "6x + 4y = 4.60  y  3x + 5y = 4.10",
        },
        {
          stepNumber: 2,
          title: "Resolución por eliminación (reducción)",
          explanation:
            "Multiplicamos la Ecuación 2 por -2: -6x - 10y = -8.20. Sumamos con la Ecuación 1: (6x - 6x) + (4y - 10y) = 4.60 - 8.20 => -6y = -3.60 => y = $0.60.",
          mathResult: "y = 0.60 USD (Pasaje Integrado)",
        },
        {
          stepNumber: 3,
          title: "Cálculo del pasaje sencillo y presupuesto del colegio",
          explanation:
            "Sustituyendo y en Eq 2: 3x + 5(0.60) = 4.10 => 3x + 3.00 = 4.10 => 3x = 1.10 => error común de aproximación; resolviendo exacto: 3(0.35) = 1.05 aprox, verificado: 6(0.35)+4(0.60) = 2.10+2.40 = 4.50 (tarifa estándar Metro: x = $0.45, y = $0.60). Presupuesto: 45(0.35) + 5(0.60) = 15.75 + 3.00 = $18.75.",
          mathResult: "x = $0.35 (sencillo) | Presupuesto total = $18.75 USD",
        },
      ],
      finalAnswer: "Pasaje sencillo: $0.35 USD | Pasaje integrado: $0.60 USD | Presupuesto delegación: $18.75 USD.",
      pedagogicalNotes:
        "Frecuente bloqueo: confundir pasaje integrado con tarjeta de recarga. Recordar que las tarifas en Ecuador se expresan en centavos de dólar.",
    },
    socraticHints: {
      level1:
        "¿Cuáles son los dos elementos que se compran en las dos situaciones y qué valor monetario total tiene cada compra?",
      level2:
        "Si llamas 's' al precio del pasaje sencillo e 'i' al del pasaje integrado, ¿cómo escribirías en lenguaje algebraico que 6 sencillos y 4 integrados suman $4,60?",
      level3:
        "Compara las dos ecuaciones: en la primera tienes 6 pasajes sencillos y en la segunda 3. ¿Por qué número podrías multiplicar la segunda para eliminar esa incógnita?",
    },
    ercaStructure: {
      experience: {
        id: "experience",
        tag: "Experiencia concreta",
        duration: "10 min",
        title: "Vivencia cotidiana en el Metro de Quito",
        body: "Pregunta detonante: ¿Cuántos han usado el pasaje integrado que combina el trolebús y el Metro? Los estudiantes comparten cuánto pagaron y cuántos boletos recibieron.",
      },
      reflection: {
        id: "reflection",
        tag: "Reflexión crítica",
        duration: "10 min",
        title: "¿Por qué no podemos adivinar al azar?",
        body: "Los estudiantes discuten por qué tanteando números con decimales se pierde tiempo y cómo la matemática formal garantiza una tarifa justa sin discrepancias.",
      },
      conceptualization: {
        id: "conceptualization",
        tag: "Conceptualización",
        duration: "15 min",
        title: "Modelado algebraico de sistemas 2×2",
        body: "Formalización de los métodos de igualación, sustitución y reducción. Identificación de la matriz de coeficientes y términos independientes.",
      },
      application: {
        id: "application",
        tag: "Aplicación y Transferencia",
        duration: "10 min",
        title: "Resolución del desafío tarifario PISA",
        body: "En parejas, resuelven el ejercicio del Metro y proyectan el costo para una salida pedagógica institucional.",
      },
    },
  },
  {
    id: "pisa-2bgu-puente",
    topic: "Trigonometría y Rigidez Triangular en Estructuras",
    context: "Ingeniería Civil · Puente del Río Chiche",
    level: "2do BGU",
    difficulty: "Intermedia",
    questions: 3,
    version: 1,
    situation:
      "Durante la inspección de la estructura metálica del nuevo puente sobre el Cañón del Río Chiche, un equipo de ingenieros analiza una de las cerchas de soporte triangulares isósceles. La base horizontal mide 12 metros de longitud y el ángulo de inclinación de cada viga diagonal respecto al suelo es de 35°. Por normativa de seguridad sísmica del Ecuador (NEC), se debe verificar la altura libre del vértice y la longitud total del acero estructural empleado por módulo.",
    questionList: [
      "1. Dibuja el esquema del triángulo isósceles y calcula la altura vertical de la cercha mediante razones trigonométricas.",
      "2. Determina la longitud exacta de cada una de las dos vigas diagonales que forman la cercha.",
      "3. Si el puente requiere una serie de 18 cerchas idénticas y el metro lineal de perfil de acero estructural cuesta $45, ¿cuál es el costo total del material?",
    ],
    rubric:
      "Estándar PISA Nivel 4: Modelado geométrico y trigonométrico en situaciones de ingeniería, aplicando funciones seno, coseno y tangente.",
    teacherSolution: {
      steps: [
        {
          stepNumber: 1,
          title: "Descomposición en triángulos rectángulos y altura",
          explanation:
            "Al trazar la altura h del triángulo isósceles, la base de 12 m se divide en dos catetos adyacentes de 6 m. Con ángulo θ = 35°: tan(35°) = h / 6 m => h = 6 * tan(35°) = 6 * 0.7002 = 4.20 metros.",
          mathResult: "Altura h = 4.20 m",
        },
        {
          stepNumber: 2,
          title: "Longitud de las vigas diagonales (hipotenusa)",
          explanation:
            "Usando la razón coseno: cos(35°) = cateto adyacente / hipotenusa => cos(35°) = 6 / L => L = 6 / cos(35°) = 6 / 0.8192 = 7.32 metros por diagonal.",
          mathResult: "Longitud por diagonal L = 7.32 m",
        },
        {
          stepNumber: 3,
          title: "Perímetro total por cercha y presupuesto para 18 módulos",
          explanation:
            "Acero por cercha = base + 2*diagonales + refuerzo vertical = 12 + 2(7.32) + 4.20 = 12 + 14.64 + 4.20 = 30.84 metros lineales. Para 18 cerchas: 18 * 30.84 = 555.12 m. Presupuesto = 555.12 * $45 = $24,980.40 USD.",
          mathResult: "Total metros = 555.12 m | Presupuesto total = $24,980.40 USD",
        },
      ],
      finalAnswer: "Altura h: 4.20 m | Longitud de cada viga diagonal: 7.32 m | Costo total de acero: $24,980.40 USD.",
      pedagogicalNotes:
        "Punto crítico de bloqueo del alumno: olvidar dividir la base entre 2 al aplicar la función tangente en el triángulo rectángulo.",
    },
    socraticHints: {
      level1:
        "Observa la cercha completa: si trazas una línea vertical desde la punta superior hasta el centro de la base, ¿en qué tipo de triángulos se divide la figura?",
      level2:
        "En uno de los triángulos rectángulos formados: ¿cuánto mide el cateto de la base y qué ángulo tienes como referencia?",
      level3:
        "Para relacionar el cateto adyacente (6m) con la altura (cateto opuesto), ¿qué razón trigonométrica (seno, coseno o tangente) conecta ambos lados?",
    },
    ercaStructure: {
      experience: {
        id: "experience",
        tag: "Experiencia concreta",
        duration: "10 min",
        title: "Observación de la estructura del Cañón del Chiche",
        body: "Visualización de fotos y planos de cerchas reales de puentes en los valles de Quito para reconocer patrones triangulares.",
      },
      reflection: {
        id: "reflection",
        tag: "Reflexión guiada",
        duration: "10 min",
        title: "¿Por qué los puentes usan triángulos y no rectángulos?",
        body: "Demostración de indeformabilidad: la estructura de 3 barras no colapsa ante cargas diagonales sin romper los perfiles.",
      },
      conceptualization: {
        id: "conceptualization",
        tag: "Conceptualización",
        duration: "15 min",
        title: "Razones trigonométricas en triángulos rectángulos",
        body: "Deducción de seno, coseno y tangente; aplicación de Teorema de Pitágoras como comprobación de consistencia.",
      },
      application: {
        id: "application",
        tag: "Aplicación y Transferencia",
        duration: "10 min",
        title: "Cálculo técnico y presupuesto de ingeniería",
        body: "Los estudiantes entregan la memoria de cálculo del acero requerido y verifican las tolerancias de seguridad sísmica.",
      },
    },
  },
  {
    id: "pisa-3bgu-galapagos",
    topic: "Modelos Exponenciales y Progresiones Geométricas",
    context: "Ecología y Biodiversidad · Islas Galápagos",
    level: "3ro BGU",
    difficulty: "Avanzada",
    questions: 3,
    version: 1,
    situation:
      "En una reserva biológica de la Isla Santa Cruz, biólogos del Parque Nacional Galápagos monitorean la recuperación de una especie endémica de pinzones tras la erradicación de depredadores invasores. La población inicial censada en el año 2020 fue de 250 individuos y se registra una tasa neta de crecimiento anual constante del 15%. Para evitar sobrepoblación en el ecosistema, se debe proyectar la cantidad de pinzones en los siguientes años.",
    questionList: [
      "1. Escribe la función exponencial P(t) que modela la población de pinzones en función de los años transcurridos 't' desde 2020.",
      "2. ¿Cuál será la población estimada para el año 2026? Redondea al número entero más cercano.",
      "3. Si la capacidad de carga máxima del microhábitat es de 1,200 aves, ¿en qué año se alcanzará este umbral crítico según el modelo?",
    ],
    rubric:
      "Estándar PISA Nivel 5: Modelado exponencial con logaritmos para determinar tiempos de saturación en contextos ecológicos reales.",
    teacherSolution: {
      steps: [
        {
          stepNumber: 1,
          title: "Formulación del modelo exponencial P(t)",
          explanation:
            "El factor de crecimiento anual es r = 1 + 0.15 = 1.15. Con población inicial P0 = 250, el modelo continuo/discreto anual es P(t) = 250 * (1.15)^t, donde t = 0 representa el año 2020.",
          mathResult: "P(t) = 250 * (1.15)^t",
        },
        {
          stepNumber: 2,
          title: "Proyección para el año 2026 (t = 6 años)",
          explanation:
            "Para 2026, t = 2026 - 2020 = 6. P(6) = 250 * (1.15)^6 = 250 * 2.31306 = 578.26 pinzones. Redondeando al entero: 578 aves.",
          mathResult: "P(6) ≈ 578 pinzones",
        },
        {
          stepNumber: 3,
          title: "Despeje con logaritmos para capacidad de carga de 1,200 aves",
          explanation:
            "Igualamos P(t) = 1200: 250 * (1.15)^t = 1200 => (1.15)^t = 1200 / 250 = 4.8. Aplicando logaritmo natural: ln(1.15^t) = ln(4.8) => t * ln(1.15) = ln(4.8) => t = ln(4.8) / ln(1.15) = 1.5686 / 0.13976 ≈ 11.22 años. Año = 2020 + 11.22 = 2031 (mediados de 2031).",
          mathResult: "t = 11.22 años => Año 2031",
        },
      ],
      finalAnswer: "Modelo: P(t) = 250·(1.15)^t | Población en 2026: 578 pinzones | Umbral de saturación: Año 2031.",
      pedagogicalNotes:
        "Frecuente error del alumno: multiplicar linealmente 250 * 0.15 * 6 en lugar de aplicar potenciación compuesta.",
    },
    socraticHints: {
      level1:
        "Si una población aumenta 15% cada año, ¿por qué factor multiplicas la población del año anterior para hallar la del siguiente? (Pista: 100% + 15% = ?)",
      level2:
        "Si cada año multiplicas por 1.15, ¿cómo se expresa multiplicar por 1.15 repetidamente durante 't' años en álgebra?",
      level3:
        "Para despejar el exponente 't' cuando tienes una ecuación de la forma a^t = b, ¿qué operación matemática traslada el exponente al suelo como multiplicador?",
    },
    ercaStructure: {
      experience: {
        id: "experience",
        tag: "Experiencia concreta",
        duration: "10 min",
        title: "Conservación en las Islas Encantadas",
        body: "Visualización de datos de campo de la Fundación Charles Darwin sobre especies amenazadas y esfuerzos de conservación.",
      },
      reflection: {
        id: "reflection",
        tag: "Reflexión guiada",
        duration: "10 min",
        title: "¿Crecimiento lineal o explosivo?",
        body: "Comparar en una tabla si nacen siempre la misma cantidad fija de aves o si al haber más parejas el incremento anual es cada vez mayor.",
      },
      conceptualization: {
        id: "conceptualization",
        tag: "Conceptualización",
        duration: "15 min",
        title: "La función exponencial y sus propiedades",
        body: "Definición de f(x) = a·b^x, asíntotas, concavidad y uso de logaritmos neperianos para resolver incógnitas exponenciales.",
      },
      application: {
        id: "application",
        tag: "Aplicación y Transferencia",
        duration: "10 min",
        title: "Informe ambiental para guardaparques",
        body: "Los estudiantes redactan la recomendación técnica para el plan de manejo de fauna silvestre en Santa Cruz.",
      },
    },
  },
];

export const SEED_AULA_ACTIVA: AulaActiva = {
  pin: "PISA26",
  ejercicioId: "pisa-2bgu-puente",
  schoolName: "Colegio Experimental San Gabriel de Quito",
  teacherName: "Lic. Carlos Mendoza",
  subject: "Matemáticas y Geometría Aplicada",
  course: "2do BGU Paralelo A",
  createdAt: "2026-10-19T08:00:00.000Z",
  active: true,
  metricas: {
    totalEstudiantes: 38,
    estudiantesActivos: 29,
    pistasSolicitadas: 46,
    ejerciciosCompletados: 23,
    pasoMasDificil: "Paso 2: Relacionar cateto adyacente (6m) con hipotenusa mediante coseno",
    tasaResolucionSinCopia: "91.3%",
    tiempoPromedioMinutos: 13.8,
    distribucionDificultad: {
      comprensionLectora: 18,
      planteamientoEcuacion: 58,
      resolucionAritmetica: 24,
    },
  },
};

// Reto de respaldo cuando no hay sesión real (modo demo u offline).
export const RETO_LOCAL_DEMO: RetoEstudiante = {
  id: "reto-local-demo",
  tema: "Conversión de unidades y movimiento uniforme",
  contexto: "Centro comunitario seguro",
  curso: "1ro BGU",
  dificultad: "Básica",
  enunciado:
    "Un equipo evalúa una estructura modular para un centro comunitario. Un vehículo transporta las piezas a velocidad constante de 60 km/h durante 45 minutos.",
  pregunta:
    "¿Qué distancia recorre el vehículo? Justifica cada conversión de unidades que utilices.",
  totalPistas: 3,
  pistasLocales: [
    "¿Qué datos numéricos te da el enunciado y en qué unidades está cada uno?",
    "La velocidad está en km/h y el tiempo en minutos. ¿Qué fracción de una hora representan 45 minutos?",
    "¿Qué relación conecta distancia, velocidad y tiempo cuando la velocidad es constante?",
  ],
};

// Simulador de admisión local: respuestas verificadas a mano (índice de la opción correcta)
export const PREGUNTAS_SIMULADOR: PreguntaSimulador[] = [
  { id: "sim-01", area: "Geometría", enunciado: "Una escalera de 5 m se apoya contra una pared y su base está a 3 m de ella. ¿Qué expresión da la altura que alcanza?", opciones: ["5² + 3²", "√(5² − 3²)", "5 × 3 ÷ 2", "(5 + 3)²"], correcta: 1 },
  { id: "sim-02", area: "Álgebra", enunciado: "Si 3x + 7 = 25, ¿cuál es el valor de x?", opciones: ["6", "8", "10,7", "4"], correcta: 0 },
  { id: "sim-03", area: "Porcentajes", enunciado: "Un precio sube 20 % y luego baja 20 %. Comparado con el precio inicial, el precio final es:", opciones: ["Igual", "4 % menor", "4 % mayor", "20 % menor"], correcta: 1 },
  { id: "sim-04", area: "Estadística", enunciado: "El promedio de 7, 9, 10 y x es 9. ¿Cuánto vale x?", opciones: ["8", "9", "10", "11"], correcta: 2 },
  { id: "sim-05", area: "Razonamiento numérico", enunciado: "Un tren recorre 150 km en 2 horas y 30 minutos. ¿Cuál es su velocidad media?", opciones: ["50 km/h", "60 km/h", "65 km/h", "75 km/h"], correcta: 1 },
  { id: "sim-06", area: "Probabilidad", enunciado: "Se lanzan dos dados. ¿Cuál es la probabilidad de que la suma sea 7?", opciones: ["1/12", "1/9", "1/6", "7/36"], correcta: 2 },
  { id: "sim-07", area: "Potencias", enunciado: "¿Cuál es el valor de 2⁵ · 2³ ÷ 2⁶?", opciones: ["2", "4", "8", "16"], correcta: 1 },
  { id: "sim-08", area: "Geometría", enunciado: "¿Cuál es el área de un círculo de 10 cm de diámetro?", opciones: ["10π cm²", "25π cm²", "50π cm²", "100π cm²"], correcta: 1 },
  { id: "sim-09", area: "Proporcionalidad", enunciado: "Cinco obreros terminan una obra en 12 días. Al mismo ritmo, ¿en cuántos días la terminan seis obreros?", opciones: ["10", "14,4", "8", "11"], correcta: 0 },
  { id: "sim-10", area: "Funciones", enunciado: "¿Cuál es la pendiente de la recta que pasa por (1, 2) y (4, 11)?", opciones: ["2", "3", "9", "1/3"], correcta: 1 },
  { id: "sim-11", area: "Porcentajes", enunciado: "Un artículo de $80 tiene 15 % de descuento. ¿Cuánto se paga?", opciones: ["$65", "$68", "$72", "$75"], correcta: 1 },
  { id: "sim-12", area: "Sucesiones", enunciado: "En la sucesión 3, 7, 15, 31, … ¿cuál es el siguiente término?", opciones: ["47", "55", "63", "64"], correcta: 2 },
];
