import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

/**
 * Carga de variables de entorno:
 * 1. services/reports-service/.env  (propio del microservicio, opcional)
 * 2. backend/.env                    (compartido: MONGO_URI, JWT_SECRET)
 * dotenv no sobrescribe variables ya definidas, así que el .env propio tiene prioridad.
 * __dirname funciona igual desde src/ (ts-node-dev) y dist/ (build).
 */
const serviceRoot = path.resolve(__dirname, '..', '..');
const candidates = [
  path.join(serviceRoot, '.env'),
  path.resolve(serviceRoot, '..', '..', 'backend', '.env'),
];

for (const file of candidates) {
  if (fs.existsSync(file)) dotenv.config({ path: file, quiet: true } as dotenv.DotenvConfigOptions);
}

const required = ['MONGO_URI', 'JWT_SECRET'] as const;
for (const key of required) {
  if (!process.env[key]) {
    console.error(`[reports-service] Falta la variable de entorno ${key}`);
    process.exit(1);
  }
}

export const env = {
  MONGO_URI: process.env.MONGO_URI as string,
  JWT_SECRET: process.env.JWT_SECRET as string,
  // NO usar PORT: el .env compartido del backend define PORT=5000.
  PORT: Number(process.env.REPORTS_PORT) || 5001,
  NODE_ENV: process.env.NODE_ENV || 'development',
};

