import { nanoid } from 'nanoid';
import { initDb, getDb } from './shared/db/index.js';

/**
 * Seeds the database with a firm admin and a sample trader.
 * Run: npm run seed -w @qalgo/api
 */

initDb();
const db = getDb();

const firmId = nanoid();
const traderId = nanoid();
const now = Date.now();

// Create firm admin
db.prepare(`
  INSERT OR IGNORE INTO traders (id, name, email, password_hash, role, max_position_size, max_daily_loss, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`).run(firmId, 'Admin', 'admin@bbsim.io', 'admin123', 'firm', 999999999, 999999999, now);

// Create sample trader
db.prepare(`
  INSERT OR IGNORE INTO traders (id, name, email, password_hash, role, max_position_size, max_daily_loss, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`).run(traderId, 'Trader One', 'trader@bbsim.io', 'trader123', 'trader', 100000, 5000, now);

console.log('[Seed] Done!');
console.log(`  Firm:   admin@bbsim.io / admin123`);
console.log(`  Trader: trader@bbsim.io / trader123`);
