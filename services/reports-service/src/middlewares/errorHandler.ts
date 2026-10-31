import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction): void {
  const timestamp = new Date().toISOString();
  const path = req.originalUrl || req.url;

  console.error(`[reports-service ERROR ${timestamp}] ${req.method} ${path}:`, {
    name: err?.name,
    message: err?.message,
    status: err?.status || err?.statusCode || 500,
  });

  let status = err?.status || err?.statusCode || 500;
  let code = err?.code || 'REPORTS_SERVICE_ERROR';
  let message = 'Error en el microservicio de reportes.';

  if (err?.name === 'CastError') {
    status = 400;
    code = 'INVALID_IDENTIFIER';
    message = 'Identificador con formato inválido para el reporte.';
  } else if (err?.name === 'BadRequestError' || status === 400) {
    status = 400;
    code = 'BAD_REQUEST';
    message = typeof err?.message === 'string' ? err.message : 'Parámetros de consulta de reporte inválidos.';
  } else if (status === 401) {
    code = 'UNAUTHORIZED';
    message = 'Sesión requerida o token inválido para acceder a reportes.';
  } else if (status === 403) {
    code = 'FORBIDDEN';
    message = 'Acceso denegado: este reporte es exclusivo para administradores.';
  } else if (status === 404) {
    code = 'NOT_FOUND';
    message = typeof err?.message === 'string' ? err.message : 'El reporte solicitado no existe.';
  } else if (status >= 500) {
    status = 500;
    code = 'INTERNAL_REPORT_ERROR';
    message = 'Ocurrió un error al procesar o generar el reporte solicitado.';
  }

  if (res.headersSent) return;

  res.status(status).json({
    success: false,
    statusCode: status,
    code,
    error: message,
    timestamp,
    path,
  });
}
