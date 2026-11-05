// Banco de práctica libre: microretos resueltos y verificados a mano. Lo que se responde aquí
// no se envía al docente (la práctica con telemetría usa un PIN de grado).
export interface Microreto {
  id: string

  titulo: string

  nivel: "Básico" | "Intermedio" | "Avanzado"

  enunciado: string

  pregunta: string

  // Resultado numérico con su unidad; se compara con la regla de services/respuestas.ts
  respuesta: string

  pistas: string[]

  apoyo?: string
}

export interface CategoriaPractica {
  id: "algebra" | "geometria" | "logica"

  nombre: string

  icono: "algebra" | "compass" | "logic"

  retos: Microreto[]
}

export const CATEGORIAS_PRACTICA: CategoriaPractica[] = [
  {
    id: "algebra",
    nombre: "Álgebra",
    icono: "algebra",
    retos: [
      {
        id: "alg-1",
        titulo: "La feria de Otavalo",
        nivel: "Básico",
        enunciado: "En una feria de Otavalo, una bufanda cuesta $3 más que un gorro. Dos gorros y una bufanda cuestan $27 en total.",
        pregunta: "¿Cuánto cuesta un gorro?",
        respuesta: "8 dólares",
        pistas: [
          "Si llamas g al precio del gorro, ¿cómo escribirías el precio de la bufanda?",
          "¿Qué ecuación forman dos gorros más una bufanda?",
          "Cuando agrupes los términos con g, ¿qué número queda solo al otro lado?",
        ],
        apoyo: "Ecuación lineal: agrupa los términos con la incógnita y despeja paso a paso.",
      },
      {
        id: "alg-2",
        titulo: "El plan de datos",
        nivel: "Básico",
        enunciado: "Un plan de datos móviles cobra $5 fijos al mes más $0,50 por cada GB usado. Este mes la factura fue de $12.",
        pregunta: "¿Cuántos GB se usaron este mes?",
        respuesta: "14 GB",
        pistas: [
          "¿Qué parte de la factura no depende de los GB?",
          "Si quitas el cargo fijo, ¿cuánto dinero corresponde solo a los datos?",
          "¿Cuántas veces cabe $0,50 en esa cantidad?",
        ],
        apoyo: "Modelo lineal: total = cargo fijo + precio por unidad × unidades.",
      },
      {
        id: "alg-3",
        titulo: "Edades de hermanos",
        nivel: "Intermedio",
        enunciado: "La edad de Ana es el triple de la de su hermano. Dentro de 5 años, la suma de sus edades será 34.",
        pregunta: "¿Qué edad tiene hoy el hermano?",
        respuesta: "6 años",
        pistas: [
          "Si h es la edad del hermano hoy, ¿cuál es la edad de Ana hoy?",
          "¿Qué edad tendrá cada uno dentro de 5 años?",
          "Suma esas dos expresiones e iguálalas a 34. ¿Qué te queda?",
        ],
      },
    ],
  },
  {
    id: "geometria",
    nombre: "Geometría",
    icono: "compass",
    retos: [
      {
        id: "geo-1",
        titulo: "El cerco del terreno",
        nivel: "Básico",
        enunciado: "Un terreno rectangular en Cuenca mide 24 m de largo y 15 m de ancho. La familia quiere cercar todo su borde con malla.",
        pregunta: "¿Cuántos metros de malla necesitan?",
        respuesta: "78 m",
        pistas: [
          "¿Qué medida del terreno representa su borde completo?",
          "¿Cuántos lados largos y cuántos lados cortos tiene un rectángulo?",
          "Suma todos los lados. ¿Te conviene agrupar primero largo y ancho?",
        ],
        apoyo: "Perímetro del rectángulo: P = 2 × (largo + ancho).",
      },
      {
        id: "geo-2",
        titulo: "La rampa de acceso",
        nivel: "Intermedio",
        enunciado: "La entrada de un colegio tiene una rampa para sillas de ruedas. Sube 1,2 m de altura y su base horizontal mide 5 m.",
        pregunta: "¿Cuánto mide la superficie inclinada de la rampa? Redondea a centésimas.",
        respuesta: "5,14 m",
        pistas: [
          "¿Qué figura forman la altura, la base y la rampa?",
          "¿Cuál de los tres lados es la hipotenusa?",
          "¿Qué teorema relaciona los tres lados de esa figura?",
        ],
        apoyo: "Teorema de Pitágoras: c² = a² + b².",
      },
      {
        id: "geo-3",
        titulo: "El tanque de agua",
        nivel: "Avanzado",
        enunciado: "Un tanque cilíndrico de una escuela rural tiene 1 m de radio y 2 m de altura. Recuerda que 1 m³ equivale a 1000 litros y usa π ≈ 3,14.",
        pregunta: "¿Cuántos litros de agua caben en el tanque lleno?",
        respuesta: "6280 litros",
        pistas: [
          "¿Qué magnitud del tanque indica cuánta agua cabe?",
          "¿Cómo se calcula el volumen de un cilindro a partir del área de su base?",
          "Ya en m³, ¿por cuánto multiplicas para pasar a litros?",
        ],
        apoyo: "Volumen del cilindro: V = π × r² × h.",
      },
    ],
  },
  {
    id: "logica",
    nombre: "Razonamiento lógico",
    icono: "logic",
    retos: [
      {
        id: "log-1",
        titulo: "Patrones de construcción",
        nivel: "Intermedio",
        enunciado: "Una estructura se arma con triángulos de palitos. La figura 1 usa 3 palitos, la figura 2 usa 5 y la figura 3 usa 7.",
        pregunta: "Sin dibujar todas las figuras, ¿cuántos palitos necesita la figura 10?",
        respuesta: "21 palitos",
        pistas: [
          "¿Cuántos palitos se agregan de una figura a la siguiente?",
          "¿El aumento es siempre el mismo?",
          "Si conoces la figura 1 y cuánto aumenta cada vez, ¿cuántos aumentos hay hasta la figura 10?",
        ],
        apoyo: "Secuencia lineal: término = valor inicial + cambio × (posición − 1).",
      },
      {
        id: "log-2",
        titulo: "La fila del bus",
        nivel: "Básico",
        enunciado: "En la parada del trolebús hay una fila de 25 personas. Juan tiene 9 personas delante de él.",
        pregunta: "¿Cuántas personas tiene Juan detrás?",
        respuesta: "15 personas",
        pistas: [
          "¿Juan se cuenta dentro de las 25 personas?",
          "¿Cuántas personas hay desde el inicio de la fila hasta Juan, incluyéndolo?",
          "¿Cuántas quedan después de él?",
        ],
      },
      {
        id: "log-3",
        titulo: "El reloj adelantado",
        nivel: "Básico",
        enunciado: "Un reloj se adelanta 3 minutos cada hora. Se puso a la hora exacta a las 8:00 de la mañana.",
        pregunta: "¿Cuántos minutos estará adelantado a las 14:00?",
        respuesta: "18 minutos",
        pistas: [
          "¿Cuántas horas pasan entre las 8:00 y las 14:00?",
          "¿Cuánto se adelanta en una sola hora?",
          "¿Qué operación junta esas dos cantidades?",
        ],
      },
    ],
  },
]
