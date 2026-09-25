import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "P_EvaluacionDocente_Sesion" })
export class Sesion {
  @PrimaryGeneratedColumn({ name: "Id" })
  id!: number;

  @Column({ name: "UsuarioId", type: "integer" })
  usuarioId!: number;

  @Column({ name: "Jti", type: "varchar", length: 64 })
  jti!: string;

  @Column({ name: "FechaInicio", type: "timestamptz" })
  fechaInicio!: Date;

  @Column({ name: "FechaExpiracion", type: "timestamptz" })
  fechaExpiracion!: Date;

  @Column({ name: "FechaCierre", type: "timestamptz", nullable: true })
  fechaCierre!: Date | null;

  @Column({ name: "Activa", type: "boolean", default: true })
  activa!: boolean;
}
