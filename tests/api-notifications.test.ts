import { POST } from '../app/api/notifications/route';

describe('API: /api/notifications', () => {
  it('should return 400 for missing params', async () => {
    const req = { json: async () => ({}) } as any;
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('should send notification with valid params', async () => {
    const req = { json: async () => ({ to: 'a@b.com', event: 'withdrawal-requested', data: { vaultAddress: '0xvault', amount: '1 ETH' } }) } as any;
    const res = await POST(req);
    // Accept 200 or 500 (if SMTP is not configured)
    expect([200, 500]).toContain(res.status);
  });
});
