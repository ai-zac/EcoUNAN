import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user.model';

const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET as string, {
    expiresIn: '30d',
  });
};

export class AuthController {
  public async register(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, password, role, studentId, faculty, career } = req.body;

      const userExists = await User.findOne({ email });
      if (userExists) {
        res.status(400).json({ success: false, error: 'User already exists' });
        return;
      }

      const user = await User.create({
        name,
        email,
        password,
        role: role === 'admin' ? 'admin' : 'user', // In real app, secure admin creation
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
      res.status(500).json({ success: false, error: error.message });
    }
  }

  public async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email });

      if (user && (await user.matchPassword(password))) {
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
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

export const authController = new AuthController();
