import { Request, Response } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/user.model';
import { sendMail } from '../utils/mailer';
import { createInitialUserNotifications } from '../services/notification.service';

const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET as string, {
    expiresIn: '7d',
  });
};

export class AuthController {
  public async register(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, password, studentId, faculty, career } = req.body;

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        res.status(400).json({ success: false, error: 'Formato de email inválido' });
        return;
      }

      if (!password || String(password).length < 8) {
        res.status(400).json({ success: false, error: 'La contraseña debe tener al menos 8 caracteres' });
        return;
      }

      if (!name || String(name).trim().length < 2) {
        res.status(400).json({ success: false, error: 'El nombre es obligatorio (mínimo 2 caracteres)' });
        return;
      }

      const userExists = await User.findOne({ email });
      if (userExists) {
        res.status(400).json({ success: false, error: 'Este correo electrónico ya está registrado' });
        return;
      }

      const user = await User.create({
        name,
        email,
        password,
        role: 'user',
        studentId,
        faculty,
        career
      });

      if (user) {
        await createInitialUserNotifications(user._id);
        res.status(201).json({
          success: true,
          data: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id as unknown as string),
          }
        });
      }
    } catch (error: any) {
      console.error('[500]', error);
      res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
  }

public async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      if (!email || !password || !String(email).trim() || !String(password).trim()) {
        res.status(400).json({ success: false, error: 'Por favor ingresa tu correo y contraseña' });
        return;
      }

      const user = await User.findOne({ email: String(email).trim().toLowerCase() }).select('+password');

      if (user && (await user.matchPassword(password))) {
        if (!user.isActive) {
          res.status(403).json({ success: false, error: 'Cuenta deshabilitada. Contacta al administrador.' });
          return;
        }
        res.status(200).json({
          success: true,
          data: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id as unknown as string),
          }
        });
      } else {
        res.status(401).json({ success: false, error: 'Correo o contraseña incorrectos' });
      }
    } catch (error: any) {
      console.error('[500]', error);
      res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
  }

  public async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      if (!email) {
        res.status(400).json({ success: false, error: 'El correo es obligatorio' });
        return;
      }

      const user = await User.findOne({ email: String(email).toLowerCase() });

      if (user) {
        const code = crypto.randomInt(100000, 999999).toString();
        const hash = crypto.createHash('sha256').update(code).digest('hex');

        user.resetPasswordCodeHash = hash;
        user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
        await user.save();

        await sendMail(
          user.email,
          'Recuperación de contraseña - EcoUNAN',
          `<!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f7f6; margin: 0; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
              <div style="background-color: #16A34A; padding: 30px 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 1px;">EcoUNAN</h1>
                <p style="color: #e6f6ec; margin: 10px 0 0 0; font-size: 16px;">Recuperación de cuenta</p>
              </div>

              <div style="padding: 40px 30px;">
                <h2 style="color: #333333; margin-top: 0;">Hola, ${user.name}</h2>
                <p style="color: #555555; font-size: 16px; line-height: 1.6;">
                  Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en <strong>EcoUNAN</strong>.
                  Utiliza el siguiente código de verificación de 6 dígitos para continuar con el proceso:
                </p>

                <div style="background-color: #F0FDF4; border: 2px dashed #16A34A; border-radius: 8px; padding: 25px; text-align: center; margin: 30px 0;">
                  <span style="font-size: 42px; font-weight: bold; letter-spacing: 12px; color: #16A34A; display: inline-block; margin-left: 12px;">
                    ${code}
                  </span>
                </div>

                <p style="color: #555555; font-size: 15px; margin-bottom: 5px;">
                  Este código expirará en <strong>15 minutos</strong>.
                </p>
                <p style="color: #888888; font-size: 14px; margin-top: 0;">
                  Si no solicitaste este cambio, puedes ignorar este correo de forma segura. Tu cuenta seguirá protegida.
                </p>
              </div>

              <div style="background-color: #f9fbf9; padding: 20px; text-align: center; border-top: 1px solid #eeeeee;">
                <p style="color: #999999; font-size: 12px; margin: 0;">
                  &copy; ${new Date().getFullYear()} EcoUNAN. Todos los derechos reservados.<br>
                  Universidad Nacional Autónoma de Nicaragua
                </p>
              </div>
            </div>
          </body>
          </html>`
        );
      }

      res.status(200).json({
        success: true,
        message: 'Si el correo está registrado, recibirás un código de recuperación.'
      });
    } catch (error: any) {
      console.error('[500]', error);
      res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
  }

  public async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email, code, newPassword } = req.body;

      if (!email || !code || !newPassword) {
        res.status(400).json({ success: false, error: 'email, code y newPassword son obligatorios' });
        return;
      }
      if (String(newPassword).length < 8) {
        res.status(400).json({ success: false, error: 'La nueva contraseña debe tener al menos 8 caracteres' });
        return;
      }

      const user = await User.findOne({ email: String(email).toLowerCase() }).select('+password +resetPasswordCodeHash +resetPasswordExpires');
      if (!user || !user.resetPasswordCodeHash || !user.resetPasswordExpires) {
        res.status(400).json({ success: false, error: 'Código inválido o expirado' });
        return;
      }
      if (user.resetPasswordExpires.getTime() < Date.now()) {
        res.status(400).json({ success: false, error: 'El código ha expirado. Solicita uno nuevo.' });
        return;
      }

      const hash = crypto.createHash('sha256').update(String(code)).digest('hex');
      const valid = crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(user.resetPasswordCodeHash));
      if (!valid) {
        res.status(400).json({ success: false, error: 'Código incorrecto' });
        return;
      }

      user.password = newPassword;
      user.resetPasswordCodeHash = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      res.status(200).json({ success: true, message: 'Contraseña restablecida correctamente. Ya puedes iniciar sesión.' });
    } catch (error: any) {
      console.error('[500]', error);
      res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
  }

public async socialLogin(req: Request, res: Response): Promise<void> {
    try {
      const { provider, accessToken } = req.body;

      if (!provider || !accessToken) {
        res.status(400).json({ success: false, error: 'provider y accessToken son obligatorios' });
        return;
      }
      if (provider !== 'google') {
        res.status(400).json({ success: false, error: `Proveedor '${provider}' no disponible todavía` });
        return;
      }

      // TODO [SEC-017]: When Google Client IDs are configured, verify the token's
      // audience matches this app's client ID. Use google-auth-library's
      // OAuth2Client.verifyIdToken() or validate the 'aud' claim.

      const gResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!gResponse.ok) {
        res.status(401).json({ success: false, error: 'Token de Google inválido o expirado' });
        return;
      }

      const profile = await gResponse.json();
      const email = String(profile.email || '').toLowerCase();
      if (!email) {
        res.status(401).json({ success: false, error: 'La cuenta de Google no expone un correo' });
        return;
      }

      let user = await User.findOne({ email });

      if (!user) {

        const randomPassword = crypto.randomBytes(32).toString('hex');
        user = await User.create({
          name: profile.name || profile.email,
          email,
          password: randomPassword,
          role: 'user',
        });
        await createInitialUserNotifications(user._id);
      } else if (!user.isActive) {
        res.status(403).json({ success: false, error: 'Cuenta deshabilitada. Contacta al administrador.' });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          token: generateToken(user._id as unknown as string),
        },
      });
    } catch (error: any) {
      console.error('[500]', error);
      res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
  }
}

export const authController = new AuthController();
