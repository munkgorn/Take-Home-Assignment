import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const method = req.method;
  const url = req.originalUrl;

  if (err.message === 'Not allowed by CORS') {
    res.status(403).json({ error: 'CORS not allowed' });
    return;
  }

  if (err instanceof ZodError) {
    const messages = err.issues.map((e) => ({
      field: e.path.map(String).join('.'),
      message: e.message,
    }));
    console.warn(`[${new Date().toISOString()}] WARN ${method} ${url} validation_error fields=${messages.map(m => m.field).join(',')}`);
    res.status(400).json({ error: 'Validation error', details: messages });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    console.warn(`[${new Date().toISOString()}] WARN ${method} ${url} prisma_error code=${err.code}`);
    switch (err.code) {
      case 'P2002':
        res.status(409).json({ error: 'A record with this value already exists' });
        return;
      case 'P2025':
        res.status(404).json({ error: 'Record not found' });
        return;
      default:
        res.status(400).json({ error: 'Database error', code: err.code });
        return;
    }
  }

  console.error(`[${new Date().toISOString()}] ERROR ${method} ${url} unhandled_error`, err.message);
  res.status(500).json({ error: 'Internal server error' });
};
