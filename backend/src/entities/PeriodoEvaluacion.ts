import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "P_EvaluacionDocente_PeriodoEvaluacion" })
export class PeriodoEvaluacion {
  @PrimaryGeneratedColumn({ name: "Id" })
  id!: number;

  @Column({ name: "PeriodoAcademicoId", type: "integer" })
  periodoAcademicoId!: number;

  @Column({ name: "InstrumentoId", type: "integer" })
  instrumentoId!: number;

  @Column({ name: "Nombre", type: "varchar", length: 150 })
  nombre!: string;

  @Column({ name: "FechaInicio", type: "timestamptz" })
  fechaInicio!: Date;

  @Column({ name: "FechaFin", type: "timestamptz" })
  fechaFin!: Date;

  @Column({ name: "Activo", type: "boolean", default: true })
  activo!: boolean;
}
