import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "P_EvaluacionDocente_ProgramaEducativo" })
export class ProgramaEducativo {
  @PrimaryGeneratedColumn({ name: "Id" })
  id!: number;

  @Column({ name: "FacultadId", type: "integer" })
  facultadId!: number;

  @Column({ name: "Nombre", type: "varchar", length: 150 })
  nombre!: string;

  @Column({ name: "NivelEducativo", type: "varchar", length: 50 })
  nivelEducativo!: string;

  /** Interruptor por carrera: si es false, sus alumnos no ven ni evaluan talleres. */
  @Column({ name: "EvaluaTalleres", type: "boolean", default: false })
  evaluaTalleres!: boolean;
}
