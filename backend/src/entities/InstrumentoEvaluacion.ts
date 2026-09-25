import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

export type TipoEvaluado = "Docente" | "Autoevaluacion" | "Coordinador";

@Entity({ name: "P_EvaluacionDocente_InstrumentoEvaluacion" })
export class InstrumentoEvaluacion {
  @PrimaryGeneratedColumn({ name: "Id" })
  id!: number;

  @Column({ name: "CreadoPorUsuarioId", type: "integer" })
  creadoPorUsuarioId!: number;

  @Column({ name: "Nombre", type: "varchar", length: 150 })
  nombre!: string;

  @Column({ name: "TipoEvaluado", type: "varchar", length: 30 })
  tipoEvaluado!: TipoEvaluado;

  @Column({ name: "Version", type: "smallint", default: 1 })
  version!: number;

  @Column({ name: "Activo", type: "boolean", default: true })
  activo!: boolean;

  @Column({ name: "FechaCreacion", type: "timestamptz" })
  fechaCreacion!: Date;
}
