import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "P_EvaluacionDocente_Grupo" })
export class Grupo {
  @PrimaryGeneratedColumn({ name: "Id" })
  id!: number;

  @Column({ name: "MateriaId", type: "integer" })
  materiaId!: number;

  @Column({ name: "DocenteId", type: "integer" })
  docenteId!: number;

  @Column({ name: "PeriodoAcademicoId", type: "integer" })
  periodoAcademicoId!: number;

  @Column({ name: "Seccion", type: "varchar", length: 10 })
  seccion!: string;

  @Column({ name: "CupoMaximo", type: "smallint", default: 0 })
  cupoMaximo!: number;
}
