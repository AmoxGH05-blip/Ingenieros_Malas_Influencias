import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "P_EvaluacionDocente_ProgramaEducativo" })
export class ProgramaEducativo {
  @PrimaryGeneratedColumn({ name: "Id" })
  id!: number;

  @Column({ name: "FacultadId", type: "int" })
  facultadId!: number;

  @Column({ name: "Nombre", type: "nvarchar", length: 150 })
  nombre!: string;

  @Column({ name: "NivelEducativo", type: "nvarchar", length: 50 })
  nivelEducativo!: string;
}
