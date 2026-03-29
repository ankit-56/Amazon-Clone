const { Pool } = require('pg');

const ssl = process.env.DATABASE_URL ? { rejectUnauthorized: false } : false;

const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL, ssl })
  : new Pool({
      host: process.env.PGHOST || 'localhost',
      port: parseInt(process.env.PGPORT || '5432', 10),
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || 'postgres',
      database: process.env.PGDATABASE || 'amazon_clone'
    });

pool.on('error', (err) => {
  console.error('Unexpected PG client error', err);
});

async function query(text, params) {
  return pool.query(text, params);
}

module.exports = { pool, query };
