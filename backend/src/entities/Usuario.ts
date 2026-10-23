import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "P_EvaluacionDocente_Usuario" })
export class Usuario {
  @PrimaryGeneratedColumn({ name: "Id" })
  id!: number;

  /** Con esto se inicia sesion (matricula o numero de empleado), siempre en MAYUSCULAS. */
  @Column({ name: "NumeroCuenta", type: "varchar", length: 20 })
  numeroCuenta!: string;

  /** Dato de contacto; ya no sirve para iniciar sesion. */
  @Column({ name: "CorreoElectronico", type: "varchar", length: 150 })
  correoElectronico!: string;

  @Column({ name: "ContrasenaHash", type: "varchar", length: 256 })
  contrasenaHash!: string;

  /** La contrasena la puso otra persona (alta o cuenta inicial): hay que cambiarla antes de usar el sistema. */
  @Column({ name: "DebeCambiarPassword", type: "boolean", default: false })
  debeCambiarPassword!: boolean;

  @Column({ name: "Activo", type: "boolean", default: true })
  activo!: boolean;

  @Column({ name: "FechaCreacion", type: "timestamptz" })
  fechaCreacion!: Date;
}
