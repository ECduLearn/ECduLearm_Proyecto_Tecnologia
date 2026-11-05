// Atajos del asistente docente: la etiqueta se ve en el chat y la instrucción es lo que recibe la IA
export interface AccionIA {
  etiqueta: string

  instruccion: string
}

export const ACCIONES_EJERCICIO: AccionIA[] = [
  {
    etiqueta: "Más fácil",
    instruccion:
      "Haz este ejercicio más fácil: baja la dificultad a Básica, usa números más simples y agrega una pregunta guía al inicio. Conserva el contexto y reescribe la solución y las pistas.",
  },
  {
    etiqueta: "Más difícil",
    instruccion:
      "Haz este ejercicio más difícil: sube la dificultad a Avanzada, agrega una condición o restricción nueva y una pregunta de argumentación. Conserva el contexto y reescribe la solución y las pistas.",
  },
  {
    etiqueta: "Cambiar contexto",
    instruccion:
      "Cambia el contexto de este ejercicio a otra situación real de Ecuador, distinta de la actual, conservando el mismo contenido matemático, el curso y la dificultad. Reescribe la solución y las pistas.",
  },
  {
    etiqueta: "Lectura comprensiva",
    instruccion:
      "Enfoca este ejercicio en la lectura comprensiva: amplía la situación con información relevante e irrelevante, y agrega una primera pregunta para identificar los datos útiles antes de calcular. Reescribe la solución y las pistas.",
  },
  {
    etiqueta: "Orientación PISA",
    instruccion:
      "Revisa este ejercicio con criterios PISA: explica qué proceso evalúa (formular, emplear o interpretar), qué nivel PISA alcanza y ajusta las preguntas para que el estudiante tenga que razonar y no solo aplicar una fórmula.",
  },
  {
    etiqueta: "Solución paso a paso",
    instruccion:
      "Escribe de nuevo la solución paso a paso de este ejercicio, verificando cada cálculo, sin cambiar el enunciado ni las preguntas.",
  },
]

// Versión equivalente para otro paralelo: misma estructura matemática, otros datos y escenario
export function instruccionVersion(letra: "B" | "C"): string {
  return `Crea la Versión ${letra} de este ejercicio para otro paralelo: cambia los valores numéricos y el escenario narrativo, pero conserva exactamente la misma estructura matemática, el mismo número de preguntas, el curso y la dificultad. Reescribe la solución paso a paso, la respuesta correcta y las pistas con los nuevos datos.`
}
