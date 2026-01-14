import { PUT, GET } from '../app/api/guardian-signatures/[id]/route';
import { POST as postRequest } from '../app/api/guardian-signatures/route';

const mockRequest = (body: any) => ({ json: async () => body } as any);
const mockContext = (id: string) => ({ params: { id } });

describe('API: /api/guardian-signatures/[id]', () => {
  beforeEach(async () => {
    // Create a request to update
    await postRequest(mockRequest({
      id: 'req2',
      vaultAddress: '0xvault',
      request: { token: '0xtoken', amount: 2n, recipient: '0xrec', nonce: 2n, reason: 'Test2' },
      signatures: [],
      requiredQuorum: 2,
      createdAt: Date.now(),
      createdBy: '0xabc',
      status: 'pending',
      guardians: ['0xabc'],
      vaultName: 'TestVault2',
    }));
  });

  it('should update a withdrawal request and trigger notification', async () => {
    const putRes = await PUT(mockRequest({ status: 'approved' }), mockContext('req2'));
    expect(putRes.status).toBe(200);
    const updated = await putRes.json();
    expect(updated.status).toBe('approved');
  });

  it('should fetch a withdrawal request by id', async () => {
    const getRes = await GET({} as any, mockContext('req2'));
    expect(getRes.status).toBe(200);
    const req = await getRes.json();
    expect(req.id).toBe('req2');
  });
});
