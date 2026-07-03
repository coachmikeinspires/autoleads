import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  const session = await getAuthSession();
  if (!session?.user?.orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const run = await prisma.syncRun.findUnique({ where: { id } });
  if (!run || run.orgId !== session.user.orgId) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(run);
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const session = await getAuthSession();
  if (!session?.user?.orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const body = await request.json();

  const updated = await prisma.syncRun.updateMany({
    where: { id, orgId: session.user.orgId },
    data: {
      status: body.status || undefined,
      insertedCount: body.insertedCount || undefined,
      skippedCount: body.skippedCount || undefined,
      errorMessage: body.errorMessage || undefined,
      completedAt: body.status === 'completed' ? new Date() : undefined,
    },
  });

  if (updated.count === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}
