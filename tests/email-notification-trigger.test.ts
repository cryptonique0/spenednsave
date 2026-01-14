import { notifyUsersOnWithdrawalEvent } from '../lib/services/email-notification-trigger';
import { saveEmailPreference } from '../lib/services/email-preferences-db';

// Mock sendNotification to capture calls
jest.mock('../lib/services/email-notifications', () => ({
  sendNotification: jest.fn(),
  composeEmail: (event: string, data: any) => ({ subject: `Subject: ${event}`, html: `HTML: ${JSON.stringify(data)}` })
}));

describe('notifyUsersOnWithdrawalEvent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    saveEmailPreference({ address: '0xabc', email: 'a@b.com', optIn: true });
    saveEmailPreference({ address: '0xdef', email: 'd@e.com', optIn: false });
  });

  it('should notify only opted-in users', async () => {
    await notifyUsersOnWithdrawalEvent({
      event: 'withdrawal-requested',
      vaultAddress: '0xvault',
      amount: '1 ETH',
      involvedAddresses: ['0xabc', '0xdef'],
    });
    const { sendNotification } = require('../lib/services/email-notifications');
    expect(sendNotification).toHaveBeenCalledTimes(1);
    expect(sendNotification).toHaveBeenCalledWith(expect.objectContaining({ to: 'a@b.com' }));
  });
});
