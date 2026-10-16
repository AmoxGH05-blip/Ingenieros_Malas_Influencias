const DIA_MS = 24 * 60 * 60 * 1000;
const ZONA = "America/Mexico_City";

/** Dia de calendario (en hora de Mexico) de una fecha, como numero de dias desde 1970. */
function diaLocal(fecha: Date): number {
  const [anio, mes, dia] = fecha.toLocaleDateString("en-CA", { timeZone: ZONA }).split("-").map(Number);
  return Date.UTC(anio, mes - 1, dia) / DIA_MS;
}

/**
 * Dias de calendario que faltan para una fecha, en hora de Mexico: 0 si es hoy, 1 si es manana, negativo si ya paso.
 * Asi "Faltan 3 dias" coincide con la fecha que se muestra ("cierra el 18 de diciembre"), sin importar la hora de cierre.
 */
export function diasRestantes(ahora: Date, fechaFin: Date): number {
  return diaLocal(fechaFin) - diaLocal(ahora);
}
