import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "P_EvaluacionDocente_Docente" })
export class Docente {
  @PrimaryGeneratedColumn({ name: "Id" })
  id!: number;

  @Column({ name: "UsuarioId", type: "integer" })
  usuarioId!: number;

  @Column({ name: "FacultadId", type: "integer" })
  facultadId!: number;

  @Column({ name: "NumeroEmpleado", type: "varchar", length: 20 })
  numeroEmpleado!: string;

  @Column({ name: "Nombre", type: "varchar", length: 100 })
  nombre!: string;

  @Column({ name: "ApellidoPaterno", type: "varchar", length: 100 })
  apellidoPaterno!: string;

  @Column({ name: "ApellidoMaterno", type: "varchar", length: 100, nullable: true })
  apellidoMaterno!: string | null;
}
