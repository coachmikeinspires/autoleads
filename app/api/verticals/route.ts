import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const verticals = await prisma.vertical.findMany({ where: { orgId: session.user.orgId } });
  return NextResponse.json(verticals);
}

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const v = await prisma.vertical.create({
    data: {
      orgId: session.user.orgId,
      label: body.label || 'Untitled',
      keywordTags: body.keywordTags ?? [],
      personTitles: body.personTitles ?? [],
      qKeywords: body.qKeywords ?? null,
    },
  });

  return NextResponse.json(v, { status: 201 });
}
