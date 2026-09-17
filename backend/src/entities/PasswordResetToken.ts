import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "P_EvaluacionDocente_PasswordResetToken" })
export class PasswordResetToken {
  @PrimaryGeneratedColumn({ name: "Id" })
  id!: number;

  @Column({ name: "UsuarioId", type: "int" })
  usuarioId!: number;

  @Column({ name: "TokenHash", type: "nvarchar", length: 256 })
  tokenHash!: string;

  @Column({ name: "FechaCreacion", type: "datetime2" })
  fechaCreacion!: Date;

  @Column({ name: "FechaExpiracion", type: "datetime2" })
  fechaExpiracion!: Date;

  @Column({ name: "Usado", type: "bit", default: false })
  usado!: boolean;
}
