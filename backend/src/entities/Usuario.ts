import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "P_EvaluacionDocente_Usuario" })
export class Usuario {
  @PrimaryGeneratedColumn({ name: "Id" })
  id!: number;

  @Column({ name: "CorreoElectronico", type: "varchar", length: 150 })
  correoElectronico!: string;

  @Column({ name: "ContrasenaHash", type: "varchar", length: 256 })
  contrasenaHash!: string;

  @Column({ name: "Activo", type: "boolean", default: true })
  activo!: boolean;

  @Column({ name: "FechaCreacion", type: "timestamptz" })
  fechaCreacion!: Date;
}
