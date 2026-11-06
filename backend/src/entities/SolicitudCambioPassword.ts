import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

export type EstadoSolicitud = "Pendiente" | "Aprobada" | "Rechazada" | "Reemplazada";

/** Contrasena nueva pedida por el dueño de la cuenta; no vale hasta que quien la gestiona la aprueba (SCRUM-80). */
@Entity({ name: "P_EvaluacionDocente_SolicitudCambioPassword" })
export class SolicitudCambioPassword {
  @PrimaryGeneratedColumn({ name: "Id" })
  id!: number;

  @Column({ name: "UsuarioId", type: "integer" })
  usuarioId!: number;

  /** bcrypt de la contrasena pedida (la contrasena en claro nunca se guarda). Solo la solicitud pendiente lo conserva. */
  @Column({ name: "NuevaPasswordHash", type: "varchar", length: 256, nullable: true })
  nuevaPasswordHash!: string | null;

  /** SHA-256 del codigo de verificacion que vio quien mando la solicitud; quien aprueba debe teclearlo. */
  @Column({ name: "CodigoHash", type: "varchar", length: 64 })
  codigoHash!: string;

  @Column({ name: "Estado", type: "varchar", length: 12, default: "Pendiente" })
  estado!: EstadoSolicitud;

  @Column({ name: "FechaSolicitud", type: "timestamptz" })
  fechaSolicitud!: Date;

  @Column({ name: "FechaResolucion", type: "timestamptz", nullable: true })
  fechaResolucion!: Date | null;

  @Column({ name: "ResueltaPorUsuarioId", type: "integer", nullable: true })
  resueltaPorUsuarioId!: number | null;
}
