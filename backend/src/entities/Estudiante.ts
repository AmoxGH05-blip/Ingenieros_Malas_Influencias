import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "P_EvaluacionDocente_Estudiante" })
export class Estudiante {
  @PrimaryGeneratedColumn({ name: "Id" })
  id!: number;

  @Column({ name: "UsuarioId", type: "integer" })
  usuarioId!: number;

  @Column({ name: "ProgramaEducativoId", type: "integer" })
  programaEducativoId!: number;

  @Column({ name: "Matricula", type: "varchar", length: 20 })
  matricula!: string;

  @Column({ name: "Nombre", type: "varchar", length: 100 })
  nombre!: string;

  @Column({ name: "ApellidoPaterno", type: "varchar", length: 100 })
  apellidoPaterno!: string;

  @Column({ name: "ApellidoMaterno", type: "varchar", length: 100, nullable: true })
  apellidoMaterno!: string | null;
}
