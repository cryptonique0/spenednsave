import { saveEmailPreference, getEmailPreference } from '../lib/services/email-preferences-db';

describe('Email Preferences DB', () => {
  it('should save and retrieve preferences', () => {
    saveEmailPreference({ address: '0xabc', email: 'a@b.com', optIn: true });
    const pref = getEmailPreference('0xabc');
    expect(pref).toBeDefined();
    expect(pref?.email).toBe('a@b.com');
    expect(pref?.optIn).toBe(true);
  });

  it('should update preferences', () => {
    saveEmailPreference({ address: '0xabc', email: 'c@d.com', optIn: false });
    const pref = getEmailPreference('0xabc');
    expect(pref?.email).toBe('c@d.com');
    expect(pref?.optIn).toBe(false);
  });

  it('should return undefined for unknown address', () => {
    const pref = getEmailPreference('0xdef');
    expect(pref).toBeUndefined();
  });
});
