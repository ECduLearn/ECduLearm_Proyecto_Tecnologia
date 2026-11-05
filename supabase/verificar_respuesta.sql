-- ==============================================================================
-- ECduLearn · Verificación de la respuesta final del estudiante (v0.3.0)
-- Archivo: supabase/verificar_respuesta.sql
--
-- Migración para bases que ya tienen schema.sql v2.0.0. La misma definición vive en
-- schema.sql, que sigue siendo la fuente de verdad.
--
-- El estudiante escribe su resultado ("12", "12.0", "12 m", "x = 7,75") y el servidor lo compara
-- con respuesta_correcta. La respuesta correcta nunca sale de la base: solo se devuelve si acertó.
-- ==============================================================================

BEGIN;

-- Números que aparecen en un texto, en orden. Acepta coma o punto decimal.
CREATE OR REPLACE FUNCTION public.fn_numeros_en_texto(p_texto text)
RETURNS numeric[]
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
    SELECT coalesce(array_agg(replace(t.m[1], ',', '.')::numeric ORDER BY t.ord), '{}')
      FROM regexp_matches(coalesce(p_texto, ''), '(-?[0-9]+(?:[.,][0-9]+)?)', 'g') WITH ORDINALITY AS t(m, ord);
$$;

-- Compara el último número que escribió el estudiante con los resultados de respuesta_correcta
-- (tolerancia del 1 %). Los números que ya son datos del enunciado no cuentan como resultado.
-- Si la respuesta correcta no tiene números, devuelve verificable = false y no registra nada.
CREATE OR REPLACE FUNCTION public.fn_verificar_respuesta(
    p_sesion_id    uuid,
    p_token_hash   text,
    p_ejercicio_id uuid,
    p_respuesta    text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_sesion     public.sesiones_estudiantes_anonimas;
    v_clave      text;
    v_enunciado  text;
    v_opciones   jsonb;
    v_resultados numeric[];
    v_filtrados  numeric[];
    v_alumno     numeric[];
    v_final      numeric;
    v_correcta   boolean;
    v_intento    public.intentos_y_bloqueos_ejercicio;
BEGIN
    v_sesion := public.fn_sesion_autorizada(p_sesion_id, p_token_hash, true);

    IF length(coalesce(p_respuesta, '')) > 500 THEN
        RAISE EXCEPTION 'Respuesta demasiado larga' USING ERRCODE = '22001';
    END IF;

    SELECT e.respuesta_correcta, e.enunciado_contexto, e.opciones_respuesta
      INTO v_clave, v_enunciado, v_opciones
      FROM public.ejercicios_pisa e
     WHERE e.id = p_ejercicio_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Ejercicio no encontrado' USING ERRCODE = 'P0002';
    END IF;
    IF v_opciones IS NOT NULL THEN
        RAISE EXCEPTION 'Las preguntas de opción múltiple se registran con fn_registrar_intento' USING ERRCODE = '22023';
    END IF;

    v_resultados := public.fn_numeros_en_texto(v_clave);
    IF cardinality(v_resultados) = 0 THEN
        RETURN jsonb_build_object('verificable', false);
    END IF;

    SELECT coalesce(array_agg(r), '{}') INTO v_filtrados
      FROM unnest(v_resultados) AS r
     WHERE NOT EXISTS (
            SELECT 1 FROM unnest(public.fn_numeros_en_texto(v_enunciado)) AS d
             WHERE abs(r - d) <= greatest(0.01, abs(d) * 0.01));
    IF cardinality(v_filtrados) > 0 THEN
        v_resultados := v_filtrados;
    END IF;

    v_alumno := public.fn_numeros_en_texto(p_respuesta);
    v_final := v_alumno[cardinality(v_alumno)];
    v_correcta := v_final IS NOT NULL AND EXISTS (
        SELECT 1 FROM unnest(v_resultados) AS r
         WHERE abs(v_final - r) <= greatest(0.01, abs(r) * 0.01));

    -- fn_validar_intento_en_ambito (trigger) comprueba que el ejercicio sea de esta sesión
    INSERT INTO public.intentos_y_bloqueos_ejercicio AS i (
        sesion_anonima_id, ejercicio_id, logro_resolver, numero_intentos)
    VALUES (v_sesion.id, p_ejercicio_id, v_correcta, 1)
    ON CONFLICT (sesion_anonima_id, ejercicio_id) DO UPDATE SET
        numero_intentos = i.numero_intentos + 1,
        logro_resolver  = i.logro_resolver OR EXCLUDED.logro_resolver
    RETURNING * INTO v_intento;

    RETURN jsonb_build_object(
        'verificable',     true,
        'correcta',        v_correcta,
        'numero_intentos', v_intento.numero_intentos
    );
END;
$$;

REVOKE ALL ON FUNCTION public.fn_numeros_en_texto(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_verificar_respuesta(uuid, text, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_verificar_respuesta(uuid, text, uuid, text) TO anon, authenticated;

COMMIT;
