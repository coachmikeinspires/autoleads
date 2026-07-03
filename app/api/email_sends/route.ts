import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const q = new URL(request.url).searchParams;
  const enrollmentId = q.get('enrollmentId');
  const where = {
    enrollment: {
      lead: {
        orgId: session.user.orgId,
      },
    },
    ...(enrollmentId ? { enrollmentId } : {}),
  };
  const list = await prisma.emailSend.findMany({ where, orderBy: { sentAt: 'desc' } });
  return NextResponse.json(list);
}

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json();
  const send = await prisma.emailSend.create({ data: { enrollmentId: body.enrollmentId, stepId: body.stepId, sentAt: new Date() } });
  return NextResponse.json(send, { status: 201 });
}
