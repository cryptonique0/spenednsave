'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Key, Shield, Smartphone, ArrowRight, Copy, Download, Eye, EyeOff } from 'lucide-react';
import {
  isWebAuthnSupported,
  getBrowserSupportInfo,
  generateRegistrationOptions,
  registerSecurityKey,
  getDeviceType,
  getDeviceIcon,
  SUPPORTED_DEVICES,
  WEBAUTHN_BEST_PRACTICES,
  WEBAUTHN_ERROR_MESSAGES,
  type WebAuthnCredential,
} from '@/lib/services/auth/webauthn-service';

type SetupStep = 'support-check' | 'device-selection' | 'registration' | 'verify' | 'backup' | 'complete';

interface WebAuthnSetupComponentProps {
  userId: string;
  userName: string;
  userDisplayName: string;
  onComplete?: (credential: WebAuthnCredential) => void;
  onCancel?: () => void;
}

export function WebAuthnSetupComponent({
  userId,
  userName,
  userDisplayName,
  onComplete,
  onCancel,
}: WebAuthnSetupComponentProps) {
  const [step, setStep] = useState<SetupStep>('support-check');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deviceName, setDeviceName] = useState('');
  const [showBestPractices, setShowBestPractices] = useState(false);
  const [browserInfo, setBrowserInfo] = useState<any>(null);
  const [credential, setCredential] = useState<WebAuthnCredential | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Check browser support on mount
  useEffect(() => {
    const checkSupport = async () => {
      const info = await getBrowserSupportInfo();
      setBrowserInfo(info);
      if (!info.isSupported) {
        setError('Your browser does not support security keys. Please use a modern browser (Chrome, Firefox, Safari, or Edge).');
      }
    };
    checkSupport();
  }, []);

  const handleRegisterKey = async () => {
    if (!deviceName.trim()) {
      setError('Please enter a name for your security key');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Generate registration options
      const options = generateRegistrationOptions(userId, userName, userDisplayName);

      // Register security key
      const registeredCredential = await registerSecurityKey(options, deviceName);

      // Generate backup codes (mock - in production, server would generate and send)
      const codes = generateBackupCodes(10);
      setBackupCodes(codes);

      // Create credential object
      const cred: WebAuthnCredential = {
        id: registeredCredential.id,
        rawId: registeredCredential.rawId,
        type: registeredCredential.type,
        deviceName,
        deviceType: getDeviceType({ deviceName }),
        transports: registeredCredential.response.transports,
        counter: 0,
        registeredAt: new Date(),
        backedUp: false,
        backupEligible: true,
      };

      setCredential(cred);
      setStep('backup');
    } catch (err: any) {
      const errorMessage = WEBAUTHN_ERROR_MESSAGES[err.name] || err.message || 'An error occurred during registration';
      setError(errorMessage);
      console.error('WebAuthn registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleDownloadCodes = () => {
    const content = `SpendVault Security Key Backup Codes\n Generated: ${new Date().toISOString()}\n\nIMPORTANT: Store these codes securely. Each code can be used once to regain access if you lose your security key.\n\n${backupCodes.join('\n')}\n\nDo not share these codes with anyone.`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spendvault-backup-codes-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!browserInfo) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin">
          <Smartphone className="w-8 h-8 text-blue-500" />
        </div>
      </div>
    );
  }

  // Support Check Screen
  if (step === 'support-check') {
    if (!browserInfo.isSupported) {
      return (
        <div className="max-w-md mx-auto p-6 space-y-6">
          <div className="space-y-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-900 dark:text-red-200">Not Supported</h3>
                <p className="text-sm text-red-800 dark:text-red-300 mt-1">
                  Your browser doesn't support security keys. Please use a modern browser like Chrome, Firefox, Safari, or Edge.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Register Security Key</h2>
          <p className="text-gray-600 dark:text-gray-400">Add a security key (YubiKey, Windows Hello, Touch ID, etc.) for the strongest protection</p>
        </div>

        {/* Supported Devices */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 dark:text-white">Popular Security Keys</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SUPPORTED_DEVICES.slice(0, 6).map((device) => (
              <div key={device.name} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{device.icon} {device.name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{device.manufacturer}</p>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {device.features.map((feat) => (
                    <span key={feat} className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                      {feat}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <Shield className="w-6 h-6 text-green-600 dark:text-green-400 mb-2" />
            <p className="font-semibold text-gray-900 dark:text-white text-sm">Most Secure</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Resistant to phishing and account takeover</p>
          </div>
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <Key className="w-6 h-6 text-blue-600 dark:text-blue-400 mb-2" />
            <p className="font-semibold text-gray-900 dark:text-white text-sm">Easy to Use</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Just tap or insert your key to verify</p>
          </div>
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <Smartphone className="w-6 h-6 text-purple-600 dark:text-purple-400 mb-2" />
            <p className="font-semibold text-gray-900 dark:text-white text-sm">Multiple Options</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">USB, NFC, Bluetooth, or built-in biometric</p>
          </div>
        </div>

        {/* Best Practices */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <button
            onClick={() => setShowBestPractices(!showBestPractices)}
            className="flex items-center justify-between w-full"
          >
            <span className="font-semibold text-blue-900 dark:text-blue-200">Security Best Practices</span>
            <span className="text-blue-600 dark:text-blue-400">{showBestPractices ? '−' : '+'}</span>
          </button>
          {showBestPractices && (
            <ul className="mt-3 space-y-2 text-sm text-blue-900 dark:text-blue-200">
              {WEBAUTHN_BEST_PRACTICES.slice(0, 5).map((practice, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="text-blue-600 dark:text-blue-400 flex-shrink-0">✓</span>
                  <span>{practice}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={() => setStep('device-selection')}
            className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors font-medium flex items-center justify-center gap-2"
          >
            Continue <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Device Selection Screen
  if (step === 'device-selection') {
    return (
      <div className="max-w-md mx-auto p-6 space-y-6">
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Name Your Security Key</h2>
          <p className="text-gray-600 dark:text-gray-400">Give your key a descriptive name so you remember which one it is</p>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Security Key Name
          </label>
          <input
            type="text"
            value={deviceName}
            onChange={(e) => setDeviceName(e.target.value)}
            placeholder="e.g., My YubiKey, Office Key, Backup Key"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => {
              setStep('support-check');
              setError(null);
            }}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors font-medium"
          >
            Back
          </button>
          <button
            onClick={() => setStep('registration')}
            disabled={!deviceName.trim()}
            className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white transition-colors font-medium"
          >
            Next
          </button>
        </div>
      </div>
    );
  }

  // Registration Screen
  if (step === 'registration') {
    return (
      <div className="max-w-md mx-auto p-6 space-y-6">
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Ready to Register</h2>
          <p className="text-gray-600 dark:text-gray-400">Follow the prompts to register your {deviceName}</p>
        </div>

        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg space-y-3">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-200">Steps:</p>
          <ol className="text-sm text-blue-900 dark:text-blue-200 space-y-2">
            <li>1. Click the button below</li>
            <li>2. Follow your browser's instructions</li>
            <li>3. Insert or tap your security key</li>
            <li>4. Complete any biometric verification if prompted</li>
          </ol>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => {
              setStep('device-selection');
              setError(null);
            }}
            disabled={loading}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors font-medium disabled:opacity-50"
          >
            Back
          </button>
          <button
            onClick={handleRegisterKey}
            disabled={loading}
            className="flex-1 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white transition-colors font-medium flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin">⏳</span> Waiting...
              </>
            ) : (
              <>
                <Key className="w-4 h-4" /> Register Key
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Backup Codes Screen
  if (step === 'backup') {
    return (
      <div className="max-w-md mx-auto p-6 space-y-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Backup Codes</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Save these codes in a safe place. You can use them to regain access if you lose your security key.</p>
        </div>

        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">⚠️ Important</p>
          <p className="text-sm text-amber-900 dark:text-amber-200 mt-1">Each code can only be used once. Store them securely, away from this device.</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Your Backup Codes</p>
            <button
              onClick={() => setShowBackupCodes(!showBackupCodes)}
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
            >
              {showBackupCodes ? (
                <>
                  <EyeOff className="w-3 h-3" /> Hide
                </>
              ) : (
                <>
                  <Eye className="w-3 h-3" /> Show
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {backupCodes.map((code, idx) => (
              <div
                key={idx}
                className="p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg group cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
                onClick={() => handleCopyCode(code, idx)}
              >
                <code className={`text-sm font-mono ${showBackupCodes ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                  {showBackupCodes ? code : '••••-••••'}
                </code>
                <div className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {copiedIndex === idx ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleDownloadCodes}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" /> Download
          </button>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setStep('complete')}
            className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors font-medium"
          >
            I've Saved the Codes
          </button>
        </div>
      </div>
    );
  }

  // Complete Screen
  return (
    <div className="max-w-md mx-auto p-6 space-y-6">
      <div className="space-y-3 text-center">
        <div className="flex justify-center">
          <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">All Set!</h2>
        <p className="text-gray-600 dark:text-gray-400">Your {deviceName} is now registered and protecting your account.</p>
      </div>

      <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg space-y-3">
        <p className="text-sm font-semibold text-green-900 dark:text-green-200">Next Steps:</p>
        <ul className="text-sm text-green-900 dark:text-green-200 space-y-2">
          <li className="flex gap-2">
            <span className="text-green-600 dark:text-green-400 flex-shrink-0">✓</span>
            <span>Security key added as a 2FA method</span>
          </li>
          <li className="flex gap-2">
            <span className="text-green-600 dark:text-green-400 flex-shrink-0">✓</span>
            <span>Backup codes saved securely</span>
          </li>
          <li className="flex gap-2">
            <span className="text-green-600 dark:text-green-400 flex-shrink-0">✓</span>
            <span>You can now use it to sign in</span>
          </li>
        </ul>
      </div>

      <button
        onClick={() => {
          if (credential && onComplete) {
            onComplete(credential);
          }
          setStep('support-check');
        }}
        className="w-full px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors font-medium"
      >
        Finish Setup
      </button>
    </div>
  );
}

/**
 * Generate mock backup codes for demo
 * In production, these would be generated server-side
 */
function generateBackupCodes(count: number): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = Array.from({ length: 4 }, () => 
      Math.floor(Math.random() * 10)
    ).join('') + '-' + Array.from({ length: 4 }, () => 
      Math.floor(Math.random() * 10)
    ).join('');
    codes.push(code);
  }
  return codes;
}
