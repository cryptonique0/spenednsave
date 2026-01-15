// Email notification service for SpendGuard
// Uses nodemailer (or Resend API if preferred)
// To use: set SMTP or Resend API credentials in environment variables

import nodemailer from 'nodemailer';

// Configure transporter (example: SMTP, can swap for Resend API)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export type EmailEventType =
  | 'withdrawal-requested'
  | 'withdrawal-approved'
  | 'withdrawal-rejected'
  | 'withdrawal-executed'
  | 'emergency-unlock-requested';

export interface SendNotificationParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendNotification({ to, subject, html }: SendNotificationParams) {
  if (!to) throw new Error('No recipient email provided');
  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'SpendGuard <no-reply@spendguard.xyz>',
    to,
    subject,
    html,
  });
}

// Helper: Compose email content for each event type
export function composeEmailContent(event: EmailEventType, data: any): { subject: string; html: string } {
  switch (event) {
    case 'withdrawal-requested':
      return {
        subject: 'Withdrawal Request Submitted',
        html: `<p>A new withdrawal request was submitted for vault <b>${data.vaultName || data.vaultAddress}</b>.<br/>Amount: <b>${data.amount}</b><br/>Reason: ${data.reason}</p>`
      };
    case 'withdrawal-approved':
      return {
        subject: 'Withdrawal Approved',
        html: `<p>Your withdrawal request for <b>${data.amount}</b> was approved by guardian <b>${data.guardianName || data.guardianAddress}</b>.</p>`
      };
    case 'withdrawal-rejected':
      return {
        subject: 'Withdrawal Rejected',
        html: `<p>Your withdrawal request for <b>${data.amount}</b> was rejected by guardian <b>${data.guardianName || data.guardianAddress}</b>.</p>`
      };
    case 'withdrawal-executed':
      return {
        subject: 'Withdrawal Executed',
        html: `<p>Your withdrawal of <b>${data.amount}</b> from vault <b>${data.vaultName || data.vaultAddress}</b> has been executed. Tx: <b>${data.executionTxHash || ''}</b></p>`
      };
    case 'emergency-unlock-requested':
      return {
        subject: 'Emergency Unlock Requested',
        html: `<p>An emergency unlock was requested for vault <b>${data.vaultName || data.vaultAddress}</b>. If this was not you, please contact support immediately.</p>`
      };
    default:
      return { subject: 'SpendGuard Notification', html: '<p>Event occurred.</p>' };
  }
}
