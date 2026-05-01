const fs = require('fs');
const path = require('path');
const pool = require('./db');

async function initDb() {
  try {
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await pool.query(schema);
    console.log('Database schema initialized successfully');
    process.exit(0);
  } catch (err) {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  }
}

initDb();
