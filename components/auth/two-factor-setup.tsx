'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, Copy, CheckCircle2, Loader, Phone, Mail, Smartphone, Shield, Download, Eye, EyeOff } from 'lucide-react';
import { TwoFactorMethod, getTwoFactorMethodName, getTwoFactorMethodIcon } from '@/lib/services/auth/two-factor-auth-types';
import TwoFactorAuthService from '@/lib/services/auth/two-factor-auth-service';

interface TwoFactorSetupProps {
  onComplete?: (config: any) => void;
  onCancel?: () => void;
}

/**
 * Two-Factor Authentication Setup Component
 * Guides user through TOTP, SMS, or Email setup with QR code and backup codes
 */
export const TwoFactorSetupComponent: React.FC<TwoFactorSetupProps> = ({
  onComplete,
  onCancel
}) => {
  const [step, setStep] = useState<'method-select' | 'setup' | 'verify' | 'backup' | 'complete'>('method-select');
  const [selectedMethod, setSelectedMethod] = useState<TwoFactorMethod | null>(null);
  const [qrCode, setQrCode] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [setupSteps, setSetupSteps] = useState<any[]>([]);

  // Start 2FA setup
  const handleStartSetup = async (method: TwoFactorMethod) => {
    setLoading(true);
    setError('');

    try {
      setSelectedMethod(method);
      setSetupSteps(TwoFactorAuthService.getSetupSteps(method));

      // Initialize setup based on method
      if (method === 'totp') {
        const response = await TwoFactorAuthService.initializeSetup({
          userId: 'current-user',
          method: 'totp'
        });

        if ('qrCode' in response) {
          setQrCode(response.qrCode);
          setSecret(response.secret);
          setBackupCodes(response.backupCodes);
          setStep('setup');
        }
      } else if (method === 'sms') {
        setStep('setup');
      } else if (method === 'email') {
        const response = await TwoFactorAuthService.initializeSetup({
          userId: 'current-user',
          method: 'email'
        });

        if ('sent' in response) {
          setStep('verify');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Setup failed');
    } finally {
      setLoading(false);
    }
  };

  // Verify code
  const handleVerify = async () => {
    if (!verificationCode) {
      setError('Please enter verification code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await TwoFactorAuthService.verifyCode({
        userId: 'current-user',
        code: verificationCode,
        method: selectedMethod || undefined
      });

      if (response.verified) {
        if (selectedMethod === 'totp') {
          // For TOTP, show backup codes after verification
          setStep('backup');
        } else {
          setStep('complete');
        }
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // RENDER METHODS
  // ==========================================

  if (step === 'method-select') {
    return <MethodSelector onSelect={handleStartSetup} loading={loading} />;
  }

  if (step === 'setup' && selectedMethod) {
    if (selectedMethod === 'totp') {
      return (
        <TOTPSetupScreen
          qrCode={qrCode}
          secret={secret}
          setupSteps={setupSteps}
          onNext={() => setStep('verify')}
          onBack={() => setStep('method-select')}
        />
      );
    } else if (selectedMethod === 'sms') {
      return (
        <SMSSetupScreen
          phoneNumber={phoneNumber}
          onPhoneChange={setPhoneNumber}
          setupSteps={setupSteps}
          loading={loading}
          error={error}
          onNext={async () => {
            try {
              const response = await TwoFactorAuthService.initializeSetup({
                userId: 'current-user',
                method: 'sms',
                phoneNumber
              });
              if ('sent' in response) {
                setStep('verify');
              }
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Failed to send SMS');
            }
          }}
          onBack={() => setStep('method-select')}
        />
      );
    } else if (selectedMethod === 'email') {
      return (
        <EmailSetupScreen
          setupSteps={setupSteps}
          loading={loading}
          error={error}
          onNext={() => setStep('verify')}
          onBack={() => setStep('method-select')}
        />
      );
    }
  }

  if (step === 'verify') {
    return (
      <VerificationScreen
        method={selectedMethod || 'email'}
        verificationCode={verificationCode}
        onCodeChange={setVerificationCode}
        loading={loading}
        error={error}
        onVerify={handleVerify}
        onBack={() => setStep('setup')}
      />
    );
  }

  if (step === 'backup' && backupCodes.length > 0) {
    return (
      <BackupCodesScreen
        backupCodes={backupCodes}
        onComplete={() => setStep('complete')}
        onBack={() => setStep('verify')}
      />
    );
  }

  if (step === 'complete') {
    return (
      <CompleteScreen
        method={selectedMethod || 'email'}
        onFinish={onComplete}
      />
    );
  }

  return null;
};

/**
 * Method Selection Screen
 */
interface MethodSelectorProps {
  onSelect: (method: TwoFactorMethod) => void;
  loading: boolean;
}

const MethodSelector: React.FC<MethodSelectorProps> = ({ onSelect, loading }) => {
  const methods: Array<{ method: TwoFactorMethod; icon: React.ReactNode; pros: string[]; cons: string[] }> = [
    {
      method: 'totp',
      icon: <Smartphone className="w-8 h-8" />,
      pros: [
        'Most secure option',
        'Works offline',
        'No phone number needed',
        'Fast verification'
      ],
      cons: [
        'Requires authenticator app',
        'Backup codes needed'
      ]
    },
    {
      method: 'sms',
      icon: <Phone className="w-8 h-8" />,
      pros: [
        'Easy to use',
        'Works on any phone',
        'Fast code delivery'
      ],
      cons: [
        'Less secure than TOTP',
        'Requires cell service',
        'SIM swap vulnerability'
      ]
    },
    {
      method: 'email',
      icon: <Mail className="w-8 h-8" />,
      pros: [
        'No additional setup',
        'Works on any device',
        'Easy backup option'
      ],
      cons: [
        'Slower delivery',
        'Email access required'
      ]
    }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Enable Two-Factor Authentication
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Choose the verification method that works best for you. You can add multiple methods later.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {methods.map((item) => (
          <button
            key={item.method}
            onClick={() => onSelect(item.method)}
            disabled={loading}
            className="text-left p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="text-blue-600 dark:text-blue-400">{item.icon}</div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {getTwoFactorMethodName(item.method)}
              </h3>
            </div>

            <div className="space-y-2 text-sm">
              <div>
                <p className="font-medium text-green-600 dark:text-green-400 mb-1">✓ Advantages</p>
                <ul className="space-y-1">
                  {item.pros.map((pro) => (
                    <li key={pro} className="text-gray-600 dark:text-gray-400">• {pro}</li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="font-medium text-orange-600 dark:text-orange-400 mb-1">⚠ Considerations</p>
                <ul className="space-y-1">
                  {item.cons.map((con) => (
                    <li key={con} className="text-gray-600 dark:text-gray-400">• {con}</li>
                  ))}
                </ul>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex gap-3">
          <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-blue-900 dark:text-blue-100">Security Tip</p>
            <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
              For maximum security, use an authenticator app (TOTP). You can also set up SMS or Email as backup methods after initial setup.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * TOTP Setup Screen
 */
interface TOTPSetupScreenProps {
  qrCode: string;
  secret: string;
  setupSteps: any[];
  onNext: () => void;
  onBack: () => void;
}

const TOTPSetupScreen: React.FC<TOTPSetupScreenProps> = ({
  qrCode,
  secret,
  setupSteps,
  onNext,
  onBack
}) => {
  const [showSecret, setShowSecret] = useState(false);

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Set Up Authenticator App
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Follow these steps to configure your authenticator app:
      </p>

      <div className="space-y-6">
        {/* Setup Steps */}
        <div className="space-y-3">
          {setupSteps.map((step) => (
            <div key={step.step} className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center font-semibold">
                {step.step}
              </div>
              <div className="flex-grow">
                <p className="font-medium text-gray-900 dark:text-white">{step.title}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{step.description}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">~{step.time}</p>
              </div>
            </div>
          ))}
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center gap-4">
          {qrCode && (
            <>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                Scan this QR code with your authenticator app
              </p>
            </>
          )}
        </div>

        {/* Manual Entry Secret */}
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Or enter manually:
          </p>
          <div className="flex gap-2">
            <input
              type={showSecret ? 'text' : 'password'}
              value={secret}
              readOnly
              className="flex-grow px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm"
            />
            <button
              onClick={() => setShowSecret(!showSecret)}
              className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              {showSecret ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
            <button
              onClick={() => navigator.clipboard.writeText(secret)}
              className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <Copy className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={onBack}
            className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 font-medium"
          >
            Back
          </button>
          <button
            onClick={onNext}
            className="flex-1 px-4 py-2 bg-blue-600 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-700 font-medium"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * SMS Setup Screen
 */
interface SMSSetupScreenProps {
  phoneNumber: string;
  onPhoneChange: (value: string) => void;
  setupSteps: any[];
  loading: boolean;
  error: string;
  onNext: () => void;
  onBack: () => void;
}

const SMSSetupScreen: React.FC<SMSSetupScreenProps> = ({
  phoneNumber,
  onPhoneChange,
  setupSteps,
  loading,
  error,
  onNext,
  onBack
}) => {
  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Set Up SMS Verification
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        We will send verification codes to your phone:
      </p>

      <div className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => onPhoneChange(e.target.value)}
            placeholder="+1 (555) 123-4567"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>

        {/* Setup Steps */}
        <div className="space-y-3">
          {setupSteps.map((step) => (
            <div key={step.step} className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center font-semibold">
                {step.step}
              </div>
              <div className="flex-grow">
                <p className="font-medium text-gray-900 dark:text-white">{step.title}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={onBack}
            disabled={loading}
            className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 font-medium disabled:opacity-50"
          >
            Back
          </button>
          <button
            onClick={onNext}
            disabled={loading || !phoneNumber}
            className="flex-1 px-4 py-2 bg-blue-600 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-700 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader className="w-4 h-4 animate-spin" />}
            Send Code
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Email Setup Screen
 */
interface EmailSetupScreenProps {
  setupSteps: any[];
  loading: boolean;
  error: string;
  onNext: () => void;
  onBack: () => void;
}

const EmailSetupScreen: React.FC<EmailSetupScreenProps> = ({
  setupSteps,
  loading,
  error,
  onNext,
  onBack
}) => {
  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Set Up Email Verification
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        We will send verification codes to your registered email address:
      </p>

      <div className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Setup Steps */}
        <div className="space-y-3">
          {setupSteps.map((step) => (
            <div key={step.step} className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center font-semibold">
                {step.step}
              </div>
              <div className="flex-grow">
                <p className="font-medium text-gray-900 dark:text-white">{step.title}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={onBack}
            disabled={loading}
            className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 font-medium disabled:opacity-50"
          >
            Back
          </button>
          <button
            onClick={onNext}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-700 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader className="w-4 h-4 animate-spin" />}
            Send Code
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Verification Screen (for entering codes)
 */
interface VerificationScreenProps {
  method: TwoFactorMethod;
  verificationCode: string;
  onCodeChange: (value: string) => void;
  loading: boolean;
  error: string;
  onVerify: () => void;
  onBack: () => void;
}

const VerificationScreen: React.FC<VerificationScreenProps> = ({
  method,
  verificationCode,
  onCodeChange,
  loading,
  error,
  onVerify,
  onBack
}) => {
  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Verify Your Code
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Enter the 6-digit code from your {getTwoFactorMethodName(method)}:
      </p>

      <div className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Verification Code
          </label>
          <input
            type="text"
            value={verificationCode}
            onChange={(e) => onCodeChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            maxLength={6}
            className="w-full px-4 py-3 text-center text-lg font-mono border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none"
          />
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            {verificationCode.length}/6 digits entered
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={onBack}
            disabled={loading}
            className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 font-medium disabled:opacity-50"
          >
            Back
          </button>
          <button
            onClick={onVerify}
            disabled={loading || verificationCode.length !== 6}
            className="flex-1 px-4 py-2 bg-blue-600 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-700 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader className="w-4 h-4 animate-spin" />}
            Verify
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Backup Codes Screen
 */
interface BackupCodesScreenProps {
  backupCodes: string[];
  onComplete: () => void;
  onBack: () => void;
}

const BackupCodesScreen: React.FC<BackupCodesScreenProps> = ({
  backupCodes,
  onComplete,
  onBack
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [downloadedAll, setDownloadedAll] = useState(false);

  const copyToClipboard = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const downloadCodes = () => {
    const content = `Two-Factor Authentication Backup Codes\n\nSave these codes in a secure location. Each code can only be used once.\n\n${backupCodes.join('\n')}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '2fa-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloadedAll(true);
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Save Your Backup Codes
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        These codes can be used to access your account if you lose access to your authenticator. Store them safely.
      </p>

      <div className="space-y-6">
        {/* Warning */}
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
            ⚠️ Keep these codes secure
          </p>
          <ul className="text-sm text-yellow-800 dark:text-yellow-200 mt-2 space-y-1">
            <li>• Write them down and store in a safe place</li>
            <li>• Do not share with anyone</li>
            <li>• Consider storing in a password manager</li>
            <li>• Each code can only be used once</li>
          </ul>
        </div>

        {/* Backup Codes Grid */}
        <div className="grid grid-cols-2 gap-3">
          {backupCodes.map((code, index) => (
            <div
              key={index}
              className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-between"
            >
              <code className="font-mono text-sm text-gray-900 dark:text-white">{code}</code>
              <button
                onClick={() => copyToClipboard(code, index)}
                className="ml-2 p-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                {copiedIndex === index ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Download Button */}
        <button
          onClick={downloadCodes}
          className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 font-medium flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          Download Codes as Text File
        </button>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={onBack}
            className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 font-medium"
          >
            Back
          </button>
          <button
            onClick={onComplete}
            disabled={!downloadedAll}
            className="flex-1 px-4 py-2 bg-green-600 dark:bg-green-600 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            I've Saved My Codes
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Setup Complete Screen
 */
interface CompleteScreenProps {
  method: TwoFactorMethod;
  onFinish?: () => void;
}

const CompleteScreen: React.FC<CompleteScreenProps> = ({ method, onFinish }) => {
  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Setup Complete!
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {getTwoFactorMethodName(method)} is now enabled on your account.
          </p>
        </div>

        <div className="w-full p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
            Next Steps:
          </p>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 text-left">
            <li>✓ Your account is now more secure</li>
            <li>✓ You'll need 2FA for your next login</li>
            <li>✓ You can add more verification methods anytime</li>
          </ul>
        </div>

        <button
          onClick={onFinish}
          className="w-full px-4 py-2 bg-blue-600 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-700 font-medium"
        >
          Back to Settings
        </button>
      </div>
    </div>
  );
};

export default TwoFactorSetupComponent;
