import { expect } from 'chai';
import sinon from 'sinon';
import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodIssue } from 'zod';
import { Prisma } from '@prisma/client';
import { errorHandler } from '../../src/middleware/errorHandler';

function createMockReq(overrides: Partial<Request> = {}): Request {
  return {
    method: 'POST',
    originalUrl: '/api/test',
    ...overrides,
  } as unknown as Request;
}

function createMockRes(): Response & { statusCode: number; jsonData: unknown } {
  const res: any = {
    statusCode: 200,
    jsonData: null,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(data: unknown) {
      res.jsonData = data;
      return res;
    },
  };
  return res;
}

describe('Error Handler Middleware', () => {
  const next = sinon.stub() as unknown as NextFunction;

  it('should handle CORS errors with 403', () => {
    const err = new Error('Not allowed by CORS');
    const req = createMockReq();
    const res = createMockRes();

    errorHandler(err, req, res, next);

    expect(res.statusCode).to.equal(403);
    expect(res.jsonData).to.deep.equal({ error: 'CORS not allowed' });
  });

  it('should handle ZodError with 400 and details', () => {
    const issues: ZodIssue[] = [
      {
        code: 'invalid_type' as any,
        expected: 'string' as any,
        received: 'number' as any,
        path: ['email'],
        message: 'Expected string, received number',
      } as any,
      {
        code: 'too_small' as any,
        minimum: 6,
        type: 'string' as any,
        inclusive: true,
        path: ['password'],
        message: 'String must contain at least 6 character(s)',
      } as any,
    ];
    const err = new ZodError(issues);
    const req = createMockReq();
    const res = createMockRes();

    errorHandler(err, req, res, next);

    expect(res.statusCode).to.equal(400);
    expect(res.jsonData).to.have.property('error', 'Validation error');
    expect((res.jsonData as any).details).to.be.an('array');
    expect((res.jsonData as any).details).to.have.lengthOf(2);
    expect((res.jsonData as any).details[0]).to.have.property('field', 'email');
    expect((res.jsonData as any).details[1]).to.have.property('field', 'password');
  });

  it('should handle ZodError with nested path', () => {
    const issues: ZodIssue[] = [
      {
        code: 'invalid_type' as any,
        expected: 'string' as any,
        received: 'undefined' as any,
        path: ['data', 'nested', 'field'],
        message: 'Required',
      } as any,
    ];
    const err = new ZodError(issues);
    const req = createMockReq();
    const res = createMockRes();

    errorHandler(err, req, res, next);

    expect(res.statusCode).to.equal(400);
    expect((res.jsonData as any).details[0].field).to.equal('data.nested.field');
  });

  it('should handle Prisma P2002 (unique constraint) with 409', () => {
    const err = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed',
      { code: 'P2002', clientVersion: '5.0.0' }
    );
    const req = createMockReq();
    const res = createMockRes();

    errorHandler(err, req, res, next);

    expect(res.statusCode).to.equal(409);
    expect(res.jsonData).to.deep.equal({ error: 'A record with this value already exists' });
  });

  it('should handle Prisma P2025 (record not found) with 404', () => {
    const err = new Prisma.PrismaClientKnownRequestError(
      'Record not found',
      { code: 'P2025', clientVersion: '5.0.0' }
    );
    const req = createMockReq();
    const res = createMockRes();

    errorHandler(err, req, res, next);

    expect(res.statusCode).to.equal(404);
    expect(res.jsonData).to.deep.equal({ error: 'Record not found' });
  });

  it('should handle other Prisma errors with 400 and code', () => {
    const err = new Prisma.PrismaClientKnownRequestError(
      'Some database error',
      { code: 'P2003', clientVersion: '5.0.0' }
    );
    const req = createMockReq();
    const res = createMockRes();

    errorHandler(err, req, res, next);

    expect(res.statusCode).to.equal(400);
    expect(res.jsonData).to.deep.equal({ error: 'Database error', code: 'P2003' });
  });

  it('should handle generic Error with 500', () => {
    const err = new Error('Something went wrong');
    const req = createMockReq();
    const res = createMockRes();

    errorHandler(err, req, res, next);

    expect(res.statusCode).to.equal(500);
    expect(res.jsonData).to.deep.equal({ error: 'Internal server error' });
  });

  it('should handle error with GET method', () => {
    const err = new Error('Something went wrong');
    const req = createMockReq({ method: 'GET', originalUrl: '/api/meetings' });
    const res = createMockRes();

    errorHandler(err, req, res, next);

    expect(res.statusCode).to.equal(500);
    expect(res.jsonData).to.deep.equal({ error: 'Internal server error' });
  });
});
