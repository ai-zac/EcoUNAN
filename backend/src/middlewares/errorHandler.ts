import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction): void {
  const timestamp = new Date().toISOString();
  const path = req.originalUrl || req.url;

  // Log estructurado en consola del servidor
  console.error(`[ERROR ${timestamp}] ${req.method} ${path}:`, {
    name: err?.name,
    message: err?.message,
    status: err?.statusCode || err?.status || 500,
    stack: process.env.NODE_ENV !== 'production' ? err?.stack : undefined,
  });

  let status = err?.statusCode || err?.status || 500;
  let code = err?.code || 'INTERNAL_SERVER_ERROR';
  let message = 'Ocurrió un error interno en el servidor. Por favor intenta más tarde.';
  let details: any = err?.details || undefined;

  // 1. Error de Sintaxis / JSON Malformado en el Body
  if (err instanceof SyntaxError && 'body' in err) {
    status = 400;
    code = 'INVALID_JSON_BODY';
    message = 'El cuerpo de la solicitud no tiene un formato JSON válido.';
  }

  // 2. Errores de Validación de Mongoose (Schema Validation)
  else if (err?.name === 'ValidationError') {
    status = 400;
    code = 'VALIDATION_ERROR';
    const fieldErrors = Object.values(err.errors || {}).map((e: any) => ({
      field: e.path,
      message: e.message,
    }));
    message = fieldErrors.length > 0
      ? fieldErrors.map((f: any) => f.message).join('. ')
      : 'Uno o más datos proporcionados no cumplen con las validaciones requeridas.';
    details = fieldErrors;
  }

  // 3. Error de Cast / ObjectId inválido en Mongoose
  else if (err?.name === 'CastError') {
    status = 400;
    code = 'INVALID_IDENTIFIER';
    message = `El identificador '${err.value}' no tiene un formato válido para el recurso solicitado.`;
  }

  // 4. Clave única duplicada en MongoDB (Error 11000 -> 409 Conflict)
  else if (err?.code === 11000) {
    status = 409;
    code = 'DUPLICATE_RESOURCE';
    const rawField = Object.keys(err.keyValue || {})[0] || 'campo';
    const fieldLabels: Record<string, string> = {
      email: 'correo electrónico',
      studentId: 'número de carnet o cédula',
      username: 'nombre de usuario',
      title: 'título',
      name: 'nombre',
    };
    const friendlyName = fieldLabels[rawField] || rawField;
    message = `Ya existe un registro con ese ${friendlyName} (${err.keyValue?.[rawField] || ''}). Por favor utiliza uno diferente.`;
    details = err.keyValue;
  }

  // 5. Errores de Multer (Carga de Archivos / Límites)
  else if (err?.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      status = 413;
      code = 'FILE_TOO_LARGE';
      message = 'El archivo supera el tamaño máximo permitido de 10 MB.';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      status = 400;
      code = 'UNEXPECTED_FILE';
      message = 'Se envió un campo de archivo no esperado en la solicitud.';
    } else {
      status = 400;
      code = 'FILE_UPLOAD_ERROR';
      message = `Error al procesar el archivo: ${err.message}`;
    }
  }

  // 6. Errores de Token JWT
  else if (err?.name === 'TokenExpiredError') {
    status = 401;
    code = 'TOKEN_EXPIRED';
    message = 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.';
  } else if (err?.name === 'JsonWebTokenError') {
    status = 401;
    code = 'INVALID_TOKEN';
    message = 'Token de autenticación inválido o alterado.';
  }

  // 7. Errores operacionales personalizados (AppError o status HTTP explícito)
  else if (err instanceof AppError || (status >= 400 && status < 500)) {
    message = typeof err?.message === 'string' ? err.message : message;
    if (status === 401 && code === 'INTERNAL_SERVER_ERROR') code = 'UNAUTHORIZED';
    if (status === 403 && code === 'INTERNAL_SERVER_ERROR') code = 'FORBIDDEN';
    if (status === 404 && code === 'INTERNAL_SERVER_ERROR') code = 'NOT_FOUND';
  }

  // 8. Error de proxy o servicio no disponible (502 / 503)
  else if (status === 502 || status === 503 || err?.code === 'ECONNREFUSED') {
    status = 502;
    code = 'SERVICE_UNAVAILABLE';
    message = 'El servicio solicitado no está disponible temporalmente o se encuentra en mantenimiento.';
  }

  // Respuesta JSON estandarizada y segura
  if (res.headersSent) return;

  res.status(status).json({
    success: false,
    statusCode: status,
    code,
    error: message,
    details: process.env.NODE_ENV !== 'production' ? (details || err?.stack) : details,
    timestamp,
    path,
  });
}
