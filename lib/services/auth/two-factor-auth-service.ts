/**
 * Two-Factor Authentication Service
 * Handles TOTP, SMS, Email verification with backup codes and trusted devices
 */

import {
  TwoFactorConfig,
  TwoFactorMethod,
  TwoFactorStatus,
  TwoFactorSetupRequest,
  TwoFactorVerificationRequest,
  TwoFactorVerificationResponse,
  TOTPSetupResponse,
  TwoFactorStatusSummary,
  TrustedDevice,
  TwoFactorSecurityEvent,
  TwoFactorSettingsUpdate,
  BackupCodesInfo,
  generateBackupCodes,
  isValidBackupCodeFormat,
  isValidTOTPCodeFormat,
  isValidOTPCodeFormat,
  generateDeviceFingerprint,
  maskPhoneNumber,
  maskEmail,
  TWO_FACTOR_CONSTANTS,
  TWO_FACTOR_DEFAULTS,
  TOTPVerificationData
} from './two-factor-auth-types';

/**
 * Two-Factor Authentication Service
 * Production implementation would integrate with:
 * - Database for storing encrypted 2FA configs
 * - SMS provider (Twilio, AWS SNS)
 * - Email service (SendGrid, AWS SES)
 * - TOTP library (speakeasy or similar)
 */
export class TwoFactorAuthService {
  /**
   * Initialize 2FA setup for a user
   * Returns setup data (QR code for TOTP, or sends OTP for SMS/Email)
   */
  static async initializeSetup(
    request: TwoFactorSetupRequest
  ): Promise<TOTPSetupResponse | { sent: boolean; maskedTarget: string }> {
    if (request.method === 'totp') {
      return this.initializeTOTPSetup(request.userId);
    } else if (request.method === 'sms' && request.phoneNumber) {
      return this.initializeSMSSetup(request.userId, request.phoneNumber);
    } else if (request.method === 'email') {
      return this.initializeEmailSetup(request.userId);
    }

    throw new Error('Invalid 2FA method or missing required data');
  }

  /**
   * Initialize TOTP (Time-based One-Time Password) setup
   * Returns secret, QR code, and backup codes
   */
  private static async initializeTOTPSetup(userId: string): Promise<TOTPSetupResponse> {
    // In production: generate using speakeasy
    const secret = this.generateTOTPSecret();
    const backupCodes = generateBackupCodes(TWO_FACTOR_CONSTANTS.BACKUP_CODE_COUNT);
    
    // In production: use qrcode library to generate actual QR code
    const qrCode = this.generateTOTPQRCode(userId, secret);

    return {
      secret,
      qrCode,
      backupCodes,
      expiresIn: TWO_FACTOR_CONSTANTS.SETUP_TIMEOUT_MINUTES * 60
    };
  }

  /**
   * Initialize SMS setup
   * Sends OTP to phone number
   */
  private static async initializeSMSSetup(
    userId: string,
    phoneNumber: string
  ): Promise<{ sent: boolean; maskedTarget: string }> {
    // Validate phone number format
    const cleaned = phoneNumber.replace(/\D/g, '');
    if (cleaned.length < 10) {
      throw new Error('Invalid phone number format');
    }

    // Generate OTP code
    const code = this.generateOTPCode();
    
    // In production: send via SMS provider
    // await this.sendSMSCode(phoneNumber, code);
    
    // Store temporarily for verification (with expiry)
    this.storeTempOTPForVerification(userId, code, TWO_FACTOR_CONSTANTS.OTP_EXPIRY_SECONDS);

    return {
      sent: true,
      maskedTarget: maskPhoneNumber(phoneNumber)
    };
  }

  /**
   * Initialize Email setup
   * Sends OTP to user's email
   */
  private static async initializeEmailSetup(userId: string): Promise<{ sent: boolean; maskedTarget: string }> {
    // Get user email from database (in production)
    const userEmail = 'user@example.com'; // Placeholder

    // Generate OTP code
    const code = this.generateOTPCode();
    
    // In production: send via email service
    // await this.sendEmailCode(userEmail, code);
    
    // Store temporarily for verification
    this.storeTempOTPForVerification(userId, code, TWO_FACTOR_CONSTANTS.OTP_EXPIRY_SECONDS);

    return {
      sent: true,
      maskedTarget: maskEmail(userEmail)
    };
  }

  /**
   * Verify 2FA code during setup or login
   */
  static async verifyCode(
    request: TwoFactorVerificationRequest
  ): Promise<TwoFactorVerificationResponse> {
    // Check if user is locked out due to failed attempts
    const lockoutStatus = await this.checkAccountLockout(request.userId);
    if (lockoutStatus.locked) {
      return {
        status: 'failed',
        verified: false,
        message: `Account locked. Try again in ${lockoutStatus.remainingTime} seconds.`,
        remainingAttempts: 0,
        nextRetryIn: lockoutStatus.remainingTime
      };
    }

    const method = request.method || TWO_FACTOR_DEFAULTS.primaryMethod;

    // Validate code format
    if (method === 'totp' || isValidBackupCodeFormat(request.code)) {
      // TOTP or backup code
      const isValid = await this.validateTOTPOrBackupCode(request.userId, request.code);
      if (isValid) {
        this.recordVerificationSuccess(request.userId, method, request.deviceFingerprint);
        return {
          status: 'success',
          verified: true,
          message: 'Verification successful',
          deviceTrusted: request.rememberDevice ? true : false
        };
      }
    } else if (isValidOTPCodeFormat(request.code)) {
      // SMS or Email OTP
      const isValid = await this.validateOTPCode(request.userId, request.code);
      if (isValid) {
        this.recordVerificationSuccess(request.userId, method, request.deviceFingerprint);
        return {
          status: 'success',
          verified: true,
          message: 'Verification successful',
          deviceTrusted: request.rememberDevice ? true : false
        };
      }
    }

    // Invalid code
    const remainingAttempts = await this.recordFailedAttempt(request.userId);
    return {
      status: 'failed',
      verified: false,
      message: 'Invalid verification code',
      remainingAttempts: Math.max(0, remainingAttempts),
      nextRetryIn: 0
    };
  }

  /**
   * Complete 2FA setup after verification
   * Creates the 2FA config and stores it
   */
  static async completeSetup(
    userId: string,
    method: TwoFactorMethod,
    backupCodes: string[]
  ): Promise<TwoFactorConfig> {
    const config: TwoFactorConfig = {
      userId,
      status: 'enabled',
      enabledMethods: [method],
      primaryMethod: method,
      backupMethods: method === 'totp' ? ['email'] : ['totp'],
      totpBackupCodes: backupCodes, // In production: hash these
      emailAddress: '', // Get from user record
      createdAt: new Date(),
      enabledAt: new Date(),
      failedAttempts: 0
    };

    // In production: encrypt and store in database
    // await db.twoFactorConfigs.create(config);
    
    this.logSecurityEvent({
      userId,
      eventType: 'setup_completed',
      method,
      timestamp: new Date(),
      ipAddress: '0.0.0.0', // Get from request
      userAgent: '', // Get from request
      severity: 'critical'
    });

    return config;
  }

  /**
   * Disable 2FA for a user
   * Requires current password verification
   */
  static async disable2FA(userId: string): Promise<void> {
    // In production: verify password/session before allowing
    
    this.logSecurityEvent({
      userId,
      eventType: 'disabled',
      timestamp: new Date(),
      ipAddress: '0.0.0.0',
      userAgent: '',
      severity: 'critical'
    });

    // In production: update database to disable 2FA
  }

  /**
   * Get 2FA status summary for display
   */
  static async getStatusSummary(userId: string): Promise<TwoFactorStatusSummary> {
    // In production: fetch from database
    return {
      enabled: false,
      status: 'disabled',
      enabledMethods: [],
      backupCodesRemaining: 0,
      trustedDevices: 0
    };
  }

  /**
   * Regenerate backup codes
   * Old codes become invalid
   */
  static async regenerateBackupCodes(userId: string): Promise<string[]> {
    const newCodes = generateBackupCodes(TWO_FACTOR_CONSTANTS.BACKUP_CODE_COUNT);
    
    this.logSecurityEvent({
      userId,
      eventType: 'backup_codes_regenerated',
      timestamp: new Date(),
      ipAddress: '0.0.0.0',
      userAgent: '',
      severity: 'info'
    });

    // In production: update database with hashed codes
    return newCodes;
  }

  /**
   * Add a trusted device
   * Device won't require 2FA for specified duration
   */
  static async trustDevice(
    userId: string,
    deviceFingerprint: string,
    deviceName: string,
    ipAddress: string,
    userAgent: string
  ): Promise<TrustedDevice> {
    const trustedDevice: TrustedDevice = {
      deviceId: `device_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      fingerprint: deviceFingerprint,
      name: deviceName,
      trustedAt: new Date(),
      expiresAt: new Date(
        Date.now() + TWO_FACTOR_DEFAULTS.deviceTrustDuration
      ),
      lastUsedAt: new Date(),
      ipAddress,
      userAgent
    };

    // In production: store in database
    
    this.logSecurityEvent({
      userId,
      eventType: 'device_trusted',
      timestamp: new Date(),
      ipAddress,
      userAgent,
      details: { deviceName, fingerprint: deviceFingerprint },
      severity: 'info'
    });

    return trustedDevice;
  }

  /**
   * Remove a trusted device
   */
  static async removeTrustedDevice(userId: string, deviceId: string): Promise<void> {
    // In production: delete from database
    
    this.logSecurityEvent({
      userId,
      eventType: 'device_untrusted',
      timestamp: new Date(),
      ipAddress: '0.0.0.0',
      userAgent: '',
      details: { deviceId },
      severity: 'info'
    });
  }

  /**
   * Get all trusted devices for user
   */
  static async getTrustedDevices(userId: string): Promise<TrustedDevice[]> {
    // In production: fetch from database
    return [];
  }

  /**
   * Update 2FA settings
   */
  static async updateSettings(
    userId: string,
    updates: TwoFactorSettingsUpdate
  ): Promise<TwoFactorConfig> {
    // In production: validate and update in database
    const config = await this.getConfig(userId);
    
    if (updates.primaryMethod) {
      config.primaryMethod = updates.primaryMethod;
    }
    if (updates.backupMethods) {
      config.backupMethods = updates.backupMethods;
    }

    return config;
  }

  /**
   * Get backup codes info
   */
  static async getBackupCodesInfo(userId: string): Promise<BackupCodesInfo> {
    // In production: fetch from database and count
    return {
      total: TWO_FACTOR_CONSTANTS.BACKUP_CODE_COUNT,
      remaining: 0,
      lastGeneratedAt: new Date()
    };
  }

  /**
   * ==========================================
   * HELPER METHODS
   * ==========================================
   */

  /**
   * Generate a TOTP secret (base32 encoded)
   */
  private static generateTOTPSecret(): string {
    // In production: use speakeasy.generateSecret()
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
  }

  /**
   * Generate QR code for TOTP
   */
  private static generateTOTPQRCode(userId: string, secret: string): string {
    // In production: use qrcode library
    // Format: otpauth://totp/appname:username?secret=...&issuer=...
    const appName = 'Spend & Save';
    const otpauthUrl = `otpauth://totp/${appName}:${userId}?secret=${secret}&issuer=${appName}`;
    
    // Return data URI (in production: generate actual QR code)
    return `data:image/png;base64,...${btoa(otpauthUrl)}`;
  }

  /**
   * Generate random 6-digit OTP code
   */
  private static generateOTPCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Store temporary OTP for verification
   */
  private static storeTempOTPForVerification(
    userId: string,
    code: string,
    expirySeconds: number
  ): void {
    // In production: store in Redis or cache with TTL
    // cache.set(`otp:${userId}`, code, expirySeconds);
  }

  /**
   * Validate TOTP code or backup code
   */
  private static async validateTOTPOrBackupCode(userId: string, code: string): Promise<boolean> {
    // In production: retrieve config from database
    // If backup code: check against hashed backup codes, mark as used
    // If TOTP: validate against current TOTP window
    return true;
  }

  /**
   * Validate OTP code (SMS/Email)
   */
  private static async validateOTPCode(userId: string, code: string): Promise<boolean> {
    // In production: retrieve temporary OTP from cache
    // Compare and ensure not expired
    return true;
  }

  /**
   * Check if account is locked due to failed attempts
   */
  private static async checkAccountLockout(
    userId: string
  ): Promise<{ locked: boolean; remainingTime: number }> {
    // In production: check in database/cache
    return { locked: false, remainingTime: 0 };
  }

  /**
   * Record failed verification attempt
   */
  private static async recordFailedAttempt(userId: string): Promise<number> {
    // In production: increment counter in database
    // If exceeds max attempts: lock account for duration
    return TWO_FACTOR_CONSTANTS.MAX_VERIFICATION_ATTEMPTS - 1;
  }

  /**
   * Record successful verification
   */
  private static recordVerificationSuccess(
    userId: string,
    method: TwoFactorMethod,
    deviceFingerprint?: string
  ): void {
    // In production: update lastVerifiedAt in database
    // Reset failed attempts counter
    this.logSecurityEvent({
      userId,
      eventType: 'verification_success',
      method,
      timestamp: new Date(),
      ipAddress: '0.0.0.0',
      userAgent: '',
      severity: 'info'
    });
  }

  /**
   * Get 2FA config for user
   */
  private static async getConfig(userId: string): Promise<TwoFactorConfig> {
    // In production: fetch from database
    return {
      userId,
      status: 'disabled',
      enabledMethods: [],
      primaryMethod: 'totp',
      backupMethods: [],
      totpBackupCodes: [],
      emailAddress: '',
      createdAt: new Date(),
      failedAttempts: 0
    };
  }

  /**
   * Log security event for audit trail
   */
  private static logSecurityEvent(event: TwoFactorSecurityEvent): void {
    // In production: store in audit log database
    console.log('[2FA Security Event]', event.eventType, {
      userId: event.userId,
      method: event.method,
      severity: event.severity
    });
  }

  /**
   * ==========================================
   * UTILITY METHODS
   * ==========================================
   */

  /**
   * Get setup steps for 2FA configuration
   */
  static getSetupSteps(method: TwoFactorMethod): Array<{
    step: number;
    title: string;
    description: string;
    time: string;
  }> {
    const steps: Record<
      TwoFactorMethod,
      Array<{ step: number; title: string; description: string; time: string }>
    > = {
      totp: [
        {
          step: 1,
          title: 'Download Authenticator App',
          description: 'Install Google Authenticator, Authy, or Microsoft Authenticator',
          time: '2 min'
        },
        {
          step: 2,
          title: 'Scan QR Code',
          description: 'Open app and scan the QR code displayed on this screen',
          time: '1 min'
        },
        {
          step: 3,
          title: 'Enter Verification Code',
          description: 'Enter the 6-digit code from your authenticator app',
          time: '1 min'
        },
        {
          step: 4,
          title: 'Save Backup Codes',
          description: 'Download and securely store your backup codes',
          time: '2 min'
        }
      ],
      sms: [
        {
          step: 1,
          title: 'Enter Phone Number',
          description: 'Provide the phone number where you want to receive SMS codes',
          time: '1 min'
        },
        {
          step: 2,
          title: 'Receive Verification Code',
          description: 'A 6-digit code will be sent to your phone',
          time: '1 min'
        },
        {
          step: 3,
          title: 'Enter Code',
          description: 'Enter the code you received in your SMS message',
          time: '1 min'
        }
      ],
      email: [
        {
          step: 1,
          title: 'Confirm Email',
          description: 'We will send a verification code to your email address',
          time: '1 min'
        },
        {
          step: 2,
          title: 'Receive Code',
          description: 'Check your email for a 6-digit verification code',
          time: '2 min'
        },
        {
          step: 3,
          title: 'Enter Code',
          description: 'Enter the code from your email',
          time: '1 min'
        }
      ]
    };

    return steps[method];
  }

  /**
   * Get recommended 2FA methods based on security level
   */
  static getRecommendedMethods(securityLevel: 'low' | 'medium' | 'high'): TwoFactorMethod[] {
    const recommendations: Record<string, TwoFactorMethod[]> = {
      low: ['email'],
      medium: ['totp', 'email'],
      high: ['totp', 'sms']
    };
    return recommendations[securityLevel] || ['totp'];
  }

  /**
   * Get 2FA best practices
   */
  static getBestPractices(): string[] {
    return [
      'Enable 2FA on all accounts with access to sensitive data',
      'Use authenticator apps (TOTP) instead of SMS when possible - they are more secure',
      'Store backup codes in a secure location (not in email or cloud)',
      'Regularly review trusted devices and remove old ones',
      'Use a strong, unique password in addition to 2FA',
      'Never share your 2FA codes with anyone, including support staff',
      'Update your recovery email and phone number regularly',
      'Consider hardware security keys for high-security accounts',
      'Enable 2FA reminders during high-value transactions',
      'Review 2FA logs and security events regularly'
    ];
  }

  /**
   * Initialize WebAuthn (FIDO2) security key setup
   * Returns registration challenge for browser API
   */
  static async initializeWebAuthnSetup(
    userId: string,
    userName: string,
    userDisplayName: string
  ): Promise<{ challenge: string; expiresIn: number }> {
    // Generate cryptographically random challenge
    const challenge = this.generateWebAuthnChallenge();

    // Store temporarily for verification (with expiry)
    this.storeTempWebAuthnChallenge(userId, challenge, TWO_FACTOR_DEFAULTS.webauthnTimeout / 1000);

    return {
      challenge,
      expiresIn: TWO_FACTOR_DEFAULTS.webauthnTimeout
    };
  }

  /**
   * Complete WebAuthn credential registration
   */
  static async completeWebAuthnRegistration(
    userId: string,
    credentialId: string,
    publicKey: string,
    deviceName: string,
    transports?: string[]
  ): Promise<{ success: boolean; credentialId: string }> {
    // In production: verify credential format and store in database
    // - Verify attestation (if needed)
    // - Store public key securely
    // - Hash credential ID for fast lookup
    // - Encrypt sensitive data

    // Record security event
    this.logSecurityEvent({
      userId,
      eventType: 'webauthn_registered',
      method: 'webauthn',
      timestamp: new Date(),
      ipAddress: '', // Would come from request context
      userAgent: '', // Would come from request context
      details: { deviceName, transports },
      severity: 'info'
    });

    return {
      success: true,
      credentialId
    };
  }

  /**
   * Get registered WebAuthn credentials for a user
   */
  static async getWebAuthnCredentials(userId: string): Promise<Array<{
    id: string;
    deviceName: string;
    registeredAt: Date;
    lastUsedAt?: Date;
  }>> {
    // In production: fetch from database
    return [];
  }

  /**
   * Remove a WebAuthn credential
   */
  static async removeWebAuthnCredential(userId: string, credentialId: string): Promise<void> {
    // In production: remove from database
    
    this.logSecurityEvent({
      userId,
      eventType: 'webauthn_removed',
      method: 'webauthn',
      timestamp: new Date(),
      ipAddress: '',
      userAgent: '',
      details: { credentialId },
      severity: 'info'
    });
  }

  /**
   * Generate WebAuthn challenge
   */
  private static generateWebAuthnChallenge(): string {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Store temporary WebAuthn challenge
   */
  private static storeTempWebAuthnChallenge(
    userId: string,
    challenge: string,
    expirySeconds: number
  ): void {
    // In production: store in session/cache with TTL
    // sessionStorage.setItem(`webauthn_challenge_${userId}`, JSON.stringify({
    //   challenge,
    //   expiresAt: Date.now() + (expirySeconds * 1000)
    // }));
  }
}

export default TwoFactorAuthService;
