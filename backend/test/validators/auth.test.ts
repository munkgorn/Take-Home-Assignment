import { expect } from 'chai';
import { registerSchema, loginSchema } from '../../src/validators/auth';

describe('Auth Validators', () => {
  describe('registerSchema', () => {
    it('should accept valid registration data', () => {
      const data = { email: 'test@example.com', password: 'password123', name: 'Test User' };
      const result = registerSchema.parse(data);
      expect(result.email).to.equal('test@example.com');
      expect(result.password).to.equal('password123');
      expect(result.name).to.equal('Test User');
    });

    it('should reject missing email', () => {
      expect(() => registerSchema.parse({ password: 'password123', name: 'Test' })).to.throw();
    });

    it('should reject invalid email format', () => {
      expect(() => registerSchema.parse({ email: 'not-an-email', password: 'password123', name: 'Test' })).to.throw();
    });

    it('should reject empty email string', () => {
      expect(() => registerSchema.parse({ email: '', password: 'password123', name: 'Test' })).to.throw();
    });

    it('should reject missing password', () => {
      expect(() => registerSchema.parse({ email: 'test@example.com', name: 'Test' })).to.throw();
    });

    it('should reject password shorter than 6 characters', () => {
      expect(() => registerSchema.parse({ email: 'test@example.com', password: '12345', name: 'Test' })).to.throw();
    });

    it('should accept password with exactly 6 characters', () => {
      const result = registerSchema.parse({ email: 'test@example.com', password: '123456', name: 'Test' });
      expect(result.password).to.equal('123456');
    });

    it('should reject missing name', () => {
      expect(() => registerSchema.parse({ email: 'test@example.com', password: 'password123' })).to.throw();
    });

    it('should reject empty name', () => {
      expect(() => registerSchema.parse({ email: 'test@example.com', password: 'password123', name: '' })).to.throw();
    });

    it('should reject empty body', () => {
      expect(() => registerSchema.parse({})).to.throw();
    });

    it('should reject null input', () => {
      expect(() => registerSchema.parse(null)).to.throw();
    });

    it('should reject undefined input', () => {
      expect(() => registerSchema.parse(undefined)).to.throw();
    });

    it('should strip extra fields', () => {
      const data = { email: 'test@example.com', password: 'password123', name: 'Test', extra: 'field' };
      const result = registerSchema.parse(data);
      expect(result).to.not.have.property('extra');
    });
  });

  describe('loginSchema', () => {
    it('should accept valid login data', () => {
      const data = { email: 'test@example.com', password: 'password123' };
      const result = loginSchema.parse(data);
      expect(result.email).to.equal('test@example.com');
      expect(result.password).to.equal('password123');
    });

    it('should reject missing email', () => {
      expect(() => loginSchema.parse({ password: 'password123' })).to.throw();
    });

    it('should reject invalid email format', () => {
      expect(() => loginSchema.parse({ email: 'bad', password: 'password123' })).to.throw();
    });

    it('should reject missing password', () => {
      expect(() => loginSchema.parse({ email: 'test@example.com' })).to.throw();
    });

    it('should accept empty password (no min length on login)', () => {
      const result = loginSchema.parse({ email: 'test@example.com', password: '' });
      expect(result.password).to.equal('');
    });

    it('should reject empty body', () => {
      expect(() => loginSchema.parse({})).to.throw();
    });

    it('should reject null input', () => {
      expect(() => loginSchema.parse(null)).to.throw();
    });

    it('should strip extra fields', () => {
      const data = { email: 'test@example.com', password: 'pass', extra: 'field' };
      const result = loginSchema.parse(data);
      expect(result).to.not.have.property('extra');
    });
  });
});
