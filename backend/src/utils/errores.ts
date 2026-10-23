/** Codigo de PostgreSQL para "unique_violation": dos altas simultaneas con el mismo numero de cuenta o correo. */
const CODIGO_UNICIDAD = "23505";

export function esViolacionDeUnicidad(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const { code, driverError } = error as { code?: unknown; driverError?: { code?: unknown } };
  return code === CODIGO_UNICIDAD || driverError?.code === CODIGO_UNICIDAD;
}

/** Errores de negocio de cuentas, materias y grupos: el controlador los traduce a su codigo HTTP. */
export class DatosInvalidosError extends Error {} // 400
export class PermisoDenegadoError extends Error {} // 403
export class NoEncontradoError extends Error {} // 404
export class ConflictoError extends Error {} // 409: duplicado, grupo lleno...
