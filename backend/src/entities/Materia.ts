import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "P_EvaluacionDocente_Materia" })
export class Materia {
  @PrimaryGeneratedColumn({ name: "Id" })
  id!: number;

  @Column({ name: "ProgramaEducativoId", type: "integer" })
  programaEducativoId!: number;

  @Column({ name: "Clave", type: "varchar", length: 20 })
  clave!: string;

  @Column({ name: "Nombre", type: "varchar", length: 150 })
  nombre!: string;

  @Column({ name: "Creditos", type: "smallint", default: 0 })
  creditos!: number;
}
