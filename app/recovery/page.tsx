'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StepByStepRecovery } from '@/components/step-by-step-recovery';
import { EmergencyContactVerification } from '@/components/emergency-contact-verification';
import { GuardianConsensusTracking } from '@/components/guardian-consensus-tracking';
import { CustomizationOptions } from '@/components/customization-options';
import { RecoverySettings } from '@/components/recovery-settings';
import { Shield, Phone, Users, Settings, AlertTriangle } from 'lucide-react';

export default function RecoveryProgram() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-surface-dark dark:to-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-surface-dark border-b border-surface-border dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 dark:text-white flex items-center gap-3 mb-2">
                <Shield className="w-8 h-8 text-primary" />
                Vault Recovery & Security
              </h1>
              <p className="text-slate-600 dark:text-slate-400 max-w-2xl">
                Comprehensive recovery process with guardian consensus, emergency contacts, and customizable security preferences
              </p>
            </div>
          </div>

          {/* Recovery Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 border border-primary/20 rounded-lg p-4">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">
                Recovery Status
              </p>
              <p className="text-2xl font-bold text-primary">In Progress</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">Phase 1 of 6</p>
            </div>

            <div className="bg-gradient-to-br from-success/10 to-success/5 dark:from-success/20 dark:to-success/10 border border-success/20 rounded-lg p-4">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">
                Verified Contacts
              </p>
              <p className="text-2xl font-bold text-success">2 of 3</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">Primary & Backup active</p>
            </div>

            <div className="bg-gradient-to-br from-info/10 to-info/5 dark:from-info/20 dark:to-info/10 border border-info/20 rounded-lg p-4">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">
                Guardian Approval
              </p>
              <p className="text-2xl font-bold text-info">1 of 3</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">Sarah Johnson approved</p>
            </div>

            <div className="bg-gradient-to-br from-warning/10 to-warning/5 dark:from-warning/20 dark:to-warning/10 border border-warning/20 rounded-lg p-4">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">
                Time Remaining
              </p>
              <p className="text-2xl font-bold text-warning">24h 15m</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">48-hour recovery window</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 lg:w-auto mb-8 bg-white dark:bg-surface-dark p-1 rounded-lg border border-surface-border dark:border-gray-700">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Recovery Process</span>
              <span className="sm:hidden">Process</span>
            </TabsTrigger>
            <TabsTrigger value="contacts" className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              <span className="hidden sm:inline">Emergency Contacts</span>
              <span className="sm:hidden">Contacts</span>
            </TabsTrigger>
            <TabsTrigger value="guardians" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Guardian Consensus</span>
              <span className="sm:hidden">Guardians</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Customization</span>
              <span className="sm:hidden">Settings</span>
            </TabsTrigger>
            <TabsTrigger value="recovery-settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Recovery Settings</span>
              <span className="sm:hidden">Recovery</span>
            </TabsTrigger>
          </TabsList>

          {/* Recovery Process Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="bg-white dark:bg-surface-dark rounded-lg p-6 border border-surface-border dark:border-gray-700">
              <div className="flex items-start gap-3 p-4 bg-info/10 dark:bg-info/20 border border-info/30 rounded-lg mb-6">
                <AlertTriangle className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  Your vault recovery is initiated. Complete all steps below to regain access. You have 48 hours to complete this process.
                </p>
              </div>
              <StepByStepRecovery />
            </div>
          </TabsContent>

          {/* Emergency Contacts Tab */}
          <TabsContent value="contacts" className="space-y-6">
            <div className="bg-white dark:bg-surface-dark rounded-lg p-6 border border-surface-border dark:border-gray-700">
              <EmergencyContactVerification />
            </div>
          </TabsContent>

          {/* Guardian Consensus Tab */}
          <TabsContent value="guardians" className="space-y-6">
            <div className="bg-white dark:bg-surface-dark rounded-lg p-6 border border-surface-border dark:border-gray-700">
              <GuardianConsensusTracking />
            </div>
          </TabsContent>

          {/* Customization Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="bg-white dark:bg-surface-dark rounded-lg p-6 border border-surface-border dark:border-gray-700">
              <CustomizationOptions />
            </div>
          </TabsContent>

          {/* Recovery Settings Tab */}
          <TabsContent value="recovery-settings" className="space-y-6">
            <div className="bg-white dark:bg-surface-dark rounded-lg p-6 border border-surface-border dark:border-gray-700">
              <RecoverySettings />
            </div>
          </TabsContent>
        </Tabs>

        {/* Additional Resources */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {/* Quick Help */}
          <div className="bg-white dark:bg-surface-dark rounded-lg p-6 border border-surface-border dark:border-gray-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              ❓ Recovery FAQs
            </h3>
            <div className="space-y-3">
              <details className="group cursor-pointer">
                <summary className="text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-primary transition-colors">
                  What happens if I don&apos;t complete recovery in 48 hours?
                </summary>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 ml-4">
                  Your recovery request will expire and you&apos;ll need to restart the process. Guardian approvals will reset.
                </p>
              </details>

              <details className="group cursor-pointer">
                <summary className="text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-primary transition-colors">
                  Can I change my guardians during recovery?
                </summary>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 ml-4">
                  No, guardians are locked during active recovery. Complete recovery first, then modify in settings.
                </p>
              </details>

              <details className="group cursor-pointer">
                <summary className="text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-primary transition-colors">
                  What if I lost access to emergency contacts?
                </summary>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 ml-4">
                  Contact support with verified identity. We can verify through security questions or additional verification methods.
                </p>
              </details>
            </div>
          </div>

          {/* Recovery Timeline */}
          <div className="bg-white dark:bg-surface-dark rounded-lg p-6 border border-surface-border dark:border-gray-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              📋 What to Expect
            </h3>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-success text-white rounded-full flex items-center justify-center text-sm font-bold">
                  ✓
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    Recovery Initiated
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Process started and security checks begun
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                  ⧖
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    Guardian Approval (In Progress)
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Waiting for guardian consent - 48 hour window
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-slate-300 dark:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-full flex items-center justify-center text-sm font-bold">
                  ▷
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                    Access Restored
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Regain full access to your vault
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
