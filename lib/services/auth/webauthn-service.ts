/**
 * WebAuthn/FIDO2 Service
 * Handles security key registration and verification using WebAuthn API
 * Supports YubiKey, Windows Hello, Touch ID, and other FIDO2 devices
 */

/**
 * Convert ArrayBuffer to Base64 string
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert Base64 string to ArrayBuffer
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Check if browser supports WebAuthn
 */
export function isWebAuthnSupported(): boolean {
  return (
    !!window.PublicKeyCredential &&
    !!navigator.credentials &&
    typeof navigator.credentials.create === 'function' &&
    typeof navigator.credentials.get === 'function'
  );
}

/**
 * Check if device supports resident keys (passwordless)
 */
export async function isResidentKeySupported(): Promise<boolean> {
  if (!isWebAuthnSupported()) return false;
  
  try {
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return available;
  } catch {
    return false;
  }
}

/**
 * Check if conditional UI is supported (autofill)
 */
export async function isConditionalUISupported(): Promise<boolean> {
  if (!isWebAuthnSupported()) return false;
  
  try {
    const available = await (PublicKeyCredential as any).isConditionalMediationAvailable?.();
    return !!available;
  } catch {
    return false;
  }
}

/**
 * Generate registration options for a new security key
 */
export function generateRegistrationOptions(
  userId: string,
  userName: string,
  userDisplayName: string,
  challenge?: ArrayBuffer
): PublicKeyCredentialCreationOptions {
  // Use provided challenge or generate random one
  const challengeBuffer = challenge || crypto.getRandomValues(new Uint8Array(32));
  
  return {
    challenge: challengeBuffer,
    rp: {
      id: typeof window !== 'undefined' ? window.location.hostname : 'localhost',
      name: 'SpendVault',
      icon: 'https://example.com/logo.png', // Update with actual logo URL
    },
    user: {
      id: new TextEncoder().encode(userId),
      name: userName,
      displayName: userDisplayName,
    },
    pubKeyCredParams: [
      { alg: -7, type: 'public-key' }, // ES256
      { alg: -257, type: 'public-key' }, // RS256
      { alg: -8, type: 'public-key' }, // EdDSA
    ],
    timeout: 120000, // 2 minutes
    attestation: 'none', // Can be 'none', 'indirect', or 'direct'
    authenticatorSelection: {
      authenticatorAttachment: 'cross-platform', // Security keys (can also be 'platform' for Touch ID/Windows Hello)
      residentKey: 'preferred',
      userVerification: 'preferred',
    },
  };
}

/**
 * Generate authentication options for security key verification
 */
export function generateAuthenticationOptions(
  userIds?: string[],
  challenge?: ArrayBuffer
): PublicKeyCredentialRequestOptions {
  const challengeBuffer = challenge || crypto.getRandomValues(new Uint8Array(32));
  
  return {
    challenge: challengeBuffer,
    timeout: 120000, // 2 minutes
    userVerification: 'preferred',
    rpId: typeof window !== 'undefined' ? window.location.hostname : 'localhost',
  };
}

/**
 * Register a new security key
 * Returns credential data to be stored on server
 */
export async function registerSecurityKey(
  options: PublicKeyCredentialCreationOptions,
  deviceName: string
): Promise<{
  id: string;
  rawId: string;
  type: string;
  response: {
    clientDataJSON: string;
    attestationObject: string;
    transports?: AuthenticatorTransport[];
  };
  deviceName: string;
  registeredAt: string;
}> {
  if (!isWebAuthnSupported()) {
    throw new Error('WebAuthn is not supported on this device');
  }

  try {
    const credential = (await navigator.credentials.create({
      publicKey: options,
    })) as PublicKeyCredential | null;

    if (!credential) {
      throw new Error('Failed to create credential - user may have cancelled');
    }

    const response = credential.response as AuthenticatorAttestationResponse;

    return {
      id: credential.id,
      rawId: arrayBufferToBase64(credential.rawId),
      type: credential.type,
      response: {
        clientDataJSON: arrayBufferToBase64(response.clientDataJSON),
        attestationObject: arrayBufferToBase64(response.attestationObject),
        transports: response.getTransports?.() || [],
      },
      deviceName,
      registeredAt: new Date().toISOString(),
    };
  } catch (error: any) {
    if (error.name === 'NotAllowedError') {
      throw new Error('Registration was cancelled or not allowed');
    }
    if (error.name === 'InvalidStateError') {
      throw new Error('This security key is already registered');
    }
    if (error.name === 'SecurityError') {
      throw new Error('Security error - ensure you are using HTTPS');
    }
    throw error;
  }
}

/**
 * Verify a security key assertion
 * Used during authentication
 */
export async function verifySecurityKeyAssertion(
  options: PublicKeyCredentialRequestOptions,
  credentialIds?: string[]
): Promise<{
  id: string;
  rawId: string;
  type: string;
  response: {
    clientDataJSON: string;
    authenticatorData: string;
    signature: string;
    userHandle: string;
  };
}> {
  if (!isWebAuthnSupported()) {
    throw new Error('WebAuthn is not supported on this device');
  }

  try {
    // If we have credential IDs, use them to hint which keys to allow
    const optionsWithAllowCredentials = credentialIds
      ? {
          ...options,
          allowCredentials: credentialIds.map((id) => ({
            type: 'public-key' as const,
            id: base64ToArrayBuffer(id),
            transports: ['usb', 'nfc', 'ble', 'internal'] as AuthenticatorTransport[],
          })),
        }
      : options;

    const assertion = (await navigator.credentials.get({
      publicKey: optionsWithAllowCredentials,
    })) as PublicKeyCredential | null;

    if (!assertion) {
      throw new Error('Failed to verify security key - user may have cancelled');
    }

    const response = assertion.response as AuthenticatorAssertionResponse;

    return {
      id: assertion.id,
      rawId: arrayBufferToBase64(assertion.rawId),
      type: assertion.type,
      response: {
        clientDataJSON: arrayBufferToBase64(response.clientDataJSON),
        authenticatorData: arrayBufferToBase64(response.authenticatorData),
        signature: arrayBufferToBase64(response.signature),
        userHandle: response.userHandle ? arrayBufferToBase64(response.userHandle) : '',
      },
    };
  } catch (error: any) {
    if (error.name === 'NotAllowedError') {
      throw new Error('Verification was cancelled or no matching security key found');
    }
    if (error.name === 'SecurityError') {
      throw new Error('Security error - ensure you are using HTTPS');
    }
    if (error.name === 'TimeoutError') {
      throw new Error('Verification timed out - please try again');
    }
    throw error;
  }
}

/**
 * Get device type from authenticator
 * Used for display purposes
 */
export function getDeviceType(credential: {
  transports?: AuthenticatorTransport[];
  deviceName?: string;
}): string {
  const transports = credential.transports || [];
  const deviceName = credential.deviceName || '';

  // Check device name first
  if (deviceName.toLowerCase().includes('yubikey')) return 'YubiKey';
  if (deviceName.toLowerCase().includes('touch id')) return 'Touch ID';
  if (deviceName.toLowerCase().includes('face id')) return 'Face ID';
  if (deviceName.toLowerCase().includes('windows hello')) return 'Windows Hello';
  if (deviceName.toLowerCase().includes('fingerprint')) return 'Fingerprint Reader';

  // Check transports
  if (transports.length === 0) return 'Security Key';
  if (transports.includes('usb')) return 'Security Key (USB)';
  if (transports.includes('nfc')) return 'Security Key (NFC)';
  if (transports.includes('ble')) return 'Security Key (Bluetooth)';
  if (transports.includes('internal')) return 'Built-in Authenticator';

  return 'Security Key';
}

/**
 * Get device icon based on type
 */
export function getDeviceIcon(
  credential: { transports?: AuthenticatorTransport[]; deviceName?: string } | string
): string {
  const deviceType = typeof credential === 'string' 
    ? credential 
    : getDeviceType(credential);

  switch (deviceType) {
    case 'YubiKey':
      return '🔐'; // Security key emoji
    case 'Touch ID':
      return '👆'; // Fingerprint
    case 'Face ID':
      return '👁️'; // Face
    case 'Windows Hello':
      return '🪟'; // Windows
    case 'Fingerprint Reader':
      return '👆';
    case 'Built-in Authenticator':
      return '📱'; // Phone
    default:
      return '🔑'; // Generic key
  }
}

/**
 * Get browser support status
 */
export async function getBrowserSupportInfo() {
  const isSupported = isWebAuthnSupported();
  const hasResidentKey = isSupported ? await isResidentKeySupported() : false;
  const hasConditionalUI = isSupported ? await isConditionalUISupported() : false;

  return {
    isSupported,
    hasResidentKey,
    hasConditionalUI,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
  };
}

/**
 * List of supported devices
 */
export const SUPPORTED_DEVICES = [
  {
    name: 'YubiKey 5',
    manufacturer: 'Yubico',
    features: ['USB-C', 'USB-A', 'NFC', 'Lightning'],
    icon: '🔐',
  },
  {
    name: 'YubiKey Bio',
    manufacturer: 'Yubico',
    features: ['USB-C', 'Fingerprint'],
    icon: '👆',
  },
  {
    name: 'Titan Security Key',
    manufacturer: 'Google',
    features: ['USB-C', 'NFC'],
    icon: '🔐',
  },
  {
    name: 'Ledger Nano X',
    manufacturer: 'Ledger',
    features: ['USB-C', 'Bluetooth', 'Cryptocurrency'],
    icon: '💰',
  },
  {
    name: 'Windows Hello',
    manufacturer: 'Microsoft',
    features: ['Facial Recognition', 'Built-in'],
    icon: '👁️',
  },
  {
    name: 'Touch ID',
    manufacturer: 'Apple',
    features: ['Fingerprint', 'Built-in'],
    icon: '👆',
  },
  {
    name: 'Face ID',
    manufacturer: 'Apple',
    features: ['Facial Recognition', 'Built-in'],
    icon: '👁️',
  },
  {
    name: 'Android Biometric',
    manufacturer: 'Google',
    features: ['Fingerprint', 'Facial Recognition', 'Built-in'],
    icon: '📱',
  },
];

/**
 * Best practices for WebAuthn/FIDO2
 */
export const WEBAUTHN_BEST_PRACTICES = [
  'Register multiple security keys as backup (at least 2 keys)',
  'Store backup keys in a secure location separate from primary key',
  'Label each security key with its purpose and location',
  'Test your security key regularly to ensure it still works',
  'Keep your device firmware updated for security patches',
  'Use PIN protection on your security key for physical security',
  'Enable passwordless sign-in for maximum convenience',
  'Do not share your security keys with anyone',
  'Have a recovery method in case you lose your keys (backup codes)',
  'Consider platform authenticators (Touch ID, Windows Hello) as primary, security keys as backup',
];

/**
 * WebAuthn error messages for user-friendly display
 */
export const WEBAUTHN_ERROR_MESSAGES: Record<string, string> = {
  NotAllowedError: 'Verification was cancelled or no matching security key was found. Please try again.',
  InvalidStateError: 'This security key is already registered. Please use a different key.',
  SecurityError: 'Security error detected. Please ensure you are using HTTPS.',
  NotSupportedError: 'Your browser or device does not support security keys.',
  UnknownError: 'An unknown error occurred. Please try again.',
  TimeoutError: 'Verification timed out. Please try again.',
  AbortError: 'The operation was cancelled.',
  NetworkError: 'A network error occurred. Please check your connection.',
  NotReadableError: 'Could not read the security key. Please try again.',
};
