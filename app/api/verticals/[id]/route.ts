import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await getAuthSession();
  if (!session?.user?.orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const v = await prisma.vertical.findUnique({ where: { id: params.id } });
  if (!v || v.orgId !== session.user.orgId) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(v);
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await getAuthSession();
  if (!session?.user?.orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json();

  const v = await prisma.vertical.updateMany({
    where: { id: params.id, orgId: session.user.orgId },
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

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await getAuthSession();
  if (!session?.user?.orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await prisma.vertical.deleteMany({ where: { id: params.id, orgId: session.user.orgId } });
  return NextResponse.json({ success: true });
}
