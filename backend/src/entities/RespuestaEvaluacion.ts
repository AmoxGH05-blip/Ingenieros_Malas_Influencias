import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "P_EvaluacionDocente_RespuestaEvaluacion" })
export class RespuestaEvaluacion {
  @PrimaryGeneratedColumn({ name: "Id" })
  id!: number;

  @Column({ name: "EvaluacionId", type: "int" })
  evaluacionId!: number;

  @Column({ name: "PreguntaId", type: "int" })
  preguntaId!: number;

  @Column({ name: "OpcionRespuestaId", type: "int", nullable: true })
  opcionRespuestaId!: number | null;

  @Column({ name: "RespuestaTexto", type: "nvarchar", nullable: true })
  respuestaTexto!: string | null;

  @Column({ name: "RespuestaNumerica", type: "decimal", precision: 9, scale: 2, nullable: true })
  respuestaNumerica!: number | null;
}
