import { composeEmailContent } from '../lib/services/email-notifications';

describe('Email Notification Templates', () => {
  it('should compose withdrawal request email', () => {
    const { subject, html } = composeEmailContent('withdrawal-requested', {
      vaultName: 'TestVault',
      amount: '1 ETH',
      reason: 'Test reason',
    });
    expect(subject).toMatch(/Withdrawal Request Submitted/);
    expect(html).toMatch(/TestVault/);
    expect(html).toMatch(/1 ETH/);
    expect(html).toMatch(/Test reason/);
  });

  it('should compose withdrawal approved email', () => {
    const { subject, html } = composeEmailContent('withdrawal-approved', {
      amount: '2 ETH',
      guardianName: 'Alice',
    });
    expect(subject).toMatch(/Withdrawal Approved/);
    expect(html).toMatch(/2 ETH/);
    expect(html).toMatch(/Alice/);
  });

  it('should compose emergency unlock email', () => {
    const { subject, html } = composeEmailContent('emergency-unlock-requested', {
      vaultName: 'TestVault',
    });
    expect(subject).toMatch(/Emergency Unlock Requested/);
    expect(html).toMatch(/TestVault/);
  });
});
