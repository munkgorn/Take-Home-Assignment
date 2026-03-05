process.env.NEXTAUTH_SECRET = 'test-secret-key';
process.env.ALLOWED_ORIGINS = 'http://localhost:3000';
process.env.PORT = '3001';

import sinon from 'sinon';

export const mochaHooks = {
  beforeAll() {
    sinon.stub(console, 'log');
    sinon.stub(console, 'warn');
    sinon.stub(console, 'error');
  },
  afterAll() {
    sinon.restore();
  },
};
