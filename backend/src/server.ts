
import 'dotenv/config';
import mongoose from 'mongoose';
import net from 'net';
import path from 'path';
import { spawn } from 'child_process';
import app from './app';

const PORT = process.env.PORT || 5000;

process.on('unhandledRejection', (reason: unknown) => {
  console.error('[UNHANDLED_REJECTION]', reason);
});

process.on('uncaughtException', (error: Error) => {
  console.error('[UNCAUGHT_EXCEPTION]', error);
  process.exit(1);
});

const checkAndEnsureReportsService = () => {
  const socket = new net.Socket();
  socket.setTimeout(800);
  socket.on('connect', () => {
    socket.destroy();
  });
  const launch = () => {
    try {
      const reportsDir = path.resolve(__dirname, '../../services/reports-service');
      const child = spawn('npx', ['tsx', 'src/server.ts'], {
        cwd: reportsDir,
        shell: true,
        stdio: 'inherit',
      });
      child.on('error', (err) => console.warn('[Reports AutoStart Error]', err.message));
    } catch (e: any) {
      console.warn('[Reports AutoStart Error]', e.message);
    }
  };
  socket.on('timeout', () => {
    socket.destroy();
    launch();
  });
  socket.on('error', () => {
    launch();
  });
  socket.connect(5001, '127.0.0.1');
};

const server = app.listen(PORT, () => {
  console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  checkAndEnsureReportsService();
});

server.headersTimeout = 65000;
server.requestTimeout = 60000;
server.keepAliveTimeout = 61000;

const gracefulShutdown = (signal: string) => {
  console.log(`[${signal}] Cerrando servidor...`);
  const forceExit = setTimeout(() => {
    console.error('Cierre forzado.');
    process.exit(1);
  }, 10000);
  forceExit.unref();

  server.close(async () => {
    try {
      await mongoose.connection.close(false);
      clearTimeout(forceExit);
      process.exit(0);
    } catch (err) {
      console.error('Error cerrando conexion:', err);
      process.exit(1);
    }
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
