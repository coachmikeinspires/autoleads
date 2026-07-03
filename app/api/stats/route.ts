import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';

export async function GET() {
  const session = await getAuthSession();
  if (!session?.user?.orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const orgId = session.user.orgId;

  // Fetch metrics
  const [leadCount, sequenceCount, enrollmentCount, emailSendCount, verticalCount] = await Promise.all([
    prisma.lead.count({ where: { orgId } }),
    prisma.emailSequence.count({ where: { orgId } }),
    prisma.sequenceEnrollment.count({ where: { lead: { orgId } } }),
    prisma.emailSend.count(),
    prisma.vertical.count({ where: { orgId } }),
  ]);

  // Recent enrollments
  const recentEnrollments = await prisma.sequenceEnrollment.findMany({
    where: { lead: { orgId } },
    orderBy: { enrolledAt: 'desc' },
    take: 5,
    include: { lead: true, sequence: true },
  });

  // Lead status breakdown
  const leadsByStatus = await prisma.lead.groupBy({
    by: ['status'],
    where: { orgId },
    _count: true,
  });

  // Enrollment status breakdown
  const enrollmentsByStatus = await prisma.sequenceEnrollment.groupBy({
    by: ['status'],
    where: { lead: { orgId } },
    _count: true,
  });

  return NextResponse.json({
    summary: {
      leads: leadCount,
      sequences: sequenceCount,
      enrollments: enrollmentCount,
      emailsSent: emailSendCount,
      verticals: verticalCount,
    },
    leadsByStatus,
    enrollmentsByStatus,
    recentEnrollments,
  });
}
