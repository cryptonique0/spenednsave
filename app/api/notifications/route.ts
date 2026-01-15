// API route to trigger email notifications (server action)
import { NextRequest } from 'next/server';
import { sendNotification, composeEmailContent, EmailEventType } from '@/lib/services/email-notifications';

export async function POST(req: NextRequest) {
  try {
    const { to, event, data } = await req.json();
    if (!to || !event) return new Response('Missing parameters', { status: 400 });
    const { subject, html } = composeEmailContent(event as EmailEventType, data);
    await sendNotification({ to, subject, html });
    return new Response('Notification sent', { status: 200 });
  } catch (e: any) {
    return new Response(e.message || 'Error sending notification', { status: 500 });
  }
}
