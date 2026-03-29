const bcrypt = require('bcryptjs');
const { query } = require('./pg');
const productsData = require('../constant/productsData');

function categoryIdForLegacyProduct(legacyId) {
  const n = parseInt(legacyId, 10);
  const electronics = [1, 2, 3, 4, 8, 9, 13];
  const fashion = [6, 7, 11, 12];
  if (electronics.includes(n)) return 1;
  if (fashion.includes(n)) return 2;
  if (n === 10) return 4;
  return 3;
}

function normalizeResUrl(resUrl) {
  if (!resUrl) return null;
  return resUrl.replace(/^\.\.\//, '');
}

async function seedCategoriesUsersProducts() {
  const catCount = await query('SELECT COUNT(*)::int AS c FROM categories');
  if (catCount.rows[0].c === 0) {
    await query(`
      INSERT INTO categories (name, slug) VALUES
        ('Electronics', 'electronics'),
        ('Fashion', 'fashion'),
        ('Home & Kitchen', 'home-kitchen'),
        ('Grocery', 'grocery')
    `);
    console.log('Categories seeded.');
  }

  const userCount = await query('SELECT COUNT(*)::int AS c FROM users');
  if (userCount.rows[0].c === 0) {
    const hash = await bcrypt.hash('demo1234', 10);
    await query(`INSERT INTO users (name, email, phone, password_hash) VALUES ($1, $2, $3, $4)`, [
      'Demo Customer',
      'demo@amazonclone.local',
      '9999999999',
      hash
    ]);
    console.log('Default demo user seeded (email: demo@amazonclone.local, password: demo1234).');
  }

  const pCount = await query('SELECT COUNT(*)::int AS c FROM products');
  if (pCount.rows[0].c === 0) {
    for (const p of productsData) {
      const priceRupees = parseInt(String(p.accValue).replace(/,/g, ''), 10) || 0;
      const mrpMatch = p.mrp && String(p.mrp).match(/[\d,]+/);
      const mrpRupees = mrpMatch ? parseInt(mrpMatch[0].replace(/,/g, ''), 10) : null;
      const specs = JSON.stringify(p.points || []);
      const desc = Array.isArray(p.points) ? p.points.join('\n') : '';
      const catId = categoryIdForLegacyProduct(p.id);

      const ins = await query(
        `INSERT INTO products (name, description, specifications, price_rupees, mrp_rupees, discount_label, value_display, stock_quantity, category_id)
         VALUES ($1, $2, $3::jsonb, $4, $5, $6, $7, $8, $9) RETURNING id`,
        [
          p.name,
          desc,
          specs,
          priceRupees,
          mrpRupees,
          p.discount || null,
          p.value || String(priceRupees),
          50,
          catId
        ]
      );
      const productId = ins.rows[0].id;

      await query(`INSERT INTO product_images (product_id, image_url, sort_order) VALUES ($1, $2, 0)`, [productId, p.url]);
      const res = normalizeResUrl(p.resUrl);
      if (res) {
        await query(`INSERT INTO product_images (product_id, image_url, sort_order) VALUES ($1, $2, 1)`, [productId, res]);
      }
    }
    console.log('Products and images seeded.');
  } else {
    console.log('Products already present, skipping product seed.');
  }
}

async function seedDefaultAddress() {
  try {
    const c = await query('SELECT COUNT(*)::int AS c FROM addresses');
    if (c.rows[0].c > 0) return;
    const u = await query('SELECT id FROM users ORDER BY id LIMIT 1');
    if (!u.rows[0]) return;
    await query(
      `INSERT INTO addresses (user_id, full_name, phone, line1, line2, city, state, postal, country, is_default)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)`,
      [
        u.rows[0].id,
        'Demo Customer',
        '9999999999',
        '123 MG Road',
        '',
        'Bengaluru',
        'Karnataka',
        '560001',
        'India'
      ]
    );
    console.log('Default delivery address seeded for first user.');
  } catch (e) {
    if (e.code === '42P01') return;
    console.error('Address seed skipped:', e.message);
  }
}

async function seed() {
  await seedCategoriesUsersProducts();
  await seedDefaultAddress();
}

module.exports = { seed };
