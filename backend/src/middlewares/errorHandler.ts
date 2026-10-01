import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction): void {
  
  console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err?.message || err);

  let status = err?.status || err?.statusCode || 500;
  let message = 'Error interno del servidor';

  
  if (err?.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors || {})
      .map((e: any) => e.message)
      .join(', ') || 'Datos inválidos';
  } else if (err?.name === 'CastError') {
    status = 400;
    message = 'Identificador inválido';
  } else if (err?.code === 11000) {
    status = 400;
    message = 'Ya existe un registro con esos datos únicos';
  } else if (status === 401 || status === 403 || status === 404) {
    
    message = typeof err?.message === 'string' ? err.message : message;
  }

  res.status(status).json({ success: false, error: message });
}
