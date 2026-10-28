# Contratos Técnicos Formales (OpenAPI 3.1 y RPC PostgreSQL v2.0.0) — ECduLearn

- **Proyecto:** ECduLearn — Plataforma EdTech SaaS B2B (1ro a 3ro BGU · Ecuador)
- **Propósito:** Definir la única fuente de verdad (*Single Source of Truth*) para la integración entre el Frontend React (`src/services/`), la función Serverless de Inteligencia Artificial ([`api/ai.ts`](file:///c:/ECduLearn_Software/api/ai.ts)) y las funciones RPC de Supabase PostgreSQL ([`supabase/schema.sql`](file:///c:/ECduLearn_Software/supabase/schema.sql) v2.0.0), sincronizada con el commit `f9f95f1`.

---

## 1. Contrato OpenAPI 3.1.0 — Servicio Serverless de IA (`/api/ai`)

```yaml
openapi: 3.1.0
info:
  title: ECduLearn AI Pedagogical Gateway API
  version: 2.1.0
  description: >
    Contrato formal del endpoint Serverless (/api/ai) que intermedia entre el cliente web ECduLearn
    y Google Gemini API, garantizando el candado pedagógico anti-copia del Tutor Socrático,
    la generación de ejercicios PISA con solución paso a paso exclusiva para el docente y la
    estructuración de planificaciones ministeriales ERCA.
servers:
  - url: https://ecdulearn.vercel.app
    description: Servidor de Producción (Vercel)
  - url: http://localhost:5173
    description: Servidor de Desarrollo Local (Vite Plugin vercelApiDev)

paths:
  /api/ai:
    post:
      operationId: invokePedagogicalAI
      summary: Ejecuta una tarea pedagógica de IA (Ejercicio PISA, Tutor Socrático o Plan ERCA)
      requestBody:
        required: true
        content:
          application/json:
            schema:
              oneOf:
                - $ref: "#/components/schemas/ExerciseRequest"
                - $ref: "#/components/schemas/SocraticRequest"
                - $ref: "#/components/schemas/ErcaRequest"
      responses:
        "200":
          description: Respuesta generada exitosamente por el modelo de IA.
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/AiSuccessResponse"
        "400":
          description: Cuerpo JSON malformado (`invalid_json`).
        "403":
          description: Origen CORS no permitido (`origin_not_allowed`).
        "405":
          description: Método HTTP no permitido (`method_not_allowed`).
        "413":
          description: El cuerpo supera el límite de 24 KB (`payload_too_large`).
        "422":
          description: Tarea inválida (`invalid_task`) o campo requerido faltante (`missing_<campo>`).
        "429":
          description: Límite de peticiones por IP superado (`rate_limited`, máx. 20 req/min).
        "502":
          description: Ningún modelo de la cascada respondió a tiempo (`ai_unavailable`).
        "503":
          description: Clave GEMINI_API_KEY no configurada en el servidor (`ai_not_configured`).

components:
  schemas:
    ExerciseRequest:
      type: object
      required: [task, input]
      properties:
        task:
          type: string
          const: exercise
        input:
          type: object
          required: [prompt]
          properties:
            prompt:
              type: string
              minLength: 1
              maxLength: 1200
            level:
              type: string
              maxLength: 40
            context:
              type: string
              maxLength: 80
            difficulty:
              type: string
              maxLength: 40
            currentExerciseJson:
              type: string
              maxLength: 4000

    SocraticRequest:
      type: object
      required: [task, input]
      properties:
        task:
          type: string
          const: socratic
        input:
          type: object
          required: [studentMessage, exerciseTitle, exerciseBody]
          properties:
            studentMessage:
              type: string
              minLength: 1
              maxLength: 600
            exerciseTitle:
              type: string
              minLength: 1
              maxLength: 200
            exerciseBody:
              type: string
              minLength: 1
              maxLength: 2500
            question:
              type: string
              maxLength: 600
            stepContext:
              type: string
              maxLength: 300
            historyText:
              type: string
              maxLength: 2500

    ErcaRequest:
      type: object
      required: [task, input]
      properties:
        task:
          type: string
          const: erca
        input:
          type: object
          required: [topic]
          properties:
            topic:
              type: string
              minLength: 1
              maxLength: 200
            course:
              type: string
              maxLength: 60
            partialIdea:
              type: string
              maxLength: 800

    AiSuccessResponse:
      type: object
      required: [text, model]
      properties:
        text:
          type: string
        model:
          type: string
          example: gemini-2.5-flash
```

---

## 2. Contrato de Funciones RPC PostgreSQL (`supabase/schema.sql` v2.0.0)

| Función RPC (`public.*`) | Rol Invocador | Parámetros de Entrada | Retorno (`RETURNS`) | Reglas de Negocio y Seguridad Aplicadas |
| :--- | :---: | :--- | :--- | :--- |
| [`fn_iniciar_sesion_anonima`](file:///c:/ECduLearn_Software/supabase/schema.sql#L676-L775) | `anon`, `authenticated` | `p_pin TEXT`,<br>`p_token_hash TEXT` | `JSONB` (`sesion_id`, `alias`, `modo`, `reanudada`) | Valida el PIN (`^[A-Z0-9]{6}$`) de aula o grado autónomo, verifica vigencia y aforo con `pg_advisory_xact_lock`, y registra `Estudiante #N` + hash SHA-256 (`token_dispositivo_hash`). |
| [`fn_contenido_sesion`](file:///c:/ECduLearn_Software/supabase/schema.sql#L620-L672) | `anon`, `authenticated` | `p_sesion_id UUID`,<br>`p_token_hash TEXT` | `JSONB` (`titulo`, `modo`, `tiempo_limite_minutos`, `ejercicios`) | Valida `token_dispositivo_hash` con `fn_sesion_autorizada`. **Jamás proyecta `solucion_paso_a_paso_docente`, `respuesta_correcta` ni el texto de `pistas_socraticas_base`.** |
| [`fn_solicitar_pista`](file:///c:/ECduLearn_Software/supabase/schema.sql#L777-L824) | `anon`, `authenticated` | `p_sesion_id UUID`,<br>`p_token_hash TEXT`,<br>`p_ejercicio_id UUID` | `JSONB` (`pista`, `numero`, `restantes`) | Incrementa `pistas_socraticas_usadas` en `intentos_y_bloqueos_ejercicio` y entrega únicamente la siguiente pista en orden. |
| [`fn_registrar_intento`](file:///c:/ECduLearn_Software/supabase/schema.sql#L826-L879) | `anon`, `authenticated` | `p_sesion_id UUID`,<br>`p_token_hash TEXT`,<br>`p_ejercicio_id UUID`,<br>`p_logro_resolver BOOLEAN`,<br>`p_paso_bloqueo TEXT`,<br>`p_opcion_seleccionada SMALLINT`,<br>`p_marcada_con_bandera BOOLEAN`,<br>`p_tiempo_segundos INT` | `JSONB` (`intento_id`, `logro_resolver`, `numero_intentos`) | En modo `SIMULADOR_ADMISION`, calcula en el servidor si `p_opcion_seleccionada` coincide con la respuesta correcta sin exponerla al cliente. |
| [`fn_registrar_mensaje`](file:///c:/ECduLearn_Software/supabase/schema.sql#L881-L914) | `anon`, `authenticated` | `p_sesion_id UUID`,<br>`p_token_hash TEXT`,<br>`p_ejercicio_id UUID`,<br>`p_remitente TEXT`,<br>`p_tipo_interaccion TEXT`,<br>`p_contenido TEXT`,<br>`p_tokens_consumidos INT` | `BIGINT` (`v_mensaje_id`) | Registra mensajes del estudiante y del tutor socrático (incluyendo `REVISION_POST_SIMULADOR` e `INTENTO_COPIA_BLOQUEADO`). |
| [`fn_finalizar_sesion`](file:///c:/ECduLearn_Software/supabase/schema.sql#L916-L954) | `anon`, `authenticated` | `p_sesion_id UUID`,<br>`p_token_hash TEXT` | `JSONB` (`estado`, `puntaje_simulador`, `tiempo_total_segundos`) | Cierra la sesión (`COMPLETADO`) y, si es `SIMULADOR_ADMISION`, calcula `puntaje_simulador` sobre 100. |
| [`fn_dashboard_institucion`](file:///c:/ECduLearn_Software/supabase/schema.sql#L1140-L1199) | `authenticated` | *(Usa `fn_mi_institucion_id()` y `fn_mi_rol()`)* | `JSONB` | Exclusivo para roles `COORDINADOR_RECTOR` y `ADMIN`: agrega docentes activos, ejercicios creados, horas ahorradas, sesiones anónimas y paso de bloqueo más frecuente. |

