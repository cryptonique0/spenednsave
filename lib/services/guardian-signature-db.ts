import path from 'path';
import crypto from 'crypto';

// `better-sqlite3` is a native, server-only module. Avoid static imports so the
// Next/Turbopack client bundler doesn't try to resolve it. Require at runtime
// when running on the server.
let Database: any = null;
try {
  if (typeof window === 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    Database = require('better-sqlite3');
  }
} catch (e) {
  // Leave Database as null; code will throw at runtime if DB is required but
  // the native module isn't available.
  Database = null;
}
import { type PendingWithdrawalRequest, type SignedWithdrawal } from '@/lib/types/guardian-signatures';
import { type Address, type Hex } from 'viem';

const dbPath = path.resolve(process.cwd(), 'guardian_signatures.sqlite');
if (!Database) {
  // If Database isn't available at module import time, export stub methods
  // that will throw when used. This prevents build-time resolution errors.
  throw new Error('better-sqlite3 module is not available. Ensure it is installed and available on the server.');
}

const db = new Database(dbPath);

// Encryption helpers — AES-256-GCM
function getEncryptionKey(): Buffer {
  const raw = process.env.DB_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error('DB_ENCRYPTION_KEY not set — cannot perform encrypted DB operations');
  }
  // Derive 32-byte key from provided secret
  return crypto.createHash('sha256').update(String(raw)).digest();
}

function encryptString(plain: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(Buffer.from(plain, 'utf8')), cipher.final()]);
  const tag = cipher.getAuthTag();
  return JSON.stringify({ iv: iv.toString('base64'), tag: tag.toString('base64'), data: ciphertext.toString('base64') });
}

function decryptString(payload: string): string {
  // payload is expected to be a JSON string produced by encryptString
  let parsed: any;
  try {
    parsed = JSON.parse(payload);
  } catch (e) {
    // Not JSON — assume plaintext
    return payload;
  }

  if (!parsed || !parsed.iv || !parsed.tag || !parsed.data) {
    // Not an encrypted payload — return as-is (string)
    return payload;
  }

  const key = getEncryptionKey();
  const iv = Buffer.from(parsed.iv, 'base64');
  const tag = Buffer.from(parsed.tag, 'base64');
  const data = Buffer.from(parsed.data, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted.toString('utf8');
}

// Initialize tables if not exist
const init = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS pending_requests (
      id TEXT PRIMARY KEY,
      vaultAddress TEXT,
      request TEXT,
      signatures TEXT,
      requiredQuorum INTEGER,
      status TEXT,
      createdAt INTEGER,
      executedAt INTEGER,
      executionTxHash TEXT
    );
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS account_activities (
      id TEXT PRIMARY KEY,
      account TEXT,
      type TEXT,
      details TEXT,
      relatedRequestId TEXT,
      timestamp INTEGER
    );
  `);
};

init();

export class GuardianSignatureDB {
  static savePendingRequest(request: PendingWithdrawalRequest) {
    // Serialize BigInt fields (amount, nonce) inside request and inside signatures
    const serializableRequest = {
      ...request.request,
      amount: request.request.amount.toString(),
      nonce: request.request.nonce.toString(),
    };

    const serializableSignatures = request.signatures.map((s: SignedWithdrawal) => ({
      ...s,
      request: {
        ...s.request,
        amount: s.request.amount.toString(),
        nonce: s.request.nonce.toString(),
      },
    }));

    // Encrypt blobs before storing
    const encRequest = encryptString(JSON.stringify(serializableRequest));
    const encSignatures = encryptString(JSON.stringify(serializableSignatures));

    db.prepare(`REPLACE INTO pending_requests (id, vaultAddress, request, signatures, requiredQuorum, status, createdAt, executedAt, executionTxHash) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(
        request.id,
        request.vaultAddress,
        encRequest,
        encSignatures,
        request.requiredQuorum,
        request.status,
        request.createdAt,
        request.executedAt ?? null,
        request.executionTxHash ?? null
      );
  }

  static getPendingRequests(): PendingWithdrawalRequest[] {
    const rows = db.prepare('SELECT * FROM pending_requests').all();
    return rows.map((row: any) => ({
      ...row,
      request: (() => {
        try {
          // Try decrypting first (handles both encrypted and plaintext payloads)
          const decrypted = decryptString(row.request);
          const req = JSON.parse(decrypted);
          return {
            ...req,
            amount: BigInt(req.amount),
            nonce: BigInt(req.nonce),
          };
        } catch (e) {
          // Fallback: attempt to parse raw
          const req = JSON.parse(row.request);
          return {
            ...req,
            amount: BigInt(req.amount),
            nonce: BigInt(req.nonce),
          };
        }
      })(),
      signatures: (() => {
        try {
          const decrypted = decryptString(row.signatures);
          const sigs = JSON.parse(decrypted);
          return sigs.map((s: any) => ({
            ...s,
            request: {
              ...s.request,
              amount: BigInt(s.request.amount),
              nonce: BigInt(s.request.nonce),
            },
          }));
        } catch (e) {
          try {
            const sigs = JSON.parse(row.signatures);
            return sigs.map((s: any) => ({
              ...s,
              request: {
                ...s.request,
                amount: BigInt(s.request.amount),
                nonce: BigInt(s.request.nonce),
              },
            }));
          } catch (e2) {
            return [];
          }
        }
      })(),
      requiredQuorum: row.requiredQuorum,
      status: row.status,
      createdAt: row.createdAt,
      executedAt: row.executedAt,
      executionTxHash: row.executionTxHash,
    }));
  }

  static getPendingRequest(id: string): PendingWithdrawalRequest | null {
    const row = db.prepare('SELECT * FROM pending_requests WHERE id = ?').get(id);
    if (!row) return null;
    return {
      ...row,
      request: (() => {
        try {
          // Try decrypting first (handles both encrypted and plaintext payloads)
          const decrypted = decryptString(row.request);
          const req = JSON.parse(decrypted);
          return {
            ...req,
            amount: BigInt(req.amount),
            nonce: BigInt(req.nonce),
          };
        } catch (e) {
          const req = JSON.parse(row.request);
          return {
            ...req,
            amount: BigInt(req.amount),
            nonce: BigInt(req.nonce),
          };
        }
      })(),
      signatures: (() => {
        try {
          const decrypted = decryptString(row.signatures);
          const sigs = JSON.parse(decrypted);
          return sigs.map((s: any) => ({
            ...s,
            request: {
              ...s.request,
              amount: BigInt(s.request.amount),
              nonce: BigInt(s.request.nonce),
            },
          }));
        } catch (e) {
          try {
            const sigs = JSON.parse(row.signatures);
            return sigs.map((s: any) => ({
              ...s,
              request: {
                ...s.request,
                amount: BigInt(s.request.amount),
                nonce: BigInt(s.request.nonce),
              },
            }));
          } catch (e2) {
            return [];
          }
        }
      })(),
      requiredQuorum: row.requiredQuorum,
      status: row.status,
      createdAt: row.createdAt,
      executedAt: row.executedAt,
      executionTxHash: row.executionTxHash,
    };
  }

  static deletePendingRequest(id: string) {
    db.prepare('DELETE FROM pending_requests WHERE id = ?').run(id);
  }

  // Account activity methods
  static saveActivity(activity: {
    id: string;
    account: string;
    type: string;
    details?: any;
    relatedRequestId?: string;
    timestamp: number;
  }) {
    // Encrypt details blob
    const detailsStr = JSON.stringify(activity.details ?? {});
    const encDetails = encryptString(detailsStr);
    db.prepare(`REPLACE INTO account_activities (id, account, type, details, relatedRequestId, timestamp) VALUES (?, ?, ?, ?, ?, ?)`)
      .run(
        activity.id,
        activity.account,
        activity.type,
        encDetails,
        activity.relatedRequestId ?? null,
        activity.timestamp
      );
  }

  static getActivitiesByAccount(account: string) {
    const rows = db.prepare('SELECT * FROM account_activities WHERE account = ? ORDER BY timestamp DESC').all(account);
    return rows.map((row: any) => ({
      id: row.id,
      account: row.account,
      type: row.type,
      details: row.details ? JSON.parse(decryptString(row.details)) : undefined,
      relatedRequestId: row.relatedRequestId,
      timestamp: row.timestamp,
    }));
  }

  static getAllActivities() {
    const rows = db.prepare('SELECT * FROM account_activities ORDER BY timestamp DESC').all();
    return rows.map((row: any) => ({
      id: row.id,
      account: row.account,
      type: row.type,
      details: row.details ? JSON.parse(decryptString(row.details)) : undefined,
      relatedRequestId: row.relatedRequestId,
      timestamp: row.timestamp,
    }));
  }

  static getActivity(id: string) {
    const row = db.prepare('SELECT * FROM account_activities WHERE id = ?').get(id);
    if (!row) return null;
    return {
      id: row.id,
      account: row.account,
      type: row.type,
      details: row.details ? JSON.parse(decryptString(row.details)) : undefined,
      relatedRequestId: row.relatedRequestId,
      timestamp: row.timestamp,
    };
  }

  static deleteActivity(id: string) {
    db.prepare('DELETE FROM account_activities WHERE id = ?').run(id);
  }
  // Add more methods as needed (addSignature, markAsExecuted, etc)
}
