import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "P_EvaluacionDocente_Estudiante" })
export class Estudiante {
  @PrimaryGeneratedColumn({ name: "Id" })
  id!: number;

  @Column({ name: "UsuarioId", type: "int" })
  usuarioId!: number;

  @Column({ name: "ProgramaEducativoId", type: "int" })
  programaEducativoId!: number;

  @Column({ name: "Matricula", type: "nvarchar", length: 20 })
  matricula!: string;

  @Column({ name: "Nombre", type: "nvarchar", length: 100 })
  nombre!: string;

  @Column({ name: "ApellidoPaterno", type: "nvarchar", length: 100 })
  apellidoPaterno!: string;

  @Column({ name: "ApellidoMaterno", type: "nvarchar", length: 100, nullable: true })
  apellidoMaterno!: string | null;
}
