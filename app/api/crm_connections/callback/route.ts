import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  // Placeholder: exchange code for tokens with provider and save a crmConnection
  // For now, just return success
  return NextResponse.json({ success: true, code, state });
}
