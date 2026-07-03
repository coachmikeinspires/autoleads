import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const provider = url.searchParams.get('provider') || 'hubspot';
  // Placeholder: redirect to provider OAuth authorize URL
  if (provider === 'hubspot') {
    const redirect = `https://app.hubspot.com/oauth/authorize?client_id=${process.env.HUBSPOT_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.HUBSPOT_REDIRECT_URI || '')}&scope=contacts&state=autoleads`;
    return NextResponse.redirect(redirect);
  }
  return NextResponse.json({ error: 'unknown provider' }, { status: 400 });
}
