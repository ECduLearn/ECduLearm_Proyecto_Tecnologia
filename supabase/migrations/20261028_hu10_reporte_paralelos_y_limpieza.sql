-- ==============================================================================
-- ECduLearn · Migración: HU-10 Detalle por Paralelo y Limpieza de Datos de Prueba
-- Archivo: supabase/migrations/20261028_hu10_reporte_paralelos_y_limpieza.sql
-- Proyecto Supabase: ihnrldouoqhglskszsoe (Esquema v2)
--
-- Contenido:
-- 1. Borrado defensivo de planificaciones de prueba (ae6577cf... y cdbce724...)
-- 2. Columna 'paralelo' en 'public.aulas_virtuales'
-- 3. Función RPC 'public.fn_reporte_institucional_paralelos' (HU-10) con Zero-PII
-- 4. Permisos mínimos: solo authenticated (COORDINADOR_RECTOR y ADMIN)
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. LIMPIEZA DE DATOS DE PRUEBA (Planificaciones ae6577cf... y cdbce724...)
-- ------------------------------------------------------------------------------

-- 1.1 Desvincular o eliminar ejercicios asociados a aulas de esas planificaciones
DELETE FROM public.aula_ejercicios ae
 WHERE EXISTS (
     SELECT 1 FROM public.aulas_virtuales a
      WHERE a.id = ae.aula_id
        AND (a.planificacion_id::text LIKE 'ae6577cf%' OR a.planificacion_id::text LIKE 'cdbce724%')
 );

-- 1.2 Desvincular o eliminar intentos y sesiones asociadas a esas aulas de prueba
DELETE FROM public.intentos_y_bloqueos_ejercicio i
 WHERE EXISTS (
     SELECT 1 FROM public.sesiones_estudiantes_anonimas s
      JOIN public.aulas_virtuales a ON a.id = s.aula_id
     WHERE s.id = i.sesion_anonima_id
       AND (a.planificacion_id::text LIKE 'ae6577cf%' OR a.planificacion_id::text LIKE 'cdbce724%')
 );

DELETE FROM public.sesiones_estudiantes_anonimas s
 WHERE EXISTS (
     SELECT 1 FROM public.aulas_virtuales a
      WHERE a.id = s.aula_id
        AND (a.planificacion_id::text LIKE 'ae6577cf%' OR a.planificacion_id::text LIKE 'cdbce724%')
 );

-- 1.3 Eliminar aulas virtuales vinculadas a las planificaciones de prueba
DELETE FROM public.aulas_virtuales
 WHERE planificacion_id::text LIKE 'ae6577cf%'
    OR planificacion_id::text LIKE 'cdbce724%';

-- 1.4 Eliminar relación de ejercicios de la planificación
DELETE FROM public.planificacion_ejercicios
 WHERE planificacion_id::text LIKE 'ae6577cf%'
    OR planificacion_id::text LIKE 'cdbce724%';

-- 1.5 Eliminar las planificaciones de prueba
DELETE FROM public.planificaciones_erca
 WHERE id::text LIKE 'ae6577cf%'
    OR id::text LIKE 'cdbce724%';


-- ------------------------------------------------------------------------------
-- 2. EVOLUCIÓN DE ESQUEMA: COLUMNA 'paralelo' EN 'aulas_virtuales'
-- ------------------------------------------------------------------------------

ALTER TABLE public.aulas_virtuales
    ADD COLUMN IF NOT EXISTS paralelo VARCHAR(20) NOT NULL DEFAULT 'A';

COMMENT ON COLUMN public.aulas_virtuales.paralelo IS
    'Identificador de sección o paralelo académico (ej. A, B, C, Matutino-A)';


-- ------------------------------------------------------------------------------
-- 3. FUNCIÓN RPC: DETALLE POR PARALELO DEL REPORTE INSTITUCIONAL (HU-10)
-- ------------------------------------------------------------------------------

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


-- ------------------------------------------------------------------------------
-- 4. SEGURIDAD Y PERMISOS DE EJECUCIÓN (MÍNIMO PRIVILEGIO / ZERO-ANON POLICY)
-- ------------------------------------------------------------------------------

-- anon NUNCA debe tener acceso a reportes institucionales
REVOKE ALL ON FUNCTION public.fn_reporte_institucional_paralelos(text) FROM PUBLIC, anon;

-- Solo usuarios institucionales autenticados (la función valida rol COORDINADOR_RECTOR o ADMIN)
GRANT EXECUTE ON FUNCTION public.fn_reporte_institucional_paralelos(text) TO authenticated;

COMMIT;
