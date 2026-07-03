import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  const session = await getAuthSession();
  if (!session?.user?.orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const enrollment = await prisma.sequenceEnrollment.findUnique({
    where: { id },
    include: { lead: true, sequence: true },
  });

  if (!enrollment || enrollment.lead.orgId !== session.user.orgId) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(enrollment);
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const session = await getAuthSession();
  if (!session?.user?.orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const body = await request.json();

  const updated = await prisma.sequenceEnrollment.updateMany({
    where: { id, lead: { orgId: session.user.orgId } },
    data: {
      status: body.status,
      currentStep: body.currentStep,
    },
  });

  if (updated.count === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const session = await getAuthSession();
  if (!session?.user?.orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  await prisma.sequenceEnrollment.deleteMany({ where: { id, lead: { orgId: session.user.orgId } } });
  return NextResponse.json({ success: true });
}
