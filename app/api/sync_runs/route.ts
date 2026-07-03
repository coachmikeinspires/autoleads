import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';

export async function GET() {
  const session = await getAuthSession();
  if (!session?.user?.orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const runs = await prisma.syncRun.findMany({ where: { orgId: session.user.orgId }, orderBy: { startedAt: 'desc' } });
  return NextResponse.json(runs);
}

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json();

  const run = await prisma.syncRun.create({ data: { orgId: session.user.orgId, verticalId: body.verticalId || null, requestedCount: body.requestedCount || 0, status: 'running' } });
  return NextResponse.json(run, { status: 201 });
}
