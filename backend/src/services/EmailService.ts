import nodemailer from "nodemailer";

type MailTransporter = ReturnType<typeof nodemailer.createTransport>;

let transporter: MailTransporter | null = null;

function getTransporter(): MailTransporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST ?? "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT ?? 465),
      secure: (process.env.SMTP_SECURE ?? "true") === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }
  return transporter;
}

export interface DatosRecordatorio {
  nombre: string;
  diasRestantes: number;
  fechaFin: Date;
  /** Materias sin evaluar, ya formateadas ("Materia (Apellido, Nombre)"). */
  pendientes: string[];
}

function escaparHtml(texto: string): string {
  return texto.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function formatearFecha(fecha: Date): string {
  return fecha.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Mexico_City" });
}

export const EmailService = {
  async enviarRecordatorioEvaluacion(destinatario: string, datos: DatosRecordatorio): Promise<void> {
    const remitente = process.env.SMTP_FROM ?? process.env.SMTP_USER;
    const enlace = `${process.env.FRONTEND_URL ?? "http://localhost:5173"}/estudiante`;
    const plazo = datos.diasRestantes === 1 ? "Falta 1 día" : `Faltan ${datos.diasRestantes} días`;
    const cierre = formatearFecha(datos.fechaFin);
    const lista = datos.pendientes.map((p) => `- ${p}`).join("\n");

    await getTransporter().sendMail({
      from: `"Evaluación Docente DYGSIS" <${remitente}>`,
      to: destinatario,
      subject: `${plazo} para cerrar tu evaluación docente`,
      text: `Hola ${datos.nombre},\n\n${plazo} para que cierre la evaluación docente (${cierre}). Aún tienes pendiente:\n\n${lista}\n\nEntra aquí para completarla:\n${enlace}`,
      html: `<p>Hola ${escaparHtml(datos.nombre)},</p><p><strong>${plazo}</strong> para que cierre la evaluación docente (${cierre}). Aún tienes pendiente:</p><ul>${datos.pendientes.map((p) => `<li>${escaparHtml(p)}</li>`).join("")}</ul><p><a href="${escaparHtml(enlace)}">Completar mi evaluación</a></p>`,
    });
  },

  async enviarCorreoRecuperacion(destinatario: string, enlaceRecuperacion: string): Promise<void> {
    const remitente = process.env.SMTP_FROM ?? process.env.SMTP_USER;

    await getTransporter().sendMail({
      from: `"Evaluacion Docente DYGSIS" <${remitente}>`,
      to: destinatario,
      subject: "Recuperacion de contrasena",
      text: `Solicitaste recuperar tu contrasena. Este enlace expira en 30 minutos:\n\n${enlaceRecuperacion}\n\nSi no fuiste tu, ignora este correo.`,
      html: `<p>Solicitaste recuperar tu contrase&ntilde;a. Este enlace expira en 30 minutos:</p><p><a href="${enlaceRecuperacion}">${enlaceRecuperacion}</a></p><p>Si no fuiste t&uacute;, ignora este correo.</p>`,
    });
  },
};
