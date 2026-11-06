/* Verificacion de integracion de talleres y laboratorios (SCRUM-54, RF08), contra la API y la base REALES.
 *
 * Recorre el flujo completo con datos temporales: permisos, alta de un taller, interruptor por carrera, evaluacion
 * de varios alumnos (validaciones, duplicados, otra carrera), resultados contrastados con SQL independiente sobre
 * las tablas, y el ocultamiento de promedios con pocas respuestas. AL TERMINAR BORRA todo lo que creo y deja la
 * carrera como estaba (aunque algo falle), pero modifica la base mientras corre: no usarlo en una base con alumnos reales
 * evaluando talleres a la vez.
 *
 * Uso (desde backend/, con el .env de la base cargado):
 *   API_URL=http://localhost:3000 COORD_CUENTA=... ALUMNO_CUENTAS=DEMO0002,DEMO0003,DEMO0004,DEMO0005,DEMO0001 DOCENTE_CUENTA=... \
 *   CUENTAS_PASSWORD=... node -r dotenv/config scripts/verificar-talleres.js
 * Se necesitan al menos 5 alumnos de la MISMA carrera (el minimo para mostrar resultados es 5, y la carrera debe tener al menos 5 alumnos), con SOLO el rol Estudiante (si tienen otro rol, las pruebas de permisos no valen). */
const { Client } = require("pg");

const API = (process.env.API_URL ?? "http://localhost:3000").replace(/\/$/, "") + "/api";
const { COORD_CUENTA, DOCENTE_CUENTA, CUENTAS_PASSWORD } = process.env;
const ALUMNOS = (process.env.ALUMNO_CUENTAS ?? "").split(",").map((c) => c.trim()).filter(Boolean);
const PREFIJO = "ZZ-PRUEBA-";

let fallas = 0;
function comprobar(texto, condicion, detalle = "") {
  console.log(`${condicion ? "OK   " : "FALLA"} ${texto}${condicion ? "" : ` ${detalle}`}`);
  if (!condicion) fallas += 1;
}

async function llamar(metodo, ruta, token, cuerpo) {
  const respuesta = await fetch(API + ruta, {
    method: metodo,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  });
  return { status: respuesta.status, cuerpo: await respuesta.json().catch(() => ({})) };
}

async function entrar(cuenta) {
  const respuesta = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ numeroCuenta: cuenta, password: CUENTAS_PASSWORD }),
  });
  return (await respuesta.json()).token;
}

/** Respuesta a todas las preguntas del instrumento con un valor de la escala (rota para variar los promedios). */
function respuestasDe(instrumento, desplazamiento) {
  const valores = instrumento.escala.map((o) => o.valor);
  const preguntas = instrumento.secciones.flatMap((s) => s.preguntas);
  return Object.fromEntries(preguntas.map((p, i) => [p.id, valores[(i + desplazamiento) % valores.length]]));
}

(async () => {
  if (ALUMNOS.length < 5) throw new Error("Define ALUMNO_CUENTAS con al menos 5 cuentas de alumnos de la misma carrera");
  const db = new Client({ host: process.env.DB_HOST, port: Number(process.env.DB_PORT), database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD, ssl: { rejectUnauthorized: false } });
  await db.connect();
  const creados = { talleres: [], carreras: [] };
  let carreraId = null;
  let estadoOriginal = false;

  try {
    const coord = await entrar(COORD_CUENTA);
    const docente = await entrar(DOCENTE_CUENTA);
    const alumnos = [];
    for (const cuenta of ALUMNOS) alumnos.push(await entrar(cuenta));

    // Permisos
    {
      comprobar("sin sesion: 401", (await llamar("GET", "/talleres")).status === 401);
      comprobar("alumno no entra a la configuracion: 403", (await llamar("GET", "/talleres", alumnos[0])).status === 403);
      comprobar("docente no entra a los resultados: 403", (await llamar("GET", "/talleres/resultados", docente)).status === 403);
      comprobar("alumno no puede crear talleres: 403", (await llamar("POST", "/talleres", alumnos[0], { programaEducativoId: 1, nombre: PREFIJO + "permiso" })).status === 403);
      comprobar("docente sin perfil de alumno: 403 al listar sus talleres", (await llamar("GET", "/estudiante/talleres", docente)).status === 403);
    }

    // Carrera de los alumnos de prueba
    const { rows: [datosCarrera] } = await db.query(
      `SELECT pe."Id", pe."EvaluaTalleres" FROM "P_EvaluacionDocente_Estudiante" e
       JOIN "P_EvaluacionDocente_Usuario" u ON u."Id" = e."UsuarioId" JOIN "P_EvaluacionDocente_ProgramaEducativo" pe ON pe."Id" = e."ProgramaEducativoId"
       WHERE u."NumeroCuenta" = $1`, [ALUMNOS[0]]);
    carreraId = datosCarrera.Id;
    estadoOriginal = datosCarrera.EvaluaTalleres;
    await db.query(`UPDATE "P_EvaluacionDocente_ProgramaEducativo" SET "EvaluaTalleres" = false WHERE "Id" = $1`, [carreraId]);

    // Alta de talleres
    const nombre = `${PREFIJO}${Date.now()}`;
    const alta = await llamar("POST", "/talleres", coord, { programaEducativoId: carreraId, nombre, tipo: "Laboratorio" });
    comprobar("alta de un laboratorio: 201", alta.status === 201 && alta.cuerpo.tipo === "Laboratorio" && alta.cuerpo.activo === true, JSON.stringify(alta));
    const tallerId = alta.cuerpo.id;
    creados.talleres.push(tallerId);
    comprobar("el mismo nombre en mayusculas: 409", (await llamar("POST", "/talleres", coord, { programaEducativoId: carreraId, nombre: nombre.toLowerCase() })).status === 409);
    comprobar("tipo invalido: 400", (await llamar("POST", "/talleres", coord, { programaEducativoId: carreraId, nombre: nombre + "b", tipo: "Aula" })).status === 400);
    comprobar("carrera inexistente: 404", (await llamar("POST", "/talleres", coord, { programaEducativoId: 999999, nombre: "x" })).status === 404);
    comprobar("taller inexistente al editar: 404", (await llamar("PATCH", "/talleres/999999", coord, { activo: false })).status === 404);

    // Taller de OTRA carrera (temporal): el alumno no lo ve ni lo puede evaluar
    const { rows: [otra] } = await db.query(
      `INSERT INTO "P_EvaluacionDocente_ProgramaEducativo" ("FacultadId", "Nombre", "NivelEducativo", "EvaluaTalleres")
       SELECT "FacultadId", $1, 'Licenciatura', true FROM "P_EvaluacionDocente_ProgramaEducativo" WHERE "Id" = $2 RETURNING "Id"`, [nombre + "-CARRERA", carreraId]);
    creados.carreras.push(otra.Id);
    const { rows: [tallerAjeno] } = await db.query(`INSERT INTO "P_EvaluacionDocente_Taller" ("ProgramaEducativoId", "Nombre") VALUES ($1, $2) RETURNING "Id"`, [otra.Id, nombre + "-AJENO"]);
    creados.talleres.push(tallerAjeno.Id);

    // Con la carrera apagada
    const apagada = await llamar("GET", "/estudiante/talleres", alumnos[0]);
    comprobar("carrera apagada: habilitado false y sin talleres", apagada.status === 200 && apagada.cuerpo.habilitado === false && apagada.cuerpo.talleres.length === 0);
    comprobar("carrera apagada: evaluar da 403", (await llamar("POST", `/estudiante/talleres/${tallerId}/respuestas`, alumnos[0], { respuestas: {} })).status === 403);

    // Encender
    comprobar("encender con valor no booleano: 400", (await llamar("PATCH", `/talleres/carreras/${carreraId}`, coord, { evaluaTalleres: "si" })).status === 400);
    const encendida = await llamar("PATCH", `/talleres/carreras/${carreraId}`, coord, { evaluaTalleres: true });
    comprobar("encender la carrera: 200", encendida.status === 200 && encendida.cuerpo.evaluaTalleres === true, JSON.stringify(encendida));

    const lista = await llamar("GET", "/estudiante/talleres", alumnos[0]);
    const suyo = lista.cuerpo.talleres?.find((t) => t.id === tallerId);
    comprobar("encendida: el alumno ve su taller y no lo ha evaluado", lista.cuerpo.habilitado === true && suyo && suyo.completada === false, JSON.stringify(lista.cuerpo));
    comprobar("el alumno no ve talleres de otra carrera", !lista.cuerpo.talleres.some((t) => t.id === tallerAjeno.Id));
    comprobar("evaluar un taller de otra carrera: 404", (await llamar("POST", `/estudiante/talleres/${tallerAjeno.Id}/respuestas`, alumnos[0], { respuestas: {} })).status === 404);

    const instrumento = (await llamar("GET", "/estudiante/talleres/instrumento", alumnos[0])).cuerpo;
    const preguntas = instrumento.secciones.flatMap((s) => s.preguntas);
    comprobar(`instrumento de talleres: ${instrumento.secciones.length} criterios, ${preguntas.length} preguntas, escala de 5`, instrumento.secciones.length >= 1 && preguntas.length >= 1 && instrumento.escala.length === 5);

    // Validaciones del envio
    const ruta = `/estudiante/talleres/${tallerId}/respuestas`;
    const buenas = respuestasDe(instrumento, 0);
    comprobar("sin respuestas: 400", (await llamar("POST", ruta, alumnos[0], {})).status === 400);
    comprobar("respuestas incompletas: 400", (await llamar("POST", ruta, alumnos[0], { respuestas: { [preguntas[0].id]: 10 } })).status === 400);
    comprobar("valor fuera de la escala: 400", (await llamar("POST", ruta, alumnos[0], { respuestas: { ...buenas, [preguntas[0].id]: 6 } })).status === 400);
    comprobar("pregunta ajena al instrumento: 400", (await llamar("POST", ruta, alumnos[0], { respuestas: { ...buenas, 999999: 5 } })).status === 400);
    comprobar("id de taller invalido: 400", (await llamar("POST", "/estudiante/talleres/abc/respuestas", alumnos[0], { respuestas: buenas })).status === 400);
    const { rows: [vacias] } = await db.query(`SELECT COUNT(*)::int AS n FROM "P_EvaluacionDocente_EvaluacionTaller" WHERE "TallerId" = $1`, [tallerId]);
    comprobar("los envios rechazados no dejaron nada guardado", vacias.n === 0);

    // Envios validos: con menos del minimo todo se oculta (promedio, criterios, conteo y participacion); con el minimo aparece
    const minimo = (await llamar("GET", "/talleres/resultados", coord)).cuerpo.minimoRespuestas;
    comprobar(`el minimo para publicar es ${minimo} y hay alumnos suficientes`, Number.isInteger(minimo) && ALUMNOS.length >= minimo);
    const enviados = [];
    for (let i = 0; i < minimo - 1; i++) {
      const respuestas = respuestasDe(instrumento, i);
      enviados.push(respuestas);
      comprobar(`alumno ${i + 1} evalua: 201`, (await llamar("POST", ruta, alumnos[i], { respuestas })).status === 201);
    }
    comprobar("el mismo alumno otra vez: 409", (await llamar("POST", ruta, alumnos[0], { respuestas: buenas })).status === 409);
    const completada = (await llamar("GET", "/estudiante/talleres", alumnos[0])).cuerpo.talleres.find((t) => t.id === tallerId);
    comprobar("el alumno ve su taller como evaluado", completada.completada === true && completada.fechaEvaluacion !== null);

    const parcial = (await llamar("GET", "/talleres/resultados", coord)).cuerpo;
    const filaParcial = parcial.carreras.find((c) => c.programaEducativoId === carreraId).talleres.find((t) => t.id === tallerId);
    comprobar(`con ${minimo - 1} evaluaciones se oculta todo: promedio, criterios, conteo y participacion`, filaParcial.respuestas === null && filaParcial.participacion === null && filaParcial.promedio === null && filaParcial.criterios.length === 0 && filaParcial.ocultoPorPocasRespuestas === true, JSON.stringify(filaParcial));

    const ultima = respuestasDe(instrumento, minimo - 1);
    enviados.push(ultima);
    comprobar(`alumno ${minimo} evalua: 201`, (await llamar("POST", ruta, alumnos[minimo - 1], { respuestas: ultima })).status === 201);

    // Resultados contra SQL independiente: promedio ponderado desde las tablas
    const { rows: [sql] } = await db.query(
      `SELECT COUNT(DISTINCT et."Id")::int AS respuestas,
              ROUND(SUM(o."Valor" * p."PesoPonderacion") / SUM(p."PesoPonderacion"), 2) AS promedio
       FROM "P_EvaluacionDocente_EvaluacionTaller" et
       JOIN "P_EvaluacionDocente_RespuestaEvaluacionTaller" r ON r."EvaluacionTallerId" = et."Id"
       JOIN "P_EvaluacionDocente_OpcionRespuesta" o ON o."Id" = r."OpcionRespuestaId"
       JOIN "P_EvaluacionDocente_Pregunta" p ON p."Id" = r."PreguntaId"
       WHERE et."TallerId" = $1`, [tallerId]);
    // ... y a mano desde lo que se mando por la API
    const pesos = (await db.query(`SELECT "Id", "PesoPonderacion"::float AS peso FROM "P_EvaluacionDocente_Pregunta" WHERE "Id" = ANY($1)`, [preguntas.map((p) => p.id)])).rows;
    let suma = 0, sumaPesos = 0;
    for (const envio of enviados) for (const { Id, peso } of pesos) { suma += envio[Id] * peso; sumaPesos += peso; }
    const aMano = Math.round((suma / sumaPesos) * 100) / 100;

    const final = (await llamar("GET", "/talleres/resultados", coord)).cuerpo;
    const carreraRes = final.carreras.find((c) => c.programaEducativoId === carreraId);
    const fila = carreraRes.talleres.find((t) => t.id === tallerId);
    comprobar(`con ${minimo} evaluaciones: se muestran (${fila.respuestas})`, fila.respuestas === minimo && fila.ocultoPorPocasRespuestas === false);
    comprobar(`promedio ${fila.promedio} = SQL ${sql.promedio}`, fila.promedio === Number(sql.promedio));
    comprobar(`promedio ${fila.promedio} = calculado a mano ${aMano} desde lo enviado`, Math.abs(fila.promedio - aMano) < 0.011);
    comprobar("un promedio por criterio", fila.criterios.length === instrumento.secciones.length && fila.criterios.every((c) => c.promedio !== null));
    comprobar("participacion = respuestas / alumnos de la carrera", fila.participacion === Math.round((minimo / carreraRes.alumnos) * 100), `${fila.participacion} vs ${carreraRes.alumnos} alumnos`);
    comprobar("los resultados no traen datos de quien respondio", !JSON.stringify(final).match(/estudiante|numeroCuenta|matricula/i));
    comprobar("ciclo inexistente: 404; id invalido: 400", (await llamar("GET", "/talleres/resultados?periodoId=999999", coord)).status === 404 && (await llamar("GET", "/talleres/resultados?periodoId=1&periodoId=2", coord)).status === 400);

    // Integridad en la base (migracion 015): una respuesta no puede apuntar a la opcion de otra pregunta ni se admite el mismo nombre con otras mayusculas
    const { rows: [otraOpcion] } = await db.query(`SELECT o."Id" AS opcion, o."PreguntaId" AS de FROM "P_EvaluacionDocente_OpcionRespuesta" o WHERE o."PreguntaId" <> $1 LIMIT 1`, [preguntas[0].id]);
    const { rows: [unaEvaluacion] } = await db.query(`SELECT "Id" FROM "P_EvaluacionDocente_EvaluacionTaller" WHERE "TallerId" = $1 LIMIT 1`, [tallerId]);
    let rechazada = false;
    try {
      await db.query("BEGIN");
      // Se quita la respuesta real de esa pregunta (dentro de la transaccion de prueba, que siempre se revierte) para que no choque con la clave unica
      await db.query(`DELETE FROM "P_EvaluacionDocente_RespuestaEvaluacionTaller" WHERE "EvaluacionTallerId" = $1 AND "PreguntaId" = $2`, [unaEvaluacion.Id, preguntas[0].id]);
      await db.query(`INSERT INTO "P_EvaluacionDocente_RespuestaEvaluacionTaller" ("EvaluacionTallerId", "PreguntaId", "OpcionRespuestaId") VALUES ($1, $2, $3)`, [unaEvaluacion.Id, preguntas[0].id, otraOpcion.opcion]);
    } catch (error) {
      rechazada = error.code === "23503";
    } finally {
      await db.query("ROLLBACK");
    }
    comprobar("la base rechaza una respuesta con la opcion de otra pregunta (23503)", rechazada);
    let duplicado = false;
    try {
      await db.query("BEGIN");
      await db.query(`INSERT INTO "P_EvaluacionDocente_Taller" ("ProgramaEducativoId", "Nombre") VALUES ($1, $2)`, [carreraId, "  " + nombre.toLowerCase() + " "]);
    } catch (error) {
      duplicado = error.code === "23505";
    } finally {
      await db.query("ROLLBACK");
    }
    comprobar("la base rechaza el mismo nombre con otras mayusculas y espacios (23505)", duplicado);

    // Baja del taller: el alumno deja de verlo si no lo habia evaluado; las evaluaciones enviadas se conservan
    const baja = await llamar("PATCH", `/talleres/${tallerId}`, coord, { activo: false });
    comprobar("dar de baja: 200", baja.status === 200 && baja.cuerpo.activo === false);
    comprobar("un taller de baja no se puede evaluar (404)", (await llamar("POST", ruta, alumnos[0], { respuestas: buenas })).status === 404);
    const trasBaja = (await llamar("GET", "/talleres/resultados", coord)).cuerpo.carreras.find((c) => c.programaEducativoId === carreraId).talleres.find((t) => t.id === tallerId);
    comprobar("con la baja se conservan sus resultados", trasBaja && trasBaja.respuestas === minimo);

    // Apagar la carrera
    comprobar("apagar la carrera: 200", (await llamar("PATCH", `/talleres/carreras/${carreraId}`, coord, { evaluaTalleres: false })).status === 200);
    comprobar("apagada otra vez: el alumno no ve talleres", (await llamar("GET", "/estudiante/talleres", alumnos[0])).cuerpo.talleres.length === 0);
  } finally {
    // Limpieza: todo lo creado por esta prueba y el interruptor como estaba
    try {
      // Si una comprobacion de permisos fallara y el alta pasara, tambien se borra lo que lleve el prefijo de prueba.
      const { rows: conPrefijo } = await db.query(`SELECT "Id" FROM "P_EvaluacionDocente_Taller" WHERE "Nombre" LIKE $1`, [PREFIJO + "%"]);
      for (const { Id } of conPrefijo) if (!creados.talleres.includes(Id)) creados.talleres.push(Id);
      if (creados.talleres.length) {
        await db.query(`DELETE FROM "P_EvaluacionDocente_RespuestaEvaluacionTaller" WHERE "EvaluacionTallerId" IN (SELECT "Id" FROM "P_EvaluacionDocente_EvaluacionTaller" WHERE "TallerId" = ANY($1))`, [creados.talleres]);
        await db.query(`DELETE FROM "P_EvaluacionDocente_EvaluacionTaller" WHERE "TallerId" = ANY($1)`, [creados.talleres]);
        await db.query(`DELETE FROM "P_EvaluacionDocente_Taller" WHERE "Id" = ANY($1)`, [creados.talleres]);
      }
      if (creados.carreras.length) await db.query(`DELETE FROM "P_EvaluacionDocente_ProgramaEducativo" WHERE "Id" = ANY($1)`, [creados.carreras]);
      if (carreraId !== null) await db.query(`UPDATE "P_EvaluacionDocente_ProgramaEducativo" SET "EvaluaTalleres" = $2 WHERE "Id" = $1`, [carreraId, estadoOriginal]);
      const { rows: [resto] } = await db.query(`SELECT (SELECT COUNT(*) FROM "P_EvaluacionDocente_Taller" WHERE "Nombre" LIKE $1) AS talleres, (SELECT COUNT(*) FROM "P_EvaluacionDocente_ProgramaEducativo" WHERE "Nombre" LIKE $1) AS carreras`, [PREFIJO + "%"]);
      console.log(`\nLimpieza: quedan ${resto.talleres} talleres y ${resto.carreras} carreras de prueba (deben ser 0); interruptor de la carrera restaurado.`);
    } catch (error) {
      console.error("ERROR EN LA LIMPIEZA, revisa la base a mano:", error.message);
      fallas += 1;
    }
    await db.end();
  }
  console.log("\nFALLAS:", fallas);
  process.exit(fallas ? 1 : 0);
})().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
