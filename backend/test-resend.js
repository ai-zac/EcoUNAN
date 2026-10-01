
const { path } = require('path');
const { dotenv } = require('dotenv')
const { Resend } = require('resend');

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY});

async function sendOTP() {
  try {
    const data = await resend.emails.send({
      from: 'Soporte EcoUNAN <soporte@ecounan.app>',
      to: ['soporte@ecounan.app'], // Enviando a sí mismo para prueba
      subject: 'Código de Recuperación de Contraseña',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
          <h2 style="color: #333;">Recuperación de Contraseña</h2>
          <p>Hola,</p>
          <p>Has solicitado restablecer tu contraseña. Utiliza el siguiente código OTP para continuar:</p>
          <div style="background-color: #f4f4f4; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
            <h1 style="margin: 0; letter-spacing: 5px; color: #4CAF50;">123456</h1>
          </div>
          <p>Este código expirará en 10 minutos. Si no has solicitado esto, puedes ignorar este correo de forma segura.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #888;">El equipo de EcoUNAN</p>
        </div>
      `,
    });

    console.log('¡Correo enviado con éxito!');
    console.log('ID del mensaje:', data.id || data.data?.id);
  } catch (error) {
    console.error('Error al enviar el correo:', error);
  }
}

sendOTP();
