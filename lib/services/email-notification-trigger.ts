// Helper to trigger email notifications for withdrawal events
import { getEmailPreference } from './email-preferences-db';
import { sendNotification, composeEmail, EmailEventType } from './email-notifications';

export async function notifyUsersOnWithdrawalEvent({
  event,
  vaultAddress,
  amount,
  reason,
  involvedAddresses,
  extraData = {}
}: {
  event: EmailEventType;
  vaultAddress: string;
  amount: string;
  reason?: string;
  involvedAddresses: string[]; // e.g. [owner, ...guardians]
  extraData?: any;
}) {
  for (const address of involvedAddresses) {
    const pref = getEmailPreference(address);
    if (pref && pref.optIn && pref.email) {
      const { subject, html } = composeEmail(event, {
        vaultAddress,
        amount,
        reason,
        ...extraData
      });
      await sendNotification({ to: pref.email, subject, html });
    }
  }
}
