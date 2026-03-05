import { expect } from 'chai';
import sinon from 'sinon';
import express from 'express';
import supertest from 'supertest';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { createAuthRoutes } from '../../src/routes/auth';

function createMockPrisma() {
  return {
    user: {
      findUnique: sinon.stub(),
      create: sinon.stub(),
    },
  } as unknown as PrismaClient;
}

function buildApp(prisma: PrismaClient) {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', createAuthRoutes(prisma));
  // Add a simple error handler for Zod validation errors
  app.use((err: any, _req: any, res: any, _next: any) => {
    if (err.name === 'ZodError') {
      res.status(400).json({ error: 'Validation error', details: err.issues });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  });
  return app;
}

describe('Auth Routes', () => {
  let hashStub: sinon.SinonStub;
  let compareStub: sinon.SinonStub;

  beforeEach(() => {
    hashStub = sinon.stub(bcrypt, 'hash' as any);
    compareStub = sinon.stub(bcrypt, 'compare' as any);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const mockPrisma = createMockPrisma();
      (mockPrisma.user.findUnique as sinon.SinonStub).resolves(null);
      hashStub.resolves('hashed-password');
      (mockPrisma.user.create as sinon.SinonStub).resolves({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
      });

      const app = buildApp(mockPrisma);
      const res = await supertest(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', password: 'password123', name: 'Test User' });

      expect(res.status).to.equal(201);
      expect(res.body).to.deep.equal({ id: 'user-1', email: 'test@example.com', name: 'Test User' });
      expect(hashStub.calledOnce).to.be.true;
      expect(hashStub.firstCall.args[1]).to.equal(10);
    });

    it('should return 409 when email already exists', async () => {
      const mockPrisma = createMockPrisma();
      (mockPrisma.user.findUnique as sinon.SinonStub).resolves({
        id: 'existing-user',
        email: 'test@example.com',
        name: 'Existing',
        password: 'hash',
      });

      const app = buildApp(mockPrisma);
      const res = await supertest(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', password: 'password123', name: 'Test User' });

      expect(res.status).to.equal(409);
      expect(res.body).to.deep.equal({ error: 'Email already registered' });
    });

    it('should return 400 for invalid email', async () => {
      const mockPrisma = createMockPrisma();
      const app = buildApp(mockPrisma);

      const res = await supertest(app)
        .post('/api/auth/register')
        .send({ email: 'invalid', password: 'password123', name: 'Test' });

      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('error');
    });

    it('should return 400 for short password', async () => {
      const mockPrisma = createMockPrisma();
      const app = buildApp(mockPrisma);

      const res = await supertest(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', password: '12345', name: 'Test' });

      expect(res.status).to.equal(400);
    });

    it('should return 400 for empty name', async () => {
      const mockPrisma = createMockPrisma();
      const app = buildApp(mockPrisma);

      const res = await supertest(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', password: 'password123', name: '' });

      expect(res.status).to.equal(400);
    });

    it('should return 400 for missing body', async () => {
      const mockPrisma = createMockPrisma();
      const app = buildApp(mockPrisma);

      const res = await supertest(app)
        .post('/api/auth/register')
        .send({});

      expect(res.status).to.equal(400);
    });

    it('should forward errors to next when prisma.create throws', async () => {
      const mockPrisma = createMockPrisma();
      (mockPrisma.user.findUnique as sinon.SinonStub).resolves(null);
      hashStub.resolves('hashed-password');
      (mockPrisma.user.create as sinon.SinonStub).rejects(new Error('DB error'));

      const app = buildApp(mockPrisma);
      const res = await supertest(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', password: 'password123', name: 'Test' });

      expect(res.status).to.equal(500);
    });

    it('should use x-forwarded-for IP when available', async () => {
      const mockPrisma = createMockPrisma();
      (mockPrisma.user.findUnique as sinon.SinonStub).resolves(null);
      hashStub.resolves('hashed-password');
      (mockPrisma.user.create as sinon.SinonStub).resolves({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test',
      });

      const app = buildApp(mockPrisma);
      const res = await supertest(app)
        .post('/api/auth/register')
        .set('x-forwarded-for', '10.0.0.1, 10.0.0.2')
        .send({ email: 'test@example.com', password: 'password123', name: 'Test' });

      expect(res.status).to.equal(201);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with correct credentials', async () => {
      const mockPrisma = createMockPrisma();
      (mockPrisma.user.findUnique as sinon.SinonStub).resolves({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed-password',
      });
      compareStub.resolves(true);

      const app = buildApp(mockPrisma);
      const res = await supertest(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(res.status).to.equal(200);
      expect(res.body).to.deep.equal({ id: 'user-1', email: 'test@example.com', name: 'Test User' });
    });

    it('should return 401 when user is not found', async () => {
      const mockPrisma = createMockPrisma();
      (mockPrisma.user.findUnique as sinon.SinonStub).resolves(null);

      const app = buildApp(mockPrisma);
      const res = await supertest(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(res.status).to.equal(401);
      expect(res.body).to.deep.equal({ error: 'Invalid credentials' });
    });

    it('should return 401 when password is wrong', async () => {
      const mockPrisma = createMockPrisma();
      (mockPrisma.user.findUnique as sinon.SinonStub).resolves({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test',
        password: 'hashed-password',
      });
      compareStub.resolves(false);

      const app = buildApp(mockPrisma);
      const res = await supertest(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'wrongpassword' });

      expect(res.status).to.equal(401);
      expect(res.body).to.deep.equal({ error: 'Invalid credentials' });
    });

    it('should return 400 for invalid email', async () => {
      const mockPrisma = createMockPrisma();
      const app = buildApp(mockPrisma);

      const res = await supertest(app)
        .post('/api/auth/login')
        .send({ email: 'invalid', password: 'password123' });

      expect(res.status).to.equal(400);
    });

    it('should return 400 for missing password', async () => {
      const mockPrisma = createMockPrisma();
      const app = buildApp(mockPrisma);

      const res = await supertest(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com' });

      expect(res.status).to.equal(400);
    });

    it('should return 400 for empty body', async () => {
      const mockPrisma = createMockPrisma();
      const app = buildApp(mockPrisma);

      const res = await supertest(app)
        .post('/api/auth/login')
        .send({});

      expect(res.status).to.equal(400);
    });

    it('should forward errors to next when prisma throws', async () => {
      const mockPrisma = createMockPrisma();
      (mockPrisma.user.findUnique as sinon.SinonStub).rejects(new Error('DB error'));

      const app = buildApp(mockPrisma);
      const res = await supertest(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(res.status).to.equal(500);
    });

    it('should use x-forwarded-for IP for login failed logging', async () => {
      const mockPrisma = createMockPrisma();
      (mockPrisma.user.findUnique as sinon.SinonStub).resolves(null);

      const app = buildApp(mockPrisma);
      const res = await supertest(app)
        .post('/api/auth/login')
        .set('x-forwarded-for', '10.0.0.1')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(res.status).to.equal(401);
    });
  });
});
