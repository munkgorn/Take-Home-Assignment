import { z } from 'zod';

export const createMeetingSchema = z.object({
  title: z.string().min(1),
  candidateName: z.string().min(1),
  position: z.string().min(1),
  meetingType: z.enum(['onsite', 'online']),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  description: z.string().optional(),
  meetingLink: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['pending', 'confirmed', 'cancelled']).optional(),
});

export const updateMeetingSchema = createMeetingSchema.partial();
