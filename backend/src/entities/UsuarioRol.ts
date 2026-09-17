import { Entity, PrimaryColumn } from "typeorm";

@Entity({ name: "P_EvaluacionDocente_UsuarioRol" })
export class UsuarioRol {
  @PrimaryColumn({ name: "UsuarioId", type: "int" })
  usuarioId!: number;

  @PrimaryColumn({ name: "RolId", type: "int" })
  rolId!: number;
}
