const fs = require('fs');
const path = require('path');
const { query } = require('./pg');

function runSqlFile(filePath) {
  const sql = fs.readFileSync(filePath, 'utf8');
  const cleanSql = sql.replace(/--.*$/gm, '');
  const chunks = cleanSql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  return chunks;
}

async function initSchema() {
  const base = path.join(__dirname, 'schema.sql');
  const ext = path.join(__dirname, 'schema_extensions.sql');

  for (const chunk of runSqlFile(base)) {
    try {
      await query(chunk + ';');
    } catch (err) {
      if (err.code === '42P07' || err.code === '42710' || err.code === '42P04') {
        continue;
      }
      throw err;
    }
  }

  if (fs.existsSync(ext)) {
    for (const chunk of runSqlFile(ext)) {
      try {
        await query(chunk + ';');
      } catch (err) {
        if (err.code === '42P07' || err.code === '42710' || err.code === '42P04' || err.code === '42701') {
          continue;
        }
        throw err;
      }
    }
  }

  console.log('PostgreSQL schema ensured.');
}

module.exports = { initSchema };
