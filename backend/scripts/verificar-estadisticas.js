/* Verificacion de integracion de estadisticas institucionales (SCRUM-55), contra la API y la base REALES.
 *
 * Contrasta /api/estadisticas/institucional (calculado en la aplicacion) con consultas SQL independientes sobre
 * las TABLAS (no sobre las vistas que usa el repositorio): participacion, promedio institucional, ventana de
 * tendencia y reparto por carrera. Comprueba tambien permisos y el manejo de periodoId. Solo lee.
 *
 * Uso (desde backend/, con el .env de la base cargado):
 *   API_URL=https://dygsis-backend.onrender.com COORD_CUENTA=... ALUMNO_CUENTA=... DOCENTE_CUENTA=... \
 *   CUENTAS_PASSWORD=... node -r dotenv/config scripts/verificar-estadisticas.js
 * Sin API_URL usa http://localhost:3000. Las cuentas y su contrasena van por variables de entorno. */
const { Client } = require("pg");
const API = (process.env.API_URL ?? "http://localhost:3000").replace(/\/$/, "") + "/api";
const { COORD_CUENTA, ALUMNO_CUENTA, DOCENTE_CUENTA, CUENTAS_PASSWORD } = process.env;
let fallas = 0;
const ok = (t, c, d = "") => { console.log(`${c ? "OK   " : "FALLA"} ${t}${c ? "" : " " + d}`); if (!c) fallas++; };

async function llamar(ruta, token) {
  const r = await fetch(API + ruta, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  return { status: r.status, cuerpo: await r.json().catch(() => ({})) };
}
async function entrar(cuenta) {
  const r = await fetch(`${API}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ numeroCuenta: cuenta, password: CUENTAS_PASSWORD }) });
  return (await r.json()).token;
}

(async () => {
  const db = new Client({ host: process.env.DB_HOST, port: Number(process.env.DB_PORT), database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD, ssl: { rejectUnauthorized: false } });
  await db.connect();
  try {
    const coord = await entrar(COORD_CUENTA), alumno = await entrar(ALUMNO_CUENTA), docente = await entrar(DOCENTE_CUENTA);
    ok("sin sesion 401", (await llamar("/estadisticas/institucional")).status === 401);
    ok("alumno 403", (await llamar("/estadisticas/institucional", alumno)).status === 403);
    ok("docente 403", (await llamar("/estadisticas/institucional", docente)).status === 403);
    ok("periodoId invalido 400", (await llamar("/estadisticas/institucional?periodoId=abc", coord)).status === 400);
    ok("periodoId repetido (arreglo) 400", (await llamar("/estadisticas/institucional?periodoId=1&periodoId=2", coord)).status === 400);
    ok("periodoId inexistente 404", (await llamar("/estadisticas/institucional?periodoId=999999", coord)).status === 404);

    const { status, cuerpo: e } = await llamar("/estadisticas/institucional", coord);
    ok("coordinador 200", status === 200);
    const p = e.periodo.id, r = e.resumen;

    // Conteos directos desde las tablas
    const { rows: [t] } = await db.query(`
      SELECT (SELECT COUNT(DISTINCT i."EstudianteId") FROM "P_EvaluacionDocente_Inscripcion" i JOIN "P_EvaluacionDocente_Grupo" g ON g."Id"=i."GrupoId" JOIN "P_EvaluacionDocente_PeriodoEvaluacion" pe ON pe."PeriodoAcademicoId"=g."PeriodoAcademicoId" WHERE pe."Id"=$1) AS alumnos,
             (SELECT COUNT(*) FROM "P_EvaluacionDocente_Inscripcion" i JOIN "P_EvaluacionDocente_Grupo" g ON g."Id"=i."GrupoId" JOIN "P_EvaluacionDocente_PeriodoEvaluacion" pe ON pe."PeriodoAcademicoId"=g."PeriodoAcademicoId" WHERE pe."Id"=$1) AS inscripciones,
             (SELECT COUNT(*) FROM "P_EvaluacionDocente_Inscripcion" i JOIN "P_EvaluacionDocente_Grupo" g ON g."Id"=i."GrupoId" JOIN "P_EvaluacionDocente_PeriodoEvaluacion" pe ON pe."PeriodoAcademicoId"=g."PeriodoAcademicoId" JOIN "P_EvaluacionDocente_Evaluacion" ev ON ev."EstudianteId"=i."EstudianteId" AND ev."GrupoId"=g."Id" AND ev."PeriodoEvaluacionId"=pe."Id" AND ev."Completada" WHERE pe."Id"=$1) AS completadas,
             (SELECT COUNT(DISTINCT i."EstudianteId") FROM "P_EvaluacionDocente_Inscripcion" i JOIN "P_EvaluacionDocente_Grupo" g ON g."Id"=i."GrupoId" JOIN "P_EvaluacionDocente_PeriodoEvaluacion" pe ON pe."PeriodoAcademicoId"=g."PeriodoAcademicoId" JOIN "P_EvaluacionDocente_Evaluacion" ev ON ev."EstudianteId"=i."EstudianteId" AND ev."GrupoId"=g."Id" AND ev."PeriodoEvaluacionId"=pe."Id" AND ev."Completada" WHERE pe."Id"=$1) AS participantes`, [p]);
    ok(`alumnos ${r.alumnos} = tablas ${t.alumnos}`, r.alumnos === Number(t.alumnos));
    ok(`inscripciones ${r.inscripciones} = ${t.inscripciones}`, r.inscripciones === Number(t.inscripciones));
    ok(`completadas ${r.completadas} = ${t.completadas}`, r.completadas === Number(t.completadas));
    ok(`participantes ${r.alumnosParticipantes} = ${t.participantes}`, r.alumnosParticipantes === Number(t.participantes));
    ok("pendientes = inscripciones - completadas", r.pendientes === r.inscripciones - r.completadas);
    ok("% alumnos = participantes/alumnos", r.participacionAlumnos === Math.round((r.alumnosParticipantes / r.alumnos) * 100));
    ok("% avance = completadas/inscripciones", r.avanceEvaluaciones === Math.round((r.completadas / r.inscripciones) * 100));

    // Promedio institucional independiente: promedio de los promedios por docente, calculado desde las respuestas
    const { rows: [pm] } = await db.query(`
      WITH por_docente AS (
        SELECT g."DocenteId", SUM(o."Valor"*pr."PesoPonderacion")/NULLIF(SUM(pr."PesoPonderacion"),0) AS prom
        FROM "P_EvaluacionDocente_RespuestaEvaluacion" re
        JOIN "P_EvaluacionDocente_Evaluacion" ev ON ev."Id"=re."EvaluacionId" AND ev."Completada" AND ev."PeriodoEvaluacionId"=$1
        JOIN "P_EvaluacionDocente_Grupo" g ON g."Id"=ev."GrupoId"
        JOIN "P_EvaluacionDocente_OpcionRespuesta" o ON o."Id"=re."OpcionRespuestaId"
        JOIN "P_EvaluacionDocente_Pregunta" pr ON pr."Id"=re."PreguntaId"
        GROUP BY g."DocenteId")
      SELECT COUNT(*) AS docentes, ROUND(AVG(ROUND(prom,2)),2) AS promedio FROM por_docente`, [p]);
    ok(`docentes con promedio ${r.docentesConPromedio} = ${pm.docentes}`, r.docentesConPromedio === Number(pm.docentes));
    ok(`promedio institucional ${r.promedioInstitucional} = ${pm.promedio}`, r.promedioInstitucional === Number(pm.promedio));
    ok("la distribucion suma los docentes con promedio", Object.values(e.distribucion).reduce((a, b) => a + b, 0) === r.docentesConPromedio);

    // Consistencia con el ranking de indicadores
    const { cuerpo: rk } = await llamar(`/indicadores/docentes?periodoId=${p}`, coord);
    ok("promedio institucional = el del ranking de indicadores", r.promedioInstitucional === rk.resumen.promedioInstitucional);
    ok("distribucion = la del ranking de indicadores", JSON.stringify(e.distribucion) === JSON.stringify(rk.resumen.distribucion));

    ok("la suma de alumnos por carrera = alumnos", e.porCarrera.reduce((a, c) => a + c.alumnos, 0) === r.alumnos);
    ok("la suma de completadas por carrera = completadas", e.porCarrera.reduce((a, c) => a + c.completadas, 0) === r.completadas);
    ok("la tendencia termina en el ciclo elegido", e.tendencia.at(-1).periodoId === p);
    ok("la tendencia esta ordenada del mas antiguo al mas reciente y trae hasta 6", e.tendencia.length <= 6 && e.tendencia.length >= 1);
    // Ventana de la tendencia calculada aparte: los 6 ciclos mas recientes con (inicio, id) hasta el elegido, del mas antiguo al mas reciente
    const { rows: ventana } = await db.query(
      `SELECT "Id" FROM (SELECT "Id","FechaInicio" FROM "P_EvaluacionDocente_PeriodoEvaluacion"
         WHERE ("FechaInicio","Id") <= (SELECT "FechaInicio","Id" FROM "P_EvaluacionDocente_PeriodoEvaluacion" WHERE "Id"=$1)
         ORDER BY "FechaInicio" DESC, "Id" DESC LIMIT 6) v ORDER BY "FechaInicio","Id"`, [p]);
    ok("la ventana de la tendencia coincide con la calculada aparte", JSON.stringify(e.tendencia.map((x) => x.periodoId)) === JSON.stringify(ventana.map((x) => x.Id)));
    const actual = e.tendencia.at(-1);
    ok("el promedio del ultimo ciclo de la tendencia = el institucional", actual.promedioInstitucional === r.promedioInstitucional);

    // Ciclo anterior (demo): sin inscripciones, con promedio
    const { cuerpo: filtros } = await llamar("/coordinacion/filtros", coord);
    const anterior = filtros.periodos.find((x) => x.id !== p);
    const { status: s2, cuerpo: e2 } = await llamar(`/estadisticas/institucional?periodoId=${anterior.id}`, coord);
    ok(`ciclo anterior "${anterior.nombre}": 200, avance null (sin inscripciones), con promedio`, s2 === 200 && e2.resumen.avanceEvaluaciones === null && e2.resumen.promedioInstitucional !== null);
    console.log("\nResumen del ciclo activo:", JSON.stringify(r));
    console.log("Tendencia:", e.tendencia.map((x) => `${x.nombre}=${x.promedioInstitucional}`).join(" | "));
    console.log("Carreras:", JSON.stringify(e.porCarrera.map((c) => [c.nombre, c.alumnos, c.promedio, c.clasificacion])));
  } finally { await db.end(); }
  console.log("\nFALLAS:", fallas);
  process.exit(fallas ? 1 : 0);
})().catch((e) => { console.error("ERROR:", e.message); process.exit(1); });
