import Database from 'better-sqlite3';
import path from 'path';
import { type PendingWithdrawalRequest, type SignedWithdrawal } from '@/lib/types/guardian-signatures';
import { type Address, type Hex } from 'viem';

const dbPath = path.resolve(process.cwd(), 'guardian_signatures.sqlite');
const db = new Database(dbPath);

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

    db.prepare(`REPLACE INTO pending_requests (id, vaultAddress, request, signatures, requiredQuorum, status, createdAt, executedAt, executionTxHash) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(
        request.id,
        request.vaultAddress,
        JSON.stringify(serializableRequest),
        JSON.stringify(serializableSignatures),
        request.requiredQuorum,
        request.status,
        request.createdAt,
        request.executedAt ?? null,
        request.executionTxHash ?? null
      );
  }

  static getPendingRequests(): PendingWithdrawalRequest[] {
    const rows = db.prepare('SELECT * FROM pending_requests').all();
    return rows.map(row => ({
      ...row,
      request: (() => {
        const req = JSON.parse(row.request);
        return {
          ...req,
          amount: BigInt(req.amount),
          nonce: BigInt(req.nonce),
        };
      })(),
      signatures: (() => {
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
        } catch (e) {
          return [];
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
        const req = JSON.parse(row.request);
        return {
          ...req,
          amount: BigInt(req.amount),
          nonce: BigInt(req.nonce),
        };
      })(),
      signatures: (() => {
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
        } catch (e) {
          return [];
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
    db.prepare(`REPLACE INTO account_activities (id, account, type, details, relatedRequestId, timestamp) VALUES (?, ?, ?, ?, ?, ?)`)
      .run(
        activity.id,
        activity.account,
        activity.type,
        JSON.stringify(activity.details ?? {}),
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
      details: row.details ? JSON.parse(row.details) : undefined,
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
      details: row.details ? JSON.parse(row.details) : undefined,
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
      details: row.details ? JSON.parse(row.details) : undefined,
      relatedRequestId: row.relatedRequestId,
      timestamp: row.timestamp,
    };
  }

  static deleteActivity(id: string) {
    db.prepare('DELETE FROM account_activities WHERE id = ?').run(id);
  }
  // Add more methods as needed (addSignature, markAsExecuted, etc)
}
