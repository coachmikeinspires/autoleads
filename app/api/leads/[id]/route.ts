import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await getAuthSession();
  if (!session?.user?.orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const lead = await prisma.lead.findUnique({ where: { id: params.id } });
  if (!lead || lead.orgId !== session.user.orgId) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(lead);
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await getAuthSession();
  if (!session?.user?.orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json();

  const updated = await prisma.lead.updateMany({ where: { id: params.id, orgId: session.user.orgId }, data: body });
  if (updated.count === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await getAuthSession();
  if (!session?.user?.orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await prisma.lead.deleteMany({ where: { id: params.id, orgId: session.user.orgId } });
  return NextResponse.json({ success: true });
}
