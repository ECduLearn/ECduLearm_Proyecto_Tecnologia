-- ==============================================================================
-- ECduLearn · Complemento SQL para Dashboard de Administración y Control de Usuarios
-- Archivo: supabase/admin_dashboard.sql (v2.1.0)
-- 
-- Permite a los administradores de ECduLearn crear, revocar y otorgar permisos
-- a usuarios institucionales (docentes y coordinadores) y ejecutar el login RPC.
-- ==============================================================================

BEGIN;

-- 1. Función RPC para autenticación de Docentes y Administradores (usada en authController.loginDocente)
CREATE OR REPLACE FUNCTION public.fn_login_docente(p_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_user record;
    v_inst record;
BEGIN
    -- Normalizar correo a minúsculas
    p_email := lower(trim(p_email));

    SELECT u.id, u.nombre_completo, u.email_institucional, u.rol, u.institucion_id, u.activo
      INTO v_user
      FROM public.usuarios_institucionales u
     WHERE lower(u.email_institucional) = p_email;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'El correo institucional no está registrado en ninguna institución.'
        );
    END IF;

    IF NOT v_user.activo THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Esta cuenta institucional se encuentra suspendida o con permisos revocados.'
        );
    END IF;

    -- Obtener institución
    SELECT i.nombre, i.activa, i.plan_suscripcion
      INTO v_inst
      FROM public.instituciones i
     WHERE i.id = v_user.institucion_id;

    IF v_inst.plan_suscripcion = 'SUSPENDIDA' THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'La suscripción institucional del plantel educativo está suspendida.'
        );
    END IF;

    -- Actualizar marca de último acceso
    UPDATE public.usuarios_institucionales
       SET ultimo_acceso_en = now()
     WHERE id = v_user.id;

    RETURN jsonb_build_object(
        'success', true,
        'id', v_user.id,
        'name', v_user.nombre_completo,
        'email', v_user.email_institucional,
        'role', v_user.rol,
        'institution', COALESCE(v_inst.nombre, 'ECduLearn Partner'),
        'message', 'Bienvenido a ECduLearn, ' || v_user.nombre_completo
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_login_docente(text) TO anon, authenticated;

-- 2. Asegurar que los administradores puedan listar y gestionar usuarios en Supabase
-- Si se usa RLS con autenticación Supabase Auth:
DROP POLICY IF EXISTS pol_admin_gestionar_usuarios ON public.usuarios_institucionales;
CREATE POLICY pol_admin_gestionar_usuarios ON public.usuarios_institucionales
    FOR ALL TO authenticated
    USING (public.fn_mi_rol() = 'ADMIN')
    WITH CHECK (public.fn_mi_rol() = 'ADMIN');

-- Otorgar permisos a authenticated para usuarios_institucionales
GRANT SELECT, INSERT, UPDATE, DELETE ON public.usuarios_institucionales TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.instituciones TO authenticated;

-- 3. Cuentas administradoras semilla en la base de datos
INSERT INTO public.usuarios_institucionales (id, institucion_id, nombre_completo, email_institucional, rol, activo)
VALUES 
    ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', '11111111-1111-4111-8111-111111111111', 'Joan Sebastian Santacruz', 'joan.santacruz@ecdulearn.edu.ec', 'ADMIN', true),
    ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '11111111-1111-4111-8111-111111111111', 'Ariel Fabricio Chacha', 'ariel.chacha@ecdulearn.edu.ec', 'ADMIN', true),
    ('99999999-9999-4999-8999-999999999999', '11111111-1111-4111-8111-111111111111', 'Super Administrador ECduLearn', 'admin@ecdulearn.edu.ec', 'ADMIN', true)
ON CONFLICT (email_institucional) DO UPDATE
    SET rol = 'ADMIN', activo = true;

COMMIT;
