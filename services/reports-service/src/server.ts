import { env } from './config/env'; // debe ir primero: carga las variables de entorno
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import recycleReportRoutes from './routes/recycleReport.routes';
import { errorHandler } from './middlewares/errorHandler';

const app = express();

app.use(helmet());
// El tráfico normal llega a través del proxy del backend principal (5000).
app.use(cors());
app.use(express.json({ limit: '10kb' }));

app.use(
  '/api/',
  rateLimit({
    windowMs: 60 * 1000,
    max: env.NODE_ENV === 'production' ? 150 : 2000,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Demasiadas solicitudes. Intenta de nuevo en un momento.' },
  }),
);

app.get('/health', (_req, res) => {
  res.json({ success: true, service: 'reports-service', db: mongoose.connection.readyState === 1 });
});

app.use('/api/reports', recycleReportRoutes);

app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Ruta no encontrada en reports-service' });
});

app.use(errorHandler);

const start = async () => {
  try {
    const conn = await mongoose.connect(env.MONGO_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      // Clúster con Stable API v1 estricta: prohibido .distinct(), solo aggregate().
      serverApi: { version: '1', strict: true, deprecationErrors: true },
    });
    console.log(`[reports-service] MongoDB conectado: ${conn.connection.host}`);
    app.listen(env.PORT, '0.0.0.0', () => {
      console.log(`[reports-service] Escuchando en el puerto ${env.PORT}`);
    });
  } catch (err) {
    console.error('[reports-service] Error conectando a MongoDB:', (err as Error).message);
    process.exit(1);
  }
};

start();
