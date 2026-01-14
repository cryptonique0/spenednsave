import { saveEmailPreference, getEmailPreference } from '../lib/services/email-preferences-db';
import { POST, GET } from '../app/api/email-preferences/route';

const mockRequest = (body: any) => ({ json: async () => body } as any);
const mockGetRequest = (address: string) => ({ url: `http://localhost/api/email-preferences?address=${address}` } as any);

describe('API: /api/email-preferences', () => {
  it('should save preferences via POST', async () => {
    const req = mockRequest({ address: '0xabc', email: 'a@b.com', optIn: true });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(getEmailPreference('0xabc')?.email).toBe('a@b.com');
  });

  it('should fetch preferences via GET', async () => {
    saveEmailPreference({ address: '0xdef', email: 'd@e.com', optIn: false });
    const req = mockGetRequest('0xdef');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.email).toBe('d@e.com');
  });

  it('should return 404 for unknown address', async () => {
    const req = mockGetRequest('0xnotfound');
    const res = await GET(req);
    expect(res.status).toBe(404);
  });
});
