import { PermisoDenegadoError } from "./errores";

/** Quien hace la operacion: sale del token, nunca del cuerpo de la peticion. */
export interface Actor {
  usuarioId: number;
  roles: string[];
}

/** Gestionan materias, grupos e inscripciones el Coordinador y, como respaldo, el Administrador. */
export function exigirGestor(actor: Actor): void {
  if (!actor.roles.includes("Administrador") && !actor.roles.includes("Coordinador")) {
    throw new PermisoDenegadoError("No tienes permiso para gestionar materias, grupos o cuentas");
  }
}
