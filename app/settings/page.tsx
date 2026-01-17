"use client";

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings as SettingsIcon, Moon, Lock, Wallet, User, Activity, Box, Shield, Download, Smartphone, AlertCircle, Globe } from 'lucide-react';
import { ThemeToggle } from '@/components/settings/theme-toggle';
import { NotificationPreferences } from '@/components/notifications/notification-preferences';
import { SecuritySettings } from '@/components/settings/security-settings';
import { WalletManagement } from '@/components/settings/wallet-management';
import { AccountPreferences } from '@/components/settings/account-preferences';
import { EmailPreferences } from '@/components/settings/email-preferences';
import { LanguagePreferences } from '@/components/settings/language-preferences';
import { VaultTransfer } from '@/components/settings/vault-transfer';
import { VaultAnalytics } from '@/components/settings/vault-analytics';
import { ActivityLogComponent } from '@/components/activity/activity-log-component';
import { VaultTemplatesComponent } from '@/components/vault-setup/vault-templates-component';
import { TwoFactorSetupComponent } from '@/components/auth/two-factor-setup';
import { PresetSelectorComponent } from '@/components/vault-setup/preset-selector';
import { createSampleActivityLogs } from '@/lib/services/activity/activity-log-types';
import { VaultTemplate } from '@/lib/services/vault/vault-templates-service';
import { VaultPresetConfig } from '@/lib/services/vault/vault-presets';
import { useAccount } from 'wagmi';

export default function SettingsPage() {
  const { address } = useAccount();
  const [activeTab, setActiveTab] = useState("appearance");
  const [selectedTemplate, setSelectedTemplate] = useState<VaultTemplate | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<VaultPresetConfig | null>(null);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const activityLogs = createSampleActivityLogs();

  // Handle tab from URL params if provided
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-background/50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-primary/10 rounded-lg">
              <SettingsIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Settings</h1>
              <p className="text-sm text-muted-foreground">Manage your account, security, and preferences</p>
            </div>
          </div>
        </div>

        {/* Settings Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-9 mb-8 bg-card border border-border overflow-x-auto">
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Moon className="w-4 h-4" />
              <span className="hidden sm:inline">Appearance</span>
              <span className="sm:hidden">Theme</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base">notifications</span>
              <span className="hidden sm:inline">Notifications</span>
              <span className="sm:hidden">Alerts</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              <span className="hidden sm:inline">Security</span>
              <span className="sm:hidden">Safe</span>
            </TabsTrigger>
            <TabsTrigger value="two-factor" className="flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              <span className="hidden sm:inline">2FA</span>
              <span className="sm:hidden">2FA</span>
            </TabsTrigger>
            <TabsTrigger value="wallets" className="flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              <span className="hidden sm:inline">Wallets</span>
              <span className="sm:hidden">Wallets</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Account</span>
              <span className="sm:hidden">Acct</span>
            </TabsTrigger>
            <TabsTrigger value="activity-logs" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">Activity</span>
              <span className="sm:hidden">Log</span>
            </TabsTrigger>
            <TabsTrigger value="vault-templates" className="flex items-center gap-2">
              <Box className="w-4 h-4" />
              <span className="hidden sm:inline">Templates</span>
              <span className="sm:hidden">Tmp</span>
            </TabsTrigger>
            <TabsTrigger value="vault-presets" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Presets</span>
              <span className="sm:hidden">Pre</span>
            </TabsTrigger>
            <TabsTrigger value="language" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">Language</span>
              <span className="sm:hidden">Lang</span>
            </TabsTrigger>
          </TabsList>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <ThemeToggle />
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <NotificationPreferences />
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <SecuritySettings />
            </div>
          </TabsContent>

          {/* Two-Factor Authentication Tab */}
          <TabsContent value="two-factor" className="space-y-6">
            {showTwoFactorSetup ? (
              <div className="bg-card border border-border rounded-lg p-6">
                <TwoFactorSetupComponent
                  onComplete={(config) => {
                    setTwoFactorEnabled(true);
                    setShowTwoFactorSetup(false);
                  }}
                  onCancel={() => setShowTwoFactorSetup(false)}
                />
              </div>
            ) : (
              <div className="space-y-6">
                {/* 2FA Status */}
                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-2">
                        Two-Factor Authentication
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <div
                      className={`px-4 py-2 rounded-full text-sm font-medium ${
                        twoFactorEnabled
                          ? 'bg-green-100 dark:bg-green-950/30 text-green-800 dark:text-green-400'
                          : 'bg-red-100 dark:bg-red-950/30 text-red-800 dark:text-red-400'
                      }`}
                    >
                      {twoFactorEnabled ? '✓ Enabled' : '○ Disabled'}
                    </div>
                  </div>

                  {/* Warning */}
                  {!twoFactorEnabled && (
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-lg mb-6 flex gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-yellow-900 dark:text-yellow-100">Recommended</p>
                        <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                          Enabling 2FA significantly improves your account security. We strongly recommend setting it up.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 2FA Methods Info */}
                  <div className="space-y-4 mb-6">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-50">Available Methods</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <p className="font-medium text-gray-900 dark:text-gray-50 mb-2">Authenticator App</p>
                        <p className="text-sm text-muted-foreground mb-3">
                          Most secure. Use Google Authenticator, Authy, or similar.
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-400">✓ Recommended</p>
                      </div>
                      <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <p className="font-medium text-gray-900 dark:text-gray-50 mb-2">SMS</p>
                        <p className="text-sm text-muted-foreground mb-3">
                          Quick to set up. Receive codes via text message.
                        </p>
                        <p className="text-xs text-amber-600 dark:text-amber-400">⚠ Standard</p>
                      </div>
                      <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <p className="font-medium text-gray-900 dark:text-gray-50 mb-2">Email</p>
                        <p className="text-sm text-muted-foreground mb-3">
                          Easy fallback. Receive codes to your email.
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">○ Backup</p>
                      </div>
                    </div>
                  </div>

                  {/* Setup Button */}
                  <button
                    onClick={() => setShowTwoFactorSetup(true)}
                    className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition font-medium"
                  >
                    {twoFactorEnabled ? 'Manage 2FA' : 'Enable 2FA Now'}
                  </button>
                </div>

                {/* Best Practices */}
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-6">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">🔐 Security Best Practices</h3>
                  <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                    <li>✓ Use authenticator apps instead of SMS when possible - they are more secure</li>
                    <li>✓ Store backup codes in a secure location, not in email</li>
                    <li>✓ Enable 2FA on all accounts with sensitive data</li>
                    <li>✓ Never share your 2FA codes with anyone</li>
                    <li>✓ Regularly review trusted devices and remove old ones</li>
                  </ul>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Wallets Tab */}
          <TabsContent value="wallets" className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <WalletManagement />
            </div>
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <AccountPreferences />
            </div>
          </TabsContent>

          {/* Activity Logs Tab */}
          <TabsContent value="activity-logs" className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-2">Activity Log Management</h2>
                <p className="text-sm text-muted-foreground">
                  View, filter, and export activity logs for compliance and auditing
                </p>
              </div>
              <ActivityLogComponent
                logs={activityLogs}
                vaultAddress={address}
                maxHeight="max-h-[600px]"
                compact={false}
              />
            </div>

            {/* Activity Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-2">Total Activities</p>
                <p className="text-2xl font-bold">{activityLogs.length}</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-2">Success Rate</p>
                <p className="text-2xl font-bold text-green-600">
                  {(
                    (activityLogs.filter((l) => l.success).length / activityLogs.length) *
                    100
                  ).toFixed(0)}
                  %
                </p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-2">Failed Activities</p>
                <p className="text-2xl font-bold text-red-600">
                  {activityLogs.filter((l) => !l.success).length}
                </p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-2">Avg Daily</p>
                <p className="text-2xl font-bold text-blue-600">
                  {Math.ceil(activityLogs.length / 7)}
                </p>
              </div>
            </div>

            {/* Logging Preferences */}
            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-semibold">Logging Preferences</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 rounded border-border"
                  />
                  <span className="text-sm">Log all vault operations</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 rounded border-border"
                  />
                  <span className="text-sm">Log security events</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 rounded border-border"
                  />
                  <span className="text-sm">Log user access</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 rounded border-border"
                  />
                  <span className="text-sm">Capture IP address and user agent</span>
                </label>
              </div>
              <div className="pt-4 border-t border-border">
                <label className="block text-sm font-medium mb-2">Retention Policy</label>
                <select className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                  <option>30 days (default)</option>
                  <option>90 days</option>
                  <option>1 year</option>
                  <option>Indefinite</option>
                </select>
              </div>
              <button className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition font-medium">
                Save Preferences
              </button>
            </div>
          </TabsContent>

          {/* Vault Templates Tab */}
          <TabsContent value="vault-templates" className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <VaultTemplatesComponent
                onSelectTemplate={setSelectedTemplate}
                maxDisplayCount={12}
                showFeatured={true}
              />
            </div>

            {/* Selected Template Details */}
            {selectedTemplate && (
              <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold mb-2">
                      {selectedTemplate.icon} {selectedTemplate.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">{selectedTemplate.description}</p>
                  </div>
                  <button
                    onClick={() => setSelectedTemplate(null)}
                    className="text-muted-foreground hover:text-foreground transition"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Setup Time</p>
                    <p className="font-semibold">
                      {selectedTemplate.estimatedSetupTime} minutes
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Required Guardians</p>
                    <p className="font-semibold">
                      {selectedTemplate.guardians.requiredCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Approval Threshold</p>
                    <p className="font-semibold">
                      {selectedTemplate.threshold.approval} of{' '}
                      {selectedTemplate.guardians.requiredCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Risk Level</p>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        selectedTemplate.riskLevel === 'low'
                          ? 'bg-green-100 dark:bg-green-950/30 text-green-800 dark:text-green-400'
                          : selectedTemplate.riskLevel === 'medium'
                            ? 'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-800 dark:text-yellow-400'
                            : 'bg-red-100 dark:bg-red-950/30 text-red-800 dark:text-red-400'
                      }`}
                    >
                      {selectedTemplate.riskLevel}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold mb-2">Features</p>
                  <ul className="space-y-1">
                    {selectedTemplate.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="text-primary">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <button className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition font-medium">
                  Deploy This Template
                </button>
              </div>
            )}
          </TabsContent>

          {/* Vault Presets Tab */}
          <TabsContent value="vault-presets" className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <PresetSelectorComponent
                onSelectPreset={setSelectedPreset}
                selectedPresetId={selectedPreset?.id}
              />
            </div>

            {/* Selected Preset Details */}
            {selectedPreset && (
              <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold mb-2">{selectedPreset.name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedPreset.description}</p>
                  </div>
                  <button
                    onClick={() => setSelectedPreset(null)}
                    className="text-muted-foreground hover:text-foreground transition"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Setup Time</p>
                    <p className="font-semibold">{selectedPreset.setupTime}m</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Guardians</p>
                    <p className="font-semibold">{selectedPreset.guardianCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Approval</p>
                    <p className="font-semibold">{selectedPreset.approvalThreshold}/{selectedPreset.guardianCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Risk Level</p>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        selectedPreset.riskLevel === 'low'
                          ? 'bg-green-100 dark:bg-green-950/30 text-green-800 dark:text-green-400'
                          : selectedPreset.riskLevel === 'medium'
                            ? 'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-800 dark:text-yellow-400'
                            : 'bg-red-100 dark:bg-red-950/30 text-red-800 dark:text-red-400'
                      }`}
                    >
                      {selectedPreset.riskLevel}
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="font-semibold text-blue-900 dark:text-blue-100 mb-3">✓ Key Features</p>
                  <ul className="space-y-2">
                    {selectedPreset.features.map((feature, i) => (
                      <li key={i} className="text-sm text-blue-800 dark:text-blue-200">
                        • {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <p className="font-semibold text-amber-900 dark:text-amber-100 mb-3">💡 Best Practices</p>
                  <ul className="space-y-2">
                    {selectedPreset.bestPractices.slice(0, 5).map((practice, i) => (
                      <li key={i} className="text-sm text-amber-800 dark:text-amber-200">
                        • {practice}
                      </li>
                    ))}
                  </ul>
                </div>

                <button className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition font-medium">
                  Deploy {selectedPreset.name}
                </button>
              </div>
            )}
          </TabsContent>

          {/* Language Tab */}
          <TabsContent value="language" className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <LanguagePreferences />
            </div>
          </TabsContent>

        {/* Additional Settings Sections */}
        <div className="mt-12 space-y-8">
          <div>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">history</span>
              Vault Management
            </h2>
            <div className="space-y-6">
              {/* Email Preferences */}
              <div className="bg-card border border-border rounded-lg p-6">
                <EmailPreferences />
              </div>

              {/* Vault Analytics */}
              {address && (
                <div className="bg-card border border-border rounded-lg p-6">
                  <VaultAnalytics vaultAddress={address} />
                </div>
              )}

              {/* Vault Transfer */}
              <div className="bg-card border border-border rounded-lg p-6">
                <VaultTransfer />
              </div>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="mt-12 pt-8 border-t border-border">
          <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4">Danger Zone</h2>
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg p-6">
            <p className="text-sm text-muted-foreground mb-4">
              These actions are permanent and cannot be undone. Proceed with caution.
            </p>
            <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
              Sign Out of All Sessions
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
