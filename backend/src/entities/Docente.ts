import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "P_EvaluacionDocente_Docente" })
export class Docente {
  @PrimaryGeneratedColumn({ name: "Id" })
  id!: number;

  @Column({ name: "UsuarioId", type: "int" })
  usuarioId!: number;

  @Column({ name: "FacultadId", type: "int" })
  facultadId!: number;

  @Column({ name: "NumeroEmpleado", type: "nvarchar", length: 20 })
  numeroEmpleado!: string;

  @Column({ name: "Nombre", type: "nvarchar", length: 100 })
  nombre!: string;

  @Column({ name: "ApellidoPaterno", type: "nvarchar", length: 100 })
  apellidoPaterno!: string;

  @Column({ name: "ApellidoMaterno", type: "nvarchar", length: 100, nullable: true })
  apellidoMaterno!: string | null;
}
