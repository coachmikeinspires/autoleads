const Database = require('better-sqlite3');
const { randomUUID } = require('crypto');
const { hashSync } = require('bcryptjs');
require('dotenv').config();

const dbPath = (process.env.DATABASE_URL || 'file:./dev.db').replace('file:', '');
const db = new Database(dbPath);

function run() {
  const orgId = randomUUID();
  const userId = randomUUID();
  const now = new Date().toISOString();

  const insertOrg = db.prepare(`INSERT INTO "Org" (id, name, plan, plan_status, created_at) VALUES (?, ?, ?, ?, ?)`);
  insertOrg.run(orgId, 'Example Org', 'starter', 'active', now);

  const passwordHash = hashSync('password123', 10);
  const insertUser = db.prepare(`INSERT INTO "User" (id, org_id, name, email, role, password, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  insertUser.run(userId, orgId, 'Admin User', 'admin@example.com', 'admin', passwordHash, now, now);

  console.log('Seeded:', { orgId, userId });
}

try {
  run();
} catch (e) {
  console.error(e);
  process.exit(1);
}
