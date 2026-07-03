import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';

export async function GET() {
  const session = await getAuthSession();
  if (!session?.user?.orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const list = await prisma.crmConnection.findMany({ where: { orgId: session.user.orgId } });
  return NextResponse.json(list);
}

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json();

  const c = await prisma.crmConnection.create({ data: { orgId: session.user.orgId, provider: body.provider, accessTokenEncrypted: body.accessToken || '', refreshTokenEncrypted: body.refreshToken || '', tokenExpiresAt: body.tokenExpiresAt ? new Date(body.tokenExpiresAt) : null } });
  return NextResponse.json(c, { status: 201 });
}
