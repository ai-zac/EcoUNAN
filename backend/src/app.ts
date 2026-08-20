import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import userRoutes from './routes/user.routes';
import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';
import rewardRoutes from './routes/reward.routes';
import goalRoutes from './routes/goal.routes';
import notificationRoutes from './routes/notification.routes';
import recycleRoutes from './routes/recycle.routes';
import staffRoutes from './routes/staff.routes';
import studentRoutes from './routes/student.routes';
import { errorHandler } from './middlewares/errorHandler';

dotenv.config();

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('[SECURITY] JWT_SECRET must be at least 32 characters. Generate with: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

const app = express();

app.use(helmet());

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:8081,http://localhost:19006').split(',');
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Request blocked from origin: ${origin}`);
      callback(new Error('No permitido por la política CORS'), false);
    }
  },
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

const sanitizeNoSQL = (obj: any): void => {
  if (!obj || typeof obj !== 'object') return;
  for (const key of Object.keys(obj)) {
    if (key.startsWith('$') || key.includes('.')) {
      delete obj[key];
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeNoSQL(obj[key]);
    }
  }
};

app.use((req, _res, next) => {
  if (req.body) sanitizeNoSQL(req.body);
  if (req.params) sanitizeNoSQL(req.params);
  if (req.query) sanitizeNoSQL(req.query);
  next();
});

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Demasiados intentos. Espera 15 minutos y vuelve a intentar.' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/auth/social', authLimiter);

const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Demasiados intentos de reset. Espera 15 minutos.' },
});
app.use('/api/auth/reset-password', resetPasswordLimiter);

const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 150 : 2000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Demasiadas solicitudes. Intenta de nuevo en un momento.' },
});
app.use('/api/', globalLimiter);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI as string, {
      maxPoolSize: 50,
      minPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxIdleTimeMS: 30000,
      serverApi: {
        version: '1',
        strict: true,
        deprecationErrors: true,
      }
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

connectDB();

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/rewards', rewardRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/recycles', recycleRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/estudiantes', studentRoutes);

app.get('/', (req, res) => {
  res.send('EcoUnan API is running...');
});

app.use(errorHandler);

export default app;
