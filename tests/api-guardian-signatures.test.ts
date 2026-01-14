import { POST as postRequest, GET as getRequests } from '../app/api/guardian-signatures/route';
import { POST as postPref } from '../app/api/email-preferences/route';

const mockRequest = (body: any) => ({ json: async () => body } as any);

describe('API: /api/guardian-signatures', () => {
  it('should create and fetch a pending withdrawal request', async () => {
    // Save email preference for notification
    await postPref(mockRequest({ address: '0xabc', email: 'a@b.com', optIn: true }));
    // Create withdrawal request
    const reqBody = {
      id: 'req1',
      vaultAddress: '0xvault',
      request: { token: '0xtoken', amount: 1n, recipient: '0xrec', nonce: 1n, reason: 'Test' },
      signatures: [],
      requiredQuorum: 2,
      createdAt: Date.now(),
      createdBy: '0xabc',
      status: 'pending',
      guardians: ['0xabc'],
      vaultName: 'TestVault',
    };
    const res = await postRequest(mockRequest(reqBody));
    expect(res.status).toBe(200);
    const saved = await res.json();
    expect(saved.id).toBe('req1');
    // Fetch all
    const getRes = await getRequests();
    expect(getRes.status).toBe(200);
    const all = await getRes.json();
    expect(Array.isArray(all)).toBe(true);
    expect(all.find((r: any) => r.id === 'req1')).toBeDefined();
  });
});
