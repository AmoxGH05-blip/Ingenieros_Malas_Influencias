import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "P_EvaluacionDocente_Evaluacion" })
export class Evaluacion {
  @PrimaryGeneratedColumn({ name: "Id" })
  id!: number;

  @Column({ name: "PeriodoEvaluacionId", type: "integer" })
  periodoEvaluacionId!: number;

  @Column({ name: "EstudianteId", type: "integer" })
  estudianteId!: number;

  @Column({ name: "GrupoId", type: "integer" })
  grupoId!: number;

  @Column({ name: "FechaRespuesta", type: "timestamptz", nullable: true })
  fechaRespuesta!: Date | null;

  @Column({ name: "Completada", type: "boolean", default: false })
  completada!: boolean;

  @Column({ name: "Anonima", type: "boolean", default: true })
  anonima!: boolean;
}
