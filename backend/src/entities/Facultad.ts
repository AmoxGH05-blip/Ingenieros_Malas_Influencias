import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "P_EvaluacionDocente_Facultad" })
export class Facultad {
  @PrimaryGeneratedColumn({ name: "Id" })
  id!: number;

  @Column({ name: "Nombre", type: "varchar", length: 150 })
  nombre!: string;

  @Column({ name: "Siglas", type: "varchar", length: 20, nullable: true })
  siglas!: string | null;
}
