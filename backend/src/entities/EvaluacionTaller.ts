import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

/** Una evaluacion enviada por un alumno a un taller en un ciclo. Solo existe cuando se envia: no hay filas pendientes. */
@Entity({ name: "P_EvaluacionDocente_EvaluacionTaller" })
export class EvaluacionTaller {
  @PrimaryGeneratedColumn({ name: "Id" })
  id!: number;

  @Column({ name: "PeriodoEvaluacionId", type: "integer" })
  periodoEvaluacionId!: number;

  @Column({ name: "EstudianteId", type: "integer" })
  estudianteId!: number;

  @Column({ name: "TallerId", type: "integer" })
  tallerId!: number;

  @Column({ name: "FechaRespuesta", type: "timestamptz", insert: false, update: false })
  fechaRespuesta!: Date;
}
