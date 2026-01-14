import { EmailPreferences } from '@/components/settings/email-preferences';

export default function SettingsPage() {
  // TODO: Load user's current email and opt-in status from backend
  return (
    <main className="max-w-2xl mx-auto py-12">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <EmailPreferences />
    </main>
  );
}
