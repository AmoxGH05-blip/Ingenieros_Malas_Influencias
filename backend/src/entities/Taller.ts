import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

export type TipoTaller = "Taller" | "Laboratorio";

/** Taller o laboratorio de una carrera. Lo evaluan los alumnos de esa carrera; no esta ligado a un docente ni a un grupo. */
@Entity({ name: "P_EvaluacionDocente_Taller" })
export class Taller {
  @PrimaryGeneratedColumn({ name: "Id" })
  id!: number;

  @Column({ name: "ProgramaEducativoId", type: "integer" })
  programaEducativoId!: number;

  @Column({ name: "Nombre", type: "varchar", length: 150 })
  nombre!: string;

  @Column({ name: "Tipo", type: "varchar", length: 20 })
  tipo!: TipoTaller;

  @Column({ name: "Activo", type: "boolean", default: true })
  activo!: boolean;

  @Column({ name: "FechaCreacion", type: "timestamptz", insert: false, update: false })
  fechaCreacion!: Date;
}
