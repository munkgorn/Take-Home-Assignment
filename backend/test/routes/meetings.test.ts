import { expect } from 'chai';
import sinon from 'sinon';
import express from 'express';
import supertest from 'supertest';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { createMeetingRoutes } from '../../src/routes/meetings';

const TEST_USER = { id: 'user-123', email: 'test@example.com', name: 'Test User' };
const TEST_TOKEN = jwt.sign({ sub: TEST_USER.id, email: TEST_USER.email, name: TEST_USER.name }, process.env.NEXTAUTH_SECRET || 'test-secret-key');

const validMeeting = {
  title: 'Interview with John',
  candidateName: 'John Doe',
  position: 'Software Engineer',
  meetingType: 'online',
  startTime: '2025-01-15T10:00:00.000Z',
  endTime: '2025-01-15T11:00:00.000Z',
};

function createMockPrisma() {
  return {
    meeting: {
      findMany: sinon.stub(),
      findFirst: sinon.stub(),
      create: sinon.stub(),
      update: sinon.stub(),
      count: sinon.stub(),
    },
  } as unknown as PrismaClient;
}

function buildApp(prisma: PrismaClient) {
  const app = express();
  app.use(express.json());
  app.use('/api/meetings', createMeetingRoutes(prisma));
  app.use((err: any, _req: any, res: any, _next: any) => {
    if (err.name === 'ZodError') {
      res.status(400).json({ error: 'Validation error', details: err.issues });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  });
  return app;
}

describe('Meeting Routes', () => {
  describe('GET /api/meetings', () => {
    it('should return paginated meetings', async () => {
      const mockPrisma = createMockPrisma();
      const meetings = [
        { id: 'm1', title: 'Meeting 1', userId: TEST_USER.id },
        { id: 'm2', title: 'Meeting 2', userId: TEST_USER.id },
      ];
      (mockPrisma.meeting.findMany as sinon.SinonStub).resolves(meetings);
      (mockPrisma.meeting.count as sinon.SinonStub).resolves(2);

      const app = buildApp(mockPrisma);
      const res = await supertest(app)
        .get('/api/meetings')
        .set('Authorization', `Bearer ${TEST_TOKEN}`);

      expect(res.status).to.equal(200);
      expect(res.body.meetings).to.have.lengthOf(2);
      expect(res.body.total).to.equal(2);
      expect(res.body.page).to.equal(1);
      expect(res.body.limit).to.equal(10);
      expect(res.body.totalPages).to.equal(1);
    });

    it('should support pagination parameters', async () => {
      const mockPrisma = createMockPrisma();
      (mockPrisma.meeting.findMany as sinon.SinonStub).resolves([]);
      (mockPrisma.meeting.count as sinon.SinonStub).resolves(25);

      const app = buildApp(mockPrisma);
      const res = await supertest(app)
        .get('/api/meetings?page=2&limit=5')
        .set('Authorization', `Bearer ${TEST_TOKEN}`);

      expect(res.status).to.equal(200);
      expect(res.body.page).to.equal(2);
      expect(res.body.limit).to.equal(5);
      expect(res.body.totalPages).to.equal(5);

      const findManyCall = (mockPrisma.meeting.findMany as sinon.SinonStub).firstCall.args[0];
      expect(findManyCall.skip).to.equal(5);
      expect(findManyCall.take).to.equal(5);
    });

    it('should enforce minimum page of 1', async () => {
      const mockPrisma = createMockPrisma();
      (mockPrisma.meeting.findMany as sinon.SinonStub).resolves([]);
      (mockPrisma.meeting.count as sinon.SinonStub).resolves(0);

      const app = buildApp(mockPrisma);
      const res = await supertest(app)
        .get('/api/meetings?page=0')
        .set('Authorization', `Bearer ${TEST_TOKEN}`);

      expect(res.status).to.equal(200);
      expect(res.body.page).to.equal(1);
    });

    it('should default limit to 10 when limit is 0 (falsy)', async () => {
      const mockPrisma = createMockPrisma();
      (mockPrisma.meeting.findMany as sinon.SinonStub).resolves([]);
      (mockPrisma.meeting.count as sinon.SinonStub).resolves(0);

      const app = buildApp(mockPrisma);
      const res = await supertest(app)
        .get('/api/meetings?limit=0')
        .set('Authorization', `Bearer ${TEST_TOKEN}`);

      // parseInt("0") is 0, which is falsy, so || 10 gives 10
      expect(res.status).to.equal(200);
      expect(res.body.limit).to.equal(10);
    });

    it('should enforce minimum limit of 1 for negative values', async () => {
      const mockPrisma = createMockPrisma();
      (mockPrisma.meeting.findMany as sinon.SinonStub).resolves([]);
      (mockPrisma.meeting.count as sinon.SinonStub).resolves(0);

      const app = buildApp(mockPrisma);
      const res = await supertest(app)
        .get('/api/meetings?limit=-5')
        .set('Authorization', `Bearer ${TEST_TOKEN}`);

      expect(res.status).to.equal(200);
      expect(res.body.limit).to.equal(1);
    });

    it('should enforce maximum limit of 100', async () => {
      const mockPrisma = createMockPrisma();
      (mockPrisma.meeting.findMany as sinon.SinonStub).resolves([]);
      (mockPrisma.meeting.count as sinon.SinonStub).resolves(0);

      const app = buildApp(mockPrisma);
      const res = await supertest(app)
        .get('/api/meetings?limit=200')
        .set('Authorization', `Bearer ${TEST_TOKEN}`);

      expect(res.status).to.equal(200);
      expect(res.body.limit).to.equal(100);
    });

    it('should filter by status', async () => {
      const mockPrisma = createMockPrisma();
      (mockPrisma.meeting.findMany as sinon.SinonStub).resolves([]);
      (mockPrisma.meeting.count as sinon.SinonStub).resolves(0);

      const app = buildApp(mockPrisma);
      const res = await supertest(app)
        .get('/api/meetings?status=confirmed')
        .set('Authorization', `Bearer ${TEST_TOKEN}`);

      expect(res.status).to.equal(200);
      const findManyCall = (mockPrisma.meeting.findMany as sinon.SinonStub).firstCall.args[0];
      expect(findManyCall.where.status).to.equal('confirmed');
    });

    it('should filter by search term', async () => {
      const mockPrisma = createMockPrisma();
      (mockPrisma.meeting.findMany as sinon.SinonStub).resolves([]);
      (mockPrisma.meeting.count as sinon.SinonStub).resolves(0);

      const app = buildApp(mockPrisma);
      const res = await supertest(app)
        .get('/api/meetings?search=John')
        .set('Authorization', `Bearer ${TEST_TOKEN}`);

      expect(res.status).to.equal(200);
      const findManyCall = (mockPrisma.meeting.findMany as sinon.SinonStub).firstCall.args[0];
      expect(findManyCall.where.OR).to.be.an('array');
      expect(findManyCall.where.OR).to.have.lengthOf(2);
    });

    it('should handle default page/limit for non-numeric values', async () => {
      const mockPrisma = createMockPrisma();
      (mockPrisma.meeting.findMany as sinon.SinonStub).resolves([]);
      (mockPrisma.meeting.count as sinon.SinonStub).resolves(0);

      const app = buildApp(mockPrisma);
      const res = await supertest(app)
        .get('/api/meetings?page=abc&limit=xyz')
        .set('Authorization', `Bearer ${TEST_TOKEN}`);

      expect(res.status).to.equal(200);
      expect(res.body.page).to.equal(1);
      expect(res.body.limit).to.equal(10);
    });

    it('should return 401 without auth token', async () => {
      const mockPrisma = createMockPrisma();
      const app = buildApp(mockPrisma);

      const res = await supertest(app).get('/api/meetings');

      expect(res.status).to.equal(401);
    });

    it('should forward errors to next when prisma throws', async () => {
      const mockPrisma = createMockPrisma();
      (mockPrisma.meeting.findMany as sinon.SinonStub).rejects(new Error('DB error'));

      const app = buildApp(mockPrisma);
      const res = await supertest(app)
        .get('/api/meetings')
        .set('Authorization', `Bearer ${TEST_TOKEN}`);

      expect(res.status).to.equal(500);
    });
  });

  describe('POST /api/meetings', () => {
    it('should create a meeting successfully', async () => {
      const mockPrisma = createMockPrisma();
      const createdMeeting = {
        id: 'meeting-1',
        ...validMeeting,
        startTime: new Date(validMeeting.startTime),
        endTime: new Date(validMeeting.endTime),
        userId: TEST_USER.id,
        status: 'pending',
      };
      (mockPrisma.meeting.create as sinon.SinonStub).resolves(createdMeeting);

      const app = buildApp(mockPrisma);
      const res = await supertest(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send(validMeeting);

      expect(res.status).to.equal(201);
      expect(res.body.id).to.equal('meeting-1');
    });

    it('should create a meeting with optional fields', async () => {
      const mockPrisma = createMockPrisma();
      const meetingData = {
        ...validMeeting,
        description: 'First round',
        meetingLink: 'https://zoom.us/j/123',
        notes: 'Prepare questions',
        status: 'confirmed',
      };
      (mockPrisma.meeting.create as sinon.SinonStub).resolves({
        id: 'meeting-2',
        ...meetingData,
        startTime: new Date(meetingData.startTime),
        endTime: new Date(meetingData.endTime),
        userId: TEST_USER.id,
      });

      const app = buildApp(mockPrisma);
      const res = await supertest(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send(meetingData);

      expect(res.status).to.equal(201);
    });

    it('should return 400 for missing required fields', async () => {
      const mockPrisma = createMockPrisma();
      const app = buildApp(mockPrisma);

      const res = await supertest(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send({ title: 'Only title' });

      expect(res.status).to.equal(400);
    });

    it('should return 400 for invalid meetingType', async () => {
      const mockPrisma = createMockPrisma();
      const app = buildApp(mockPrisma);

      const res = await supertest(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send({ ...validMeeting, meetingType: 'hybrid' });

      expect(res.status).to.equal(400);
    });

    it('should return 400 for invalid datetime format', async () => {
      const mockPrisma = createMockPrisma();
      const app = buildApp(mockPrisma);

      const res = await supertest(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send({ ...validMeeting, startTime: 'not-a-date' });

      expect(res.status).to.equal(400);
    });

    it('should return 401 without auth token', async () => {
      const mockPrisma = createMockPrisma();
      const app = buildApp(mockPrisma);

      const res = await supertest(app)
        .post('/api/meetings')
        .send(validMeeting);

      expect(res.status).to.equal(401);
    });

    it('should forward errors to next when prisma throws', async () => {
      const mockPrisma = createMockPrisma();
      (mockPrisma.meeting.create as sinon.SinonStub).rejects(new Error('DB error'));

      const app = buildApp(mockPrisma);
      const res = await supertest(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send(validMeeting);

      expect(res.status).to.equal(500);
    });
  });

  describe('GET /api/meetings/:id', () => {
    it('should return a meeting by id', async () => {
      const mockPrisma = createMockPrisma();
      const meeting = { id: 'meeting-1', title: 'Interview', userId: TEST_USER.id };
      (mockPrisma.meeting.findFirst as sinon.SinonStub).resolves(meeting);

      const app = buildApp(mockPrisma);
      const res = await supertest(app)
        .get('/api/meetings/meeting-1')
        .set('Authorization', `Bearer ${TEST_TOKEN}`);

      expect(res.status).to.equal(200);
      expect(res.body.id).to.equal('meeting-1');
    });

    it('should return 404 when meeting is not found', async () => {
      const mockPrisma = createMockPrisma();
      (mockPrisma.meeting.findFirst as sinon.SinonStub).resolves(null);

      const app = buildApp(mockPrisma);
      const res = await supertest(app)
        .get('/api/meetings/nonexistent')
        .set('Authorization', `Bearer ${TEST_TOKEN}`);

      expect(res.status).to.equal(404);
      expect(res.body).to.deep.equal({ error: 'Meeting not found' });
    });

    it('should return 401 without auth token', async () => {
      const mockPrisma = createMockPrisma();
      const app = buildApp(mockPrisma);

      const res = await supertest(app).get('/api/meetings/meeting-1');

      expect(res.status).to.equal(401);
    });

    it('should forward errors to next when prisma throws', async () => {
      const mockPrisma = createMockPrisma();
      (mockPrisma.meeting.findFirst as sinon.SinonStub).rejects(new Error('DB error'));

      const app = buildApp(mockPrisma);
      const res = await supertest(app)
        .get('/api/meetings/meeting-1')
        .set('Authorization', `Bearer ${TEST_TOKEN}`);

      expect(res.status).to.equal(500);
    });
  });

  describe('PUT /api/meetings/:id', () => {
    it('should update a meeting successfully', async () => {
      const mockPrisma = createMockPrisma();
      (mockPrisma.meeting.findFirst as sinon.SinonStub).resolves({
        id: 'meeting-1',
        title: 'Old Title',
        userId: TEST_USER.id,
      });
      (mockPrisma.meeting.update as sinon.SinonStub).resolves({
        id: 'meeting-1',
        title: 'New Title',
        userId: TEST_USER.id,
      });

      const app = buildApp(mockPrisma);
      const res = await supertest(app)
        .put('/api/meetings/meeting-1')
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send({ title: 'New Title' });

      expect(res.status).to.equal(200);
      expect(res.body.title).to.equal('New Title');
    });

    it('should update startTime and endTime as Date objects', async () => {
      const mockPrisma = createMockPrisma();
      (mockPrisma.meeting.findFirst as sinon.SinonStub).resolves({
        id: 'meeting-1',
        userId: TEST_USER.id,
      });
      (mockPrisma.meeting.update as sinon.SinonStub).resolves({
        id: 'meeting-1',
        startTime: new Date('2025-02-01T10:00:00.000Z'),
        endTime: new Date('2025-02-01T11:00:00.000Z'),
      });

      const app = buildApp(mockPrisma);
      const res = await supertest(app)
        .put('/api/meetings/meeting-1')
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send({ startTime: '2025-02-01T10:00:00.000Z', endTime: '2025-02-01T11:00:00.000Z' });

      expect(res.status).to.equal(200);

      const updateCall = (mockPrisma.meeting.update as sinon.SinonStub).firstCall.args[0];
      expect(updateCall.data.startTime).to.be.instanceOf(Date);
      expect(updateCall.data.endTime).to.be.instanceOf(Date);
    });

    it('should handle partial update without startTime/endTime', async () => {
      const mockPrisma = createMockPrisma();
      (mockPrisma.meeting.findFirst as sinon.SinonStub).resolves({
        id: 'meeting-1',
        userId: TEST_USER.id,
      });
      (mockPrisma.meeting.update as sinon.SinonStub).resolves({
        id: 'meeting-1',
        status: 'confirmed',
      });

      const app = buildApp(mockPrisma);
      const res = await supertest(app)
        .put('/api/meetings/meeting-1')
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send({ status: 'confirmed' });

      expect(res.status).to.equal(200);

      const updateCall = (mockPrisma.meeting.update as sinon.SinonStub).firstCall.args[0];
      expect(updateCall.data.startTime).to.be.undefined;
      expect(updateCall.data.endTime).to.be.undefined;
    });

    it('should return 404 when meeting is not found', async () => {
      const mockPrisma = createMockPrisma();
      (mockPrisma.meeting.findFirst as sinon.SinonStub).resolves(null);

      const app = buildApp(mockPrisma);
      const res = await supertest(app)
        .put('/api/meetings/nonexistent')
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send({ title: 'New Title' });

      expect(res.status).to.equal(404);
      expect(res.body).to.deep.equal({ error: 'Meeting not found' });
    });

    it('should return 400 for invalid update data', async () => {
      const mockPrisma = createMockPrisma();
      const app = buildApp(mockPrisma);

      const res = await supertest(app)
        .put('/api/meetings/meeting-1')
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send({ meetingType: 'invalid' });

      expect(res.status).to.equal(400);
    });

    it('should return 401 without auth token', async () => {
      const mockPrisma = createMockPrisma();
      const app = buildApp(mockPrisma);

      const res = await supertest(app)
        .put('/api/meetings/meeting-1')
        .send({ title: 'New Title' });

      expect(res.status).to.equal(401);
    });

    it('should forward errors to next when prisma.update throws', async () => {
      const mockPrisma = createMockPrisma();
      (mockPrisma.meeting.findFirst as sinon.SinonStub).resolves({
        id: 'meeting-1',
        userId: TEST_USER.id,
      });
      (mockPrisma.meeting.update as sinon.SinonStub).rejects(new Error('DB error'));

      const app = buildApp(mockPrisma);
      const res = await supertest(app)
        .put('/api/meetings/meeting-1')
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send({ title: 'New Title' });

      expect(res.status).to.equal(500);
    });
  });

  describe('DELETE /api/meetings/:id', () => {
    it('should soft delete a meeting successfully', async () => {
      const mockPrisma = createMockPrisma();
      (mockPrisma.meeting.findFirst as sinon.SinonStub).resolves({
        id: 'meeting-1',
        userId: TEST_USER.id,
      });
      (mockPrisma.meeting.update as sinon.SinonStub).resolves({
        id: 'meeting-1',
        deletedAt: new Date(),
      });

      const app = buildApp(mockPrisma);
      const res = await supertest(app)
        .delete('/api/meetings/meeting-1')
        .set('Authorization', `Bearer ${TEST_TOKEN}`);

      expect(res.status).to.equal(204);

      const updateCall = (mockPrisma.meeting.update as sinon.SinonStub).firstCall.args[0];
      expect(updateCall.data.deletedAt).to.be.instanceOf(Date);
    });

    it('should return 404 when meeting is not found', async () => {
      const mockPrisma = createMockPrisma();
      (mockPrisma.meeting.findFirst as sinon.SinonStub).resolves(null);

      const app = buildApp(mockPrisma);
      const res = await supertest(app)
        .delete('/api/meetings/nonexistent')
        .set('Authorization', `Bearer ${TEST_TOKEN}`);

      expect(res.status).to.equal(404);
      expect(res.body).to.deep.equal({ error: 'Meeting not found' });
    });

    it('should return 401 without auth token', async () => {
      const mockPrisma = createMockPrisma();
      const app = buildApp(mockPrisma);

      const res = await supertest(app).delete('/api/meetings/meeting-1');

      expect(res.status).to.equal(401);
    });

    it('should forward errors to next when prisma throws', async () => {
      const mockPrisma = createMockPrisma();
      (mockPrisma.meeting.findFirst as sinon.SinonStub).resolves({
        id: 'meeting-1',
        userId: TEST_USER.id,
      });
      (mockPrisma.meeting.update as sinon.SinonStub).rejects(new Error('DB error'));

      const app = buildApp(mockPrisma);
      const res = await supertest(app)
        .delete('/api/meetings/meeting-1')
        .set('Authorization', `Bearer ${TEST_TOKEN}`);

      expect(res.status).to.equal(500);
    });
  });
});
