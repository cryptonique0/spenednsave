// Simple in-memory (or file-based) email preferences DB for demo
// In production, use a real DB and authentication

export interface EmailPreference {
  address: string; // user wallet address
  email: string;
  optIn: boolean;
}

const emailPrefs: EmailPreference[] = [];

export function saveEmailPreference(pref: EmailPreference) {
  const idx = emailPrefs.findIndex(p => p.address === pref.address);
  if (idx >= 0) emailPrefs[idx] = pref;
  else emailPrefs.push(pref);
}

export function getEmailPreference(address: string): EmailPreference | undefined {
  return emailPrefs.find(p => p.address === address);
}
