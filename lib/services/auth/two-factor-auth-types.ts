/**
 * Two-Factor Authentication Types and Interfaces
 * Supports TOTP, SMS, Email verification methods with backup codes
 */

/**
 * 2FA Method Type
 * - totp: Time-based One-Time Password (authenticator apps)
 * - sms: SMS text message verification
 * - email: Email verification code
 * - webauthn: Security keys (YubiKey, Windows Hello, Touch ID, etc.)
 */
export type TwoFactorMethod = 'totp' | 'sms' | 'email' | 'webauthn';

/**
 * 2FA Status
 * - disabled: 2FA not enabled
 * - enabled: 2FA is active and required
 * - pending: 2FA setup in progress, not yet confirmed
 * - suspended: Temporarily disabled (e.g., after failed attempts)
 */
export type TwoFactorStatus = 'disabled' | 'enabled' | 'pending' | 'suspended';

/**
 * Verification Result Status
 */
export type VerificationStatus = 'success' | 'failed' | 'expired' | 'invalid_format';

/**
 * 2FA Configuration for a user
 */
export interface TwoFactorConfig {
  userId: string;
  status: TwoFactorStatus;
  enabledMethods: TwoFactorMethod[];
  primaryMethod: TwoFactorMethod;
  backupMethods: TwoFactorMethod[];
  totpSecret?: string; // Encrypted TOTP secret
  totpBackupCodes: string[]; // Hashed backup codes for TOTP
  phoneNumber?: string; // Encrypted phone number for SMS
  emailAddress: string;
  createdAt: Date;
  enabledAt?: Date;
  lastVerifiedAt?: Date;
  failedAttempts: number;
  lockedUntil?: Date;
  recoveryEmail?: string; // Alternative recovery email
}

/**
 * 2FA Setup Request - Initial setup data
 */
export interface TwoFactorSetupRequest {
  userId: string;
  method: TwoFactorMethod;
  phoneNumber?: string;
  recoveryEmail?: string;
}

/**
 * TOTP Setup Response - QR code and backup codes
 */
export interface TOTPSetupResponse {
  secret: string; // Base32 encoded secret
  qrCode: string; // Data URI for QR code image
  backupCodes: string[]; // Array of backup codes
  expiresIn: number; // Seconds until setup expires
}

/**
 * 2FA Verification Request - Code submission
 */
export interface TwoFactorVerificationRequest {
  userId: string;
  code: string; // 6-digit code or backup code
  method?: TwoFactorMethod; // Can specify method or use primary
  rememberDevice?: boolean; // Remember this device for 30 days
  deviceFingerprint?: string; // Browser/device identifier
}

/**
 * 2FA Verification Response
 */
export interface TwoFactorVerificationResponse {
  status: VerificationStatus;
  verified: boolean;
  message: string;
  remainingAttempts?: number;
  nextRetryIn?: number; // Seconds until next attempt allowed
  deviceTrusted?: boolean;
  backupCodesRemaining?: number;
}

/**
 * Device Trust Information
 */
export interface TrustedDevice {
  deviceId: string;
  fingerprint: string;
  name: string; // e.g., "Chrome on MacOS"
  trustedAt: Date;
  expiresAt: Date;
  lastUsedAt: Date;
  ipAddress: string;
  userAgent: string;
}

/**
 * 2FA Settings Update
 */
export interface TwoFactorSettingsUpdate {
  primaryMethod?: TwoFactorMethod;
  backupMethods?: TwoFactorMethod[];
  phoneNumber?: string;
  recoveryEmail?: string;
  removeMethod?: TwoFactorMethod;
}

/**
 * Backup Codes Info
 */
export interface BackupCodesInfo {
  total: number;
  remaining: number;
  lastGeneratedAt: Date;
  lastUsedAt?: Date;
}

/**
 * 2FA Security Event (for audit logging)
 */
export interface TwoFactorSecurityEvent {
  userId: string;
  eventType: 'setup_started' | 'setup_completed' | 'verification_success' | 'verification_failed' | 'backup_code_used' | 'method_removed' | 'backup_codes_regenerated' | 'device_trusted' | 'device_untrusted' | 'disabled' | 'account_locked' | 'webauthn_registered' | 'webauthn_verified' | 'webauthn_removed';
  method?: TwoFactorMethod;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  details?: Record<string, any>;
  severity: 'info' | 'warning' | 'critical';
}

/**
 * 2FA Status Summary (for display)
 */
export interface TwoFactorStatusSummary {
  enabled: boolean;
  status: TwoFactorStatus;
  primaryMethod?: TwoFactorMethod;
  enabledMethods: TwoFactorMethod[];
  backupCodesRemaining: number;
  trustedDevices: number;
  lastVerified?: Date;
  setupProgress?: number; // 0-100 for setup flow
}

/**
 * 2FA Recovery Options
 */
export interface TwoFactorRecoveryOption {
  type: 'backup_code' | 'recovery_email' | 'admin_override';
  description: string;
  available: boolean;
}

/**
 * 2FA Challenge Response (for login flow)
 */
export interface TwoFactorChallenge {
  challengeId: string;
  userId: string;
  createdAt: Date;
  expiresAt: Date;
  availableMethods: TwoFactorMethod[];
  attemptCount: number;
  maxAttempts: number;
}

/**
 * SMS OTP Payload
 */
export interface SMSOTPPayload {
  phoneNumber: string;
  code: string;
  expiresIn: number; // seconds
  attemptCount: number;
}

/**
 * Email OTP Payload
 */
export interface EmailOTPPayload {
  email: string;
  code: string;
  expiresIn: number; // seconds
  attemptCount: number;
  magicLink?: string; // Alternative one-click link
}

/**
 * TOTP Verification Data
 */
export interface TOTPVerificationData {
  secret: string;
  code: string;
  window?: number; // Time window for code validation (default: 1)
}

/**
 * Helper function to generate a backup code
 */
export function generateBackupCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
    if (i === 3) code += '-';
  }
  return code; // Format: XXXX-XXXX
}

/**
 * Generate array of backup codes
 */
export function generateBackupCodes(count: number = 10): string[] {
  return Array.from({ length: count }, () => generateBackupCode());
}

/**
 * Validate backup code format
 */
export function isValidBackupCodeFormat(code: string): boolean {
  return /^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code);
}

/**
 * Validate TOTP code format (6 digits)
 */
export function isValidTOTPCodeFormat(code: string): boolean {
  return /^\d{6}$/.test(code);
}

/**
 * Validate SMS/Email code format (6 digits)
 */
export function isValidOTPCodeFormat(code: string): boolean {
  return /^\d{6}$/.test(code);
}

/**
 * Device fingerprint for trusted device tracking
 */
export function generateDeviceFingerprint(
  userAgent: string,
  language: string,
  timezone: string,
  platform: string
): string {
  const combined = `${userAgent}|${language}|${timezone}|${platform}`;
  // Simple hash (in production, use crypto.subtle.digest)
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `device_${Math.abs(hash).toString(36)}`;
}

/**
 * Convert 2FA method to display name
 */
export function getTwoFactorMethodName(method: TwoFactorMethod): string {
  const names: Record<TwoFactorMethod, string> = {
    totp: 'Authenticator App',
    sms: 'Text Message (SMS)',
    email: 'Email',
    webauthn: 'Security Key (WebAuthn)'
  };
  return names[method];
}

/**
 * Get method icon name for UI display
 */
export function getTwoFactorMethodIcon(method: TwoFactorMethod): string {
  const icons: Record<TwoFactorMethod, string> = {
    totp: 'Smartphone',
    sms: 'MessageSquare',
    email: 'Mail',
    webauthn: 'KeyRound'
  };
  return icons[method];
}

/**
 * Get status color for UI
 */
export function getTwoFactorStatusColor(status: TwoFactorStatus): string {
  const colors: Record<TwoFactorStatus, string> = {
    enabled: 'green',
    pending: 'yellow',
    disabled: 'gray',
    suspended: 'red'
  };
  return colors[status];
}

/**
 * Check if 2FA is active (should enforce verification)
 */
export function isTwoFactorActive(status: TwoFactorStatus): boolean {
  return status === 'enabled' || status === 'pending';
}

/**
 * Mask phone number for display
 */
export function maskPhoneNumber(phoneNumber: string): string {
  const cleaned = phoneNumber.replace(/\D/g, '');
  return `••••••${cleaned.slice(-4)}`;
}

/**
 * Mask email for display
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  const masked = local.substring(0, 2) + '•'.repeat(Math.max(1, local.length - 2));
  return `${masked}@${domain}`;
}

/**
 * Calculate time until 2FA expires (e.g., for setup)
 */
export function getTimeRemaining(expiresAt: Date): number {
  return Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
}

/**
 * Check if code has expired
 */
export function isCodeExpired(expiresAt: Date): boolean {
  return Date.now() > expiresAt.getTime();
}

/**
 * Generate a time-based window for TOTP validation
 * Returns array of valid codes for current time and ±1 interval
 */
export function getTOTPTimeWindows(): number[] {
  const now = Math.floor(Date.now() / 1000);
  const timeStep = 30; // Standard 30-second interval
  return [
    Math.floor((now - timeStep) / timeStep),
    Math.floor(now / timeStep),
    Math.floor((now + timeStep) / timeStep)
  ];
}

/**
 * Constants for 2FA configuration
 */
export const TWO_FACTOR_CONSTANTS = {
  OTP_LENGTH: 6,
  OTP_EXPIRY_SECONDS: 300, // 5 minutes
  TOTP_WINDOW: 1, // ±1 time interval (30 seconds each side)
  BACKUP_CODE_COUNT: 10,
  MAX_VERIFICATION_ATTEMPTS: 5,
  LOCKOUT_DURATION_MINUTES: 15,
  DEVICE_TRUST_DURATION_DAYS: 30,
  TOTP_TIME_STEP: 30, // 30-second intervals
  SMS_DELIVERY_TIMEOUT_SECONDS: 60,
  EMAIL_DELIVERY_TIMEOUT_SECONDS: 120,
  SETUP_TIMEOUT_MINUTES: 10,
  CODE_LENGTH: 6,
  BACKUP_CODE_FORMAT: /^[A-Z0-9]{4}-[A-Z0-9]{4}$/
};

/**
 * WebAuthn Credential - Registered security key information
 */
export interface WebAuthnCredential {
  id: string; // Credential ID (public key)
  rawId: string; // Base64-encoded credential ID
  type: string; // 'public-key'
  deviceName: string; // User-friendly name (e.g., "My YubiKey")
  deviceType?: string; // Detected device type (e.g., "YubiKey", "Touch ID")
  transports?: string[]; // Transport hints (usb, nfc, ble, internal)
  counter: number; // Signature counter for clone detection
  registeredAt: Date;
  lastUsedAt?: Date;
  backedUp: boolean; // Whether this credential is backed up
  backupEligible: boolean; // Whether this credential is eligible for backup
  aaguid?: string; // Authenticator AAGUID for device identification
  publicKey?: string; // Base64-encoded public key (for server-side verification)
}

/**
 * 2FA Settings Defaults
 */
export const TWO_FACTOR_DEFAULTS = {
  primaryMethod: 'totp' as TwoFactorMethod,
  backupMethods: ['email'] as TwoFactorMethod[],
  maxAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 minutes
  setupTimeout: 10 * 60 * 1000, // 10 minutes
  deviceTrustDuration: 30 * 24 * 60 * 60 * 1000, // 30 days
  webauthnTimeout: 120000 // 2 minutes for WebAuthn operations
};
