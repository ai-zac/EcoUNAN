import nodemailer from 'nodemailer';

/**
 * Envia un email. Si hay credenciales SMTP en .env usa el transporte real;
 * si no, imprime el contenido en consola (modo desarrollo).
 */
export async function sendMail(to: string, subject: string, html: string): Promise<void> {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    const codeMatch = html.match(/\b(\d{6})\b/);
    console.log('──────────────────────────────────────────────');
    console.log(`[mail:DEV] Para: ${to}`);
    console.log(`[mail:DEV] Asunto: ${subject}`);
    if (codeMatch) {
      console.log(`[mail:DEV] CODIGO DE RECUPERACION: ${codeMatch[1]} (solo modo desarrollo)`);
    }
    console.log('──────────────────────────────────────────────');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  await transporter.sendMail({
    from: SMTP_FROM || `"EcoUNAN" <${SMTP_USER}>`,
    to,
    subject,
    html,
  });
}
