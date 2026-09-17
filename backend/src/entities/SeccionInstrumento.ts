import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "P_EvaluacionDocente_SeccionInstrumento" })
export class SeccionInstrumento {
  @PrimaryGeneratedColumn({ name: "Id" })
  id!: number;

  @Column({ name: "InstrumentoId", type: "int" })
  instrumentoId!: number;

  @Column({ name: "Nombre", type: "nvarchar", length: 150 })
  nombre!: string;

  @Column({ name: "Orden", type: "smallint", default: 1 })
  orden!: number;
}
