import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  const session = await getAuthSession();
  if (!session?.user?.orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const seq = await prisma.emailSequence.findUnique({ where: { id } });
  if (!seq || seq.orgId !== session.user.orgId) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(seq);
}

export async function PUT(request: Request, { params }: RouteContext) {
  const session = await getAuthSession();
  if (!session?.user?.orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const body = await request.json();

  const updated = await prisma.emailSequence.updateMany({
    where: { id, orgId: session.user.orgId },
    data: { name: body.name, status: body.status },
  });

  if (updated.count === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const session = await getAuthSession();
  if (!session?.user?.orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  await prisma.emailSequence.deleteMany({ where: { id, orgId: session.user.orgId } });
  return NextResponse.json({ success: true });
}
