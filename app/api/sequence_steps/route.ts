import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const seqId = new URL(request.url).searchParams.get('sequenceId');
  if (!seqId) return NextResponse.json({ error: 'sequenceId required' }, { status: 400 });

  const sequence = await prisma.emailSequence.findFirst({
    where: { id: seqId, orgId: session.user.orgId },
    select: { id: true },
  });

  if (!sequence) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const steps = await prisma.sequenceStep.findMany({ where: { sequenceId: seqId }, orderBy: { stepNumber: 'asc' } });
  return NextResponse.json(steps);
}

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json();

  const sequence = await prisma.emailSequence.findFirst({
    where: { id: body.sequenceId, orgId: session.user.orgId },
    select: { id: true },
  });

  if (!sequence) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const step = await prisma.sequenceStep.create({ data: { sequenceId: body.sequenceId, stepNumber: body.stepNumber || 1, subject: body.subject || null, body: body.body || null, delayDays: body.delayDays || 0 } });
  return NextResponse.json(step, { status: 201 });
}
