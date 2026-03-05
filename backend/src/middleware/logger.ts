import { Request, Response, NextFunction } from 'express';

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return req.ip || req.socket.remoteAddress || 'unknown';
}

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  const ip = getClientIp(req);
  const method = req.method;
  const url = req.originalUrl;
  const userAgent = req.headers['user-agent'] || '-';
  const origin = req.headers['origin'] || '-';

  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const userId = req.user?.id ?? '-';

    const level = status >= 500 ? 'ERROR' : status >= 400 ? 'WARN' : 'INFO';

    console.log(
      `[${new Date().toISOString()}] ${level} ${method} ${url} ${status} ${duration}ms | ip=${ip} user=${userId} origin=${origin} ua="${userAgent}"`
    );
  });

  next();
};

export const securityLogger = {
  loginSuccess(email: string, ip: string) {
    console.log(`[${new Date().toISOString()}] SECURITY login_success email=${email} ip=${ip}`);
  },
  loginFailed(email: string, ip: string) {
    console.warn(`[${new Date().toISOString()}] SECURITY login_failed email=${email} ip=${ip}`);
  },
  registerSuccess(email: string, ip: string) {
    console.log(`[${new Date().toISOString()}] SECURITY register_success email=${email} ip=${ip}`);
  },
  tokenMissing(ip: string, url: string) {
    console.warn(`[${new Date().toISOString()}] SECURITY token_missing ip=${ip} url=${url}`);
  },
  tokenInvalid(ip: string, url: string) {
    console.warn(`[${new Date().toISOString()}] SECURITY token_invalid ip=${ip} url=${url}`);
  },
  tokenExpired(ip: string, url: string) {
    console.warn(`[${new Date().toISOString()}] SECURITY token_expired ip=${ip} url=${url}`);
  },
  corsBlocked(origin: string, ip: string) {
    console.warn(`[${new Date().toISOString()}] SECURITY cors_blocked origin=${origin} ip=${ip}`);
  },
};
