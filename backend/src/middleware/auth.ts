import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { securityLogger } from './logger';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
      };
    }
  }
}

interface JwtPayload {
  sub?: string;
  email?: string;
  name?: string;
  id?: string;
}

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return req.ip || req.socket.remoteAddress || 'unknown';
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  const ip = getClientIp(req);

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    securityLogger.tokenMissing(ip, req.originalUrl);
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.NEXTAUTH_SECRET;

  if (!secret) {
    res.status(500).json({ error: 'Server configuration error' });
    return;
  }

  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;

    const userId = decoded.sub || decoded.id;

    if (!userId) {
      securityLogger.tokenInvalid(ip, req.originalUrl);
      res.status(401).json({ error: 'Invalid token payload' });
      return;
    }

    req.user = {
      id: userId,
      email: decoded.email || '',
      name: decoded.name || '',
    };

    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      securityLogger.tokenExpired(ip, req.originalUrl);
    } else {
      securityLogger.tokenInvalid(ip, req.originalUrl);
    }
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};
