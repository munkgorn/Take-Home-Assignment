import { expect } from 'chai';
import { createMeetingSchema, updateMeetingSchema } from '../../src/validators/meeting';

const validMeeting = {
  title: 'Interview with John',
  candidateName: 'John Doe',
  position: 'Software Engineer',
  meetingType: 'online' as const,
  startTime: '2025-01-15T10:00:00.000Z',
  endTime: '2025-01-15T11:00:00.000Z',
};

describe('Meeting Validators', () => {
  describe('createMeetingSchema', () => {
    it('should accept valid meeting data with required fields only', () => {
      const result = createMeetingSchema.parse(validMeeting);
      expect(result.title).to.equal('Interview with John');
      expect(result.candidateName).to.equal('John Doe');
      expect(result.position).to.equal('Software Engineer');
      expect(result.meetingType).to.equal('online');
      expect(result.startTime).to.equal('2025-01-15T10:00:00.000Z');
      expect(result.endTime).to.equal('2025-01-15T11:00:00.000Z');
    });

    it('should accept valid meeting data with all optional fields', () => {
      const data = {
        ...validMeeting,
        description: 'First round interview',
        meetingLink: 'https://zoom.us/j/123',
        notes: 'Prepare coding questions',
        status: 'confirmed' as const,
      };
      const result = createMeetingSchema.parse(data);
      expect(result.description).to.equal('First round interview');
      expect(result.meetingLink).to.equal('https://zoom.us/j/123');
      expect(result.notes).to.equal('Prepare coding questions');
      expect(result.status).to.equal('confirmed');
    });

    it('should accept meetingType "onsite"', () => {
      const result = createMeetingSchema.parse({ ...validMeeting, meetingType: 'onsite' });
      expect(result.meetingType).to.equal('onsite');
    });

    it('should reject invalid meetingType', () => {
      expect(() => createMeetingSchema.parse({ ...validMeeting, meetingType: 'hybrid' })).to.throw();
    });

    it('should accept status "pending"', () => {
      const result = createMeetingSchema.parse({ ...validMeeting, status: 'pending' });
      expect(result.status).to.equal('pending');
    });

    it('should accept status "cancelled"', () => {
      const result = createMeetingSchema.parse({ ...validMeeting, status: 'cancelled' });
      expect(result.status).to.equal('cancelled');
    });

    it('should reject invalid status', () => {
      expect(() => createMeetingSchema.parse({ ...validMeeting, status: 'completed' })).to.throw();
    });

    it('should reject missing title', () => {
      const { title, ...data } = validMeeting;
      expect(() => createMeetingSchema.parse(data)).to.throw();
    });

    it('should reject empty title', () => {
      expect(() => createMeetingSchema.parse({ ...validMeeting, title: '' })).to.throw();
    });

    it('should reject missing candidateName', () => {
      const { candidateName, ...data } = validMeeting;
      expect(() => createMeetingSchema.parse(data)).to.throw();
    });

    it('should reject empty candidateName', () => {
      expect(() => createMeetingSchema.parse({ ...validMeeting, candidateName: '' })).to.throw();
    });

    it('should reject missing position', () => {
      const { position, ...data } = validMeeting;
      expect(() => createMeetingSchema.parse(data)).to.throw();
    });

    it('should reject empty position', () => {
      expect(() => createMeetingSchema.parse({ ...validMeeting, position: '' })).to.throw();
    });

    it('should reject missing meetingType', () => {
      const { meetingType, ...data } = validMeeting;
      expect(() => createMeetingSchema.parse(data)).to.throw();
    });

    it('should reject missing startTime', () => {
      const { startTime, ...data } = validMeeting;
      expect(() => createMeetingSchema.parse(data)).to.throw();
    });

    it('should reject non-datetime startTime', () => {
      expect(() => createMeetingSchema.parse({ ...validMeeting, startTime: 'not-a-date' })).to.throw();
    });

    it('should reject missing endTime', () => {
      const { endTime, ...data } = validMeeting;
      expect(() => createMeetingSchema.parse(data)).to.throw();
    });

    it('should reject non-datetime endTime', () => {
      expect(() => createMeetingSchema.parse({ ...validMeeting, endTime: 'not-a-date' })).to.throw();
    });

    it('should reject empty body', () => {
      expect(() => createMeetingSchema.parse({})).to.throw();
    });

    it('should reject null input', () => {
      expect(() => createMeetingSchema.parse(null)).to.throw();
    });
  });

  describe('updateMeetingSchema', () => {
    it('should accept a partial update with only title', () => {
      const result = updateMeetingSchema.parse({ title: 'Updated Title' });
      expect(result.title).to.equal('Updated Title');
    });

    it('should accept a partial update with only status', () => {
      const result = updateMeetingSchema.parse({ status: 'cancelled' });
      expect(result.status).to.equal('cancelled');
    });

    it('should accept an empty object (all fields optional)', () => {
      const result = updateMeetingSchema.parse({});
      expect(result).to.deep.equal({});
    });

    it('should accept a full update with all fields', () => {
      const data = {
        ...validMeeting,
        description: 'Updated desc',
        meetingLink: 'https://meet.google.com/abc',
        notes: 'Updated notes',
        status: 'confirmed' as const,
      };
      const result = updateMeetingSchema.parse(data);
      expect(result.title).to.equal(validMeeting.title);
      expect(result.description).to.equal('Updated desc');
    });

    it('should still reject invalid meetingType in partial', () => {
      expect(() => updateMeetingSchema.parse({ meetingType: 'hybrid' })).to.throw();
    });

    it('should still reject invalid status in partial', () => {
      expect(() => updateMeetingSchema.parse({ status: 'done' })).to.throw();
    });

    it('should still reject invalid datetime in partial', () => {
      expect(() => updateMeetingSchema.parse({ startTime: 'not-a-date' })).to.throw();
    });

    it('should reject null input', () => {
      expect(() => updateMeetingSchema.parse(null)).to.throw();
    });
  });
});
