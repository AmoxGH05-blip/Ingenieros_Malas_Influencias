import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "P_EvaluacionDocente_PeriodoAcademico" })
export class PeriodoAcademico {
  @PrimaryGeneratedColumn({ name: "Id" })
  id!: number;

  @Column({ name: "Nombre", type: "varchar", length: 50 })
  nombre!: string;

  @Column({ name: "FechaInicio", type: "date" })
  fechaInicio!: string;

  @Column({ name: "FechaFin", type: "date" })
  fechaFin!: string;

  @Column({ name: "Activo", type: "boolean", default: true })
  activo!: boolean;
}
