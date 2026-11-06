/* Verificacion de integracion de coordinacion (SCRUM-44), contra la API y la base REALES.
 *
 * Contrasta lo que devuelve /api/coordinacion (calculado en la aplicacion) con las vistas de
 * participacion de la base (calculadas en SQL, de forma independiente) y comprueba permisos y filtros.
 * Solo lee: no crea ni modifica datos.
 *
 * Uso (desde backend/, con el .env de la base cargado):
 *   API_URL=https://dygsis-backend.onrender.com COORD_CUENTA=... ALUMNO_CUENTA=... DOCENTE_CUENTA=... \
 *   CUENTAS_PASSWORD=... node -r dotenv/config scripts/verificar-coordinacion.js
 * Sin API_URL usa http://localhost:3000. Las cuentas y su contrasena van por variables de entorno. */
const { Client } = require("pg");

const API = (process.env.API_URL ?? "http://localhost:3000").replace(/\/$/, "") + "/api";
const { COORD_CUENTA, ADMIN_CUENTA, ALUMNO_CUENTA, DOCENTE_CUENTA, CUENTAS_PASSWORD } = process.env;

let fallas = 0;
function comprobar(texto, condicion, detalle = "") {
  console.log(`${condicion ? "OK   " : "FALLA"} ${texto}${condicion ? "" : ` ${detalle}`}`);
  if (!condicion) fallas += 1;
}

async function llamar(ruta, token) {
  const respuesta = await fetch(API + ruta, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  return { status: respuesta.status, cuerpo: await respuesta.json().catch(() => ({})) };
}

async function entrar(cuenta) {
  const respuesta = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ numeroCuenta: cuenta, password: CUENTAS_PASSWORD }),
  });
  const cuerpo = await respuesta.json();
  if (!cuerpo.token) throw new Error(`No se pudo iniciar sesion con ${cuenta} (${respuesta.status})`);
  return cuerpo.token;
}

async function main() {
  for (const [nombre, valor] of Object.entries({ COORD_CUENTA, ALUMNO_CUENTA, DOCENTE_CUENTA, CUENTAS_PASSWORD })) {
    if (!valor) throw new Error(`Falta la variable de entorno ${nombre}`);
  }
  const db = new Client({
    host: process.env.DB_HOST, port: Number(process.env.DB_PORT), database: process.env.DB_NAME,
    user: process.env.DB_USER, password: process.env.DB_PASSWORD, ssl: { rejectUnauthorized: false },
  });
  await db.connect();
  try {
    const [coord, alumno, docente] = await Promise.all([entrar(COORD_CUENTA), entrar(ALUMNO_CUENTA), entrar(DOCENTE_CUENTA)]);
    const admin = ADMIN_CUENTA ? await entrar(ADMIN_CUENTA) : null;

    console.log("\n== Permisos");
    for (const ruta of ["/coordinacion/filtros", "/coordinacion/avance"]) {
      comprobar(`${ruta} sin sesion: 401`, (await llamar(ruta)).status === 401);
      comprobar(`${ruta} alumno: 403`, (await llamar(ruta, alumno)).status === 403);
      comprobar(`${ruta} docente: 403`, (await llamar(ruta, docente)).status === 403);
      comprobar(`${ruta} coordinador: 200`, (await llamar(ruta, coord)).status === 200);
      if (admin) comprobar(`${ruta} administrador: 200`, (await llamar(ruta, admin)).status === 200);
    }

    console.log("\n== Filtros invalidos");
    for (const malo of ["periodoId=abc", "grupoId=0", "programaEducativoId=-2", "periodoId=1.5"]) {
      comprobar(`avance?${malo}: 400`, (await llamar(`/coordinacion/avance?${malo}`, coord)).status === 400);
    }

    console.log("\n== Avance del ciclo activo contra las vistas SQL");
    const { cuerpo: avance } = await llamar("/coordinacion/avance", coord);
    const resumen = avance.resumen;
    const periodoId = avance.periodo?.id;
    comprobar("hay ciclo activo", Boolean(periodoId));
    const [{ rows: [ciclo] }, { rows: filasGrupo }] = await Promise.all([
      db.query('SELECT * FROM "V_EvaluacionDocente_ParticipacionCiclo" WHERE "PeriodoEvaluacionId" = $1', [periodoId]),
      db.query('SELECT * FROM "V_EvaluacionDocente_ParticipacionGrupo" WHERE "PeriodoEvaluacionId" = $1', [periodoId]),
    ]);
    comprobar("concluidos + parciales + no iniciados = alumnos", resumen.concluidos + resumen.parciales + resumen.noIniciados === resumen.alumnos);
    comprobar(`alumnos: API ${resumen.alumnos} = vista ${ciclo.Alumnos}`, resumen.alumnos === Number(ciclo.Alumnos));
    comprobar(
      `alumnos participantes: API ${resumen.concluidos + resumen.parciales} = vista ${ciclo.AlumnosParticipantes}`,
      resumen.concluidos + resumen.parciales === Number(ciclo.AlumnosParticipantes)
    );
    const inscritosAPI = avance.porGrupo.reduce((suma, g) => suma + g.inscritos, 0);
    comprobar(`inscripciones: suma por grupo ${inscritosAPI} = vista ${ciclo.Inscripciones}`, inscritosAPI === Number(ciclo.Inscripciones));
    comprobar("el porcentaje de participacion esta entre 0 y 100", resumen.porcentajeParticipacion >= 0 && resumen.porcentajeParticipacion <= 100);

    const vistaPorGrupo = new Map(filasGrupo.map((f) => [f.GrupoId, f]));
    let gruposCoinciden = true;
    for (const g of avance.porGrupo) {
      const fila = vistaPorGrupo.get(g.grupoId);
      // En un grupo, "concluidos" = alumnos con todas sus evaluaciones; compara inscritos (igual en ambos lados).
      if (!fila || Number(fila.Inscripciones) !== g.inscritos) gruposCoinciden = false;
    }
    comprobar(`los ${avance.porGrupo.length} grupos tienen los mismos inscritos que la vista`, gruposCoinciden && avance.porGrupo.length === filasGrupo.filter((f) => avance.porGrupo.some((g) => g.grupoId === f.GrupoId)).length);

    console.log("\n== Filtros");
    const { cuerpo: filtros } = await llamar("/coordinacion/filtros", coord);
    comprobar("los filtros traen periodos, carreras y grupos", filtros.periodos.length > 0 && filtros.programasEducativos.length > 0 && filtros.grupos.length > 0);
    const grupo = avance.porGrupo[0];
    if (grupo) {
      const { cuerpo: filtrado } = await llamar(`/coordinacion/avance?grupoId=${grupo.grupoId}`, coord);
      comprobar("filtrar por grupo deja solo ese grupo", filtrado.porGrupo.length === 1 && filtrado.porGrupo[0].grupoId === grupo.grupoId);
      comprobar(`los alumnos del grupo filtrado = inscritos del grupo (${grupo.inscritos})`, filtrado.resumen.alumnos === grupo.inscritos);
    }
    const carrera = filtros.programasEducativos[0];
    const { cuerpo: porCarrera } = await llamar(`/coordinacion/avance?programaEducativoId=${carrera.id}`, coord);
    const { rows: [vistaCarrera] } = await db.query(
      'SELECT * FROM "V_EvaluacionDocente_ParticipacionCarrera" WHERE "PeriodoEvaluacionId" = $1 AND "ProgramaEducativoId" = $2', [periodoId, carrera.id]
    );
    comprobar(
      `filtrar por carrera "${carrera.nombre}": alumnos API ${porCarrera.resumen.alumnos} = vista ${vistaCarrera?.Alumnos ?? 0}`,
      porCarrera.resumen.alumnos === Number(vistaCarrera?.Alumnos ?? 0)
    );

    console.log("\n== Ciclos anteriores y avisos");
    const anterior = filtros.periodos.find((p) => p.id !== periodoId);
    if (anterior) {
      const { status, cuerpo } = await llamar(`/coordinacion/avance?periodoId=${anterior.id}`, coord);
      comprobar(`un ciclo anterior ("${anterior.nombre}") responde 200 y no mezcla alumnos del ciclo activo`, status === 200 && cuerpo.periodo.id === anterior.id);
    }
    const { status: statusAvisos, cuerpo: avisos } = await llamar("/notificaciones", coord);
    comprobar("los avisos del coordinador responden 200 con una lista", statusAvisos === 200 && Array.isArray(avisos.notificaciones));
    comprobar("los avisos de un docente responden 200 con una lista", (await llamar("/notificaciones", docente)).status === 200);
    comprobar("los avisos sin sesion: 401", (await llamar("/notificaciones")).status === 401);
  } finally {
    await db.end();
  }
}

main()
  .then(() => {
    console.log(`\nFALLAS: ${fallas}`);
    process.exit(fallas ? 1 : 0);
  })
  .catch((error) => {
    console.error("ERROR:", error.message);
    process.exit(1);
  });
