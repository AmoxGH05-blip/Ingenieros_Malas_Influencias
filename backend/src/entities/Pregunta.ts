import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "P_EvaluacionDocente_Pregunta" })
export class Pregunta {
  @PrimaryGeneratedColumn({ name: "Id" })
  id!: number;

  @Column({ name: "SeccionInstrumentoId", type: "integer" })
  seccionInstrumentoId!: number;

  @Column({ name: "TipoPreguntaId", type: "integer" })
  tipoPreguntaId!: number;

  @Column({ name: "Texto", type: "varchar", length: 500 })
  texto!: string;

  @Column({ name: "Orden", type: "smallint", default: 1 })
  orden!: number;

  @Column({ name: "Obligatoria", type: "boolean", default: true })
  obligatoria!: boolean;

  @Column({ name: "PesoPonderacion", type: "decimal", precision: 5, scale: 2, default: 1.0 })
  pesoPonderacion!: number;
}
