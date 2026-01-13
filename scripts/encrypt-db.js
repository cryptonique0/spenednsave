#!/usr/bin/env node
const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

function getKey() {
  const raw = process.env.DB_ENCRYPTION_KEY;
  if (!raw) throw new Error('Set DB_ENCRYPTION_KEY in env');
  return crypto.createHash('sha256').update(String(raw)).digest();
}

function encryptString(plain) {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(Buffer.from(plain, 'utf8')), cipher.final()]);
  const tag = cipher.getAuthTag();
  return JSON.stringify({ iv: iv.toString('base64'), tag: tag.toString('base64'), data: ciphertext.toString('base64') });
}

function isEncrypted(payload) {
  try {
    const p = JSON.parse(payload);
    return p && p.iv && p.tag && p.data;
  } catch (e) {
    return false;
  }
}

(async () => {
  const dbPath = path.resolve(process.cwd(), 'guardian_signatures.sqlite');
  const db = new Database(dbPath);

  console.log('Scanning pending_requests...');
  const rows = db.prepare('SELECT id, request, signatures FROM pending_requests').all();
  let updated = 0;
  for (const row of rows) {
    let req = row.request;
    let sigs = row.signatures;
    let changed = false;
    if (req && !isEncrypted(req)) {
      req = encryptString(req);
      changed = true;
    }
    if (sigs && !isEncrypted(sigs)) {
      sigs = encryptString(sigs);
      changed = true;
    }
    if (changed) {
      db.prepare('UPDATE pending_requests SET request = ?, signatures = ? WHERE id = ?').run(req, sigs, row.id);
      updated++;
    }
  }

  console.log('Scanning account_activities...');
  const acts = db.prepare('SELECT id, details FROM account_activities').all();
  let actUpdated = 0;
  for (const a of acts) {
    if (a.details && !isEncrypted(a.details)) {
      const enc = encryptString(a.details);
      db.prepare('UPDATE account_activities SET details = ? WHERE id = ?').run(enc, a.id);
      actUpdated++;
    }
  }

  console.log(`Updated ${updated} pending_requests and ${actUpdated} activities.`);
  process.exit(0);
})();
