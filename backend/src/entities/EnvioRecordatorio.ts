import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "P_EvaluacionDocente_EnvioRecordatorio" })
export class EnvioRecordatorio {
  @PrimaryGeneratedColumn({ name: "Id" })
  id!: number;

  @Column({ name: "PeriodoEvaluacionId", type: "integer" })
  periodoEvaluacionId!: number;

  @Column({ name: "UsuarioId", type: "integer" })
  usuarioId!: number;

  @Column({ name: "DiasAntes", type: "smallint" })
  diasAntes!: number;

  @Column({ name: "FechaEnvio", type: "timestamptz", default: () => "now()" })
  fechaEnvio!: Date;
}
