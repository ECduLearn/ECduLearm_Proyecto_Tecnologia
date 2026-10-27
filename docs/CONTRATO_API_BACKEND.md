# CONTRATO DE INTEGRACIÓN API REST — FRONTEND & BACKEND

**Proyecto:** ECduLearn (ECduLearn Web) — Plataforma EdTech SaaS B2B  
**Destinatario:** Joan Sebastian Santacruz Villamarin (Backend Developer)  
**Remitente / Autor:** Ariel Fabricio Chacha Pilco (Scrum Master & Tech Lead)  
**Consumidor de API en Frontend:** `/src/services/apiAdapter.ts`  
**Versión de Contrato:** `v1.0.0` (SemVer)  
**Formato de Intercambio:** `application/json; charset=utf-8`  
**URL Base de Referencia:** `http://localhost:3000/api` (Configurable en `.env` mediante `VITE_BACKEND_URL`)

---

## 1. Convenciones y Principios de Diseño
1. **Separación Estricta:** El frontend desacopla todas las peticiones a través del patrón adaptador (`apiAdapter.ts`).
2. **Privacidad de Menores (Cero Datos Personales):** Ningún endpoint de estudiantes recibe o almacena nombres, correos o teléfonos. Todo acceso de alumnos opera exclusivamente bajo el identificador de sesión `pin` de 6 caracteres (ej. `PISA26`).
3. **Códigos de Estado HTTP Estándar:**
   - `200 OK`: Consulta o actualización exitosa.
   - `201 Created`: Recurso creado satisfactoriamente.
   - `400 Bad Request`: Parámetros faltantes o JSON inválido.
   - `404 Not Found`: Recurso no encontrado (ej. PIN no existe o caducó).
   - `500 Internal Server Error`: Falla en el servidor o base de datos.

---

## 2. Endpoints de Ejercicios PISA y ERCA

### 2.1. Listar Ejercicios
- **Método:** `GET`
- **Ruta:** `/api/ejercicios`
- **Descripción:** Retorna la lista de ejercicios PISA disponibles en el repositorio curricular.
- **Respuesta Exitosa (`200 OK`):**
```json
[
  {
    "id": "pisa-1bgu-metro",
    "topic": "Sistemas de Ecuaciones Lineales y Función Afín",
    "context": "Transporte Urbano · Metro de Quito",
    "level": "1ro BGU",
    "difficulty": "Intermedia",
    "questions": 3,
    "version": 1,
    "situation": "El Metro de Quito conecta Quitumbe con El Labrador...",
    "questionList": [
      "1. Identifica las dos incógnitas del problema...",
      "2. Resuelve el sistema empleando el método analítico...",
      "3. Si un colegio desea movilizar a 45 estudiantes..."
    ],
    "rubric": "Estándar PISA Nivel 3-4...",
    "teacherSolution": {
      "steps": [
        {
          "stepNumber": 1,
          "title": "Definición de variables",
          "explanation": "Sea x el pasaje sencillo y y el pasaje integrado...",
          "mathResult": "6x + 4y = 4.60"
        }
      ],
      "finalAnswer": "Pasaje sencillo: $0.35 USD | Integrado: $0.60 USD",
      "pedagogicalNotes": "Recordar tarifas en centavos."
    },
    "socraticHints": {
      "level1": "¿Cuáles son los dos elementos que se compran?",
      "level2": "¿Cómo escribirías que 6 sencillos y 4 integrados suman $4,60?",
      "level3": "Compara las dos ecuaciones para eliminar una variable."
    },
    "ercaStructure": {
      "experience": { "id": "experience", "tag": "Experiencia concreta", "duration": "10 min", "title": "Vivencia en el Metro", "body": "..." },
      "reflection": { "id": "reflection", "tag": "Reflexión crítica", "duration": "10 min", "title": "¿Por qué no adivinar?", "body": "..." },
      "conceptualization": { "id": "conceptualization", "tag": "Conceptualización", "duration": "15 min", "title": "Modelado algebraico", "body": "..." },
      "application": { "id": "application", "tag": "Aplicación y Transferencia", "duration": "10 min", "title": "Desafío tarifario", "body": "..." }
    }
  }
]
```

### 2.2. Crear o Actualizar Ejercicio
- **Método:** `POST`
- **Ruta:** `/api/ejercicios`
- **Descripción:** Guarda un ejercicio recién generado con IA o adaptado manualmente.
- **Cuerpo de Solicitud (`application/json`):**
```json
{
  "id": "pisa-custom-1718000000",
  "topic": "Trigonometría y Fuerzas",
  "context": "Ingeniería Civil",
  "level": "2do BGU",
  "difficulty": "Intermedia",
  "questions": 3,
  "version": 1,
  "situation": "Texto del problema contextualizado...",
  "questionList": ["Pregunta 1", "Pregunta 2", "Pregunta 3"],
  "rubric": "Rúbrica PISA",
  "teacherSolution": { ... },
  "socraticHints": { ... },
  "ercaStructure": { ... }
}
```
- **Respuesta Exitosa (`201 Created` o `200 OK`):**
Retorna el objeto del ejercicio persistido con su ID confirmado.

---

## 3. Endpoints de Aulas y Sesiones por PIN

### 3.1. Crear Sesión de Aula
- **Método:** `POST`
- **Ruta:** `/api/aulas`
- **Descripción:** Crea un aula activa asignada a un ejercicio y genera su código PIN.
- **Cuerpo de Solicitud (`application/json`):**
```json
{
  "pin": "PISA26",
  "ejercicioId": "pisa-2bgu-puente",
  "schoolName": "Colegio Experimental San Gabriel de Quito",
  "teacherName": "Lic. Carlos Mendoza",
  "subject": "Matemáticas y Geometría Aplicada",
  "course": "2do BGU Paralelo A"
}
```
- **Respuesta Exitosa (`201 Created`):**
```json
{
  "pin": "PISA26",
  "ejercicioId": "pisa-2bgu-puente",
  "schoolName": "Colegio Experimental San Gabriel de Quito",
  "teacherName": "Lic. Carlos Mendoza",
  "subject": "Matemáticas y Geometría Aplicada",
  "course": "2do BGU Paralelo A",
  "createdAt": "2026-10-19T08:00:00.000Z",
  "active": true,
  "metricas": {
    "totalEstudiantes": 38,
    "estudiantesActivos": 29,
    "pistasSolicitadas": 46,
    "ejerciciosCompletados": 23,
    "pasoMasDificil": "Paso 2: Relacionar cateto adyacente con coseno",
    "tasaResolucionSinCopia": "91.3%",
    "tiempoPromedioMinutos": 13.8,
    "distribucionDificultad": {
      "comprensionLectora": 18,
      "planteamientoEcuacion": 58,
      "resolucionAritmetica": 24
    }
  }
}
```

### 3.2. Obtener Aula Activa por PIN (Ingreso de Estudiantes)
- **Método:** `GET`
- **Ruta:** `/api/aulas/:pin`
- **Parámetro de Ruta:** `pin` (String alfanumérico en mayúsculas de 6 caracteres, ej. `PISA26`).
- **Respuesta Exitosa (`200 OK`):**
Retorna el objeto `AulaActiva`.
- **Respuesta Si No Existe (`404 Not Found`):**
```json
{
  "error": "NOT_FOUND",
  "message": "El código PIN ingresado no corresponde a ningún aula activa."
}
```

---

## 4. Endpoints de Interacciones y Analítica

### 4.1. Registrar Interacción Socrática
- **Método:** `POST`
- **Ruta:** `/api/interacciones`
- **Descripción:** Registra de forma anónima cada vez que un estudiante solicita una pista o completa un paso.
- **Cuerpo de Solicitud (`application/json`):**
```json
{
  "pin": "PISA26",
  "tipo": "pista",
  "detalle": "No entiendo el enunciado, ¿cómo empiezo?",
  "timestamp": 1729000000000
}
```
- **Respuesta Exitosa (`200 OK` o `201 Created`):**
```json
{
  "success": true,
  "message": "Interacción registrada correctamente"
}
```

### 4.2. Obtener Métricas Docentes
- **Método:** `GET`
- **Ruta:** `/api/metricas?pin=PISA26`
- **Respuesta Exitosa (`200 OK`):**
```json
{
  "totalEstudiantes": 38,
  "estudiantesActivos": 29,
  "pistasSolicitadas": 46,
  "ejerciciosCompletados": 23,
  "pasoMasDificil": "Paso 2: Relacionar cateto adyacente con coseno",
  "tasaResolucionSinCopia": "91.3%",
  "tiempoPromedioMinutos": 13.8,
  "distribucionDificultad": {
    "comprensionLectora": 18,
    "planteamientoEcuacion": 58,
    "resolucionAritmetica": 24
  }
}
```

---

## 5. Instrucciones para Joan (Entorno y Ejecución Backend)
1. Instalar dependencias en el servidor: `express`, `cors`, `dotenv`.
2. Habilitar CORS en Express:
```js
import cors from 'cors';
app.use(cors({ origin: ['http://localhost:5173', 'https://*.vercel.app'] }));
```
3. Cuando el backend esté listo y levantado (ej. en `http://localhost:3000`), el frontend cambia en su archivo `.env`:
```env
VITE_USE_MOCK_API=false
VITE_BACKEND_URL=http://localhost:3000/api
```
Y toda la aplicación operará inmediatamente contra el servidor real sin tocar una sola línea de la interfaz visual.
