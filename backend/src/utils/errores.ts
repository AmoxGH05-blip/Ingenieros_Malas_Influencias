/** Codigo de PostgreSQL para "unique_violation": dos altas simultaneas con el mismo numero de cuenta o correo. */
const CODIGO_UNICIDAD = "23505";

export function esViolacionDeUnicidad(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const { code, driverError } = error as { code?: unknown; driverError?: { code?: unknown } };
  return code === CODIGO_UNICIDAD || driverError?.code === CODIGO_UNICIDAD;
}
