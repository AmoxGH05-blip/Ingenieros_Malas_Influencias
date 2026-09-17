import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "P_EvaluacionDocente_OpcionRespuesta" })
export class OpcionRespuesta {
  @PrimaryGeneratedColumn({ name: "Id" })
  id!: number;

  @Column({ name: "PreguntaId", type: "int" })
  preguntaId!: number;

  @Column({ name: "Texto", type: "nvarchar", length: 200 })
  texto!: string;

  @Column({ name: "Valor", type: "decimal", precision: 5, scale: 2 })
  valor!: number;

  @Column({ name: "Orden", type: "smallint", default: 1 })
  orden!: number;
}
