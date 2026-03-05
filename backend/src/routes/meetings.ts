import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';
import { createMeetingSchema, updateMeetingSchema } from '../validators/meeting';

export function createMeetingRoutes(prisma: PrismaClient) {
  const router = Router();

  router.use(authMiddleware);

  router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 10));
      const status = req.query.status as string | undefined;
      const search = req.query.search as string | undefined;

      const where: Prisma.MeetingWhereInput = {
        userId: req.user!.id,
        deletedAt: null,
      };

      if (status) {
        where.status = status;
      }

      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { candidateName: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [meetings, total] = await Promise.all([
        prisma.meeting.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { startTime: 'asc' },
        }),
        prisma.meeting.count({ where }),
      ]);

      res.json({
        meetings,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    } catch (err) {
      next(err);
    }
  });

  router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = createMeetingSchema.parse(req.body);

      const meeting = await prisma.meeting.create({
        data: {
          ...data,
          startTime: new Date(data.startTime),
          endTime: new Date(data.endTime),
          userId: req.user!.id,
        },
      });

      res.status(201).json(meeting);
    } catch (err) {
      next(err);
    }
  });

  router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;

      const meeting = await prisma.meeting.findFirst({
        where: { id, userId: req.user!.id, deletedAt: null },
      });

      if (!meeting) {
        res.status(404).json({ error: 'Meeting not found' });
        return;
      }

      res.json(meeting);
    } catch (err) {
      next(err);
    }
  });

  router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const data = updateMeetingSchema.parse(req.body);

      const existing = await prisma.meeting.findFirst({
        where: { id, userId: req.user!.id, deletedAt: null },
      });

      if (!existing) {
        res.status(404).json({ error: 'Meeting not found' });
        return;
      }

      const updateData: Record<string, unknown> = { ...data };
      if (data.startTime) updateData.startTime = new Date(data.startTime);
      if (data.endTime) updateData.endTime = new Date(data.endTime);

      const meeting = await prisma.meeting.update({
        where: { id },
        data: updateData,
      });

      res.json(meeting);
    } catch (err) {
      next(err);
    }
  });

  router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;

      const existing = await prisma.meeting.findFirst({
        where: { id, userId: req.user!.id, deletedAt: null },
      });

      if (!existing) {
        res.status(404).json({ error: 'Meeting not found' });
        return;
      }

      await prisma.meeting.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });

  return router;
}

export default createMeetingRoutes(new PrismaClient());
