import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction): void {
  console.error(`[reports-service ERROR] ${req.method} ${req.originalUrl}:`, err?.message || err);

  let status = err?.status || err?.statusCode || 500;
  let message = 'Error interno del servidor';

  if (err?.name === 'CastError') {
    status = 400;
    message = 'Identificador inválido';
  } else if (status === 400 || status === 401 || status === 403 || status === 404) {
    message = typeof err?.message === 'string' ? err.message : message;
  }

  if (res.headersSent) return;
  res.status(status).json({ success: false, error: message });
}

