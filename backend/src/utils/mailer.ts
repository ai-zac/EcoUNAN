import { Resend } from 'resend';

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[mailer] FATAL: RESEND_API_KEY environment variable is not set');
      throw new Error('RESEND_API_KEY is required in production');
    } else {
      console.log('[mailer] INFO: RESEND_API_KEY no configurada. Códigos de recuperación saldrán por consola (DEV mode).');
    }
  }
  return new Resend(apiKey || 'placeholder-will-fail');
}

export async function sendMail(to: string, subject: string, html: string): Promise<void> {
  const from = process.env.EMAIL_FROM || 'Soporte EcoUNAN <soporte@ecounan.app>';
  const resend = getResendClient();

  try {
    const data = await resend.emails.send({
      from,
      to: [to],
      replyTo: process.env.EMAIL_REPLY_TO || 'soporte@ecounan.app',
      subject,
      html,
    });

    console.log(`[mail:RESEND] Correo enviado exitosamente a ${to}. ID:`, JSON.stringify(data));
  } catch (error) {
    console.error(`[mail:RESEND] Error enviando correo a ${to}:`, error);
    
    if (process.env.NODE_ENV !== 'production') {
      const codeMatch = html.match(/\b(\d{6})\b/);
      if (codeMatch) {
        console.log('──────────────────────────────────────────────');
        console.log(`[mail:DEV-FALLBACK] Para: ${to}`);
        console.log(`[mail:DEV-FALLBACK] Asunto: ${subject}`);
        console.log(`[mail:DEV-FALLBACK] CODIGO DE RECUPERACION: ${codeMatch[1]}`);
        console.log('──────────────────────────────────────────────');
      }
    }
  }
}
