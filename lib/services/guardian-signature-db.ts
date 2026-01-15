import crypto from 'crypto';
import { MongoClient, Db, Collection } from 'mongodb';
import { type PendingWithdrawalRequest, type SignedWithdrawal } from '@/lib/types/guardian-signatures';
import { type Address, type Hex } from 'viem';

// MongoDB connection
let mongoClient: MongoClient | null = null;
let db: Db | null = null;

async function getDatabase(): Promise<Db> {
  if (db) {
    return db;
  }

  const mongoUrl = process.env.MONGODB_URI;
  if (!mongoUrl) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  try {
    mongoClient = new MongoClient(mongoUrl);
    await mongoClient.connect();
    db = mongoClient.db('spendguard');
    
    // Initialize collections with indexes
    await initializeCollections();
    
    console.log('[MongoDB] Connected successfully');
    return db;
  } catch (err) {
    console.error('[MongoDB] Connection error:', err);
    throw err;
  }
}

async function initializeCollections() {
  if (!db) return;

  try {
    // Create collections if they don't exist
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    if (!collectionNames.includes('pending_requests')) {
      await db.createCollection('pending_requests');
    }
    if (!collectionNames.includes('account_activities')) {
      await db.createCollection('account_activities');
    }
    if (!collectionNames.includes('guardians')) {
      await db.createCollection('guardians');
    }

    // Create indexes
    const pendingReqCollection = db.collection('pending_requests');
    await pendingReqCollection.createIndex({ id: 1 }, { unique: true }).catch(() => {});
    await pendingReqCollection.createIndex({ vaultAddress: 1 });
    await pendingReqCollection.createIndex({ status: 1 });
    await pendingReqCollection.createIndex({ createdAt: 1 });

    const activitiesCollection = db.collection('account_activities');
    await activitiesCollection.createIndex({ account: 1 });
    await activitiesCollection.createIndex({ timestamp: -1 });
    await activitiesCollection.createIndex({ relatedRequestId: 1 }).catch(() => {});

    const guardiansCollection = db.collection('guardians');
    await guardiansCollection.createIndex({ id: 1 }, { unique: true }).catch(() => {});
    await guardiansCollection.createIndex({ tokenAddress: 1 });
    await guardiansCollection.createIndex({ address: 1 });
  } catch (err) {
    console.error('[MongoDB] Collection initialization error:', err);
    // Don't throw - allow graceful degradation
  }
}

// Encryption helpers — AES-256-GCM
function getEncryptionKey(): Buffer | null {
  const raw = process.env.DB_ENCRYPTION_KEY;
  if (!raw) {
    return null;
  }
  // Derive 32-byte key from provided secret
  return crypto.createHash('sha256').update(String(raw)).digest();
}

function encryptString(plain: string): string {
  const key = getEncryptionKey();
  if (!key) {
    // If no encryption key, store as plaintext
    return plain;
  }
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
  if (!key) {
    // No encryption key configured, can't decrypt
    console.warn('[GuardianSignatureDB] Cannot decrypt payload - DB_ENCRYPTION_KEY not set');
    return payload;
  }
  
  try {
    const iv = Buffer.from(parsed.iv, 'base64');
    const tag = Buffer.from(parsed.tag, 'base64');
    const data = Buffer.from(parsed.data, 'base64');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (e) {
    // Decryption failed, return original payload
    console.warn('[GuardianSignatureDB] Decryption failed:', e);
    return payload;
  }
}

export class GuardianSignatureDB {
  static async savePendingRequest(request: any) {
    try {
      const database = await getDatabase();
      const collection = database.collection('pending_requests');

      // Serialize BigInt fields (amount, nonce) inside request and inside signatures
      const serializableRequest = {
        ...request.request,
        amount: typeof request.request.amount === 'bigint' ? request.request.amount.toString() : String(request.request.amount),
        nonce: typeof request.request.nonce === 'bigint' ? request.request.nonce.toString() : String(request.request.nonce),
      };

      const serializableSignatures = (request.signatures || []).map((s: any) => {
        // If signature doesn't have request field, use the top-level request
        const signatureRequest = s.request || request.request;
        return {
          ...s,
          request: {
            ...signatureRequest,
            amount: typeof signatureRequest.amount === 'bigint' ? signatureRequest.amount.toString() : String(signatureRequest.amount),
            nonce: typeof signatureRequest.nonce === 'bigint' ? signatureRequest.nonce.toString() : String(signatureRequest.nonce),
          },
        };
      });

      // Encrypt blobs before storing
      const encRequest = encryptString(JSON.stringify(serializableRequest));
      const encSignatures = encryptString(JSON.stringify(serializableSignatures));
      const guardiansArray = Array.isArray((request as any).guardians) ? (request as any).guardians : [];
      const encGuardians = encryptString(JSON.stringify(guardiansArray));

      console.log('[GuardianSignatureDB] Saving guardians:', guardiansArray);

      await collection.updateOne(
        { id: request.id },
        {
          $set: {
            id: request.id,
            vaultAddress: request.vaultAddress,
            request: encRequest,
            signatures: encSignatures,
            requiredQuorum: request.requiredQuorum,
            status: request.status,
            createdAt: request.createdAt,
            createdBy: request.createdBy,
            executedAt: request.executedAt ?? null,
            executionTxHash: request.executionTxHash ?? null,
            guardians: encGuardians,
            updatedAt: new Date(),
          },
        },
        { upsert: true }
      );
      
      // Verify the save was successful
      const savedDoc = await collection.findOne({ id: request.id });
      if (!savedDoc) {
        throw new Error('Failed to verify saved document in database');
      }
      
      console.log('[GuardianSignatureDB] Request saved successfully with ID:', request.id);
      console.log('[GuardianSignatureDB] Verified document exists in database');
    } catch (err) {
      console.error('[GuardianSignatureDB] Error saving pending request:', err);
      throw err;
    }
  }

  static async getPendingRequests(): Promise<PendingWithdrawalRequest[]> {
    try {
      const database = await getDatabase();
      const collection = database.collection('pending_requests');
      const rows = await collection.find({}).toArray();

      return rows.map((row: any) => {
        try {
          return {
            ...row,
            request: (() => {
              try {
                const decrypted = decryptString(row.request);
                const req = JSON.parse(decrypted);
                return {
                  ...req,
                  amount: BigInt(req.amount),
                  nonce: BigInt(req.nonce),
                };
              } catch (e) {
                console.error('[getPendingRequests] Error parsing request:', e);
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
                  console.error('[getPendingRequests] Error parsing signatures:', e2);
                  return [];
                }
              }
            })(),
            guardians: (() => {
              try {
                const decrypted = decryptString(row.guardians);
                const parsed = JSON.parse(decrypted);
                console.log('[getPendingRequests] Decrypted guardians for', row.id, ':', parsed);
                return parsed;
              } catch (e) {
                try {
                  const parsed = JSON.parse(row.guardians);
                  console.log('[getPendingRequests] Guardians (unencrypted) for', row.id, ':', parsed);
                  return parsed;
                } catch (e2) {
                  console.error('[getPendingRequests] Error parsing guardians for', row.id, ':', e2);
                  console.warn('[getPendingRequests] Raw guardians value:', row.guardians);
                  return [];
                }
              }
            })(),
            requiredQuorum: row.requiredQuorum,
            status: row.status,
            createdAt: row.createdAt,
            createdBy: row.createdBy,
            executedAt: row.executedAt,
            executionTxHash: row.executionTxHash,
          };
        } catch (rowErr) {
          console.error('[getPendingRequests] Error processing row:', rowErr);
          return null;
        }
      }).filter((r: any) => r !== null);
    } catch (err) {
      console.error('[getPendingRequests] Database error:', err);
      return [];
    }
  }

  static async getPendingRequest(id: string): Promise<PendingWithdrawalRequest | null> {
    try {
      const database = await getDatabase();
      const collection = database.collection('pending_requests');
      const row = await collection.findOne({ id });

      if (!row) return null;
      
      return {
        ...row,
        request: (() => {
          try {
            const decrypted = decryptString(row.request);
            const req = JSON.parse(decrypted);
            return {
              ...req,
              amount: BigInt(req.amount),
              nonce: BigInt(req.nonce),
            };
          } catch (e) {
            console.error('[getPendingRequest] Error parsing request:', e);
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
              console.error('[getPendingRequest] Error parsing signatures:', e2);
              return [];
            }
          }
        })(),
        guardians: (() => {
          try {
            const decrypted = decryptString(row.guardians);
            return JSON.parse(decrypted);
          } catch (e) {
            try {
              return JSON.parse(row.guardians);
            } catch (e2) {
              console.error('[getPendingRequest] Error parsing guardians:', e2);
              return [];
            }
          }
        })(),
        requiredQuorum: row.requiredQuorum,
        status: row.status,
        createdAt: row.createdAt,
        createdBy: row.createdBy,
        executedAt: row.executedAt,
        executionTxHash: row.executionTxHash,
      };
    } catch (err) {
      console.error('[getPendingRequest] Database error:', err);
      return null;
    }
  }

  static async deletePendingRequest(id: string) {
    try {
      const database = await getDatabase();
      const collection = database.collection('pending_requests');
      await collection.deleteOne({ id });
    } catch (err) {
      console.error('[GuardianSignatureDB] Error deleting pending request:', err);
      throw err;
    }
  }

  // Account activity methods
  static async saveActivity(activity: {
    id: string;
    account: string;
    type: string;
    details?: any;
    relatedRequestId?: string;
    timestamp: number;
  }) {
    try {
      const database = await getDatabase();
      const collection = database.collection('account_activities');

      // Encrypt details blob
      const detailsStr = JSON.stringify(activity.details ?? {});
      const encDetails = encryptString(detailsStr);

      await collection.updateOne(
        { id: activity.id },
        {
          $set: {
            id: activity.id,
            account: activity.account,
            type: activity.type,
            details: encDetails,
            relatedRequestId: activity.relatedRequestId ?? null,
            timestamp: activity.timestamp,
            createdAt: new Date(),
          },
        },
        { upsert: true }
      );
    } catch (err) {
      console.error('[GuardianSignatureDB] Error saving activity:', err);
      throw err;
    }
  }

  static async getActivitiesByAccount(account: string) {
    const database = await getDatabase();
    const collection = database.collection('account_activities');
    const rows = await collection.find({ account }).sort({ timestamp: -1 }).toArray();

    return rows.map((row: any) => ({
      id: row.id,
      account: row.account,
      type: row.type,
      details: row.details ? JSON.parse(decryptString(row.details)) : undefined,
      relatedRequestId: row.relatedRequestId,
      timestamp: row.timestamp,
    }));
  }

  static async getAllActivities() {
    const database = await getDatabase();
    const collection = database.collection('account_activities');
    const rows = await collection.find({}).sort({ timestamp: -1 }).toArray();

    return rows.map((row: any) => ({
      id: row.id,
      account: row.account,
      type: row.type,
      details: row.details ? JSON.parse(decryptString(row.details)) : undefined,
      relatedRequestId: row.relatedRequestId,
      timestamp: row.timestamp,
    }));
  }

  static async getActivity(id: string) {
    try {
      const database = await getDatabase();
      const collection = database.collection('account_activities');
      const row = await collection.findOne({ id });

      if (!row) return null;
      
      return {
        id: row.id,
        account: row.account,
        type: row.type,
        details: row.details ? JSON.parse(decryptString(row.details)) : undefined,
        relatedRequestId: row.relatedRequestId,
        timestamp: row.timestamp,
      };
    } catch (err) {
      console.error('[GuardianSignatureDB] Error getting activity:', err);
      return null;
    }
  }

  static async deleteActivity(id: string) {
    try {
      const database = await getDatabase();
      const collection = database.collection('account_activities');
      await collection.deleteOne({ id });
    } catch (err) {
      console.error('[GuardianSignatureDB] Error deleting activity:', err);
      throw err;
    }
  }

  // Guardian methods
  static async saveGuardian(guardian: {
    address: string;
    tokenId: string;
    addedAt: number;
    blockNumber: string;
    txHash: string;
    tokenAddress: string;
  }) {
    try {
      const database = await getDatabase();
      const collection = database.collection('guardians');
      const id = `${guardian.tokenAddress.toLowerCase()}-${guardian.address.toLowerCase()}`;

      await collection.updateOne(
        { id },
        {
          $set: {
            id,
            address: guardian.address.toLowerCase(),
            tokenId: guardian.tokenId,
            addedAt: guardian.addedAt,
            blockNumber: guardian.blockNumber,
            txHash: guardian.txHash,
            tokenAddress: guardian.tokenAddress.toLowerCase(),
            updatedAt: new Date(),
          },
        },
        { upsert: true }
      );
    } catch (err) {
      console.error('[GuardianSignatureDB] Error saving guardian:', err);
      throw err;
    }
  }

  static async getGuardiansByTokenAddress(tokenAddress: string) {
    const database = await getDatabase();
    const collection = database.collection('guardians');
    const rows = await collection.find({ tokenAddress: tokenAddress.toLowerCase() }).sort({ addedAt: 1 }).toArray();

    return rows.map((row: any) => ({
      address: row.address,
      tokenId: row.tokenId,
      addedAt: row.addedAt,
      blockNumber: row.blockNumber,
      txHash: row.txHash,
      tokenAddress: row.tokenAddress,
    }));
  }

  static async deleteGuardiansByTokenAddress(tokenAddress: string) {
    try {
      const database = await getDatabase();
      const collection = database.collection('guardians');
      await collection.deleteMany({ tokenAddress: tokenAddress.toLowerCase() });
    } catch (err) {
      console.error('[GuardianSignatureDB] Error deleting guardians:', err);
      throw err;
    }
  }

  // Utility method to close database connection (optional)
  static async closeConnection() {
    if (mongoClient) {
      await mongoClient.close();
      mongoClient = null;
      db = null;
      console.log('[MongoDB] Connection closed');
    }
  }
}