import Icon from "./Icon"
import type { Exercise } from "@/models/types"

export default function ExerciseCard({ exercise }: { exercise: Exercise }) {
  return (
    <article
      id="exercise-document"
      className="mt-4 overflow-hidden rounded-3xl border border-sand-200 bg-white shadow-xl shadow-sand-900/5 sm:ml-12"
    >
      <div className="border-b border-sand-200 bg-sand-50 px-5 py-4 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {[exercise.context, exercise.level, "Razonamiento lógico"].map(
              (tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-ink-100 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-ink-900"
                >
                  {tag}
                </span>
              ),
            )}
          </div>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-sand-500">
            <Icon name="check" className="size-4 text-ink-600" />
            Versión {exercise.version}
          </span>
        </div>
      </div>

      <div className="p-5 sm:p-8">
        <div className="flex items-start gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-ink-950 text-white shadow-sm">
            <Icon name="file" className="size-5" />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-ink-700">
              Desafío aplicado PISA
            </p>
            <h2 className="mt-1 text-xl font-bold leading-tight text-ink-950 sm:text-2xl">
              {exercise.topic}
            </h2>
            <p className="mt-2 text-sm text-sand-500">
              Dificultad {exercise.difficulty.toLowerCase()} ·{" "}
              {exercise.questions} preguntas
            </p>
          </div>
        </div>

        <div className="mt-7 rounded-2xl border border-sand-200 bg-sand-50 p-5 sm:p-6">
          <p className="text-sm font-bold text-sand-900">Situación</p>
          <p className="mt-2 text-sm leading-7 text-sand-700">
            {exercise.situation ||
              "Un equipo de estudiantes analiza la estabilidad de una estructura para un nuevo centro comunitario. El diseño utiliza módulos triangulares de 4 metros de base y 3 metros de altura. Antes de construir, deben comparar alternativas y justificar cuál distribuye mejor las cargas."}
          </p>
        </div>

        <div className="mt-7 space-y-5">
          {exercise.questionList && exercise.questionList.length > 0
            ? exercise.questionList.map((q, index) => (
                <div key={index} className="flex gap-4">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-ink-100 text-sm font-bold text-ink-950">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold leading-6 text-sand-800">
                      {q}
                    </p>
                    <div className="mt-3 h-8 border-b border-dashed border-sand-300" />
                  </div>
                </div>
              ))
            : Array.from(
                { length: Math.min(exercise.questions, 4) },
                (_, index) => (
                  <div key={index} className="flex gap-4">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-ink-100 text-sm font-bold text-ink-950">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold leading-6 text-sand-800">
                        {index === 0
                          ? "Calcula el área de uno de los módulos triangulares utilizados en la estructura."
                          : index === 1
                            ? "Si el diseño requiere 12 módulos, ¿qué superficie total representan?"
                            : index === 2
                              ? "Explica qué alternativa elegirías y sustenta tu decisión con los datos."
                              : "Propón un cambio al diseño que reduzca material sin comprometer la estabilidad."}
                      </p>
                      <div className="mt-3 h-8 border-b border-dashed border-sand-300" />
                    </div>
                  </div>
                ),
              )}
        </div>

        {/* Solo para el docente: no se imprime en la hoja del estudiante */}
        <details className="group mt-8 rounded-2xl border border-ink-200 bg-ink-50/60 print:hidden">
          <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 px-5 text-sm font-semibold text-ink-900 [&::-webkit-details-marker]:hidden">
            <svg className="size-4 transition-transform duration-200 group-open:rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="m9 6 6 6-6 6" />
            </svg>
            Solución paso a paso (solo para ti)
          </summary>
          <div className="space-y-5 px-5 pb-5 text-sm leading-relaxed text-sand-800">
            {exercise.solucionDocente ? (
              <p className="whitespace-pre-line">{exercise.solucionDocente}</p>
            ) : (
              <p className="text-sand-600">
                Esta versión no trae solución. Pídele al asistente «agrega la solución paso a paso».
              </p>
            )}
            {exercise.respuestaCorrecta && (
              <p>
                <span className="font-semibold text-ink-900">Respuesta: </span>
                {exercise.respuestaCorrecta}
              </p>
            )}
            {exercise.pistasSocraticas && exercise.pistasSocraticas.length > 0 && (
              <div>
                <p className="font-semibold text-ink-900">Pistas que verá el estudiante, una a una</p>
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-sand-700">
                  {exercise.pistasSocraticas.map((pista) => (
                    <li key={pista}>{pista}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </details>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-sand-200 pt-5 text-xs text-sand-500">
          <span>ECduLearn · Guía docente</span>
          <span>{exercise.level}</span>
        </div>
      </div>
    </article>
  )
}
