const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../data.sqlite');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    position TEXT NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    score INTEGER NOT NULL,
    strengths TEXT,
    improvements TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

function saveAttempt({ sessionId, position, question, answer, score, strengths, improvements }) {
  const stmt = db.prepare(`
    INSERT INTO attempts (session_id, position, question, answer, score, strengths, improvements)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(sessionId, position, question, answer, score, strengths, improvements);
}

function getHistory(sessionId, limit = 50) {
  const stmt = db.prepare(`
    SELECT id, position, question, answer, score, strengths, improvements, created_at
    FROM attempts
    WHERE session_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `);
  return stmt.all(sessionId, limit);
}

function getStats(sessionId) {
  const stmt = db.prepare(`
    SELECT COUNT(*) as totalAttempts, AVG(score) as avgScore
    FROM attempts
    WHERE session_id = ?
  `);
  return stmt.get(sessionId);
}

module.exports = { saveAttempt, getHistory, getStats };