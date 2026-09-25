import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "P_EvaluacionDocente_RespuestaEvaluacion" })
export class RespuestaEvaluacion {
  @PrimaryGeneratedColumn({ name: "Id" })
  id!: number;

  @Column({ name: "EvaluacionId", type: "integer" })
  evaluacionId!: number;

  @Column({ name: "PreguntaId", type: "integer" })
  preguntaId!: number;

  @Column({ name: "OpcionRespuestaId", type: "integer", nullable: true })
  opcionRespuestaId!: number | null;

  @Column({ name: "RespuestaTexto", type: "varchar", nullable: true })
  respuestaTexto!: string | null;

  @Column({ name: "RespuestaNumerica", type: "decimal", precision: 9, scale: 2, nullable: true })
  respuestaNumerica!: number | null;
}
