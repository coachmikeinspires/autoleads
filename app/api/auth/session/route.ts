import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';

export async function GET() {
  const session = await getAuthSession();
  return NextResponse.json({ session });
}
