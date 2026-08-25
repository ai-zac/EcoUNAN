import { Request, Response } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/user.model';
import { sendMail } from '../utils/mailer';

const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET as string, {
    expiresIn: '30d',
  });
};

export class AuthController {
  public async register(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, password, studentId, faculty, career } = req.body;

      const userExists = await User.findOne({ email });
      if (userExists) {
        res.status(400).json({ success: false, error: 'User already exists' });
        return;
      }

      // El rol NUNCA viene del cliente. Los roles de staff los asigna el superadmin.
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

      const user = await User.findOne({ email });

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
        res.status(401).json({ success: false, error: 'Invalid email or password' });
      }
    } catch (error: any) {
      console.error('[500]', error);
      res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
  }
  // @desc    Solicitar codigo de recuperacion de contraseÃ±a
  // @route   POST /api/auth/forgot-password
  // @access  Public (por diseno: el usuario perdio su acceso)
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
        user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 min
        await user.save();

        await sendMail(
          user.email,
          'RecuperaciÃ³n de contraseÃ±a - EcoUNAN',
          `<div style="font-family:sans-serif;max-width:480px">
            <h2 style="color:#16A34A">EcoUNAN ðŸŒ±</h2>
            <p>Hola ${user.name}, tu cÃ³digo para restablecer la contraseÃ±a es:</p>
            <p style="font-size:32px;font-weight:bold;letter-spacing:8px;background:#F0FDF4;padding:12px;text-align:center;border-radius:8px">${code}</p>
            <p>Este cÃ³digo expira en <b>15 minutos</b>. Si no solicitaste el cambio, ignora este mensaje.</p>
          </div>`
        );
      }

      // Respuesta generica: no revela si el correo existe o no
      res.status(200).json({
        success: true,
        message: 'Si el correo estÃ¡ registrado, recibirÃ¡s un cÃ³digo de recuperaciÃ³n.'
      });
    } catch (error: any) {
      console.error('[500]', error);
      res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
  }

  // @desc    Restablecer contraseÃ±a con el codigo recibido
  // @route   PUT /api/auth/reset-password
  // @access  Public (por diseno)
  public async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email, code, newPassword } = req.body;

      if (!email || !code || !newPassword) {
        res.status(400).json({ success: false, error: 'email, code y newPassword son obligatorios' });
        return;
      }
      if (String(newPassword).length < 8) {
        res.status(400).json({ success: false, error: 'La nueva contraseÃ±a debe tener al menos 8 caracteres' });
        return;
      }

      const user = await User.findOne({ email: String(email).toLowerCase() }).select('+resetPasswordCodeHash +resetPasswordExpires');
      if (!user || !user.resetPasswordCodeHash || !user.resetPasswordExpires) {
        res.status(400).json({ success: false, error: 'CÃ³digo invÃ¡lido o expirado' });
        return;
      }
      if (user.resetPasswordExpires.getTime() < Date.now()) {
        res.status(400).json({ success: false, error: 'El cÃ³digo ha expirado. Solicita uno nuevo.' });
        return;
      }

      const hash = crypto.createHash('sha256').update(String(code)).digest('hex');
      const valid = crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(user.resetPasswordCodeHash));
      if (!valid) {
        res.status(400).json({ success: false, error: 'CÃ³digo incorrecto' });
        return;
      }

      user.password = newPassword; // pre-save hook la hashea
      user.resetPasswordCodeHash = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      res.status(200).json({ success: true, message: 'ContraseÃ±a restablecida correctamente. Ya puedes iniciar sesiÃ³n.' });
    } catch (error: any) {
      console.error('[500]', error);
      res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
  }
  // @desc    Login social con Google (verifica el token contra la API de Google)
  // @route   POST /api/auth/social
  // @access  Public (por diseno: es autenticacion en si misma)
  public async socialLogin(req: Request, res: Response): Promise<void> {
    try {
      const { provider, accessToken } = req.body;

      if (!provider || !accessToken) {
        res.status(400).json({ success: false, error: 'provider y accessToken son obligatorios' });
        return;
      }
      if (provider !== 'google') {
        res.status(400).json({ success: false, error: `Proveedor '${provider}' no disponible todavÃ­a` });
        return;
      }

      const gResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!gResponse.ok) {
        res.status(401).json({ success: false, error: 'Token de Google invÃ¡lido o expirado' });
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
        // Alta automatica sin contraseÃ±a conocida por el usuario
        const randomPassword = crypto.randomBytes(32).toString('hex');
        user = await User.create({
          name: profile.name || profile.email,
          email,
          password: randomPassword, // hasheado por el pre-save hook; nadie lo conoce
          role: 'user', // NUNCA se acepta rol del cliente
        });
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

