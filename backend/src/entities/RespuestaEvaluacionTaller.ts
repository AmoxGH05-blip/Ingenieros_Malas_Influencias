import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "P_EvaluacionDocente_RespuestaEvaluacionTaller" })
export class RespuestaEvaluacionTaller {
  @PrimaryGeneratedColumn({ name: "Id" })
  id!: number;

  @Column({ name: "EvaluacionTallerId", type: "integer" })
  evaluacionTallerId!: number;

  @Column({ name: "PreguntaId", type: "integer" })
  preguntaId!: number;

  @Column({ name: "OpcionRespuestaId", type: "integer" })
  opcionRespuestaId!: number;
}
