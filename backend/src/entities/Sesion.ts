import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "P_EvaluacionDocente_Sesion" })
export class Sesion {
  @PrimaryGeneratedColumn({ name: "Id" })
  id!: number;

  @Column({ name: "UsuarioId", type: "int" })
  usuarioId!: number;

  @Column({ name: "Jti", type: "nvarchar", length: 64 })
  jti!: string;

  @Column({ name: "FechaInicio", type: "datetime2" })
  fechaInicio!: Date;

  @Column({ name: "FechaExpiracion", type: "datetime2" })
  fechaExpiracion!: Date;

  @Column({ name: "FechaCierre", type: "datetime2", nullable: true })
  fechaCierre!: Date | null;

  @Column({ name: "Activa", type: "bit", default: true })
  activa!: boolean;
}
