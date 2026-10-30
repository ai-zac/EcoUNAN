import { Request, Response, NextFunction } from 'express';

let activeExports = 0;
const MAX_CONCURRENT_EXPORTS = 3;

export const exportLimiter = (req: Request, res: Response, next: NextFunction): void => {
  if (activeExports >= MAX_CONCURRENT_EXPORTS) {
    res.status(429).json({ success: false, error: 'Demasiadas exportaciones concurrentes. Intenta de nuevo en unos momentos.' });
    return;
  }

  activeExports++;
  let released = false;
  const release = () => {
    if (!released) {
      released = true;
      activeExports--;
    }
  };

  res.on('finish', release);
  res.on('close', release);
  next();
};
