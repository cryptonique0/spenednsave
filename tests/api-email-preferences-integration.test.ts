import { POST, GET } from '../app/api/email-preferences/route';

const mockRequest = (body: any) => ({ json: async () => body } as any);
const mockGetRequest = (address: string) => ({ url: `http://localhost/api/email-preferences?address=${address}` } as any);

describe('API: /api/email-preferences (integration)', () => {
  it('should save and fetch preferences end-to-end', async () => {
    const req = mockRequest({ address: '0x123', email: 'test@a.com', optIn: true });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const getRes = await GET(mockGetRequest('0x123'));
    expect(getRes.status).toBe(200);
    const json = await getRes.json();
    expect(json.email).toBe('test@a.com');
    expect(json.optIn).toBe(true);
  });
});
