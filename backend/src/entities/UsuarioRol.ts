import { Entity, PrimaryColumn } from "typeorm";

@Entity({ name: "P_EvaluacionDocente_UsuarioRol" })
export class UsuarioRol {
  @PrimaryColumn({ name: "UsuarioId", type: "integer" })
  usuarioId!: number;

  @PrimaryColumn({ name: "RolId", type: "integer" })
  rolId!: number;
}
