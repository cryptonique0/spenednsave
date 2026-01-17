'use client';

import { useState } from 'react';
import { Phone, Mail, Check, Shield, Copy } from 'lucide-react';

interface EmergencyContact {
  id: string;
  type: 'phone' | 'email';
  value: string;
  masked: string;
  verified: boolean;
  verifiedAt?: string;
  isPrimary: boolean;
  isBackup: boolean;
}

interface VerificationStep {
  id: string;
  step: number;
  title: string;
  completed: boolean;
  contactId?: string;
}

const EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    id: '1',
    type: 'phone',
    value: '+1-555-123-4567',
    masked: '+1-555-***-4567',
    verified: true,
    verifiedAt: '2024-12-15',
    isPrimary: true,
    isBackup: false
  },
  {
    id: '2',
    type: 'email',
    value: 'recovery@example.com',
    masked: 'rec****@example.com',
    verified: false,
    isPrimary: false,
    isBackup: true
  },
  {
    id: '3',
    type: 'phone',
    value: '+1-555-987-6543',
    masked: '+1-555-***-6543',
    verified: true,
    verifiedAt: '2024-11-10',
    isPrimary: false,
    isBackup: true
  }
];

const VERIFICATION_STEPS: VerificationStep[] = [
  {
    id: '1',
    step: 1,
    title: 'Send OTP to Primary Phone',
    completed: true,
    contactId: '1'
  },
  {
    id: '2',
    step: 2,
    title: 'Enter and Verify OTP Code',
    completed: true,
    contactId: '1'
  },
  {
    id: '3',
    step: 3,
    title: 'Send Verification Link to Email',
    completed: false,
    contactId: '2'
  },
  {
    id: '4',
    step: 4,
    title: 'Click Email Verification Link',
    completed: false,
    contactId: '2'
  },
  {
    id: '5',
    step: 5,
    title: 'Verify Backup Phone',
    completed: false,
    contactId: '3'
  }
];

export function EmergencyContactVerification() {
  const [contacts, setContacts] = useState<EmergencyContact[]>(EMERGENCY_CONTACTS);
  const [otpValues, setOtpValues] = useState<Record<string, string>>({});
  const [verifyingContactId, setVerifyingContactId] = useState<string | null>(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newContactType, setNewContactType] = useState<'phone' | 'email'>('phone');
  const [newContactValue, setNewContactValue] = useState('');

  const handleSendOTP = (contactId: string) => {
    setVerifyingContactId(contactId);
    // In real app, this would call backend API
    setTimeout(() => {
      // Show notification
    }, 1000);
  };

  const handleVerifyOTP = (contactId: string, otp: string) => {
    if (otp.length === 6) {
      setContacts(contacts.map(c =>
        c.id === contactId
          ? { ...c, verified: true, verifiedAt: new Date().toISOString().split('T')[0] }
          : c
      ));
      setOtpValues({ ...otpValues, [contactId]: '' });
      setVerifyingContactId(null);
    }
  };

  const handleCopyValue = (value: string) => {
    navigator.clipboard.writeText(value);
  };

  const handleAddContact = () => {
    if (!newContactValue.trim()) return;

    const newContact: EmergencyContact = {
      id: Date.now().toString(),
      type: newContactType,
      value: newContactValue,
      masked: newContactType === 'phone'
        ? newContactValue.replace(/\d(?=\d{4})/g, '*')
        : newContactValue.replace(/(.{2})[^@]*(@)/, '$1****$2'),
      verified: false,
      isPrimary: false,
      isBackup: contacts.length > 1
    };

    setContacts([...contacts, newContact]);
    setNewContactValue('');
    setShowAddForm(false);
  };

  const verifiedCount = contacts.filter(c => c.verified).length;
  const totalContacts = contacts.length;

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Emergency Contact Verification
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Verify multiple contact methods for secure vault recovery
        </p>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-surface-dark border border-surface-border dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                Verified Contacts
              </p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">
                {verifiedCount}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                of {totalContacts} added
              </p>
            </div>
            <Check className="w-8 h-8 text-success/60" />
          </div>
        </div>

        <div className="bg-white dark:bg-surface-dark border border-surface-border dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                Primary Contact
              </p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                Phone
              </p>
              <p className="text-xs text-success mt-1 font-semibold">
                ✓ Verified
              </p>
            </div>
            <Phone className="w-8 h-8 text-primary/60" />
          </div>
        </div>

        <div className="bg-white dark:bg-surface-dark border border-surface-border dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                Backup Contacts
              </p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">
                {contacts.filter(c => c.isBackup).length}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Additional backups
              </p>
            </div>
            <Shield className="w-8 h-8 text-primary/60" />
          </div>
        </div>
      </div>

      {/* Emergency Contacts List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Your Contacts
          </h3>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition-colors text-sm"
          >
            + Add Contact
          </button>
        </div>

        {/* Add Contact Form */}
        {showAddForm && (
          <div className="bg-slate-50 dark:bg-slate-800 border border-surface-border dark:border-gray-700 rounded-lg p-4 space-y-4">
            <div className="flex gap-2">
              <select
                value={newContactType}
                onChange={(e) => setNewContactType(e.target.value as 'phone' | 'email')}
                className="px-3 py-2 bg-white dark:bg-surface-dark border border-surface-border dark:border-gray-700 rounded-lg text-slate-900 dark:text-white text-sm"
              >
                <option value="phone">Phone Number</option>
                <option value="email">Email Address</option>
              </select>
              <input
                type={newContactType === 'phone' ? 'tel' : 'email'}
                placeholder={newContactType === 'phone' ? '+1-555-123-4567' : 'recovery@example.com'}
                value={newContactValue}
                onChange={(e) => setNewContactValue(e.target.value)}
                className="flex-1 px-4 py-2 bg-white dark:bg-surface-dark border border-surface-border dark:border-gray-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
              <button
                onClick={handleAddContact}
                className="px-4 py-2 bg-success hover:bg-success/80 text-white font-semibold rounded-lg transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        )}

        {/* Contacts */}
        {contacts.map((contact) => (
          <div
            key={contact.id}
            className={`border rounded-lg p-6 transition-all ${
              contact.verified
                ? 'bg-success/5 dark:bg-success/10 border-success/30 dark:border-success/40'
                : 'bg-white dark:bg-surface-dark border-surface-border dark:border-gray-700'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                <div className={`p-3 rounded-lg flex-shrink-0 ${
                  contact.verified
                    ? 'bg-success/20 dark:bg-success/30'
                    : 'bg-slate-100 dark:bg-slate-800'
                }`}>
                  {contact.type === 'phone' ? (
                    <Phone className={`w-5 h-5 ${contact.verified ? 'text-success' : 'text-slate-400'}`} />
                  ) : (
                    <Mail className={`w-5 h-5 ${contact.verified ? 'text-success' : 'text-slate-400'}`} />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-slate-900 dark:text-white">
                      {contact.type === 'phone' ? 'Phone Number' : 'Email Address'}
                    </h4>
                    {contact.verified && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-success/20 text-success text-xs font-semibold rounded">
                        <Check className="w-3 h-3" />
                        Verified
                      </span>
                    )}
                    {contact.isPrimary && (
                      <span className="inline-flex items-center px-2 py-0.5 bg-primary/20 text-primary text-xs font-semibold rounded">
                        Primary
                      </span>
                    )}
                    {contact.isBackup && (
                      <span className="inline-flex items-center px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded">
                        Backup
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <code className="text-sm font-mono text-slate-600 dark:text-slate-400">
                      {contact.masked}
                    </code>
                    <button
                      onClick={() => handleCopyValue(contact.value)}
                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                      title="Copy full value"
                    >
                      <Copy className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    </button>
                  </div>

                  {contact.verifiedAt && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                      Verified on {contact.verifiedAt}
                    </p>
                  )}
                </div>
              </div>

              {/* Verify Button */}
              {!contact.verified && (
                <div className="flex-shrink-0">
                  {verifyingContactId !== contact.id ? (
                    <button
                      onClick={() => handleSendOTP(contact.id)}
                      className="px-4 py-2 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition-colors text-sm whitespace-nowrap"
                    >
                      Verify Now
                    </button>
                  ) : (
                    <div className="w-full max-w-xs space-y-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="000000"
                          value={otpValues[contact.id] || ''}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                            setOtpValues({ ...otpValues, [contact.id]: val });
                            if (val.length === 6) {
                              handleVerifyOTP(contact.id, val);
                            }
                          }}
                          className="flex-1 px-3 py-2 bg-white dark:bg-surface-dark border border-surface-border dark:border-gray-700 rounded-lg text-center text-slate-900 dark:text-white font-mono text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        />
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                        OTP sent to {contact.type === 'phone' ? 'phone' : 'email'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Verification Timeline */}
      <div className="bg-white dark:bg-surface-dark border border-surface-border dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
          Verification Steps
        </h3>
        <div className="space-y-4">
          {VERIFICATION_STEPS.map((step, idx) => (
            <div key={step.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                  step.completed
                    ? 'bg-success text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white'
                }`}>
                  {step.completed ? '✓' : step.step}
                </div>
                {idx < VERIFICATION_STEPS.length - 1 && (
                  <div className={`w-0.5 h-12 mt-2 ${
                    step.completed ? 'bg-success' : 'bg-slate-300 dark:bg-slate-700'
                  }`} />
                )}
              </div>

              <div className="pb-4 pt-1">
                <h4 className={`font-semibold ${
                  step.completed ? 'text-success' : 'text-slate-900 dark:text-white'
                }`}>
                  {step.title}
                </h4>
                {step.contactId && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Contact: {
                      contacts.find(c => c.id === step.contactId)?.masked
                    }
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-lg p-4">
        <div className="flex gap-3">
          <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 text-sm mb-1">
              Security Best Practices
            </h4>
            <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Keep at least 2 verified emergency contacts</li>
              <li>• Use a phone number you check regularly</li>
              <li>• Update contacts if your information changes</li>
              <li>• Do not share OTP codes with anyone</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
