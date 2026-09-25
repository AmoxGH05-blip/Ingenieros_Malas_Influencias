import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "P_EvaluacionDocente_PasswordResetToken" })
export class PasswordResetToken {
  @PrimaryGeneratedColumn({ name: "Id" })
  id!: number;

  @Column({ name: "UsuarioId", type: "integer" })
  usuarioId!: number;

  @Column({ name: "TokenHash", type: "varchar", length: 256 })
  tokenHash!: string;

  @Column({ name: "FechaCreacion", type: "timestamptz" })
  fechaCreacion!: Date;

  @Column({ name: "FechaExpiracion", type: "timestamptz" })
  fechaExpiracion!: Date;

  @Column({ name: "Usado", type: "boolean", default: false })
  usado!: boolean;
}
