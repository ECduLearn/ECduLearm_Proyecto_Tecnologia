// Misma regla que fn_verificar_respuesta (schema.sql): se usa en la práctica libre y en las aulas
// que solo existen en este dispositivo. Con sesión real la verificación la hace el servidor.

const NUMERO = /-?\d+(?:[.,]\d+)?/g

export function extraerNumeros(texto: string): number[] {
  return (texto.match(NUMERO) ?? []).map((n) => Number(n.replace(",", ".")))
}

function cercanos(a: number, b: number): boolean {
  return Math.abs(a - b) <= Math.max(0.01, Math.abs(b) * 0.01)
}

/**
 * true/false si se pudo comparar; null si la respuesta guardada no tiene un resultado numérico.
 * Acepta "12", "12.0", "12,0", "12 m" o un procedimiento que termine en el resultado.
 */
export function verificarRespuestaLocal(respuesta: string, clave: string, enunciado = ""): boolean | null {
  const resultados = extraerNumeros(clave)
  if (!resultados.length) return null

  const datos = extraerNumeros(enunciado)
  const sinDatos = resultados.filter((r) => !datos.some((d) => cercanos(r, d)))
  const candidatos = sinDatos.length ? sinDatos : resultados

  const delEstudiante = extraerNumeros(respuesta)
  const final = delEstudiante.at(-1)
  return final !== undefined && candidatos.some((r) => cercanos(final, r))
}
