import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';

export async function GET() {
  const session = await getAuthSession();
  if (!session?.user?.orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const list = await prisma.emailSequence.findMany({ where: { orgId: session.user.orgId } });
  return NextResponse.json(list);
}

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json();

  const seq = await prisma.emailSequence.create({ data: { orgId: session.user.orgId, name: body.name || 'Untitled', status: body.status || 'draft' } });
  return NextResponse.json(seq, { status: 201 });
}
