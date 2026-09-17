import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "P_EvaluacionDocente_Rol" })
export class Rol {
  @PrimaryGeneratedColumn({ name: "Id" })
  id!: number;

  @Column({ name: "Nombre", type: "nvarchar", length: 50 })
  nombre!: string;
}
