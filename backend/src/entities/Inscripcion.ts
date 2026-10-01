import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "P_EvaluacionDocente_Inscripcion" })
export class Inscripcion {
  @PrimaryGeneratedColumn({ name: "Id" })
  id!: number;

  @Column({ name: "EstudianteId", type: "integer" })
  estudianteId!: number;

  @Column({ name: "GrupoId", type: "integer" })
  grupoId!: number;

  @Column({ name: "FechaInscripcion", type: "date" })
  fechaInscripcion!: string;
}
