import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const q = new URL(request.url).searchParams;
  const verticalId = q.get('verticalId') || undefined;

  const where = { orgId: session.user.orgId, ...(verticalId ? { verticalId } : {}) };
  const leads = await prisma.lead.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      vertical: {
        select: {
          id: true,
          label: true,
        },
      },
    },
  });
  return NextResponse.json(leads);
}

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json();

  const lead = await prisma.lead.create({
    data: {
      orgId: session.user.orgId,
      verticalId: body.verticalId || null,
      firstName: body.firstName || null,
      lastName: body.lastName || null,
      email: body.email || null,
      phone: body.phone || null,
      title: body.title || null,
      companyName: body.companyName || null,
      companySize: body.companySize || null,
      location: body.location || null,
      linkedinUrl: body.linkedinUrl || null,
      providerId: body.providerId || null,
      providerSource: body.providerSource || null,
      notes: body.notes || null,
    },
  });

  return NextResponse.json(lead, { status: 201 });
}
