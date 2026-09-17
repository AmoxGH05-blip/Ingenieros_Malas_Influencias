import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "P_EvaluacionDocente_PeriodoEvaluacion" })
export class PeriodoEvaluacion {
  @PrimaryGeneratedColumn({ name: "Id" })
  id!: number;

  @Column({ name: "PeriodoAcademicoId", type: "int" })
  periodoAcademicoId!: number;

  @Column({ name: "InstrumentoId", type: "int" })
  instrumentoId!: number;

  @Column({ name: "Nombre", type: "nvarchar", length: 150 })
  nombre!: string;

  @Column({ name: "FechaInicio", type: "datetime2" })
  fechaInicio!: Date;

  @Column({ name: "FechaFin", type: "datetime2" })
  fechaFin!: Date;

  @Column({ name: "Activo", type: "bit", default: true })
  activo!: boolean;
}
