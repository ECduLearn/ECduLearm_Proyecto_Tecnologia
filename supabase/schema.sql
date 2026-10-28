-- ==============================================================================
-- ECduLearn · Esquema relacional v2.0.0 (PostgreSQL 15+ / Supabase)
-- Versión auditada de supabase/schema.sql v1 · Cambio MAJOR (tablas renombradas)
--
-- PARTE A (secciones 1-9): PostgreSQL estándar. Se puede migrar a otro PostgreSQL
--                         (p. ej. un VPS en Hostinger) sin cambios.
-- PARTE B (secciones 10-14): solo para Supabase (auth.uid(), roles anon/authenticated,
--                          RLS, Realtime). Si migras fuera de Supabase, quítala.
--
-- Coexiste con las tablas v1 (pin_sessions, exercises, student_interactions):
-- los nombres no chocan, así que el frontend actual sigue funcionando mientras migran.
-- ==============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ==============================================================================
-- PARTE A · 1. FUNCIONES UTILITARIAS
-- ==============================================================================

-- now() en TIMESTAMPTZ guarda el instante absoluto (no usar TIMEZONE('utc', NOW())).
CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

-- Supuesto de negocio: 45 min (2700 s) para adaptar a mano un ejercicio PISA.
-- Viene de las entrevistas de campo (4 a 10 h semanales). Se define una sola vez aquí.
CREATE OR REPLACE FUNCTION public.fn_baseline_segundos_manual()
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$ SELECT 2700 $$;

-- ==============================================================================
-- PARTE A · 2. CATÁLOGOS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.asignaturas (
    id      SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre  VARCHAR(80) NOT NULL,
    CONSTRAINT uq_asignaturas_nombre UNIQUE (nombre)
);

-- ==============================================================================
-- PARTE A · 3. TENANT B2B Y USUARIOS ADULTOS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.instituciones (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre              VARCHAR(200) NOT NULL,
    codigo_amie         VARCHAR(12),
    tipo_institucion    VARCHAR(20)  NOT NULL DEFAULT 'PARTICULAR',
    plan_suscripcion    VARCHAR(20)  NOT NULL DEFAULT 'PILOTO',
    pin_grado_autonomo  VARCHAR(6),
    limite_docentes     SMALLINT     NOT NULL DEFAULT 10,
    ciudad              VARCHAR(100) NOT NULL DEFAULT 'Quito',
    provincia           VARCHAR(100) NOT NULL DEFAULT 'Pichincha',
    activa              BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_instituciones_amie       UNIQUE (codigo_amie),
    CONSTRAINT uq_instituciones_pin_grado  UNIQUE (pin_grado_autonomo),
    -- FISCOMISIONAL incluye a la red Fe y Alegría
    CONSTRAINT ck_instituciones_tipo   CHECK (tipo_institucion IN ('PARTICULAR', 'FISCOMISIONAL', 'FISCAL', 'MUNICIPAL')),
    CONSTRAINT ck_instituciones_plan   CHECK (plan_suscripcion IN ('ACTIVA', 'PILOTO', 'CONVENIO', 'SUSPENDIDA')),
    CONSTRAINT ck_instituciones_pin    CHECK (pin_grado_autonomo IS NULL OR pin_grado_autonomo ~ '^[A-Z0-9]{6}$'),
    CONSTRAINT ck_instituciones_limite CHECK (limite_docentes BETWEEN 1 AND 500)
);

-- Aquí nunca se guardan estudiantes.
CREATE TABLE IF NOT EXISTS public.usuarios_institucionales (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institucion_id           UUID         NOT NULL,
    auth_user_id             UUID,                 -- vínculo con auth.users (Supabase Auth)
    nombre_completo          VARCHAR(150) NOT NULL,
    email_institucional      VARCHAR(254) NOT NULL,
    password_hash            VARCHAR(255),         -- NULL con Supabase Auth; bcrypt/argon2 en backend propio
    rol                      VARCHAR(20)  NOT NULL DEFAULT 'DOCENTE',
    asignatura_principal_id  SMALLINT,
    activo                   BOOLEAN      NOT NULL DEFAULT TRUE,
    ultimo_acceso_en         TIMESTAMPTZ,
    created_at               TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at               TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT fk_usuarios_institucion FOREIGN KEY (institucion_id)
        REFERENCES public.instituciones (id) ON DELETE RESTRICT,
    CONSTRAINT fk_usuarios_asignatura FOREIGN KEY (asignatura_principal_id)
        REFERENCES public.asignaturas (id) ON DELETE SET NULL,
    CONSTRAINT uq_usuarios_email  UNIQUE (email_institucional),
    CONSTRAINT uq_usuarios_auth   UNIQUE (auth_user_id),
    CONSTRAINT ck_usuarios_rol    CHECK (rol IN ('DOCENTE', 'COORDINADOR_RECTOR', 'ADMIN')),
    CONSTRAINT ck_usuarios_email  CHECK (email_institucional ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
    -- Al forzar minúsculas, el UNIQUE ya no distingue mayúsculas (y funciona igual en MySQL)
    CONSTRAINT ck_usuarios_email_minusculas CHECK (email_institucional = lower(email_institucional)),
    -- Impide guardar contraseñas en texto plano
    CONSTRAINT ck_usuarios_password_hash CHECK (password_hash IS NULL OR password_hash ~ '^\$(2[aby]\$|argon2)')
);

-- ==============================================================================
-- PARTE A · 4. CONTENIDO PEDAGÓGICO (PISA + ERCA)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.ejercicios_pisa (
    id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    docente_creador_id            UUID,            -- NULL = banco base de ECduLearn
    ejercicio_padre_id            UUID,            -- agrupa Versión A/B/C e iteraciones
    etiqueta_version              VARCHAR(20)  NOT NULL DEFAULT 'Original',
    curso_bgu                     VARCHAR(7)   NOT NULL,
    asignatura_id                 SMALLINT     NOT NULL,
    tema_curricular               VARCHAR(150) NOT NULL,
    contexto_pisa                 VARCHAR(100) NOT NULL,
    nivel_dificultad              VARCHAR(10)  NOT NULL DEFAULT 'Intermedia',
    nivel_pisa                    SMALLINT,
    enunciado_contexto            TEXT         NOT NULL,
    pregunta_razonamiento         TEXT         NOT NULL,
    opciones_respuesta            JSONB,           -- solo opción múltiple (simulador)
    respuesta_correcta            TEXT         NOT NULL,  -- en opción múltiple: letra 'A'..'F'
    solucion_paso_a_paso_docente  TEXT         NOT NULL,  -- nunca se expone al estudiante
    pistas_socraticas_base        JSONB        NOT NULL DEFAULT '[]'::jsonb,
    es_publico                    BOOLEAN      NOT NULL DEFAULT FALSE,
    generado_por_ia               BOOLEAN      NOT NULL DEFAULT TRUE,
    tiempo_creacion_segundos      INTEGER,
    created_at                    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at                    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT fk_ejercicios_docente FOREIGN KEY (docente_creador_id)
        REFERENCES public.usuarios_institucionales (id) ON DELETE SET NULL,
    CONSTRAINT fk_ejercicios_padre FOREIGN KEY (ejercicio_padre_id)
        REFERENCES public.ejercicios_pisa (id) ON DELETE SET NULL,
    CONSTRAINT fk_ejercicios_asignatura FOREIGN KEY (asignatura_id)
        REFERENCES public.asignaturas (id) ON DELETE RESTRICT,
    CONSTRAINT uq_ejercicios_version UNIQUE (ejercicio_padre_id, etiqueta_version),
    CONSTRAINT ck_ejercicios_curso      CHECK (curso_bgu IN ('1ro BGU', '2do BGU', '3ro BGU')),
    CONSTRAINT ck_ejercicios_dificultad CHECK (nivel_dificultad IN ('Básica', 'Intermedia', 'Avanzada')),
    CONSTRAINT ck_ejercicios_nivel_pisa CHECK (nivel_pisa IS NULL OR nivel_pisa BETWEEN 1 AND 6),
    CONSTRAINT ck_ejercicios_etiqueta   CHECK (etiqueta_version ~ '^(Original|Iteración [0-9]{1,3}|Versión [A-Z])$'),
    CONSTRAINT ck_ejercicios_no_autorref CHECK (ejercicio_padre_id IS NULL OR ejercicio_padre_id <> id),
    CONSTRAINT ck_ejercicios_opciones   CHECK (
        opciones_respuesta IS NULL
        OR (jsonb_typeof(opciones_respuesta) = 'array' AND jsonb_array_length(opciones_respuesta) BETWEEN 2 AND 6)
    ),
    CONSTRAINT ck_ejercicios_respuesta_mc CHECK (opciones_respuesta IS NULL OR respuesta_correcta ~ '^[A-F]$'),
    CONSTRAINT ck_ejercicios_pistas     CHECK (jsonb_typeof(pistas_socraticas_base) = 'array'),
    CONSTRAINT ck_ejercicios_tiempo     CHECK (tiempo_creacion_segundos IS NULL OR tiempo_creacion_segundos >= 0),
    CONSTRAINT ck_ejercicios_banco_base CHECK (docente_creador_id IS NOT NULL OR es_publico)
);

CREATE TABLE IF NOT EXISTS public.planificaciones_erca (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    docente_id              UUID         NOT NULL,
    titulo_guia             VARCHAR(200) NOT NULL,
    curso_bgu               VARCHAR(7)   NOT NULL,
    asignatura_id           SMALLINT     NOT NULL,
    destreza_dcd            VARCHAR(400) NOT NULL,
    duracion_minutos        SMALLINT     NOT NULL DEFAULT 45,
    fase_experiencia        TEXT         NOT NULL,
    fase_reflexion          TEXT         NOT NULL,
    fase_conceptualizacion  TEXT         NOT NULL,
    fase_aplicacion_texto   TEXT         NOT NULL,
    archivo_silabo_url      VARCHAR(500),
    created_at              TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT fk_planificaciones_docente FOREIGN KEY (docente_id)
        REFERENCES public.usuarios_institucionales (id) ON DELETE CASCADE,
    CONSTRAINT fk_planificaciones_asignatura FOREIGN KEY (asignatura_id)
        REFERENCES public.asignaturas (id) ON DELETE RESTRICT,
    CONSTRAINT ck_planificaciones_curso    CHECK (curso_bgu IN ('1ro BGU', '2do BGU', '3ro BGU')),
    CONSTRAINT ck_planificaciones_duracion CHECK (duracion_minutos BETWEEN 15 AND 240),
    CONSTRAINT ck_planificaciones_url      CHECK (archivo_silabo_url IS NULL OR archivo_silabo_url ~ '^https://')
);

-- Relación N:M: qué ejercicios van en la fase de Aplicación de cada guía
CREATE TABLE IF NOT EXISTS public.planificacion_ejercicios (
    planificacion_id  UUID     NOT NULL,
    ejercicio_id      UUID     NOT NULL,
    orden             SMALLINT NOT NULL,
    CONSTRAINT pk_planificacion_ejercicios PRIMARY KEY (planificacion_id, ejercicio_id),
    CONSTRAINT fk_plan_ej_planificacion FOREIGN KEY (planificacion_id)
        REFERENCES public.planificaciones_erca (id) ON DELETE CASCADE,
    CONSTRAINT fk_plan_ej_ejercicio FOREIGN KEY (ejercicio_id)
        REFERENCES public.ejercicios_pisa (id) ON DELETE RESTRICT,
    CONSTRAINT ck_plan_ej_orden CHECK (orden >= 1),
    CONSTRAINT uq_plan_ej_orden UNIQUE (planificacion_id, orden)
);

-- ==============================================================================
-- PARTE A · 5. AULAS POR PIN Y TELEMETRÍA ANÓNIMA (ZERO-PII)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.aulas_virtuales (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pin_acceso             VARCHAR(6)   NOT NULL,
    docente_id             UUID         NOT NULL,
    planificacion_id       UUID,
    titulo_sesion          VARCHAR(150) NOT NULL,
    paralelo               VARCHAR(20)  NOT NULL DEFAULT 'A',
    modo_aula              VARCHAR(20)  NOT NULL DEFAULT 'RETO_CLASE',
    tiempo_limite_minutos  SMALLINT,
    max_estudiantes        SMALLINT     NOT NULL DEFAULT 45,
    activa                 BOOLEAN      NOT NULL DEFAULT TRUE,
    expires_at             TIMESTAMPTZ  NOT NULL DEFAULT (now() + INTERVAL '7 days'),
    created_at             TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at             TIMESTAMPTZ  NOT NULL DEFAULT now(),
    -- RESTRICT: un docente con aulas se desactiva (activo=false); no se borra, para no perder métricas
    CONSTRAINT fk_aulas_docente FOREIGN KEY (docente_id)
        REFERENCES public.usuarios_institucionales (id) ON DELETE RESTRICT,
    CONSTRAINT fk_aulas_planificacion FOREIGN KEY (planificacion_id)
        REFERENCES public.planificaciones_erca (id) ON DELETE SET NULL,
    CONSTRAINT uq_aulas_pin        UNIQUE (pin_acceso),
    CONSTRAINT ck_aulas_pin        CHECK (pin_acceso ~ '^[A-Z0-9]{6}$'),
    CONSTRAINT ck_aulas_modo       CHECK (modo_aula IN ('RETO_CLASE', 'PRACTICA_LIBRE', 'SIMULADOR_ADMISION')),
    CONSTRAINT ck_aulas_cronometro CHECK (modo_aula <> 'SIMULADOR_ADMISION' OR tiempo_limite_minutos IS NOT NULL),
    CONSTRAINT ck_aulas_tiempo     CHECK (tiempo_limite_minutos IS NULL OR tiempo_limite_minutos BETWEEN 5 AND 240),
    CONSTRAINT ck_aulas_capacidad  CHECK (max_estudiantes BETWEEN 1 AND 60),
    CONSTRAINT ck_aulas_expiracion CHECK (expires_at > created_at)
);

CREATE TABLE IF NOT EXISTS public.aula_ejercicios (
    aula_id       UUID     NOT NULL,
    ejercicio_id  UUID     NOT NULL,
    orden         SMALLINT NOT NULL,
    CONSTRAINT pk_aula_ejercicios PRIMARY KEY (aula_id, ejercicio_id),
    CONSTRAINT fk_aula_ej_aula FOREIGN KEY (aula_id)
        REFERENCES public.aulas_virtuales (id) ON DELETE CASCADE,
    CONSTRAINT fk_aula_ej_ejercicio FOREIGN KEY (ejercicio_id)
        REFERENCES public.ejercicios_pisa (id) ON DELETE RESTRICT,
    CONSTRAINT ck_aula_ej_orden CHECK (orden >= 1),
    CONSTRAINT uq_aula_ej_orden UNIQUE (aula_id, orden)
);

-- Arco exclusivo: la sesión pertenece a un aula (PIN de aula) O a una institución (PIN de grado).
CREATE TABLE IF NOT EXISTS public.sesiones_estudiantes_anonimas (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aula_id                 UUID,
    institucion_id          UUID,
    alias_temporal          VARCHAR(20)  NOT NULL,
    token_dispositivo_hash  VARCHAR(64)  NOT NULL,  -- SHA-256 de un token aleatorio del navegador
    estado                  VARCHAR(12)  NOT NULL DEFAULT 'EN_PROGRESO',
    iniciado_en             TIMESTAMPTZ  NOT NULL DEFAULT now(),
    ultima_actividad_en     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    finalizado_en           TIMESTAMPTZ,
    -- Columna calculada: no se guarda a mano, así evitamos inconsistencias (atributo derivado)
    tiempo_total_segundos   INTEGER GENERATED ALWAYS AS (
        CASE WHEN finalizado_en IS NULL THEN NULL
             ELSE EXTRACT(EPOCH FROM (finalizado_en - iniciado_en))::integer END
    ) STORED,
    puntaje_simulador       NUMERIC(5,2),
    CONSTRAINT fk_sesiones_aula FOREIGN KEY (aula_id)
        REFERENCES public.aulas_virtuales (id) ON DELETE CASCADE,
    CONSTRAINT fk_sesiones_institucion FOREIGN KEY (institucion_id)
        REFERENCES public.instituciones (id) ON DELETE CASCADE,
    CONSTRAINT uq_sesiones_alias UNIQUE (aula_id, alias_temporal),
    CONSTRAINT uq_sesiones_token UNIQUE (aula_id, token_dispositivo_hash),
    CONSTRAINT ck_sesiones_ambito CHECK ((aula_id IS NULL) <> (institucion_id IS NULL)),
    -- Zero-PII a nivel de motor: el alias solo puede tener este formato, nunca un nombre real
    CONSTRAINT ck_sesiones_alias  CHECK (alias_temporal ~ '^Estudiante #[0-9]{1,6}$'),
    CONSTRAINT ck_sesiones_token  CHECK (token_dispositivo_hash ~ '^[a-f0-9]{64}$'),
    CONSTRAINT ck_sesiones_estado CHECK (estado IN ('EN_PROGRESO', 'COMPLETADO', 'ABANDONADO')),
    CONSTRAINT ck_sesiones_cierre CHECK ((estado = 'EN_PROGRESO') = (finalizado_en IS NULL)),
    CONSTRAINT ck_sesiones_fechas CHECK (finalizado_en IS NULL OR finalizado_en >= iniciado_en),
    CONSTRAINT ck_sesiones_puntaje CHECK (puntaje_simulador IS NULL OR puntaje_simulador BETWEEN 0 AND 100)
);

-- Una fila por (sesión, ejercicio): las métricas dependen de la clave completa (2FN/3FN)
CREATE TABLE IF NOT EXISTS public.intentos_y_bloqueos_ejercicio (
    id                          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    sesion_anonima_id           UUID        NOT NULL,
    ejercicio_id                UUID        NOT NULL,
    logro_resolver              BOOLEAN     NOT NULL DEFAULT FALSE,
    numero_intentos             SMALLINT    NOT NULL DEFAULT 0,
    pistas_socraticas_usadas    SMALLINT    NOT NULL DEFAULT 0,
    paso_bloqueo_detectado      VARCHAR(30),
    opcion_seleccionada         SMALLINT,   -- índice 0..5 (sin texto libre: no puede haber PII)
    marcada_con_bandera         BOOLEAN     NOT NULL DEFAULT FALSE,
    tiempo_resolucion_segundos  INTEGER,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_intentos_sesion FOREIGN KEY (sesion_anonima_id)
        REFERENCES public.sesiones_estudiantes_anonimas (id) ON DELETE CASCADE,
    CONSTRAINT fk_intentos_ejercicio FOREIGN KEY (ejercicio_id)
        REFERENCES public.ejercicios_pisa (id) ON DELETE RESTRICT,
    CONSTRAINT uq_intentos_sesion_ejercicio UNIQUE (sesion_anonima_id, ejercicio_id),
    CONSTRAINT ck_intentos_numero  CHECK (numero_intentos >= 0),
    CONSTRAINT ck_intentos_pistas  CHECK (pistas_socraticas_usadas >= 0),
    CONSTRAINT ck_intentos_opcion  CHECK (opcion_seleccionada IS NULL OR opcion_seleccionada BETWEEN 0 AND 5),
    CONSTRAINT ck_intentos_tiempo  CHECK (tiempo_resolucion_segundos IS NULL OR tiempo_resolucion_segundos >= 0),
    -- Vocabulario cerrado para poder hacer GROUP BY confiable en el dashboard
    CONSTRAINT ck_intentos_paso CHECK (paso_bloqueo_detectado IS NULL OR paso_bloqueo_detectado IN (
        'COMPRENSION_LECTORA', 'IDENTIFICACION_VARIABLES', 'PLANTEAMIENTO_ECUACION',
        'CALCULO', 'INTERPRETACION_RESULTADO'
    ))
);

CREATE TABLE IF NOT EXISTS public.mensajes_tutor_socratico (
    id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    intento_id         BIGINT      NOT NULL,
    remitente          VARCHAR(10) NOT NULL,
    tipo_interaccion   VARCHAR(25) NOT NULL DEFAULT 'TEXTO_LIBRE',
    contenido_mensaje  TEXT        NOT NULL,
    tokens_consumidos  INTEGER,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_mensajes_intento FOREIGN KEY (intento_id)
        REFERENCES public.intentos_y_bloqueos_ejercicio (id) ON DELETE CASCADE,
    CONSTRAINT ck_mensajes_remitente CHECK (remitente IN ('ESTUDIANTE', 'TUTOR_IA')),
    CONSTRAINT ck_mensajes_tipo CHECK (tipo_interaccion IN (
        'TEXTO_LIBRE', 'CHIP_RAPIDO', 'REVISION_POST_SIMULADOR', 'INTENTO_COPIA_BLOQUEADO'
    )),
    CONSTRAINT ck_mensajes_largo  CHECK (char_length(contenido_mensaje) BETWEEN 1 AND 4000),
    CONSTRAINT ck_mensajes_tokens CHECK (tokens_consumidos IS NULL OR (tokens_consumidos >= 0 AND remitente = 'TUTOR_IA')),
    CONSTRAINT ck_mensajes_copia  CHECK (tipo_interaccion <> 'INTENTO_COPIA_BLOQUEADO' OR remitente = 'ESTUDIANTE')
);

-- ==============================================================================
-- PARTE A · 6. ÍNDICES
-- PostgreSQL NO crea índices automáticos en las FK (solo en PK y UNIQUE).
-- No hace falta índice extra en pin_acceso, email ni sesiones.aula_id: ya los cubre un UNIQUE.
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_usuarios_institucion    ON public.usuarios_institucionales (institucion_id);
CREATE INDEX IF NOT EXISTS idx_ejercicios_docente      ON public.ejercicios_pisa (docente_creador_id);
CREATE INDEX IF NOT EXISTS idx_ejercicios_padre        ON public.ejercicios_pisa (ejercicio_padre_id) WHERE ejercicio_padre_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ejercicios_catalogo     ON public.ejercicios_pisa (curso_bgu, asignatura_id, nivel_dificultad);
CREATE INDEX IF NOT EXISTS idx_ejercicios_publicos     ON public.ejercicios_pisa (created_at DESC) WHERE es_publico;
CREATE INDEX IF NOT EXISTS idx_planificaciones_docente ON public.planificaciones_erca (docente_id);
CREATE INDEX IF NOT EXISTS idx_plan_ej_ejercicio       ON public.planificacion_ejercicios (ejercicio_id);
CREATE INDEX IF NOT EXISTS idx_aulas_docente           ON public.aulas_virtuales (docente_id);
CREATE INDEX IF NOT EXISTS idx_aulas_planificacion     ON public.aulas_virtuales (planificacion_id) WHERE planificacion_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_aulas_vigentes          ON public.aulas_virtuales (expires_at) WHERE activa;
CREATE INDEX IF NOT EXISTS idx_aula_ej_ejercicio       ON public.aula_ejercicios (ejercicio_id);
CREATE INDEX IF NOT EXISTS idx_sesiones_institucion    ON public.sesiones_estudiantes_anonimas (institucion_id, token_dispositivo_hash) WHERE institucion_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sesiones_en_progreso    ON public.sesiones_estudiantes_anonimas (ultima_actividad_en) WHERE estado = 'EN_PROGRESO';
CREATE INDEX IF NOT EXISTS idx_sesiones_iniciado       ON public.sesiones_estudiantes_anonimas (iniciado_en);
CREATE INDEX IF NOT EXISTS idx_intentos_ejercicio_paso ON public.intentos_y_bloqueos_ejercicio (ejercicio_id, paso_bloqueo_detectado);
CREATE INDEX IF NOT EXISTS idx_mensajes_intento        ON public.mensajes_tutor_socratico (intento_id, created_at);
CREATE INDEX IF NOT EXISTS idx_mensajes_copia          ON public.mensajes_tutor_socratico (created_at) WHERE tipo_interaccion = 'INTENTO_COPIA_BLOQUEADO';

-- ==============================================================================
-- PARTE A · 7. TRIGGERS DE INTEGRIDAD DE NEGOCIO
-- ==============================================================================

DO $$
DECLARE
    t text;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'instituciones', 'usuarios_institucionales', 'ejercicios_pisa',
        'planificaciones_erca', 'aulas_virtuales', 'intentos_y_bloqueos_ejercicio'
    ] LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trg_%1$s_updated_at ON public.%1$I', t);
        EXECUTE format(
            'CREATE TRIGGER trg_%1$s_updated_at BEFORE UPDATE ON public.%1$I '
            'FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at()', t);
    END LOOP;
END $$;

-- 7.1 Límite de docentes activos según el plan contratado
CREATE OR REPLACE FUNCTION public.fn_validar_limite_docentes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_limite   smallint;
    v_actuales integer;
BEGIN
    IF NEW.rol <> 'DOCENTE' OR NOT NEW.activo THEN
        RETURN NEW;
    END IF;

    SELECT i.limite_docentes INTO v_limite
      FROM public.instituciones i
     WHERE i.id = NEW.institucion_id
       FOR UPDATE;

    SELECT count(*) INTO v_actuales
      FROM public.usuarios_institucionales u
     WHERE u.institucion_id = NEW.institucion_id
       AND u.rol = 'DOCENTE' AND u.activo AND u.id <> NEW.id;

    IF v_actuales >= v_limite THEN
        RAISE EXCEPTION 'La institución alcanzó su límite de % docentes activos', v_limite
            USING ERRCODE = 'P0001';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_usuarios_limite_docentes ON public.usuarios_institucionales;
CREATE TRIGGER trg_usuarios_limite_docentes
    BEFORE INSERT OR UPDATE OF rol, activo, institucion_id ON public.usuarios_institucionales
    FOR EACH ROW EXECUTE FUNCTION public.fn_validar_limite_docentes();

-- 7.2 Un PIN no puede ser a la vez PIN de aula y PIN de grado (unicidad entre dos tablas)
CREATE OR REPLACE FUNCTION public.fn_validar_pin_global()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF TG_TABLE_NAME = 'aulas_virtuales' THEN
        IF EXISTS (SELECT 1 FROM public.instituciones i WHERE i.pin_grado_autonomo = NEW.pin_acceso) THEN
            RAISE EXCEPTION 'El PIN % ya está en uso como PIN de grado', NEW.pin_acceso USING ERRCODE = '23505';
        END IF;
    ELSIF NEW.pin_grado_autonomo IS NOT NULL
      AND EXISTS (SELECT 1 FROM public.aulas_virtuales a WHERE a.pin_acceso = NEW.pin_grado_autonomo) THEN
        RAISE EXCEPTION 'El PIN % ya está en uso por un aula', NEW.pin_grado_autonomo USING ERRCODE = '23505';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_aulas_pin_global ON public.aulas_virtuales;
CREATE TRIGGER trg_aulas_pin_global
    BEFORE INSERT OR UPDATE OF pin_acceso ON public.aulas_virtuales
    FOR EACH ROW EXECUTE FUNCTION public.fn_validar_pin_global();

DROP TRIGGER IF EXISTS trg_instituciones_pin_global ON public.instituciones;
CREATE TRIGGER trg_instituciones_pin_global
    BEFORE INSERT OR UPDATE OF pin_grado_autonomo ON public.instituciones
    FOR EACH ROW EXECUTE FUNCTION public.fn_validar_pin_global();

-- 7.3 Un ejercicio publicado en un aula no se edita: se crea una nueva iteración.
--     Esto reemplaza el snapshot JSONB "exercise_data" de v1 sin duplicar datos.
CREATE OR REPLACE FUNCTION public.fn_proteger_ejercicio_publicado()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.aula_ejercicios ae WHERE ae.ejercicio_id = OLD.id) THEN
        RAISE EXCEPTION 'El ejercicio ya está publicado en un aula. Crea una nueva iteración con ejercicio_padre_id.'
            USING ERRCODE = 'P0001';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ejercicios_inmutables ON public.ejercicios_pisa;
CREATE TRIGGER trg_ejercicios_inmutables
    BEFORE UPDATE OF enunciado_contexto, pregunta_razonamiento, opciones_respuesta,
                     respuesta_correcta, pistas_socraticas_base, nivel_dificultad
    ON public.ejercicios_pisa
    FOR EACH ROW
    WHEN (OLD.* IS DISTINCT FROM NEW.*)
    EXECUTE FUNCTION public.fn_proteger_ejercicio_publicado();

-- 7.4 El ejercicio del intento debe pertenecer al aula (o institución) de la sesión
CREATE OR REPLACE FUNCTION public.fn_validar_intento_en_ambito()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_aula uuid;
    v_inst uuid;
BEGIN
    SELECT s.aula_id, s.institucion_id INTO v_aula, v_inst
      FROM public.sesiones_estudiantes_anonimas s
     WHERE s.id = NEW.sesion_anonima_id;

    IF v_aula IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM public.aula_ejercicios ae
                        WHERE ae.aula_id = v_aula AND ae.ejercicio_id = NEW.ejercicio_id) THEN
            RAISE EXCEPTION 'El ejercicio no pertenece al aula de esta sesión' USING ERRCODE = '23514';
        END IF;
    ELSIF v_inst IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1
                         FROM public.ejercicios_pisa e
                         LEFT JOIN public.usuarios_institucionales u ON u.id = e.docente_creador_id
                        WHERE e.id = NEW.ejercicio_id
                          AND (e.es_publico OR u.institucion_id = v_inst)) THEN
            RAISE EXCEPTION 'El ejercicio no está disponible para práctica libre' USING ERRCODE = '23514';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_intentos_ambito ON public.intentos_y_bloqueos_ejercicio;
CREATE TRIGGER trg_intentos_ambito
    BEFORE INSERT OR UPDATE OF sesion_anonima_id, ejercicio_id ON public.intentos_y_bloqueos_ejercicio
    FOR EACH ROW EXECUTE FUNCTION public.fn_validar_intento_en_ambito();

-- ==============================================================================
-- PARTE A · 8. VISTAS DE MÉTRICAS (con SUM(CASE) para que también funcionen en MySQL)
-- security_invoker: la vista respeta el RLS de quien consulta (PG15+)
-- ==============================================================================

-- Métrica 1: tiempo ahorrado por docente
CREATE OR REPLACE VIEW public.vw_tiempo_ahorrado_docente
WITH (security_invoker = true) AS
SELECT
    u.id              AS docente_id,
    u.institucion_id,
    u.nombre_completo,
    COUNT(e.id)       AS ejercicios_generados,
    ROUND(AVG(e.tiempo_creacion_segundos)::numeric, 1) AS promedio_segundos_creacion,
    ROUND(COALESCE(SUM(GREATEST(public.fn_baseline_segundos_manual()
          - COALESCE(e.tiempo_creacion_segundos, public.fn_baseline_segundos_manual()), 0)), 0) / 3600.0, 2)
                      AS horas_ahorradas_estimadas
FROM public.usuarios_institucionales u
LEFT JOIN public.ejercicios_pisa e
       ON e.docente_creador_id = u.id AND e.generado_por_ia
WHERE u.rol = 'DOCENTE'
GROUP BY u.id, u.institucion_id, u.nombre_completo;

-- Métrica 2: % de ejercicios resueltos con ayuda socrática, por aula
CREATE OR REPLACE VIEW public.vw_completitud_socratica_aula
WITH (security_invoker = true) AS
SELECT
    a.id         AS aula_id,
    a.pin_acceso,
    a.docente_id,
    a.modo_aula,
    COUNT(DISTINCT s.id) AS estudiantes_anonimos,
    COUNT(i.id)          AS intentos_totales,
    COALESCE(SUM(CASE WHEN i.logro_resolver THEN 1 ELSE 0 END), 0) AS resueltos,
    COALESCE(SUM(CASE WHEN i.logro_resolver AND i.pistas_socraticas_usadas > 0 THEN 1 ELSE 0 END), 0)
                         AS resueltos_con_ayuda,
    ROUND(100.0 * SUM(CASE WHEN i.logro_resolver AND i.pistas_socraticas_usadas > 0 THEN 1 ELSE 0 END)
          / NULLIF(COUNT(i.id), 0), 1) AS pct_resueltos_con_ayuda,
    ROUND(AVG(i.pistas_socraticas_usadas)::numeric, 2) AS promedio_pistas
FROM public.aulas_virtuales a
LEFT JOIN public.sesiones_estudiantes_anonimas s ON s.aula_id = a.id
LEFT JOIN public.intentos_y_bloqueos_ejercicio i ON i.sesion_anonima_id = s.id
GROUP BY a.id, a.pin_acceso, a.docente_id, a.modo_aula;

-- Métrica 3: paso exacto con mayor % de bloqueo, por aula y ejercicio
CREATE OR REPLACE VIEW public.vw_pasos_bloqueo_aula
WITH (security_invoker = true) AS
WITH base AS (
    SELECT s.aula_id, i.ejercicio_id, i.paso_bloqueo_detectado, i.pistas_socraticas_usadas
      FROM public.intentos_y_bloqueos_ejercicio i
      JOIN public.sesiones_estudiantes_anonimas s ON s.id = i.sesion_anonima_id
     WHERE s.aula_id IS NOT NULL
),
totales AS (
    SELECT aula_id, ejercicio_id, COUNT(*) AS intentos_totales
      FROM base
     GROUP BY aula_id, ejercicio_id
)
SELECT
    b.aula_id,
    b.ejercicio_id,
    e.tema_curricular,
    b.paso_bloqueo_detectado,
    COUNT(*)                          AS estudiantes_bloqueados,
    SUM(b.pistas_socraticas_usadas)   AS pistas_solicitadas,
    t.intentos_totales,
    ROUND(100.0 * COUNT(*) / t.intentos_totales, 1) AS pct_bloqueo
FROM base b
JOIN totales t ON t.aula_id = b.aula_id AND t.ejercicio_id = b.ejercicio_id
JOIN public.ejercicios_pisa e ON e.id = b.ejercicio_id
WHERE b.paso_bloqueo_detectado IS NOT NULL
GROUP BY b.aula_id, b.ejercicio_id, e.tema_curricular, b.paso_bloqueo_detectado, t.intentos_totales;

-- ==============================================================================
-- PARTE A · 9. RPCs DEL ESTUDIANTE ANÓNIMO (únicas puertas de entrada del alumno)
-- El estudiante nunca toca las tablas: solo llama a estas funciones.
-- El token es un SHA-256 (hex) de un valor aleatorio guardado en el navegador.
-- ==============================================================================

-- Lo que puede ver el estudiante (sin respuesta, sin solución y sin pistas)
CREATE OR REPLACE FUNCTION public.fn_ejercicio_json_estudiante(e public.ejercicios_pisa)
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
    SELECT jsonb_build_object(
        'id',           e.id,
        'curso_bgu',    e.curso_bgu,
        'tema',         e.tema_curricular,
        'contexto',     e.contexto_pisa,
        'dificultad',   e.nivel_dificultad,
        'enunciado',    e.enunciado_contexto,
        'pregunta',     e.pregunta_razonamiento,
        'opciones',     e.opciones_respuesta,
        'total_pistas', jsonb_array_length(e.pistas_socraticas_base)
    );
$$;

CREATE OR REPLACE FUNCTION public.fn_sesion_autorizada(
    p_sesion_id uuid, p_token_hash text, p_requiere_activa boolean DEFAULT true)
RETURNS public.sesiones_estudiantes_anonimas
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_sesion public.sesiones_estudiantes_anonimas;
BEGIN
    SELECT s.* INTO v_sesion
      FROM public.sesiones_estudiantes_anonimas s
     WHERE s.id = p_sesion_id
       AND s.token_dispositivo_hash = lower(btrim(coalesce(p_token_hash, '')));

    IF NOT FOUND OR (p_requiere_activa AND v_sesion.estado <> 'EN_PROGRESO') THEN
        RAISE EXCEPTION 'Sesión anónima no válida o finalizada' USING ERRCODE = '28000';
    END IF;

    UPDATE public.sesiones_estudiantes_anonimas
       SET ultima_actividad_en = now()
     WHERE id = v_sesion.id AND estado = 'EN_PROGRESO';

    RETURN v_sesion;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_contenido_sesion(p_sesion_id uuid, p_token_hash text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_sesion public.sesiones_estudiantes_anonimas;
    v_res    jsonb;
BEGIN
    v_sesion := public.fn_sesion_autorizada(p_sesion_id, p_token_hash, false);

    IF v_sesion.aula_id IS NOT NULL THEN
        SELECT jsonb_build_object(
                   'titulo',                a.titulo_sesion,
                   'modo',                  a.modo_aula,
                   'tiempo_limite_minutos', a.tiempo_limite_minutos,
                   'institucion',           i.nombre,
                   'docente',               u.nombre_completo,
                   'ejercicios', COALESCE((
                        SELECT jsonb_agg(public.fn_ejercicio_json_estudiante(e)
                                         || jsonb_build_object('orden', ae.orden) ORDER BY ae.orden)
                          FROM public.aula_ejercicios ae
                          JOIN public.ejercicios_pisa e ON e.id = ae.ejercicio_id
                         WHERE ae.aula_id = a.id), '[]'::jsonb))
          INTO v_res
          FROM public.aulas_virtuales a
          JOIN public.usuarios_institucionales u ON u.id = a.docente_id
          JOIN public.instituciones i ON i.id = u.institucion_id
         WHERE a.id = v_sesion.aula_id;
    ELSE
        SELECT jsonb_build_object(
                   'titulo',                'Práctica libre',
                   'modo',                  'PRACTICA_LIBRE',
                   'tiempo_limite_minutos', NULL,
                   'institucion',           i.nombre,
                   'docente',               NULL,
                   'ejercicios', COALESCE((
                        SELECT jsonb_agg(t.obj ORDER BY t.created_at DESC)
                          FROM (SELECT public.fn_ejercicio_json_estudiante(e) AS obj, e.created_at
                                  FROM public.ejercicios_pisa e
                                  LEFT JOIN public.usuarios_institucionales u ON u.id = e.docente_creador_id
                                 WHERE e.es_publico OR u.institucion_id = i.id
                                 ORDER BY e.created_at DESC
                                 LIMIT 30) t), '[]'::jsonb))
          INTO v_res
          FROM public.instituciones i
         WHERE i.id = v_sesion.institucion_id;
    END IF;

    RETURN v_res;
END;
$$;

-- Entrada única del estudiante: PIN + token -> sesión anónima (o retoma la que ya tenía,
-- por ejemplo si el navegador se cerró o el sistema mató la pestaña).
CREATE OR REPLACE FUNCTION public.fn_iniciar_sesion_anonima(p_pin text, p_token_hash text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_pin       text := upper(btrim(coalesce(p_pin, '')));
    v_token     text := lower(btrim(coalesce(p_token_hash, '')));
    v_aula      public.aulas_virtuales;
    v_inst      uuid;
    v_sesion    public.sesiones_estudiantes_anonimas;
    v_total     integer;
    v_reanudada boolean := false;
BEGIN
    IF v_pin !~ '^[A-Z0-9]{6}$' THEN
        RETURN NULL;   -- respuesta neutra: no revela si el PIN existe
    END IF;
    IF v_token !~ '^[a-f0-9]{64}$' THEN
        RAISE EXCEPTION 'Token de dispositivo inválido (se espera SHA-256 en hex)' USING ERRCODE = '22023';
    END IF;

    SELECT a.* INTO v_aula
      FROM public.aulas_virtuales a
     WHERE a.pin_acceso = v_pin AND a.activa AND a.expires_at > now();

    IF FOUND THEN
        SELECT s.* INTO v_sesion
          FROM public.sesiones_estudiantes_anonimas s
         WHERE s.aula_id = v_aula.id AND s.token_dispositivo_hash = v_token;

        IF FOUND THEN
            v_reanudada := true;
        ELSE
            -- Evita que dos alumnos reciban el mismo "Estudiante #N" al entrar a la vez
            PERFORM pg_advisory_xact_lock(hashtextextended(v_aula.id::text, 0));
            SELECT count(*) INTO v_total
              FROM public.sesiones_estudiantes_anonimas s
             WHERE s.aula_id = v_aula.id;

            IF v_total >= v_aula.max_estudiantes THEN
                RAISE EXCEPTION 'El aula alcanzó su capacidad máxima de % estudiantes', v_aula.max_estudiantes
                    USING ERRCODE = 'P0001';
            END IF;

            INSERT INTO public.sesiones_estudiantes_anonimas (aula_id, alias_temporal, token_dispositivo_hash)
            VALUES (v_aula.id, 'Estudiante #' || (v_total + 1), v_token)
            RETURNING * INTO v_sesion;
        END IF;
    ELSE
        SELECT i.id INTO v_inst
          FROM public.instituciones i
         WHERE i.pin_grado_autonomo = v_pin
           AND i.activa AND i.plan_suscripcion <> 'SUSPENDIDA';

        IF NOT FOUND THEN
            RETURN NULL;
        END IF;

        SELECT s.* INTO v_sesion
          FROM public.sesiones_estudiantes_anonimas s
         WHERE s.institucion_id = v_inst
           AND s.token_dispositivo_hash = v_token
           AND s.estado = 'EN_PROGRESO'
         ORDER BY s.iniciado_en DESC
         LIMIT 1;

        IF FOUND THEN
            v_reanudada := true;
        ELSE
            PERFORM pg_advisory_xact_lock(hashtextextended(v_inst::text, 0));
            SELECT count(*) INTO v_total
              FROM public.sesiones_estudiantes_anonimas s
             WHERE s.institucion_id = v_inst;

            INSERT INTO public.sesiones_estudiantes_anonimas (institucion_id, alias_temporal, token_dispositivo_hash)
            VALUES (v_inst, 'Estudiante #' || ((v_total % 999999) + 1), v_token)
            RETURNING * INTO v_sesion;
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'sesion_id', v_sesion.id,
        'alias',     v_sesion.alias_temporal,
        'estado',    v_sesion.estado,
        'reanudada', v_reanudada,
        'contenido', public.fn_contenido_sesion(v_sesion.id, v_token)
    );
END;
$$;

-- Candado socrático en la base de datos: entrega UNA pista a la vez, en orden,
-- y la cuenta. Nunca devuelve la respuesta ni la solución.
CREATE OR REPLACE FUNCTION public.fn_solicitar_pista(p_sesion_id uuid, p_token_hash text, p_ejercicio_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_sesion public.sesiones_estudiantes_anonimas;
    v_pistas jsonb;
    v_total  integer;
    v_usadas smallint;
BEGIN
    v_sesion := public.fn_sesion_autorizada(p_sesion_id, p_token_hash, true);

    SELECT e.pistas_socraticas_base INTO v_pistas
      FROM public.ejercicios_pisa e
     WHERE e.id = p_ejercicio_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Ejercicio no encontrado' USING ERRCODE = 'P0002';
    END IF;
    v_total := jsonb_array_length(v_pistas);

    INSERT INTO public.intentos_y_bloqueos_ejercicio (sesion_anonima_id, ejercicio_id)
    VALUES (v_sesion.id, p_ejercicio_id)
    ON CONFLICT (sesion_anonima_id, ejercicio_id) DO NOTHING;

    SELECT i.pistas_socraticas_usadas INTO v_usadas
      FROM public.intentos_y_bloqueos_ejercicio i
     WHERE i.sesion_anonima_id = v_sesion.id AND i.ejercicio_id = p_ejercicio_id
       FOR UPDATE;

    IF v_usadas >= v_total THEN
        RETURN jsonb_build_object('pista', NULL, 'numero', v_usadas, 'restantes', 0);
    END IF;

    UPDATE public.intentos_y_bloqueos_ejercicio
       SET pistas_socraticas_usadas = v_usadas + 1
     WHERE sesion_anonima_id = v_sesion.id AND ejercicio_id = p_ejercicio_id;

    RETURN jsonb_build_object(
        'pista',     v_pistas ->> v_usadas::integer,
        'numero',    v_usadas + 1,
        'restantes', v_total - v_usadas - 1
    );
END;
$$;

-- Registra un intento. En opción múltiple la nota la pone el servidor, no el navegador.
CREATE OR REPLACE FUNCTION public.fn_registrar_intento(
    p_sesion_id                  uuid,
    p_token_hash                 text,
    p_ejercicio_id               uuid,
    p_logro_resolver             boolean  DEFAULT false,
    p_paso_bloqueo               text     DEFAULT NULL,
    p_opcion_seleccionada        smallint DEFAULT NULL,
    p_marcada_con_bandera        boolean  DEFAULT false,
    p_tiempo_resolucion_segundos integer  DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_sesion    public.sesiones_estudiantes_anonimas;
    v_respuesta text;
    v_opciones  jsonb;
    v_logro     boolean := coalesce(p_logro_resolver, false);
    v_intento   public.intentos_y_bloqueos_ejercicio;
BEGIN
    v_sesion := public.fn_sesion_autorizada(p_sesion_id, p_token_hash, true);

    SELECT e.respuesta_correcta, e.opciones_respuesta INTO v_respuesta, v_opciones
      FROM public.ejercicios_pisa e
     WHERE e.id = p_ejercicio_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Ejercicio no encontrado' USING ERRCODE = 'P0002';
    END IF;

    IF v_opciones IS NOT NULL THEN
        v_logro := p_opcion_seleccionada IS NOT NULL
               AND chr(65 + p_opcion_seleccionada) = upper(btrim(v_respuesta));
    END IF;

    INSERT INTO public.intentos_y_bloqueos_ejercicio AS i (
        sesion_anonima_id, ejercicio_id, logro_resolver, numero_intentos,
        paso_bloqueo_detectado, opcion_seleccionada, marcada_con_bandera, tiempo_resolucion_segundos)
    VALUES (
        v_sesion.id, p_ejercicio_id, v_logro, 1,
        upper(p_paso_bloqueo), p_opcion_seleccionada, coalesce(p_marcada_con_bandera, false),
        p_tiempo_resolucion_segundos)
    ON CONFLICT (sesion_anonima_id, ejercicio_id) DO UPDATE SET
        numero_intentos            = i.numero_intentos + 1,
        -- Simulador: cuenta la última opción marcada. Reto abierto: si ya lo resolvió, queda resuelto.
        logro_resolver             = CASE WHEN v_opciones IS NOT NULL THEN EXCLUDED.logro_resolver
                                          ELSE i.logro_resolver OR EXCLUDED.logro_resolver END,
        paso_bloqueo_detectado     = COALESCE(EXCLUDED.paso_bloqueo_detectado, i.paso_bloqueo_detectado),
        opcion_seleccionada        = COALESCE(EXCLUDED.opcion_seleccionada, i.opcion_seleccionada),
        marcada_con_bandera        = EXCLUDED.marcada_con_bandera,
        tiempo_resolucion_segundos = COALESCE(EXCLUDED.tiempo_resolucion_segundos, i.tiempo_resolucion_segundos)
    RETURNING * INTO v_intento;

    RETURN jsonb_build_object(
        'intento_id',      v_intento.id,
        'logro_resolver',  v_intento.logro_resolver,
        'numero_intentos', v_intento.numero_intentos
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_registrar_mensaje(
    p_sesion_id         uuid,
    p_token_hash        text,
    p_ejercicio_id      uuid,
    p_remitente         text,
    p_tipo_interaccion  text,
    p_contenido         text,
    p_tokens_consumidos integer DEFAULT NULL)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_tipo       text := upper(coalesce(p_tipo_interaccion, 'TEXTO_LIBRE'));
    v_sesion     public.sesiones_estudiantes_anonimas;
    v_intento_id bigint;
    v_mensaje_id bigint;
BEGIN
    -- La revisión socrática del simulador se permite también con la sesión ya cerrada
    v_sesion := public.fn_sesion_autorizada(p_sesion_id, p_token_hash, v_tipo <> 'REVISION_POST_SIMULADOR');

    INSERT INTO public.intentos_y_bloqueos_ejercicio (sesion_anonima_id, ejercicio_id)
    VALUES (v_sesion.id, p_ejercicio_id)
    ON CONFLICT (sesion_anonima_id, ejercicio_id) DO NOTHING;

    SELECT i.id INTO v_intento_id
      FROM public.intentos_y_bloqueos_ejercicio i
     WHERE i.sesion_anonima_id = v_sesion.id AND i.ejercicio_id = p_ejercicio_id;

    INSERT INTO public.mensajes_tutor_socratico (intento_id, remitente, tipo_interaccion, contenido_mensaje, tokens_consumidos)
    VALUES (v_intento_id, upper(p_remitente), v_tipo, btrim(p_contenido), p_tokens_consumidos)
    RETURNING id INTO v_mensaje_id;

    RETURN v_mensaje_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_finalizar_sesion(p_sesion_id uuid, p_token_hash text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_sesion    public.sesiones_estudiantes_anonimas;
    v_modo      text;
    v_total     integer;
    v_resueltos integer;
    v_puntaje   numeric(5,2);
BEGIN
    v_sesion := public.fn_sesion_autorizada(p_sesion_id, p_token_hash, true);

    IF v_sesion.aula_id IS NOT NULL THEN
        SELECT a.modo_aula INTO v_modo FROM public.aulas_virtuales a WHERE a.id = v_sesion.aula_id;
    END IF;

    IF v_modo = 'SIMULADOR_ADMISION' THEN
        SELECT count(*) INTO v_total FROM public.aula_ejercicios ae WHERE ae.aula_id = v_sesion.aula_id;
        SELECT count(*) INTO v_resueltos
          FROM public.intentos_y_bloqueos_ejercicio i
         WHERE i.sesion_anonima_id = v_sesion.id AND i.logro_resolver;
        v_puntaje := round(100.0 * v_resueltos / NULLIF(v_total, 0), 2);
    END IF;

    UPDATE public.sesiones_estudiantes_anonimas
       SET estado = 'COMPLETADO', finalizado_en = now(), puntaje_simulador = v_puntaje
     WHERE id = v_sesion.id
    RETURNING * INTO v_sesion;

    RETURN jsonb_build_object(
        'estado',                v_sesion.estado,
        'puntaje_simulador',     v_sesion.puntaje_simulador,
        'tiempo_total_segundos', v_sesion.tiempo_total_segundos
    );
END;
$$;

-- Mantenimiento (solo service_role / cron). Minimización de datos (LOPDP).
CREATE OR REPLACE FUNCTION public.fn_cerrar_sesiones_inactivas(p_minutos integer DEFAULT 120)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_filas integer;
BEGIN
    UPDATE public.sesiones_estudiantes_anonimas
       SET estado = 'ABANDONADO', finalizado_en = ultima_actividad_en
     WHERE estado = 'EN_PROGRESO'
       AND ultima_actividad_en < now() - make_interval(mins => p_minutos);
    GET DIAGNOSTICS v_filas = ROW_COUNT;
    RETURN v_filas;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_purgar_datos_anonimos(p_dias integer DEFAULT 365)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_filas integer;
BEGIN
    DELETE FROM public.sesiones_estudiantes_anonimas
     WHERE iniciado_en < now() - make_interval(days => p_dias);
    GET DIAGNOSTICS v_filas = ROW_COUNT;
    RETURN v_filas;
END;
$$;

-- Con pg_cron habilitado en Supabase:
-- SELECT cron.schedule('ecdulearn-limpieza', '0 3 * * *',
--   $$SELECT public.fn_cerrar_sesiones_inactivas(); SELECT public.fn_purgar_datos_anonimos(365);$$);

-- ==============================================================================
-- PARTE A · 9.1 DATOS SEMILLA (idempotentes)
-- ==============================================================================

INSERT INTO public.asignaturas (nombre)
VALUES ('Matemáticas'), ('Física'), ('Química'), ('Biología')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO public.instituciones (id, nombre, codigo_amie, tipo_institucion, plan_suscripcion, pin_grado_autonomo, limite_docentes)
VALUES ('11111111-1111-4111-8111-111111111111', 'Unidad Educativa Demo ECduLearn', '17H00000',
        'PARTICULAR', 'PILOTO', 'GRADO1', 15)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.usuarios_institucionales (id, institucion_id, nombre_completo, email_institucional, rol, asignatura_principal_id)
VALUES ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '11111111-1111-4111-8111-111111111111',
        'Docente Demo PUCE', 'docente@puce.edu.ec', 'DOCENTE',
        (SELECT id FROM public.asignaturas WHERE nombre = 'Matemáticas'))
ON CONFLICT (email_institucional) DO NOTHING;

INSERT INTO public.ejercicios_pisa (
    id, docente_creador_id, etiqueta_version, curso_bgu, asignatura_id, tema_curricular, contexto_pisa,
    nivel_dificultad, nivel_pisa, enunciado_contexto, pregunta_razonamiento, respuesta_correcta,
    solucion_paso_a_paso_docente, pistas_socraticas_base, es_publico, generado_por_ia, tiempo_creacion_segundos)
VALUES (
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Original', '2do BGU',
    (SELECT id FROM public.asignaturas WHERE nombre = 'Matemáticas'),
    'Razones trigonométricas en triángulos rectángulos',
    'Ingeniería civil',
    'Intermedia', 4,
    'Para reforzar una pasarela peatonal junto al Puente del Chiche, un equipo de ingeniería propone cerchas triangulares isósceles de acero. Cada cercha tiene una base de 12 m y sus lados iguales forman un ángulo de 35° con la base. Por diseño, la altura del vértice superior no puede superar los 5 m.',
    '¿Cuál es la altura del vértice superior de la cercha y cumple con el límite de 5 m? Justifica el razonamiento trigonométrico que usaste.',
    'h = 6 · tan(35°) ≈ 4,20 m. Sí cumple, porque 4,20 m < 5 m.',
    'Paso 1 (Comprensión): la altura de un triángulo isósceles cae en el punto medio de la base. Paso 2 (Variables): se forma un triángulo rectángulo con cateto adyacente de 6 m y ángulo de 35°; la incógnita es el cateto opuesto h. Paso 3 (Modelo): tan(35°) = h / 6. Paso 4 (Cálculo): h = 6 · 0,7002 ≈ 4,20 m. Paso 5 (Interpretación): 4,20 m < 5 m, cumple con un margen de 0,80 m.',
    '["¿Qué figura aparece si trazas la altura desde el vértice superior hasta la base?",
      "En ese triángulo rectángulo, ¿qué lado conoces y qué lado buscas respecto al ángulo de 35°?",
      "¿Qué razón trigonométrica relaciona el cateto opuesto con el cateto adyacente?"]'::jsonb,
    TRUE, TRUE, 9)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.planificaciones_erca (
    id, docente_id, titulo_guia, curso_bgu, asignatura_id, destreza_dcd, duracion_minutos,
    fase_experiencia, fase_reflexion, fase_conceptualizacion, fase_aplicacion_texto)
VALUES (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Razones trigonométricas en estructuras de Quito', '2do BGU',
    (SELECT id FROM public.asignaturas WHERE nombre = 'Matemáticas'),
    'Resolver triángulos rectángulos con razones trigonométricas en problemas de contexto real.',
    45,
    'Observar fotografías de cerchas y puentes de Quito e identificar triángulos.',
    '¿Por qué los ingenieros prefieren triángulos y no cuadrados en las estructuras?',
    'Definición de seno, coseno y tangente en el triángulo rectángulo.',
    'Resolver el reto del Puente del Chiche (ejercicio PISA vinculado).')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.planificacion_ejercicios (planificacion_id, ejercicio_id, orden)
VALUES ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 1)
ON CONFLICT (planificacion_id, ejercicio_id) DO NOTHING;

INSERT INTO public.aulas_virtuales (id, pin_acceso, docente_id, planificacion_id, titulo_sesion, paralelo, modo_aula, max_estudiantes, expires_at)
VALUES ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'PISA26',
        'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        'Reto semanal · Puente del Chiche', 'A', 'RETO_CLASE', 45, now() + INTERVAL '30 days')
ON CONFLICT (pin_acceso) DO UPDATE
    SET activa = TRUE, expires_at = EXCLUDED.expires_at;

INSERT INTO public.aula_ejercicios (aula_id, ejercicio_id, orden)
VALUES ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 1)
ON CONFLICT (aula_id, ejercicio_id) DO NOTHING;

-- ==============================================================================
-- PARTE B · 10. IDENTIDAD DEL DOCENTE (SOLO SUPABASE)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.fn_mi_usuario_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT u.id
      FROM public.usuarios_institucionales u
      JOIN public.instituciones i ON i.id = u.institucion_id
     WHERE u.auth_user_id = auth.uid()
       AND u.activo
       AND i.activa
       AND i.plan_suscripcion <> 'SUSPENDIDA';
$$;

CREATE OR REPLACE FUNCTION public.fn_mi_institucion_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT u.institucion_id FROM public.usuarios_institucionales u WHERE u.id = public.fn_mi_usuario_id();
$$;

CREATE OR REPLACE FUNCTION public.fn_mi_rol()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT u.rol FROM public.usuarios_institucionales u WHERE u.id = public.fn_mi_usuario_id();
$$;

-- Cuentas pre-creadas por el colegio (lista blanca B2B): se vinculan solo cuando el
-- correo ya está CONFIRMADO, para que nadie se apropie de un correo ajeno al registrarse.
CREATE OR REPLACE FUNCTION public.fn_vincular_usuario_auth()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    UPDATE public.usuarios_institucionales
       SET auth_user_id = NEW.id
     WHERE email_institucional = lower(NEW.email)
       AND auth_user_id IS NULL;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_vincular_usuario_auth ON auth.users;
CREATE TRIGGER trg_vincular_usuario_auth
    AFTER INSERT OR UPDATE OF email_confirmed_at ON auth.users
    FOR EACH ROW
    WHEN (NEW.email_confirmed_at IS NOT NULL)
    EXECUTE FUNCTION public.fn_vincular_usuario_auth();

-- Vincula cuentas que ya existían antes de crear el trigger
UPDATE public.usuarios_institucionales u
   SET auth_user_id = au.id
  FROM auth.users au
 WHERE lower(au.email) = u.email_institucional
   AND au.email_confirmed_at IS NOT NULL
   AND u.auth_user_id IS NULL;

-- Panel del rector: solo números agregados de su institución, nunca datos por alumno
CREATE OR REPLACE FUNCTION public.fn_dashboard_institucion()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_inst uuid := public.fn_mi_institucion_id();
    v_rol  text := public.fn_mi_rol();
    v_res  jsonb;
BEGIN
    IF v_inst IS NULL OR v_rol NOT IN ('COORDINADOR_RECTOR', 'ADMIN') THEN
        RAISE EXCEPTION 'No autorizado' USING ERRCODE = '42501';
    END IF;

    v_res := (
        WITH docentes AS (
            SELECT u.id FROM public.usuarios_institucionales u WHERE u.institucion_id = v_inst
        ),
        sesiones AS (
            SELECT s.id
              FROM public.sesiones_estudiantes_anonimas s
              LEFT JOIN public.aulas_virtuales a ON a.id = s.aula_id
             WHERE a.docente_id IN (SELECT id FROM docentes) OR s.institucion_id = v_inst
        ),
        intentos AS (
            SELECT i.*
              FROM public.intentos_y_bloqueos_ejercicio i
             WHERE i.sesion_anonima_id IN (SELECT id FROM sesiones)
        )
        SELECT jsonb_build_object(
            'docentes_activos', (SELECT count(*) FROM public.usuarios_institucionales u
                                  WHERE u.institucion_id = v_inst AND u.activo AND u.rol = 'DOCENTE'),
            'ejercicios_generados', (SELECT count(*) FROM public.ejercicios_pisa e
                                      WHERE e.docente_creador_id IN (SELECT id FROM docentes)),
            'horas_ahorradas_estimadas', (
                SELECT ROUND(COALESCE(SUM(GREATEST(public.fn_baseline_segundos_manual()
                       - COALESCE(e.tiempo_creacion_segundos, public.fn_baseline_segundos_manual()), 0)), 0) / 3600.0, 2)
                  FROM public.ejercicios_pisa e
                 WHERE e.docente_creador_id IN (SELECT id FROM docentes) AND e.generado_por_ia),
            'aulas_activas', (SELECT count(*) FROM public.aulas_virtuales a
                               WHERE a.docente_id IN (SELECT id FROM docentes) AND a.activa AND a.expires_at > now()),
            'sesiones_anonimas', (SELECT count(*) FROM sesiones),
            'pct_resueltos_con_ayuda', (
                SELECT ROUND(100.0 * SUM(CASE WHEN logro_resolver AND pistas_socraticas_usadas > 0 THEN 1 ELSE 0 END)
                       / NULLIF(count(*), 0), 1)
                  FROM intentos),
            'paso_bloqueo_mas_frecuente', (
                SELECT paso_bloqueo_detectado FROM intentos
                 WHERE paso_bloqueo_detectado IS NOT NULL
                 GROUP BY paso_bloqueo_detectado
                 ORDER BY count(*) DESC
                 LIMIT 1)
        )
    );

    RETURN v_res;
END;
$$;

-- Detalle por paralelo del reporte institucional (HU-10: rectores y coordinadores)
-- Cumple con Zero-PII: métricas agregadas por curso, paralelo y docente.
CREATE OR REPLACE FUNCTION public.fn_reporte_institucional_paralelos(p_curso_bgu text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_inst uuid := public.fn_mi_institucion_id();
    v_rol  text := public.fn_mi_rol();
    v_res  jsonb;
BEGIN
    -- Control estricto de acceso RBAC por tenant: solo rectores y administradores de la institución
    IF v_inst IS NULL OR v_rol NOT IN ('COORDINADOR_RECTOR', 'ADMIN') THEN
        RAISE EXCEPTION 'No autorizado' USING ERRCODE = '42501';
    END IF;

    WITH docentes_inst AS (
        SELECT u.id, u.nombre_completo, u.email_institucional, u.asignatura_principal_id
          FROM public.usuarios_institucionales u
         WHERE u.institucion_id = v_inst
    ),
    aulas_filtradas AS (
        SELECT a.id AS aula_id,
               a.pin_acceso,
               a.titulo_sesion,
               COALESCE(NULLIF(trim(a.paralelo), ''), 'A') AS paralelo,
               a.activa,
               a.docente_id,
               COALESCE(p.curso_bgu, '2do BGU') AS curso_bgu,
               d.nombre_completo AS docente_nombre,
               d.email_institucional AS docente_email,
               COALESCE(asig.nombre, 'Matemáticas') AS asignatura_nombre
          FROM public.aulas_virtuales a
          JOIN docentes_inst d ON d.id = a.docente_id
          LEFT JOIN public.planificaciones_erca p ON p.id = a.planificacion_id
          LEFT JOIN public.asignaturas asig ON asig.id = COALESCE(p.asignatura_id, d.asignatura_principal_id)
         WHERE (p_curso_bgu IS NULL OR COALESCE(p.curso_bgu, '2do BGU') = p_curso_bgu)
    ),
    metricas_aula AS (
        SELECT af.curso_bgu,
               af.paralelo,
               af.docente_nombre,
               af.docente_email,
               af.asignatura_nombre,
               COUNT(DISTINCT af.aula_id) AS total_aulas,
               COUNT(DISTINCT CASE WHEN af.activa THEN af.aula_id END) AS aulas_activas,
               COUNT(DISTINCT s.id) AS estudiantes_participantes,
               COUNT(i.id) AS total_intentos,
               COUNT(CASE WHEN i.logro_resolver THEN 1 END) AS ejercicios_resueltos,
               ROUND(
                   100.0 * COUNT(CASE WHEN i.logro_resolver AND i.pistas_socraticas_usadas > 0 THEN 1 END)
                   / NULLIF(COUNT(i.id), 0), 1
               ) AS pct_resueltos_con_ayuda,
               ROUND(AVG(i.pistas_socraticas_usadas)::numeric, 1) AS promedio_pistas,
               ROUND(AVG(COALESCE(i.tiempo_resolucion_segundos, s.tiempo_total_segundos))::numeric, 0) AS promedio_tiempo_segundos,
               (
                   SELECT i2.paso_bloqueo_detectado
                     FROM public.intentos_y_bloqueos_ejercicio i2
                     JOIN public.sesiones_estudiantes_anonimas s2 ON s2.id = i2.sesion_anonima_id
                     JOIN public.aulas_virtuales a2 ON a2.id = s2.aula_id
                     LEFT JOIN public.planificaciones_erca p2 ON p2.id = a2.planificacion_id
                    WHERE a2.docente_id IN (SELECT id FROM docentes_inst)
                      AND COALESCE(NULLIF(trim(a2.paralelo), ''), 'A') = af.paralelo
                      AND COALESCE(p2.curso_bgu, '2do BGU') = af.curso_bgu
                      AND i2.paso_bloqueo_detectado IS NOT NULL
                    GROUP BY i2.paso_bloqueo_detectado
                    ORDER BY COUNT(*) DESC
                    LIMIT 1
               ) AS paso_bloqueo_mas_frecuente,
               jsonb_build_object(
                   'COMPRENSION_LECTORA', COUNT(CASE WHEN i.paso_bloqueo_detectado = 'COMPRENSION_LECTORA' THEN 1 END),
                   'IDENTIFICACION_VARIABLES', COUNT(CASE WHEN i.paso_bloqueo_detectado = 'IDENTIFICACION_VARIABLES' THEN 1 END),
                   'PLANTEAMIENTO_ECUACION', COUNT(CASE WHEN i.paso_bloqueo_detectado = 'PLANTEAMIENTO_ECUACION' THEN 1 END),
                   'CALCULO', COUNT(CASE WHEN i.paso_bloqueo_detectado = 'CALCULO' THEN 1 END),
                   'INTERPRETACION_RESULTADO', COUNT(CASE WHEN i.paso_bloqueo_detectado = 'INTERPRETACION_RESULTADO' THEN 1 END)
               ) AS desglose_bloqueos
          FROM aulas_filtradas af
          LEFT JOIN public.sesiones_estudiantes_anonimas s ON s.aula_id = af.aula_id
          LEFT JOIN public.intentos_y_bloqueos_ejercicio i ON i.sesion_anonima_id = s.id
         GROUP BY af.curso_bgu, af.paralelo, af.docente_nombre, af.docente_email, af.asignatura_nombre
    )
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'curso_bgu', curso_bgu,
            'paralelo', paralelo,
            'docente_nombre', docente_nombre,
            'docente_email', docente_email,
            'asignatura', asignatura_nombre,
            'total_aulas', total_aulas,
            'aulas_activas', aulas_activas,
            'estudiantes_participantes', estudiantes_participantes,
            'total_intentos', total_intentos,
            'ejercicios_resueltos', ejercicios_resueltos,
            'pct_resueltos_con_ayuda', COALESCE(pct_resueltos_con_ayuda, 0),
            'promedio_pistas', COALESCE(promedio_pistas, 0),
            'promedio_tiempo_segundos', COALESCE(promedio_tiempo_segundos, 0),
            'paso_bloqueo_mas_frecuente', COALESCE(paso_bloqueo_mas_frecuente, 'SIN_BLOQUEOS'),
            'desglose_bloqueos', desglose_bloqueos
        ) ORDER BY curso_bgu, paralelo, docente_nombre
    ), '[]'::jsonb)
      INTO v_res
      FROM metricas_aula;

    RETURN v_res;
END;
$$;

-- ==============================================================================
-- PARTE B · 11. ROW LEVEL SECURITY (SOLO SUPABASE)
-- Nada de "USING (true)". El rol anon no tiene ninguna política sobre tablas v2.
-- ==============================================================================

ALTER TABLE public.asignaturas                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instituciones                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios_institucionales      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ejercicios_pisa               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planificaciones_erca          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planificacion_ejercicios      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aulas_virtuales               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aula_ejercicios               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sesiones_estudiantes_anonimas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intentos_y_bloqueos_ejercicio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensajes_tutor_socratico      ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pol_asignaturas_lectura ON public.asignaturas;
CREATE POLICY pol_asignaturas_lectura ON public.asignaturas
    FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS pol_instituciones_propia ON public.instituciones;
CREATE POLICY pol_instituciones_propia ON public.instituciones
    FOR SELECT TO authenticated
    USING (id = (SELECT public.fn_mi_institucion_id()));

DROP POLICY IF EXISTS pol_usuarios_misma_institucion ON public.usuarios_institucionales;
CREATE POLICY pol_usuarios_misma_institucion ON public.usuarios_institucionales
    FOR SELECT TO authenticated
    USING (institucion_id = (SELECT public.fn_mi_institucion_id()));

DROP POLICY IF EXISTS pol_usuarios_editar_perfil ON public.usuarios_institucionales;
CREATE POLICY pol_usuarios_editar_perfil ON public.usuarios_institucionales
    FOR UPDATE TO authenticated
    USING (id = (SELECT public.fn_mi_usuario_id()))
    WITH CHECK (id = (SELECT public.fn_mi_usuario_id()));

DROP POLICY IF EXISTS pol_ejercicios_lectura ON public.ejercicios_pisa;
CREATE POLICY pol_ejercicios_lectura ON public.ejercicios_pisa
    FOR SELECT TO authenticated
    USING (
        es_publico
        OR docente_creador_id = (SELECT public.fn_mi_usuario_id())
        OR EXISTS (SELECT 1 FROM public.usuarios_institucionales u
                    WHERE u.id = ejercicios_pisa.docente_creador_id
                      AND u.institucion_id = (SELECT public.fn_mi_institucion_id()))
    );

DROP POLICY IF EXISTS pol_ejercicios_insertar ON public.ejercicios_pisa;
CREATE POLICY pol_ejercicios_insertar ON public.ejercicios_pisa
    FOR INSERT TO authenticated
    WITH CHECK (docente_creador_id = (SELECT public.fn_mi_usuario_id()));

DROP POLICY IF EXISTS pol_ejercicios_editar ON public.ejercicios_pisa;
CREATE POLICY pol_ejercicios_editar ON public.ejercicios_pisa
    FOR UPDATE TO authenticated
    USING (docente_creador_id = (SELECT public.fn_mi_usuario_id()))
    WITH CHECK (docente_creador_id = (SELECT public.fn_mi_usuario_id()));

DROP POLICY IF EXISTS pol_ejercicios_eliminar ON public.ejercicios_pisa;
CREATE POLICY pol_ejercicios_eliminar ON public.ejercicios_pisa
    FOR DELETE TO authenticated
    USING (docente_creador_id = (SELECT public.fn_mi_usuario_id()));

DROP POLICY IF EXISTS pol_planificaciones_propias ON public.planificaciones_erca;
CREATE POLICY pol_planificaciones_propias ON public.planificaciones_erca
    FOR ALL TO authenticated
    USING (docente_id = (SELECT public.fn_mi_usuario_id()))
    WITH CHECK (docente_id = (SELECT public.fn_mi_usuario_id()));

DROP POLICY IF EXISTS pol_plan_ejercicios_propios ON public.planificacion_ejercicios;
CREATE POLICY pol_plan_ejercicios_propios ON public.planificacion_ejercicios
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.planificaciones_erca p
                    WHERE p.id = planificacion_ejercicios.planificacion_id
                      AND p.docente_id = (SELECT public.fn_mi_usuario_id())))
    WITH CHECK (EXISTS (SELECT 1 FROM public.planificaciones_erca p
                         WHERE p.id = planificacion_ejercicios.planificacion_id
                           AND p.docente_id = (SELECT public.fn_mi_usuario_id())));

DROP POLICY IF EXISTS pol_aulas_propias ON public.aulas_virtuales;
CREATE POLICY pol_aulas_propias ON public.aulas_virtuales
    FOR ALL TO authenticated
    USING (docente_id = (SELECT public.fn_mi_usuario_id()))
    WITH CHECK (docente_id = (SELECT public.fn_mi_usuario_id()));

DROP POLICY IF EXISTS pol_aula_ejercicios_propios ON public.aula_ejercicios;
CREATE POLICY pol_aula_ejercicios_propios ON public.aula_ejercicios
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.aulas_virtuales a
                    WHERE a.id = aula_ejercicios.aula_id
                      AND a.docente_id = (SELECT public.fn_mi_usuario_id())))
    WITH CHECK (EXISTS (SELECT 1 FROM public.aulas_virtuales a
                         WHERE a.id = aula_ejercicios.aula_id
                           AND a.docente_id = (SELECT public.fn_mi_usuario_id())));

-- Telemetría: el docente SOLO lee (las escrituras pasan por las RPC)
DROP POLICY IF EXISTS pol_sesiones_docente ON public.sesiones_estudiantes_anonimas;
CREATE POLICY pol_sesiones_docente ON public.sesiones_estudiantes_anonimas
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.aulas_virtuales a
                    WHERE a.id = sesiones_estudiantes_anonimas.aula_id
                      AND a.docente_id = (SELECT public.fn_mi_usuario_id())));

DROP POLICY IF EXISTS pol_intentos_docente ON public.intentos_y_bloqueos_ejercicio;
CREATE POLICY pol_intentos_docente ON public.intentos_y_bloqueos_ejercicio
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1
                     FROM public.sesiones_estudiantes_anonimas s
                     JOIN public.aulas_virtuales a ON a.id = s.aula_id
                    WHERE s.id = intentos_y_bloqueos_ejercicio.sesion_anonima_id
                      AND a.docente_id = (SELECT public.fn_mi_usuario_id())));

DROP POLICY IF EXISTS pol_mensajes_docente ON public.mensajes_tutor_socratico;
CREATE POLICY pol_mensajes_docente ON public.mensajes_tutor_socratico
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1
                     FROM public.intentos_y_bloqueos_ejercicio i
                     JOIN public.sesiones_estudiantes_anonimas s ON s.id = i.sesion_anonima_id
                     JOIN public.aulas_virtuales a ON a.id = s.aula_id
                    WHERE i.id = mensajes_tutor_socratico.intento_id
                      AND a.docente_id = (SELECT public.fn_mi_usuario_id())));

-- ==============================================================================
-- PARTE B · 12. PRIVILEGIOS (mínimo privilegio)
-- Supabase da todo a anon/authenticated por defecto; aquí se recorta.
-- Solo afecta objetos v2; las tablas v1 no se tocan.
-- ==============================================================================

REVOKE ALL ON
    public.instituciones, public.usuarios_institucionales, public.ejercicios_pisa,
    public.planificaciones_erca, public.planificacion_ejercicios, public.aulas_virtuales,
    public.aula_ejercicios, public.sesiones_estudiantes_anonimas,
    public.intentos_y_bloqueos_ejercicio, public.mensajes_tutor_socratico,
    public.vw_tiempo_ahorrado_docente, public.vw_completitud_socratica_aula, public.vw_pasos_bloqueo_aula
FROM anon;

REVOKE INSERT, UPDATE, DELETE ON public.asignaturas FROM anon, authenticated;
GRANT SELECT ON public.asignaturas TO anon, authenticated;

REVOKE INSERT, UPDATE, DELETE ON public.instituciones FROM authenticated;
REVOKE INSERT, DELETE ON public.usuarios_institucionales FROM authenticated;
REVOKE UPDATE ON public.usuarios_institucionales FROM authenticated;
GRANT UPDATE (nombre_completo, asignatura_principal_id) ON public.usuarios_institucionales TO authenticated;

REVOKE INSERT, UPDATE, DELETE ON
    public.sesiones_estudiantes_anonimas, public.intentos_y_bloqueos_ejercicio, public.mensajes_tutor_socratico
FROM authenticated;

GRANT SELECT ON public.vw_tiempo_ahorrado_docente, public.vw_completitud_socratica_aula,
                public.vw_pasos_bloqueo_aula TO authenticated;

-- Funciones: Postgres da EXECUTE a PUBLIC por defecto -> se revoca y se otorga lo justo
REVOKE EXECUTE ON FUNCTION
    public.fn_set_updated_at(),
    public.fn_baseline_segundos_manual(),
    public.fn_validar_limite_docentes(),
    public.fn_validar_pin_global(),
    public.fn_proteger_ejercicio_publicado(),
    public.fn_validar_intento_en_ambito(),
    public.fn_ejercicio_json_estudiante(public.ejercicios_pisa),
    public.fn_sesion_autorizada(uuid, text, boolean),
    public.fn_contenido_sesion(uuid, text),
    public.fn_iniciar_sesion_anonima(text, text),
    public.fn_solicitar_pista(uuid, text, uuid),
    public.fn_registrar_intento(uuid, text, uuid, boolean, text, smallint, boolean, integer),
    public.fn_registrar_mensaje(uuid, text, uuid, text, text, text, integer),
    public.fn_finalizar_sesion(uuid, text),
    public.fn_cerrar_sesiones_inactivas(integer),
    public.fn_purgar_datos_anonimos(integer),
    public.fn_mi_usuario_id(),
    public.fn_mi_institucion_id(),
    public.fn_mi_rol(),
    public.fn_vincular_usuario_auth(),
    public.fn_dashboard_institucion(),
    public.fn_reporte_institucional_paralelos(text)
FROM PUBLIC, anon, authenticated;

-- Estudiante anónimo
GRANT EXECUTE ON FUNCTION
    public.fn_iniciar_sesion_anonima(text, text),
    public.fn_contenido_sesion(uuid, text),
    public.fn_solicitar_pista(uuid, text, uuid),
    public.fn_registrar_intento(uuid, text, uuid, boolean, text, smallint, boolean, integer),
    public.fn_registrar_mensaje(uuid, text, uuid, text, text, text, integer),
    public.fn_finalizar_sesion(uuid, text)
TO anon, authenticated;

-- Docente / rector (las políticas RLS y las vistas las necesitan)
GRANT EXECUTE ON FUNCTION
    public.fn_mi_usuario_id(),
    public.fn_mi_institucion_id(),
    public.fn_mi_rol(),
    public.fn_baseline_segundos_manual(),
    public.fn_dashboard_institucion(),
    public.fn_reporte_institucional_paralelos(text)
TO authenticated;

-- ==============================================================================
-- PARTE B · 13. REALTIME: dashboard en vivo del docente (respeta RLS)
-- ==============================================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
       AND NOT EXISTS (SELECT 1 FROM pg_publication_tables
                        WHERE pubname = 'supabase_realtime'
                          AND schemaname = 'public'
                          AND tablename = 'intentos_y_bloqueos_ejercicio') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.intentos_y_bloqueos_ejercicio;
    END IF;
END $$;

COMMIT;
