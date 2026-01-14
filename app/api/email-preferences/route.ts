import { NextRequest } from 'next/server';
import { saveEmailPreference, getEmailPreference } from '@/lib/services/email-preferences-db';

export async function POST(req: NextRequest) {
  const { address, email, optIn } = await req.json();
  if (!address || !email) return new Response('Missing address or email', { status: 400 });
  saveEmailPreference({ address, email, optIn });
  return new Response('Saved', { status: 200 });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get('address');
  if (!address) return new Response('Missing address', { status: 400 });
  const pref = getEmailPreference(address);
  if (!pref) return new Response('Not found', { status: 404 });
  return Response.json(pref);
}
