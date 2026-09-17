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

export const EmailService = {
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
