import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "P_EvaluacionDocente_Usuario" })
export class Usuario {
  @PrimaryGeneratedColumn({ name: "Id" })
  id!: number;

  @Column({ name: "CorreoElectronico", type: "nvarchar", length: 150 })
  correoElectronico!: string;

  @Column({ name: "ContrasenaHash", type: "nvarchar", length: 256 })
  contrasenaHash!: string;

  @Column({ name: "Activo", type: "bit", default: true })
  activo!: boolean;

  @Column({ name: "FechaCreacion", type: "datetime2" })
  fechaCreacion!: Date;
}
