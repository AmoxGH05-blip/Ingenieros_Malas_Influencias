/**
 * Crea la primera cuenta de Administrador (SCRUM-78). Uso, desde backend/:
 *
 *   read -rs ADMIN_PASSWORD && export ADMIN_PASSWORD && npm run admin:inicial     (Git Bash / Linux / macOS)
 *
 * El "read -rs" pide la contrasena sin mostrarla, asi no queda en el historial de comandos. No la escribas
 * en la propia linea del comando (ADMIN_PASSWORD='...' npm run ...): el historial de la terminal la guardaria.
 * En PowerShell: $s = Read-Host -AsSecureString; $env:ADMIN_PASSWORD = [Net.NetworkCredential]::new('', $s).Password
 *
 * Variables opcionales: ADMIN_NUMERO_CUENTA (por defecto ADMIN0001) y ADMIN_CORREO.
 * La contrasena se lee del entorno para que no quede en el repo ni en un chat.
 * La cuenta nace con cambio obligatorio: al entrar por primera vez se pide una contrasena nueva.
 */
import "dotenv/config";
import { AppDataSource } from "../src/config/data-source";
import { AdminInicialInvalidoError, AdminInicialService } from "../src/services/AdminInicialService";

async function main(): Promise<number> {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    console.error("Falta ADMIN_PASSWORD (la contrasena temporal de la cuenta). Ver el encabezado de este archivo.");
    return 1;
  }

  await AppDataSource.initialize();
  try {
    const cuenta = await AdminInicialService.crear({
      numeroCuenta: process.env.ADMIN_NUMERO_CUENTA,
      password,
      correo: process.env.ADMIN_CORREO,
    });
    console.log(`Cuenta creada: ${cuenta.numeroCuenta} (${cuenta.correo}).`);
    console.log("Inicia sesion con ese numero de cuenta y la contrasena temporal; se te pedira cambiarla.");
    return 0;
  } catch (error) {
    if (error instanceof AdminInicialInvalidoError) {
      console.error(`No se creo la cuenta: ${error.message}`);
      return 1;
    }
    throw error;
  } finally {
    await AppDataSource.destroy();
  }
}

main()
  .then((codigo) => process.exit(codigo))
  .catch((error: unknown) => {
    // Solo el mensaje: el objeto de un error de TypeORM incluye los parametros de la consulta (como el hash de la contrasena).
    console.error("Error inesperado:", error instanceof Error ? error.message : "desconocido");
    process.exit(1);
  });
