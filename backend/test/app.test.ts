import { expect } from 'chai';
import supertest from 'supertest';
import app from '../src/index';

describe('App (index.ts)', () => {
  describe('Security Headers', () => {
    it('should set X-Content-Type-Options to nosniff', async () => {
      const res = await supertest(app).get('/api/auth/login');
      expect(res.headers['x-content-type-options']).to.equal('nosniff');
    });

    it('should set X-Frame-Options to DENY', async () => {
      const res = await supertest(app).get('/api/auth/login');
      expect(res.headers['x-frame-options']).to.equal('DENY');
    });

    it('should set X-XSS-Protection', async () => {
      const res = await supertest(app).get('/api/auth/login');
      expect(res.headers['x-xss-protection']).to.equal('1; mode=block');
    });

    it('should not have X-Powered-By header', async () => {
      const res = await supertest(app).get('/api/auth/login');
      expect(res.headers['x-powered-by']).to.be.undefined;
    });
  });

  describe('CORS', () => {
    it('should allow requests from allowed origins', async () => {
      const res = await supertest(app)
        .options('/api/auth/login')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST');

      expect(res.headers['access-control-allow-origin']).to.equal('http://localhost:3000');
    });

    it('should allow requests with no origin (curl/server-to-server)', async () => {
      const res = await supertest(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'pass' });

      // Should not get a CORS error — status depends on auth logic, not CORS
      expect(res.status).to.not.equal(403);
    });

    it('should block requests from disallowed origins', async () => {
      const res = await supertest(app)
        .post('/api/auth/login')
        .set('Origin', 'http://evil.com')
        .send({ email: 'test@example.com', password: 'pass' });

      // The CORS error gets caught by errorHandler and returns 403
      expect(res.status).to.equal(403);
      expect(res.body).to.deep.equal({ error: 'CORS not allowed' });
    });
  });

  describe('Routes Registration', () => {
    it('should have /api/auth routes mounted', async () => {
      const res = await supertest(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });

      // Should get auth-related response, not 404
      expect(res.status).to.not.equal(404);
    });

    it('should have /api/meetings routes mounted', async () => {
      const res = await supertest(app)
        .get('/api/meetings')
        .set('Authorization', 'Bearer invalid');

      // Should get auth error from middleware, not 404
      expect(res.status).to.equal(401);
    });
  });

  describe('JSON Body Parsing', () => {
    it('should parse JSON request bodies', async () => {
      const res = await supertest(app)
        .post('/api/auth/register')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({ email: 'test@example.com', password: 'password123', name: 'Test' }));

      // Should not fail on JSON parsing; result depends on DB
      expect(res.status).to.be.oneOf([201, 409, 500]);
    });
  });
});
