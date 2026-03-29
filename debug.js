require('dotenv').config();
const { query } = require('./database/pg');
const fs = require('fs');

async function debug() {
  try {
    const users = await query('SELECT id, name, email FROM users ORDER BY id LIMIT 5');
    const products = await query('SELECT id, name, price_rupees FROM products LIMIT 5');
    const result = {
      users: users.rows,
      products: products.rows
    };
    fs.writeFileSync('debug_data.json', JSON.stringify(result, null, 2));
    console.log('Debug data saved.');
  } catch (e) {
    console.error(e);
  }
}
debug();
