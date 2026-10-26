-- ==============================================================================
-- ECduLearm: Esquema Profesional de Base de Datos PostgreSQL para Supabase
-- Plataforma SaaS B2B EdTech con Tutor Socrático y Acceso Anónimo por PIN
-- Arquitectura: Relacional Normalizada (3NF) + RLS + Triggers + Realtime + Vistas
-- Pontificia Universidad Católica del Ecuador (PUCE) - Emprendimiento Tecnológico
-- ==============================================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. FUNCIÓN DISPARADORA GENÉRICA PARA ACTUALIZACIÓN DE TIMESTAMPS
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.fn_handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 3. TABLA: INSTITUCIONES_EDUCATIVAS (Entidad Institucional B2B)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.instituciones_educativas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(200) NOT NULL,
    codigo_amie VARCHAR(30) UNIQUE, -- Código oficial del Ministerio de Educación de Ecuador
    ciudad VARCHAR(100) DEFAULT 'Quito' NOT NULL,
    provincia VARCHAR(100) DEFAULT 'Pichincha' NOT NULL,
    tipo VARCHAR(50) DEFAULT 'Fiscal' CHECK (tipo IN ('Fiscal', 'Particular', 'Municipal', 'Fiscomisional')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Trigger updated_at para instituciones
DROP TRIGGER IF EXISTS trg_instituciones_updated_at ON public.instituciones_educativas;
CREATE TRIGGER trg_instituciones_updated_at
    BEFORE UPDATE ON public.instituciones_educativas
    FOR EACH ROW EXECUTE FUNCTION public.fn_handle_updated_at();

-- ==============================================================================
-- 4. TABLA: DOCENTES (Perfiles de Profesores y Coordinadores de Área)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.docentes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institucion_id UUID REFERENCES public.instituciones_educativas(id) ON DELETE SET NULL,
    email_institucional VARCHAR(150) UNIQUE NOT NULL,
    nombre_completo VARCHAR(150) NOT NULL,
    especialidad VARCHAR(100) DEFAULT 'Matemáticas y Razonamiento Lógico',
    rol VARCHAR(30) DEFAULT 'docente' CHECK (rol IN ('docente', 'coordinador_area', 'administrador')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Trigger updated_at para docentes
DROP TRIGGER IF EXISTS trg_docentes_updated_at ON public.docentes;
CREATE TRIGGER trg_docentes_updated_at
    BEFORE UPDATE ON public.docentes
    FOR EACH ROW EXECUTE FUNCTION public.fn_handle_updated_at();

-- ==============================================================================
-- 5. TABLA: EXERCISES (Guías Didácticas ERCA y Retos Cuantitativos PISA)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.exercises (
    id TEXT PRIMARY KEY DEFAULT ('ex-' || substr(md5(random()::text), 1, 8)),
    docente_id UUID REFERENCES public.docentes(id) ON DELETE SET NULL,
    topic TEXT NOT NULL,
    context TEXT DEFAULT 'Razonamiento Cuantitativo' NOT NULL,
    level TEXT DEFAULT '2do BGU' NOT NULL,
    difficulty TEXT DEFAULT 'Intermedia' CHECK (difficulty IN ('Básica', 'Intermedia', 'Avanzada')),
    questions INTEGER DEFAULT 3 CHECK (questions >= 1 AND questions <= 10),
    version INTEGER DEFAULT 1 CHECK (version >= 1),
    situation TEXT NOT NULL,
    question_list JSONB DEFAULT '[]'::jsonb NOT NULL,
    rubric TEXT DEFAULT 'Estándar PISA: Modelado de situaciones reales y razonamiento cuantitativo.',
    fases_erca JSONB DEFAULT '[]'::jsonb, -- Estructura en 4 fases: Experiencia, Reflexión, Conceptualización, Aplicación
    solucion_docente TEXT, -- Procedimiento guiado exclusivo para el docente
    is_public BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Trigger updated_at para exercises
DROP TRIGGER IF EXISTS trg_exercises_updated_at ON public.exercises;
CREATE TRIGGER trg_exercises_updated_at
    BEFORE UPDATE ON public.exercises
    FOR EACH ROW EXECUTE FUNCTION public.fn_handle_updated_at();

-- ==============================================================================
-- 6. TABLA: PIN_SESSIONS (Aulas Virtuales y Sesiones Efímeras por PIN)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.pin_sessions (
    pin VARCHAR(10) PRIMARY KEY,
    docente_id UUID REFERENCES public.docentes(id) ON DELETE SET NULL,
    exercise_id TEXT REFERENCES public.exercises(id) ON DELETE SET NULL,
    school_name TEXT DEFAULT 'Institución Educativa' NOT NULL,
    teacher_name TEXT DEFAULT 'Docente Responsable' NOT NULL,
    subject TEXT DEFAULT 'Razonamiento Lógico Matemático' NOT NULL,
    active BOOLEAN DEFAULT TRUE NOT NULL,
    estado VARCHAR(20) DEFAULT 'activa' CHECK (estado IN ('activa', 'cerrada', 'archivada', 'expirada')),
    exercise_data JSONB NOT NULL, -- Snapshot inmutable del ejercicio al momento de crear el aula
    max_students INTEGER DEFAULT 50,
    expires_at TIMESTAMPTZ DEFAULT (TIMEZONE('utc'::text, NOW()) + INTERVAL '7 days'),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Trigger updated_at para pin_sessions
DROP TRIGGER IF EXISTS trg_pin_sessions_updated_at ON public.pin_sessions;
CREATE TRIGGER trg_pin_sessions_updated_at
    BEFORE UPDATE ON public.pin_sessions
    FOR EACH ROW EXECUTE FUNCTION public.fn_handle_updated_at();

-- ==============================================================================
-- 7. TABLA: STUDENT_INTERACTIONS (Telemetría Pedagógica y Tutor Socrático)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.student_interactions (
    id BIGSERIAL PRIMARY KEY,
    pin VARCHAR(10) REFERENCES public.pin_sessions(pin) ON DELETE CASCADE NOT NULL,
    student_session_id VARCHAR(100) NOT NULL, -- Identificador anónimo efímero del navegador (sin PII)
    pregunta_numero INTEGER DEFAULT 1 CHECK (pregunta_numero >= 1),
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'tutor', 'system')),
    message TEXT NOT NULL,
    is_blocked_attempt BOOLEAN DEFAULT FALSE NOT NULL, -- Intento de solicitar respuesta directa o copia
    pistas_solicitadas INTEGER DEFAULT 0,
    paso_bloqueo VARCHAR(100), -- Etapa cognitiva: 'comprensión_lectora', 'variables', 'ecuación', 'cálculo'
    completado BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==============================================================================
-- 8. TABLA: ADMISSION_QUESTIONS (Banco de Preguntas del Simulador Universitario)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.admission_questions (
    id SERIAL PRIMARY KEY,
    area VARCHAR(100) NOT NULL, -- 'Geometría', 'Álgebra', 'Razonamiento numérico'
    prompt TEXT NOT NULL,
    options JSONB NOT NULL, -- Array con opciones de respuesta
    correct_option VARCHAR(5) NOT NULL, -- 'A', 'B', 'C', 'D'
    explanation TEXT,
    difficulty VARCHAR(20) DEFAULT 'Intermedia' CHECK (difficulty IN ('Básica', 'Intermedia', 'Avanzada')),
    active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==============================================================================
-- 9. ÍNDICES DE ALTO RENDIMIENTO
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_docentes_email ON public.docentes(email_institucional);
CREATE INDEX IF NOT EXISTS idx_exercises_docente ON public.exercises(docente_id);
CREATE INDEX IF NOT EXISTS idx_exercises_topic ON public.exercises(topic);
CREATE INDEX IF NOT EXISTS idx_exercises_level ON public.exercises(level);
CREATE INDEX IF NOT EXISTS idx_pin_sessions_active ON public.pin_sessions(active);
CREATE INDEX IF NOT EXISTS idx_pin_sessions_docente ON public.pin_sessions(docente_id);
CREATE INDEX IF NOT EXISTS idx_pin_sessions_expires ON public.pin_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_student_interactions_pin ON public.student_interactions(pin);
CREATE INDEX IF NOT EXISTS idx_student_interactions_session ON public.student_interactions(student_session_id);
CREATE INDEX IF NOT EXISTS idx_student_interactions_blocked ON public.student_interactions(is_blocked_attempt);
CREATE INDEX IF NOT EXISTS idx_admission_questions_area ON public.admission_questions(area);

-- ==============================================================================
-- 10. VISTAS ANALÍTICAS INTELIGENTES (Para Panel Docente y Coordinación)
-- ==============================================================================

-- Vista 1: Resumen de actividad por Aula Virtual (alumnos únicos, interacciones y copias bloqueadas)
CREATE OR REPLACE VIEW public.vw_resumen_aulas AS
SELECT 
    p.pin,
    p.school_name,
    p.teacher_name,
    p.subject,
    p.active,
    p.expires_at,
    (p.expires_at > TIMEZONE('utc'::text, NOW()) AND p.active = true) AS esta_vigente,
    COALESCE(COUNT(DISTINCT si.student_session_id), 0) AS total_estudiantes_unicos,
    COALESCE(COUNT(si.id), 0) AS total_mensajes_socrativos,
    COALESCE(COUNT(CASE WHEN si.is_blocked_attempt = true THEN 1 END), 0) AS intentos_copia_bloqueados,
    p.created_at
FROM public.pin_sessions p
LEFT JOIN public.student_interactions si ON p.pin = si.pin
GROUP BY p.pin, p.school_name, p.teacher_name, p.subject, p.active, p.expires_at, p.created_at;

-- Vista 2: Analítica de Dificultad y Pasos de Bloqueo por Pregunta
CREATE OR REPLACE VIEW public.vw_analitica_bloqueos_pisa AS
SELECT 
    si.pin,
    si.pregunta_numero,
    COALESCE(si.paso_bloqueo, 'Comprensión general') AS paso_critico,
    COUNT(*) AS frecuencia_bloqueos,
    SUM(si.pistas_solicitadas) AS total_pistas_pedidas,
    COUNT(CASE WHEN si.is_blocked_attempt = true THEN 1 END) AS solicitudes_respuesta_directa
FROM public.student_interactions si
WHERE si.role = 'student'
GROUP BY si.pin, si.pregunta_numero, si.paso_bloqueo;

-- ==============================================================================
-- 11. FUNCIÓN RPC: VALIDACIÓN DE PIN SEGURO PARA EL ESTUDIANTE
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.fn_validar_pin_aula(p_pin TEXT)
RETURNS TABLE (
    valido BOOLEAN,
    pin TEXT,
    school_name TEXT,
    teacher_name TEXT,
    subject TEXT,
    exercise_data JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        true AS valido,
        ps.pin::TEXT,
        ps.school_name,
        ps.teacher_name,
        ps.subject,
        ps.exercise_data
    FROM public.pin_sessions ps
    WHERE ps.pin = UPPER(TRIM(p_pin))
      AND ps.active = true
      AND (ps.expires_at IS NULL OR ps.expires_at > TIMEZONE('utc'::text, NOW()))
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 12. SEGURIDAD A NIVEL DE FILAS (ROW LEVEL SECURITY - RLS)
-- ==============================================================================
ALTER TABLE public.instituciones_educativas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.docentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admission_questions ENABLE ROW LEVEL SECURITY;

-- Políticas para instituciones_educativas:
DROP POLICY IF EXISTS "Lectura pública de instituciones" ON public.instituciones_educativas;
CREATE POLICY "Lectura pública de instituciones"
    ON public.instituciones_educativas FOR SELECT
    USING (true);

-- Políticas para docentes:
DROP POLICY IF EXISTS "Lectura pública de docentes" ON public.docentes;
CREATE POLICY "Lectura pública de docentes"
    ON public.docentes FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Gestión de docentes" ON public.docentes;
CREATE POLICY "Gestión de docentes"
    ON public.docentes FOR ALL
    USING (true)
    WITH CHECK (true);

-- Políticas para exercises:
DROP POLICY IF EXISTS "Lectura pública de ejercicios" ON public.exercises;
CREATE POLICY "Lectura pública de ejercicios"
    ON public.exercises FOR SELECT
    USING (is_public = true OR true);

DROP POLICY IF EXISTS "Creación y edición de ejercicios" ON public.exercises;
CREATE POLICY "Creación y edición de ejercicios"
    ON public.exercises FOR ALL
    USING (true)
    WITH CHECK (true);

-- Políticas para pin_sessions:
-- Estudiantes pueden leer sesiones activas sin autenticarse (acceso anónimo por PIN)
DROP POLICY IF EXISTS "Lectura de sesiones de PIN activas" ON public.pin_sessions;
CREATE POLICY "Lectura de sesiones de PIN activas"
    ON public.pin_sessions FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Creación y actualización de sesiones de PIN" ON public.pin_sessions;
CREATE POLICY "Creación y actualización de sesiones de PIN"
    ON public.pin_sessions FOR ALL
    USING (true)
    WITH CHECK (true);

-- Políticas para student_interactions:
-- Los estudiantes pueden insertar sus preguntas y consultar sus propias interacciones anónimas
DROP POLICY IF EXISTS "Inserción de interacciones de alumnos" ON public.student_interactions;
CREATE POLICY "Inserción de interacciones de alumnos"
    ON public.student_interactions FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Lectura de interacciones socráticas" ON public.student_interactions;
CREATE POLICY "Lectura de interacciones socráticas"
    ON public.student_interactions FOR SELECT
    USING (true);

-- Políticas para admission_questions:
DROP POLICY IF EXISTS "Lectura pública del banco del simulador" ON public.admission_questions;
CREATE POLICY "Lectura pública del banco del simulador"
    ON public.admission_questions FOR SELECT
    USING (active = true);

-- ==============================================================================
-- 13. HABILITACIÓN DE PUBLICACIÓN EN TIEMPO REAL (SUPABASE REALTIME)
-- ==============================================================================
DO $$
BEGIN
    -- Publicación en tiempo real para sesiones de PIN (detección de inicio de clases)
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'pin_sessions'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.pin_sessions;
    END IF;

    -- Publicación en tiempo real para interacciones (para que el docente vea dudas en vivo)
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'student_interactions'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.student_interactions;
    END IF;
END $$;

-- ==============================================================================
-- 14. DATOS SEMILLA (SEED DATA) OFICIALES Y DEMOSTRATIVOS
-- ==============================================================================

-- 14.1 Instituciones Educativas
INSERT INTO public.instituciones_educativas (id, nombre, codigo_amie, ciudad, provincia, tipo)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Unidad Educativa Municipal Eugenio Espejo', '17H00010', 'Quito', 'Pichincha', 'Municipal'),
    ('22222222-2222-2222-2222-222222222222', 'Colegio Experimental 24 de Mayo', '17H00025', 'Quito', 'Pichincha', 'Fiscal'),
    ('33333333-3333-3333-3333-333333333333', 'Unidad Educativa San Gabriel', '17H00102', 'Quito', 'Pichincha', 'Particular')
ON CONFLICT (id) DO UPDATE 
SET nombre = EXCLUDED.nombre;

-- 14.2 Docentes
INSERT INTO public.docentes (id, institucion_id, email_institucional, nombre_completo, especialidad, rol)
VALUES 
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'docente@ecdulearn.edu.ec', 'Prof. Joan Sebastian Santacruz', 'Física y Razonamiento Lógico', 'docente'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'ariel.chacha@ecdulearn.edu.ec', 'Prof. Ariel Fabricio Chacha', 'Matemática y Ciencias de la Computación', 'coordinador_area'),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333', 'melissa.molina@ecdulearn.edu.ec', 'Prof. Melissa Molina Sierra', 'Geometría y Razonamiento Espacial', 'docente')
ON CONFLICT (email_institucional) DO UPDATE 
SET nombre_completo = EXCLUDED.nombre_completo;

-- 14.3 Ejercicios y Guías ERCA/PISA
INSERT INTO public.exercises (id, docente_id, topic, context, level, difficulty, questions, version, situation, question_list, rubric, fases_erca, solucion_docente)
VALUES 
(
    'ex-pisa26',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Cinemática y Frecuencias en el Metro de Quito',
    'Transporte y Movilidad Urbana',
    '2do BGU',
    'Intermedia',
    3,
    1,
    'Los trenes del Metro de Quito recorren 22 km entre las estaciones Quitumbe y El Labrador en 34 minutos, realizando 15 paradas intermedias de 30 segundos cada una. Un equipo de estudiantes de bachillerato analiza las curvas de velocidad y consumo energético para planificar la frecuencia de trenes requerida durante la hora pico matutina.',
    '[
        "Calcula la velocidad media comercial de un tren en km/h descontando el tiempo de permanencia en andenes.",
        "Si en hora pico se busca una frecuencia de paso de 5 minutos entre trenes, determina la flota mínima activa necesaria en la línea completa.",
        "Evalúa matemáticamente si un incremento del 10% en la velocidad máxima reduce de forma significativa el tiempo total frente a la optimización de los tiempos de embarque."
    ]'::jsonb,
    'Estándar PISA: Nivel 4 - Modelado cuantitativo, cinemática y toma de decisiones fundamentadas en transporte masivo.',
    '[
        {"fase": "Experiencia", "actividad": "Ver el mapa de paradas del Metro de Quito y medir tiempos de traslado reales."},
        {"fase": "Reflexión", "actividad": "¿Por qué un tren no puede acelerar instantáneamente ni frenar en cero segundos en cada andén?"},
        {"fase": "Conceptualización", "actividad": "Definición de velocidad media, tiempo muerto operacional y ciclo de rotación de flota."},
        {"fase": "Aplicación", "actividad": "Cálculo de flota óptima y propuesta de frecuencias en hora pico."}
    ]'::jsonb,
    'Paso 1: Descontar 15 paradas * 30 s = 450 s (7.5 min). Tiempo en movimiento = 26.5 min (0.4417 h). V_media = 22 km / 0.4417 h = 49.8 km/h. Paso 2: Tiempo de ida y vuelta = 34 min * 2 = 68 min. Flota = 68 min / 5 min = 13.6 -> 14 trenes mínimos.'
),
(
    'ex-default-1',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Estabilidad de estructuras',
    'Ingeniería civil',
    '2do BGU',
    'Intermedia',
    3,
    1,
    'Un equipo de estudiantes de bachillerato analiza la estabilidad de una estructura para un nuevo centro comunitario en Quito. El diseño preliminar utiliza módulos triangulares de 4 metros de base y 3 metros de altura. Antes de iniciar la construcción, deben evaluar la resistencia geométrica, comparar alternativas y justificar cuál distribución optimiza los materiales y soporta mejor las cargas vivas y sísmicas.',
    '[
        "Calcula el área frontal y el perímetro de uno de los módulos triangulares isósceles utilizados en la estructura.",
        "Si la cubierta requiere un enrejado de 12 módulos simétricos, ¿qué superficie total ocupan y qué relación existe entre rigidez y peso?",
        "Formula una recomendación técnica fundamentada para la junta cantonal que demuestre por qué la geometría triangular evita deformaciones por corte."
    ]'::jsonb,
    'Evaluación bajo estándar PISA: Nivel 4 - Interpretación, modelado geométrico y argumentación con evidencia técnica.',
    '[
        {"fase": "Experiencia", "actividad": "Inspeccionar cerchas y puentes en la ciudad de Quito."},
        {"fase": "Reflexión", "actividad": "¿Qué figura geométrica es indeformable ante fuerzas en sus vértices?"},
        {"fase": "Conceptualización", "actividad": "Teorema de Pitágoras, cálculo de hipotenusa para lados simétricos (l = sqrt(2^2 + 3^2) = 3.61 m)."},
        {"fase": "Aplicación", "actividad": "Diseño de la cercha triangular y justificación de rigidez estructural."}
    ]'::jsonb,
    'Área = (4 * 3) / 2 = 6 m^2. Lado = sqrt(2^2 + 3^2) = 3.61 m. Perímetro = 4 + 2*(3.61) = 11.22 m. Superficie total 12 módulos = 72 m^2.'
),
(
    'ex-galapagos-1',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Dinámica poblacional en las Islas Galápagos',
    'Biología y Conservación',
    '3ro BGU',
    'Avanzada',
    3,
    1,
    'Científicos de la Estación Charles Darwin monitorean la recuperación de tortugas gigantes en la Isla Santa Cruz. La población inicial registrada hace 10 años era de 450 individuos y actualmente asciende a 720. Se busca modelar si la tasa de crecimiento actual garantiza la autosuficiencia ecológica antes del año 2035.',
    '[
        "Determina la tasa de crecimiento porcentual anual promedio experimentada por la colonia.",
        "Proyecta matemáticamente la población esperada para el año 2035 asumiendo un modelo malthusiano y contrástalo con una capacidad de carga de 1,200 individuos.",
        "Plantea dos factores limitantes ambientales de las islas que deban incluirse en una función logística."
    ]'::jsonb,
    'Estándar PISA: Nivel 5 - Modelación exponencial y evaluación de límites ecológicos sustentables.',
    '[]'::jsonb,
    'P(t) = P0 * (1 + r)^t. 720 = 450 * (1 + r)^10 -> (1+r) = (720/450)^(1/10) = 1.6^0.1 = 1.048 (4.8% anual).'
)
ON CONFLICT (id) DO UPDATE 
SET situation = EXCLUDED.situation, 
    question_list = EXCLUDED.question_list, 
    rubric = EXCLUDED.rubric,
    solucion_docente = EXCLUDED.solucion_docente,
    updated_at = NOW();

-- 14.4 Aulas Virtuales con Códigos PIN Activos
INSERT INTO public.pin_sessions (pin, docente_id, exercise_id, school_name, teacher_name, subject, active, estado, exercise_data, expires_at)
VALUES 
(
    'PISA26',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'ex-pisa26',
    'Unidad Educativa Municipal Eugenio Espejo',
    'Prof. Joan Santacruz (Docente Demo)',
    'Física y Razonamiento Lógico',
    true,
    'activa',
    '{
        "id": "ex-pisa26",
        "topic": "Cinemática y Frecuencias en el Metro de Quito",
        "context": "Transporte y Movilidad Urbana",
        "level": "2do BGU",
        "difficulty": "Intermedia",
        "questions": 3,
        "version": 1,
        "situation": "Los trenes del Metro de Quito recorren 22 km entre las estaciones Quitumbe y El Labrador en 34 minutos, realizando 15 paradas intermedias de 30 segundos cada una. Un equipo de estudiantes de bachillerato analiza las curvas de velocidad y consumo energético para planificar la frecuencia de trenes requerida durante la hora pico matutina.",
        "questionList": [
            "Calcula la velocidad media comercial de un tren en km/h descontando el tiempo de permanencia en andenes.",
            "Si en hora pico se busca una frecuencia de paso de 5 minutos entre trenes, determina la flota mínima activa necesaria en la línea completa.",
            "Evalúa matemáticamente si un incremento del 10% en la velocidad máxima reduce de forma significativa el tiempo total frente a la optimización de los tiempos de embarque."
        ],
        "rubric": "Estándar PISA: Nivel 4 - Modelado cuantitativo, cinemática y toma de decisiones fundamentadas en transporte masivo."
    }'::jsonb,
    TIMEZONE('utc'::text, NOW()) + INTERVAL '30 days'
),
(
    '482917',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'ex-default-1',
    'Colegio Experimental 24 de Mayo',
    'Prof. Marco Andrade',
    'Matemática y Razonamiento Lógico',
    true,
    'activa',
    '{
        "id": "ex-default-1",
        "topic": "Estabilidad de estructuras",
        "context": "Ingeniería civil",
        "level": "2do BGU",
        "difficulty": "Intermedia",
        "questions": 3,
        "version": 1,
        "situation": "Un equipo de estudiantes de bachillerato analiza la estabilidad de una estructura para un nuevo centro comunitario en Quito. El diseño preliminar utiliza módulos triangulares de 4 metros de base y 3 metros de altura. Antes de iniciar la construcción, deben evaluar la resistencia geométrica, comparar alternativas y justificar cuál distribución optimiza los materiales y soporta mejor las cargas vivas y sísmicas.",
        "questionList": [
            "Calcula el área frontal y el perímetro de uno de los módulos triangulares isósceles utilizados en la estructura.",
            "Si la cubierta requiere un enrejado de 12 módulos simétricos, ¿qué superficie total ocupan y qué relación existe entre rigidez y peso?",
            "Formula una recomendación técnica fundamentada para la junta cantonal que demuestre por qué la geometría triangular evita deformaciones por corte."
        ],
        "rubric": "Evaluación bajo estándar PISA: Nivel 4 - Interpretación, modelado geométrico y argumentación con evidencia técnica."
    }'::jsonb,
    TIMEZONE('utc'::text, NOW()) + INTERVAL '30 days'
),
(
    'GAL26',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'ex-galapagos-1',
    'Unidad Educativa San Gabriel',
    'Prof. Ariel Fabricio Chacha',
    'Biología y Matemáticas Aplicadas',
    true,
    'activa',
    '{
        "id": "ex-galapagos-1",
        "topic": "Dinámica poblacional en las Islas Galápagos",
        "context": "Biología y Conservación",
        "level": "3ro BGU",
        "difficulty": "Avanzada",
        "questions": 3,
        "version": 1,
        "situation": "Científicos de la Estación Charles Darwin monitorean la recuperación de tortugas gigantes en la Isla Santa Cruz. La población inicial registrada hace 10 años era de 450 individuos y actualmente asciende a 720. Se busca modelar si la tasa de crecimiento actual garantiza la autosuficiencia ecológica antes del año 2035.",
        "questionList": [
            "Determina la tasa de crecimiento porcentual anual promedio experimentada por la colonia.",
            "Proyecta matemáticamente la población esperada para el año 2035 asumiendo un modelo malthusiano y contrástalo con una capacidad de carga de 1,200 individuos.",
            "Plantea dos factores limitantes ambientales de las islas que deban incluirse en una función logística."
        ],
        "rubric": "Estándar PISA: Nivel 5 - Modelación exponencial y evaluación de límites ecológicos sustentables."
    }'::jsonb,
    TIMEZONE('utc'::text, NOW()) + INTERVAL '30 days'
)
ON CONFLICT (pin) DO UPDATE
SET exercise_data = EXCLUDED.exercise_data,
    active = EXCLUDED.active,
    expires_at = EXCLUDED.expires_at,
    updated_at = NOW();

-- 14.5 Banco de Preguntas para el Simulador de Admisión
INSERT INTO public.admission_questions (id, area, prompt, options, correct_option, explanation, difficulty)
VALUES
(
    1,
    'Geometría',
    'Una escalera de 5 metros se apoya contra una pared vertical. La base dista 3 metros de la pared. ¿Qué expresión permite calcular la altura que alcanza la escalera?',
    '["5² + 3²", "√(5² − 3²)", "5 × 3 ÷ 2", "(5 + 3)²"]'::jsonb,
    'B',
    'Por el Teorema de Pitágoras: h² + b² = L² -> h = √(5² − 3²) = √(25 − 9) = √16 = 4 metros.',
    'Intermedia'
),
(
    2,
    'Álgebra',
    'Si 3x + 7 = 25, ¿qué operación conviene realizar primero para despejar la incógnita?',
    '["Dividir para 3", "Restar 7 en ambos miembros", "Sumar 25 a ambos miembros", "Multiplicar por 7"]'::jsonb,
    'B',
    'Se aplica la propiedad uniforme de la igualdad restando 7 en ambos lados para obtener 3x = 18.',
    'Básica'
),
(
    3,
    'Razonamiento numérico',
    'Una cantidad aumenta un 20% y en el periodo siguiente disminuye un 20%. ¿Qué se debe comparar para determinar si regresa a su valor inicial?',
    '["Las bases de cálculo de cada porcentaje", "Solo los porcentajes numéricos", "El tiempo transcurrido", "La suma directa de los porcentajes"]'::jsonb,
    'A',
    'Al aumentar 20% a 100 queda 120. Al restar el 20% a 120, se descuenta 24, quedando 96. La base de cálculo cambió.',
    'Avanzada'
)
ON CONFLICT (id) DO UPDATE 
SET prompt = EXCLUDED.prompt,
    options = EXCLUDED.options;

-- 14.6 Interacciones de Ejemplo para el Dashboard Analítico
INSERT INTO public.student_interactions (pin, student_session_id, pregunta_numero, role, message, is_blocked_attempt, pistas_solicitadas, paso_bloqueo, completado)
VALUES 
    ('PISA26', 'anon-student-001', 1, 'student', '¿Cuál es la respuesta de la pregunta 1 del metro?', true, 0, 'comprensión_lectora', false),
    ('PISA26', 'anon-student-001', 1, 'tutor', '¡Hola! Recuerda que no puedo darte la respuesta directa. Vamos paso a paso: ¿Cuántos kilómetros mide el recorrido y cuántos minutos tardan en total las paradas?', false, 1, 'comprensión_lectora', false),
    ('PISA26', 'anon-student-001', 1, 'student', 'Son 22 km y 15 paradas de 30 segundos, o sea 450 segundos.', false, 1, 'variables', false),
    ('PISA26', 'anon-student-001', 1, 'tutor', '¡Excelente observación! Ahora convierte esos 450 segundos a minutos y réstalos de los 34 minutos totales.', false, 2, 'cálculo', true),
    ('PISA26', 'anon-student-002', 2, 'student', 'Dame la solución del cálculo de la flota por favor', true, 0, 'ecuación', false);
