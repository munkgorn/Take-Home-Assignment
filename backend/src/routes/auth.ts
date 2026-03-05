import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { registerSchema, loginSchema } from '../validators/auth';
import { securityLogger } from '../middleware/logger';

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return req.ip || req.socket.remoteAddress || 'unknown';
}

export function createAuthRoutes(prisma: PrismaClient) {
  const router = Router();

  router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = registerSchema.parse(req.body);
      const ip = getClientIp(req);

      const existing = await prisma.user.findUnique({ where: { email: data.email } });
      if (existing) {
        res.status(409).json({ error: 'Email already registered' });
        return;
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);

      const user = await prisma.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          name: data.name,
        },
        select: {
          id: true,
          email: true,
          name: true,
        },
      });

      securityLogger.registerSuccess(data.email, ip);
      res.status(201).json(user);
    } catch (err) {
      next(err);
    }
  });

  router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = loginSchema.parse(req.body);
      const ip = getClientIp(req);

      const user = await prisma.user.findUnique({ where: { email: data.email } });
      if (!user) {
        securityLogger.loginFailed(data.email, ip);
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      const valid = await bcrypt.compare(data.password, user.password);
      if (!valid) {
        securityLogger.loginFailed(data.email, ip);
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      securityLogger.loginSuccess(data.email, ip);
      res.json({ id: user.id, email: user.email, name: user.name });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

export default createAuthRoutes(new PrismaClient());
