-- ==============================================================================
-- ECduLearn · Políticas RLS del Panel de Administración
-- Archivo: supabase/admin_dashboard.sql (v2.2.0)
--
-- Un usuario autenticado con Supabase Auth y rol 'ADMIN' en usuarios_institucionales
-- (public.fn_mi_rol() = 'ADMIN') puede gestionar usuarios e instituciones.
-- El inicio de sesión lo hace Supabase Auth (signInWithPassword): no hay RPC de login.
-- ==============================================================================

BEGIN;

-- 1. Legado inseguro: devolvía el perfil con solo el correo, sin contraseña, y era
--    ejecutable por anon.
DROP FUNCTION IF EXISTS public.fn_login_docente(text);

-- 2. Gestión de usuarios e instituciones para el rol ADMIN
DROP POLICY IF EXISTS pol_admin_gestionar_usuarios ON public.usuarios_institucionales;
CREATE POLICY pol_admin_gestionar_usuarios ON public.usuarios_institucionales
    FOR ALL TO authenticated
    USING (public.fn_mi_rol() = 'ADMIN')
    WITH CHECK (public.fn_mi_rol() = 'ADMIN');

DROP POLICY IF EXISTS pol_admin_gestionar_instituciones ON public.instituciones;
CREATE POLICY pol_admin_gestionar_instituciones ON public.instituciones
    FOR ALL TO authenticated
    USING (public.fn_mi_rol() = 'ADMIN')
    WITH CHECK (public.fn_mi_rol() = 'ADMIN');

GRANT SELECT, INSERT, UPDATE, DELETE ON public.usuarios_institucionales TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.instituciones TO authenticated;

COMMIT;

-- ==============================================================================
-- 3. Promover un correo real a ADMIN (manual, desde el SQL Editor de Supabase)
--
-- Este script no crea administradores. Para dar el rol a una persona real:
--
--   a) La persona crea su cuenta en Supabase Auth (Authentication > Users) con su
--      correo institucional real y lo confirma.
--
--   b) Comprueba que existe y está confirmada:
--
--      SELECT id, email, email_confirmed_at
--        FROM auth.users
--       WHERE lower(email) = lower('correo.real@colegio.edu.ec');
--
--   c1) Si ya tiene fila en usuarios_institucionales, promuévela y vincúlala:
--
--      UPDATE public.usuarios_institucionales u
--         SET rol = 'ADMIN',
--             activo = true,
--             auth_user_id = a.id
--        FROM auth.users a
--       WHERE lower(a.email) = lower('correo.real@colegio.edu.ec')
--         AND a.email_confirmed_at IS NOT NULL
--         AND lower(u.email_institucional) = lower(a.email);
--
--   c2) Si no tiene fila, créala en su institución (reemplaza el UUID y el nombre):
--
--      INSERT INTO public.usuarios_institucionales
--             (institucion_id, nombre_completo, email_institucional, rol, activo, auth_user_id)
--      SELECT '<uuid-de-la-institucion>', 'Nombre Apellido', lower(a.email), 'ADMIN', true, a.id
--        FROM auth.users a
--       WHERE lower(a.email) = lower('correo.real@colegio.edu.ec')
--         AND a.email_confirmed_at IS NOT NULL;
--
--   d) Verifica: la persona inicia sesión y SELECT public.fn_mi_rol(); devuelve 'ADMIN'.
--
-- Nunca promuevas cuentas demo ni correos ficticios (p. ej. admin@ecdulearn.edu.ec):
-- sus credenciales son públicas en la app.
-- ==============================================================================
