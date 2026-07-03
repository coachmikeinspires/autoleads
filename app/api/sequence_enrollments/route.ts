import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const q = new URL(request.url).searchParams;
  const leadId = q.get('leadId');
  const sequenceId = q.get('sequenceId');
  const where = {
    lead: { orgId: session.user.orgId },
    ...(leadId ? { leadId } : {}),
    ...(sequenceId ? { sequenceId } : {}),
  };
  const list = await prisma.sequenceEnrollment.findMany({
    where,
    orderBy: { enrolledAt: 'desc' },
    include: {
      lead: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          companyName: true,
        },
      },
    },
  });
  return NextResponse.json(list);
}

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json();

  const [lead, sequence] = await Promise.all([
    prisma.lead.findFirst({ where: { id: body.leadId, orgId: session.user.orgId }, select: { id: true } }),
    prisma.emailSequence.findFirst({ where: { id: body.sequenceId, orgId: session.user.orgId }, select: { id: true } }),
  ]);

  if (!lead || !sequence) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const enrollment = await prisma.sequenceEnrollment.create({ data: { leadId: body.leadId, sequenceId: body.sequenceId, currentStep: 0, status: 'active' } });
  return NextResponse.json(enrollment, { status: 201 });
}
