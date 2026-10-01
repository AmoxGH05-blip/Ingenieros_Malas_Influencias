# Pruebas del flujo del alumno (evaluación docente)

**Proyecto:** Sistema de Información de Evaluación Docente Institucional Adaptable
**Equipo:** Ingenieros Malas Influencias · **Jira:** SCRUM-37

## Cómo correrlas

```bash
cd backend
npm install
npm test
```

No requieren conexión a la base de datos — los repositorios se mockean con Vitest (`vi.mock`), mismo patrón que `AuthService.test.ts`.

## Qué cubren (10 pruebas nuevas, `src/services/EvaluacionService.test.ts`)

- **Listar asignaciones:** rechaza cuentas sin perfil de estudiante; devuelve lista vacía sin periodo activo; crea la fila `Evaluacion` (pendiente) la primera vez que se consulta un grupo inscrito; no duplica esa fila si ya existe.
- **Progreso:** cuenta correctamente completadas/pendientes a partir de las asignaciones.
- **Instrumento activo:** arma la escala de respuesta sin duplicados a partir de las opciones de las preguntas.
- **Registrar respuesta:** rechaza una asignación inexistente o de otro alumno; **bloquea una evaluación duplicada** (ya `Completada`); rechaza un envío con preguntas sin responder; guarda las respuestas y marca la evaluación como completada en el caso correcto.

Suite completa del backend: 26 pruebas (16 de autenticación + 10 de este módulo), todas verdes.

## Pruebas manuales end-to-end (complementarias, 01-oct-2026)

Flujo completo probado en navegador contra Supabase real (no mock):

1. Login con `DEMO0001` / `Demo2026!` → dashboard muestra 5 docentes asignados, datos reales de la base.
2. Abrir el cuestionario de un docente pendiente → 15 preguntas reales cargadas desde `InstrumentoEvaluacion`/`SeccionInstrumento`/`Pregunta`/`OpcionRespuesta`.
3. Responder las 15 preguntas y enviar → mensaje de confirmación, dashboard actualiza a "1 de 5 completadas" / 20%.
4. Verificado en base de datos: `Evaluacion.Completada = true`, `FechaRespuesta` con la fecha real, 15 filas en `RespuestaEvaluacion`.
5. Reenviar la misma evaluación por API directa (saltándose la UI) → rechazado con `409 Esta evaluacion ya fue registrada` — confirma que el bloqueo de duplicado es del servidor, no solo de la interfaz.

## Estado de Prototipo 1

Con esto, el flujo del alumno (SCRUM-33 a SCRUM-35) queda funcional de punta a punta. Ver `docs/demo-prototipo1.md` para el guion de demostración.
