import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  const session = await getAuthSession();
  if (!session?.user?.orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const v = await prisma.vertical.findUnique({ where: { id } });
  if (!v || v.orgId !== session.user.orgId) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(v);
}

export async function PUT(request: Request, { params }: RouteContext) {
  const session = await getAuthSession();
  if (!session?.user?.orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const body = await request.json();

  const v = await prisma.vertical.updateMany({
    where: { id, orgId: session.user.orgId },
    data: {
      label: body.label,
      keywordTags: body.keywordTags ?? undefined,
      personTitles: body.personTitles ?? undefined,
      qKeywords: body.qKeywords ?? undefined,
    },
  });

  if (v.count === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const session = await getAuthSession();
  if (!session?.user?.orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  await prisma.vertical.deleteMany({ where: { id, orgId: session.user.orgId } });
  return NextResponse.json({ success: true });
}
