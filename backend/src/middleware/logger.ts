import { Request, Response, NextFunction } from 'express';

export const logger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusColor = res.statusCode >= 500 ? '\x1b[31m' : res.statusCode >= 400 ? '\x1b[33m' : '\x1b[32m';
    const reset = '\x1b[0m';

    console.log(
      `${statusColor}${res.statusCode}${reset} ${req.method.padEnd(7)} ${req.path.padEnd(40)} ${duration}ms`
    );
  });

  next();
};
