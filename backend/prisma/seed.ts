import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10);

  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      password: hashedPassword,
      name: 'Test User',
    },
  });

  const now = new Date();

  const meetings = [
    {
      title: 'Frontend Developer Interview',
      description: 'Technical interview for React position',
      candidateName: 'Alice Johnson',
      position: 'Frontend Developer',
      meetingType: 'online',
      meetingLink: 'https://meet.google.com/abc-defg-hij',
      startTime: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
      status: 'confirmed',
      userId: user.id,
    },
    {
      title: 'Backend Engineer Screening',
      description: 'Initial screening call',
      candidateName: 'Bob Smith',
      position: 'Backend Engineer',
      meetingType: 'online',
      meetingLink: 'https://zoom.us/j/123456789',
      startTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000),
      status: 'pending',
      userId: user.id,
    },
    {
      title: 'Product Manager Final Round',
      description: 'Final round with hiring manager',
      candidateName: 'Carol Davis',
      position: 'Product Manager',
      meetingType: 'onsite',
      startTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000),
      status: 'confirmed',
      notes: 'Bring portfolio and case study presentation',
      userId: user.id,
    },
    {
      title: 'UX Designer Portfolio Review',
      candidateName: 'David Lee',
      position: 'UX Designer',
      meetingType: 'online',
      meetingLink: 'https://meet.google.com/xyz-uvwx-yz',
      startTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
      status: 'pending',
      userId: user.id,
    },
    {
      title: 'DevOps Engineer Technical Assessment',
      description: 'Live coding and infrastructure design',
      candidateName: 'Eve Martinez',
      position: 'DevOps Engineer',
      meetingType: 'onsite',
      startTime: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 120 * 60 * 1000),
      status: 'cancelled',
      notes: 'Candidate withdrew application',
      userId: user.id,
    },
  ];

  for (const meeting of meetings) {
    await prisma.meeting.create({ data: meeting });
  }

  console.log('Seed data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
