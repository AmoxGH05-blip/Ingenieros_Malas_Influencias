import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "P_EvaluacionDocente_Evaluacion" })
export class Evaluacion {
  @PrimaryGeneratedColumn({ name: "Id" })
  id!: number;

  @Column({ name: "PeriodoEvaluacionId", type: "int" })
  periodoEvaluacionId!: number;

  @Column({ name: "EstudianteId", type: "int" })
  estudianteId!: number;

  @Column({ name: "GrupoId", type: "int" })
  grupoId!: number;

  @Column({ name: "FechaRespuesta", type: "datetime2", nullable: true })
  fechaRespuesta!: Date | null;

  @Column({ name: "Completada", type: "bit", default: false })
  completada!: boolean;

  @Column({ name: "Anonima", type: "bit", default: true })
  anonima!: boolean;
}
