"use client";

import { EmailPreferences } from '@/components/settings/email-preferences';
import { VaultTransfer } from '@/components/settings/vault-transfer';
import { EmergencyContacts } from '@/components/settings/emergency-contacts';
import { VaultAnalytics } from '@/components/settings/vault-analytics';
import { useAccount } from 'wagmi';

export default function SettingsPage() {
  const { address } = useAccount();

  return (
    <main className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-2xl font-bold mb-8">Settings</h1>
      
      {/* Email Preferences Section */}
      <section className="mb-8">
        <EmailPreferences />
      </section>

      {/* Vault Analytics Section */}
      {address && (
        <section className="mb-8">
          <VaultAnalytics vaultAddress={address} />
        </section>
      )}

      {/* Transfer Vault Ownership Section */}
      <section className="mb-8">
        <VaultTransfer />
      </section>

      {/* Emergency Contacts Section */}
      <section>
        <EmergencyContacts />
      </section>
    </main>
  );
}
