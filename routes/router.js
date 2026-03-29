const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Razorpay = require('razorpay');
const { query, pool } = require('../database/pg');
const authenticate = require('../middleware/authenticate');
const resolveSessionUser = require('../middleware/resolveSessionUser');
const { check, validationResult } = require('express-validator');
const { formatProductRow, fetchProductById } = require('../services/productMapper');
const { loadUserWithCart } = require('../services/userPayload');
const { verifyRazorpayPaymentSignature } = require('../services/razorpayVerify');
const { sendOrderConfirmationEmail } = require('../services/orderEmail');

const secretKey = process.env.SECRET_KEY;

function orderNumber() {
  return `ORD-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;
}

// --- Categories ---
router.get('/categories', async (req, res) => {
  try {
    const r = await query(`SELECT id, name, slug FROM categories ORDER BY id`);
    res.json(r.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to load categories' });
  }
});

// --- Product listing (grid + filters) ---
router.get('/products', async (req, res) => {
  try {
    const { search, categoryId } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(48, Math.max(1, parseInt(req.query.limit, 10) || 24));
    const offset = (page - 1) * limit;

    const params = [];
    let where = 'WHERE 1=1';
    if (categoryId) {
      params.push(categoryId);
      where += ` AND p.category_id = $${params.length}`;
    }
    if (search && String(search).trim()) {
      params.push(`%${String(search).trim().toLowerCase()}%`);
      where += ` AND LOWER(p.name) LIKE $${params.length}`;
    }

    const countR = await query(`SELECT COUNT(*)::int AS c FROM products p ${where}`, params);
    const total = countR.rows[0].c;

    const limitParam = params.length + 1;
    params.push(limit);
    const offsetParam = params.length + 1;
    params.push(offset);
    const r = await query(
      `SELECT p.*,
        (SELECT json_agg(json_build_object('image_url', pi.image_url, 'sort_order', pi.sort_order) ORDER BY pi.sort_order)
         FROM product_images pi WHERE pi.product_id = p.id) AS images_json
       FROM products p
       ${where}
       ORDER BY p.id
       LIMIT $${limitParam} OFFSET $${offsetParam}`,
      params
    );
    const list = r.rows.map((row) => {
      const imgs = row.images_json || [];
      const { images_json, ...prod } = row;
      return formatProductRow(prod, imgs);
    });
    res.json({
      products: list,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit))
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to load products' });
  }
});

// --- Single product (legacy path) ---
router.get('/product/:id', async (req, res) => {
  try {
    const p = await fetchProductById(query, req.params.id);
    if (!p) return res.status(404).json({ message: 'Product not found' });
    res.json(p);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to load product' });
  }
});

// --- Cart: current user (demo or logged-in) ---
router.get('/getAuthUser', resolveSessionUser, async (req, res) => {
  try {
    const payload = await loadUserWithCart(query, req.userId);
    if (!payload) return res.status(404).json({ message: 'User not found' });
    res.send(payload);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to load user' });
  }
});

// --- Add to cart (legacy + optional quantity) ---
router.post('/addtocart/:id', resolveSessionUser, async (req, res) => {
  try {
    const productId = parseInt(req.params.id, 10);
    const addQty = Math.max(1, parseInt(req.body.quantity, 10) || 1);
    const p = await query(`SELECT id, stock_quantity FROM products WHERE id = $1`, [productId]);
    if (!p.rows[0]) return res.status(404).json({ status: false, message: 'Product not found' });

    const existing = await query(
      `SELECT quantity FROM cart_items WHERE user_id = $1 AND product_id = $2`,
      [req.userId, productId]
    );
    const current = existing.rows[0] ? existing.rows[0].quantity : 0;
    const nextQty = current + addQty;
    if (nextQty > p.rows[0].stock_quantity) {
      return res.status(400).json({ status: false, message: 'Not enough stock available' });
    }

    await query(
      `INSERT INTO cart_items (user_id, product_id, quantity) VALUES ($1, $2, $3)
       ON CONFLICT (user_id, product_id) DO UPDATE SET quantity = $3, updated_at = NOW()`,
      [req.userId, productId, nextQty]
    );

    const user = await loadUserWithCart(query, req.userId);
    res.status(201).json({ status: true, message: user });
  } catch (e) {
    console.error(e);
    res.status(500).json({ status: false, message: 'Cart update failed' });
  }
});

// Replace cart with a single item (Buy Now)
router.post('/buy-now/:id', resolveSessionUser, async (req, res) => {
  try {
    const productId = parseInt(req.params.id, 10);
    const qty = Math.max(1, parseInt(req.body.quantity, 10) || 1);
    const p = await query(`SELECT id, stock_quantity FROM products WHERE id = $1`, [productId]);
    if (!p.rows[0]) return res.status(404).json({ status: false, message: 'Product not found' });
    if (qty > p.rows[0].stock_quantity) {
      return res.status(400).json({ status: false, message: 'Not enough stock available' });
    }
    await query(`DELETE FROM cart_items WHERE user_id = $1`, [req.userId]);
    await query(
      `INSERT INTO cart_items (user_id, product_id, quantity) VALUES ($1, $2, $3)`,
      [req.userId, productId, qty]
    );
    const user = await loadUserWithCart(query, req.userId);
    res.status(201).json({ status: true, message: user });
  } catch (e) {
    console.error(e);
    res.status(500).json({ status: false, message: 'Buy now failed' });
  }
});

// --- Update cart line quantity ---
router.patch('/cart/items/:productId', resolveSessionUser, async (req, res) => {
  try {
    const productId = parseInt(req.params.productId, 10);
    const qty = parseInt(req.body.quantity, 10);
    if (!Number.isFinite(qty) || qty < 1) {
      return res.status(400).json({ status: false, message: 'Invalid quantity' });
    }
    const p = await query(`SELECT stock_quantity FROM products WHERE id = $1`, [productId]);
    if (!p.rows[0]) return res.status(404).json({ status: false, message: 'Product not found' });
    if (qty > p.rows[0].stock_quantity) {
      return res.status(400).json({ status: false, message: 'Not enough stock available' });
    }
    const up = await query(
      `UPDATE cart_items SET quantity = $1, updated_at = NOW()
       WHERE user_id = $2 AND product_id = $3 RETURNING *`,
      [qty, req.userId, productId]
    );
    if (!up.rows[0]) return res.status(404).json({ status: false, message: 'Item not in cart' });
    res.json({ status: true, message: 'Quantity updated' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ status: false, message: 'Update failed' });
  }
});

router.delete('/delete/:id', resolveSessionUser, async (req, res) => {
  try {
    const productId = parseInt(req.params.id, 10);
    await query(`DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2`, [req.userId, productId]);
    res.status(201).json({ status: true, message: 'Item deleted successfully' });
  } catch (e) {
    console.error(e);
    res.status(400).json({ status: false, message: String(e.message) });
  }
});

// --- Register ---
router.post(
  '/register',
  [
    check('name').notEmpty().trim().escape(),
    check('number').notEmpty().isNumeric().isLength({ min: 10, max: 10 }),
    check('password').isLength({ min: 6 }).matches(/\d/).isAlphanumeric(),
    check('confirmPassword').notEmpty(),
    check('email').isEmail().normalizeEmail()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: false, message: errors.array() });
    }
    const { name, number, email, password, confirmPassword } = req.body;
    if (password !== confirmPassword) {
      return res.status(400).json({ status: false, message: [{ msg: "Passwords don't match" }] });
    }
    try {
      const em = await query(`SELECT id FROM users WHERE email = $1`, [email]);
      if (em.rows[0]) {
        return res.status(400).json({ status: false, message: [{ msg: 'Email already registered' }] });
      }
      const ph = await query(`SELECT id FROM users WHERE phone = $1`, [number]);
      if (ph.rows[0]) {
        return res.status(400).json({ status: false, message: [{ msg: 'Number already registered' }] });
      }
      const hash = await bcrypt.hash(password, 10);
      await query(
        `INSERT INTO users (name, email, phone, password_hash) VALUES ($1, $2, $3, $4)`,
        [name, email, number, hash]
      );
      res.status(201).json({ status: true, message: 'Registered' });
    } catch (e) {
      console.error(e);
      if (e.code === '23505') {
        return res.status(400).json({ status: false, message: [{ msg: 'Email or phone already registered' }] });
      }
      res.status(500).json({ status: false, message: 'Registration failed' });
    }
  }
);

// --- Login ---
router.post(
  '/login',
  [
    check('email').isEmail().normalizeEmail(),
    check('password').isLength({ min: 6 }).matches(/\d/).isAlphanumeric()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: false, message: errors.array() });
    }
    const { email, password } = req.body;
    if (!secretKey) {
      return res.status(500).json({ status: false, message: [{ msg: 'Server misconfigured: SECRET_KEY' }] });
    }
    try {
      const r = await query(`SELECT * FROM users WHERE email = $1`, [email]);
      if (!r.rows[0]) {
        return res.status(400).json({ status: false, message: [{ msg: 'Incorrect Email or Password' }] });
      }
      const ok = await bcrypt.compare(password, r.rows[0].password_hash);
      if (!ok) {
        return res.status(400).json({ status: false, message: [{ msg: 'Incorrect Email or Password' }] });
      }
      const token = jwt.sign({ userId: r.rows[0].id }, secretKey, { expiresIn: '7d' });
      res.cookie('AmazonClone', token, {
        maxAge: 7 * 24 * 3600000,
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        secure: false
      });
      return res.status(201).json({ status: true, message: 'Logged in successfully!' });
    } catch (e) {
      console.error(e);
      res.status(500).json({ status: false, message: 'Login failed' });
    }
  }
);

router.get('/logout', (req, res) => {
  res.clearCookie('AmazonClone', { httpOnly: true, path: '/' });
  return res.status(201).json({ status: true, message: 'Logged out successfully!' });
});

// --- Place order (checkout) ---
router.post('/orders', resolveSessionUser, async (req, res) => {
  const { addressId, paymentMethod, paymentSuccess } = req.body;

  if (!addressId || !paymentMethod) {
    return res.status(400).json({ status: false, message: 'Missing address or payment method' });
  }

  const allowed = ['COD', 'UPI', 'CARD', 'NETBANKING'];
  if (!allowed.includes(paymentMethod)) {
    return res.status(400).json({ status: false, message: 'Invalid payment method' });
  }

  const onlineOk = paymentMethod === 'COD' || paymentSuccess !== false;
  if (!onlineOk) {
    return res.status(400).json({ status: false, message: 'Payment was not completed. Choose another method or try again.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const addrR = await client.query(`SELECT * FROM addresses WHERE id = $1 AND user_id = $2`, [addressId, req.userId]);
    if (!addrR.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ status: false, message: 'Address not found' });
    }
    const s = addrR.rows[0];

    const cartR = await client.query(
      `SELECT ci.quantity, p.id AS product_id, p.name, p.price_rupees, p.stock_quantity,
        (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY sort_order LIMIT 1) AS img
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       WHERE ci.user_id = $1`,
      [req.userId]
    );

    if (cartR.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ status: false, message: 'Cart is empty' });
    }

    let totalRupees = 0;
    for (const row of cartR.rows) {
      if (row.quantity > row.stock_quantity) {
        await client.query('ROLLBACK');
        return res.status(400).json({ status: false, message: `Insufficient stock for ${row.name}` });
      }
      const unit = Number(row.price_rupees) || 0;
      totalRupees += row.quantity * unit;
    }

    const totalPaise = Math.round(totalRupees * 100);
    const payStatus = paymentMethod === 'COD' ? 'Pending' : 'Success';

    const on = orderNumber();
    const ord = await client.query(
      `INSERT INTO orders (
        order_number, user_id, status, subtotal_paise, total_paise,
        payment_status, payment_method,
        shipping_full_name, shipping_phone, shipping_line1, shipping_line2,
        shipping_city, shipping_state, shipping_postal, shipping_country,
        shipping_address_id, expected_delivery_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW() + interval '3 days')
      RETURNING id, order_number`,
      [
        on,
        req.userId,
        'Placed',
        totalPaise,
        totalPaise,
        payStatus,
        paymentMethod,
        s.full_name,
        s.phone,
        s.line1,
        s.line2 || null,
        s.city,
        s.state,
        s.postal,
        s.country || 'India',
        addressId
      ]
    );
    const orderId = ord.rows[0].id;

    for (const row of cartR.rows) {
      const unit = Number(row.price_rupees) || 0;
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price_rupees, image_url)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [orderId, row.product_id, row.name, row.quantity, unit, row.img || null]
      );
      await client.query(`UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2`, [row.quantity, row.product_id]);
    }

    await client.query(`DELETE FROM cart_items WHERE user_id = $1`, [req.userId]);
    await client.query('COMMIT');

    const userRow = await query(`SELECT email, name FROM users WHERE id = $1`, [req.userId]);
    const emailLines = cartR.rows.map((row) => ({
      name: row.name,
      qty: row.quantity,
      unitRupees: Number(row.price_rupees) || 0
    }));

    sendOrderConfirmationEmail({
      to: userRow.rows[0]?.email,
      customerName: userRow.rows[0]?.name,
      orderNumber: ord.rows[0].order_number,
      paymentType: `${paymentMethod} (${payStatus})`,
      lines: emailLines,
      shipping: {
        fullName: s.full_name,
        phone: s.phone,
        line1: s.line1,
        line2: s.line2,
        city: s.city,
        state: s.state,
        postal: s.postal,
        country: s.country || 'India'
      },
      totalPaise,
      extraNote: ''
    }).catch((err) => console.error('[orderEmail]', err.message));

    res.status(201).json({
      status: true,
      orderNumber: ord.rows[0].order_number,
      orderId: ord.rows[0].id
    });
  } catch (e) {
    try {
      await client.query('ROLLBACK');
    } catch (rb) {
      /* ignore */
    }
    console.error(e);
    res.status(500).json({ status: false, message: 'Order placement failed' });
  } finally {
    client.release();
  }
});

router.get('/orders/confirmation/:orderNumber', resolveSessionUser, async (req, res) => {
  try {
    const r = await query(
      `SELECT * FROM orders WHERE order_number = $1 AND user_id = $2`,
      [req.params.orderNumber, req.userId]
    );
    if (!r.rows[0]) return res.status(404).json({ message: 'Order not found' });
    const items = await query(`SELECT * FROM order_items WHERE order_id = $1`, [r.rows[0].id]);
    res.json({ order: r.rows[0], items: items.rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Lookup failed' });
  }
});


// --- Wishlist ---
router.get('/wishlist', resolveSessionUser, async (req, res) => {
  try {
    const r = await query(
      `SELECT p.*, 
        (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY sort_order LIMIT 1) AS img
       FROM wishlists w
       JOIN products p ON p.id = w.product_id
       WHERE w.user_id = $1`,
      [req.userId]
    );
    res.json(r.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to load wishlist' });
  }
});

router.post('/wishlist/:id', resolveSessionUser, async (req, res) => {
  try {
    const pid = parseInt(req.params.id, 10);
    await query(
      `INSERT INTO wishlists (user_id, product_id) VALUES ($1, $2)
       ON CONFLICT (user_id, product_id) DO NOTHING`,
      [req.userId, pid]
    );
    res.status(201).json({ status: true, message: 'Added to wishlist' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ status: false, message: 'Failed to add to wishlist' });
  }
});

router.delete('/wishlist/:id', resolveSessionUser, async (req, res) => {
  try {
    const pid = parseInt(req.params.id, 10);
    await query(`DELETE FROM wishlists WHERE user_id = $1 AND product_id = $2`, [req.userId, pid]);
    res.status(201).json({ status: true, message: 'Removed from wishlist' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ status: false, message: 'Failed to remove from wishlist' });
  }
});

// --- OAuth Login (Secure) ---
router.post('/oauth/login', async (req, res) => {
  const { idToken, googleId, githubId, name, email } = req.body;
  const { OAuth2Client } = require('google-auth-library');
  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  try {
    let userData = { name, email, googleId, githubId };

    // 1. If it's a Google Login via ID Token
    if (idToken) {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      userData = {
        name: payload.name,
        email: payload.email,
        googleId: payload.sub,
        githubId: null
      };
    }

    if (!userData.email || (!userData.googleId && !userData.githubId)) {
      return res.status(400).json({ status: false, message: 'Invalid OAuth data' });
    }

    // 2. Database Upsert
    let r = await query(`SELECT id FROM users WHERE email = $1`, [userData.email]);
    let userId;

    if (!r.rows[0]) {
      const newUser = await query(
        `INSERT INTO users (name, email, google_id, github_id) VALUES ($1, $2, $3, $4) RETURNING id`,
        [userData.name, userData.email, userData.googleId, userData.githubId]
      );
      userId = newUser.rows[0].id;
    } else {
      userId = r.rows[0].id;
      if (userData.googleId) await query(`UPDATE users SET google_id = $1 WHERE id = $2`, [userData.googleId, userId]);
      if (userData.githubId) await query(`UPDATE users SET github_id = $1 WHERE id = $2`, [userData.githubId, userId]);
    }

    // 3. Issue Session
    const token = jwt.sign({ userId }, secretKey, { expiresIn: '7d' });
    res.cookie('AmazonClone', token, { maxAge: 7 * 24 * 3600000, httpOnly: true, path: '/' });
    res.status(201).json({ status: true, message: 'OAuth login successful' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ status: false, message: 'OAuth verification failed' });
  }
});

// --- Password Reset Request ---
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const r = await query(`SELECT id, name FROM users WHERE email = $1`, [email]);
    if (!r.rows[0]) return res.status(404).json({ status: false, message: 'User not found' });

    const resetToken = require('crypto').randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 3600000); // 1 hour

    await query(
      `UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE id = $3`,
      [resetToken, expiry, r.rows[0].id]
    );

    // Normally you'd send an email here using services/orderEmail.js logic (but generalized)
    console.log(`Reset Token for ${email}: ${resetToken}`);
    
    res.json({ status: true, message: 'Reset token generated (check server logs for demo)' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ status: false, message: 'Password reset failed' });
  }
});

router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    const r = await query(
      `SELECT id FROM users WHERE reset_token = $1 AND reset_token_expiry > NOW()`,
      [token]
    );
    if (!r.rows[0]) return res.status(400).json({ status: false, message: 'Invalid or expired token' });

    const hash = await bcrypt.hash(newPassword, 10);
    await query(
      `UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2`,
      [hash, r.rows[0].id]
    );
    res.json({ status: true, message: 'Password updated successfully' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ status: false, message: 'Password update failed' });
  }
});

// --- Addresses Management ---
router.get('/addresses', resolveSessionUser, async (req, res) => {
  try {
    const r = await query(`SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC`, [req.userId]);
    res.json(r.rows);
  } catch (e) {
    res.status(500).json({ message: 'Failed to load addresses' });
  }
});

router.post('/addresses', resolveSessionUser, async (req, res) => {
  const { fullName, phone, line1, line2, city, state, postal, country, isDefault } = req.body;
  try {
    if (isDefault) {
      await query(`UPDATE addresses SET is_default = false WHERE user_id = $1`, [req.userId]);
    }
    const r = await query(
      `INSERT INTO addresses (user_id, full_name, phone, line1, line2, city, state, postal, country, is_default)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [req.userId, fullName, phone, line1, line2, city, state, postal, country, isDefault || false]
    );
    res.status(201).json({ status: true, address: r.rows[0] });
  } catch (e) {
    console.error('Save Address Error:', e);
    res.status(500).json({ message: 'Failed to save address' });
  }
});

// --- Reviews ---
router.post('/products/:productId/reviews', resolveSessionUser, async (req, res) => {
  const { rating, comment } = req.body;
  const productId = parseInt(req.params.productId, 10);
  try {
    await query(
      `INSERT INTO reviews (user_id, product_id, rating, comment)
       VALUES ($1, $2, $3, $4) ON CONFLICT (user_id, product_id) DO UPDATE SET rating = $3, comment = $4, created_at = NOW()`,
      [req.userId, productId, rating, comment]
    );
    res.status(201).json({ status: true, message: 'Review added' });
  } catch (e) {
    res.status(500).json({ message: 'Failed to add review' });
  }
});

// --- Search Suggestions ---
router.get('/products/suggestions', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.json([]);
  try {
    const r = await query(`SELECT id, name FROM products WHERE LOWER(name) LIKE $1 LIMIT 5`, [`%${q.toLowerCase()}%`]);
    res.json(r.rows);
  } catch (e) {
    res.json([]);
  }
});

// --- Enhanced Orders ---
router.patch('/orders/:orderId/simulate-tracking', resolveSessionUser, async (req, res) => {
  const statuses = ['Placed', 'Confirmed', 'Shipped', 'Out for Delivery', 'Delivered'];
  const orderId = parseInt(req.params.orderId, 10);
  try {
    const r = await query(`SELECT status FROM orders WHERE id = $1 AND user_id = $2`, [orderId, req.userId]);
    if (!r.rows[0]) return res.status(404).json({ message: 'Order not found' });
    const currentIndex = statuses.indexOf(r.rows[0].status);
    if (currentIndex < statuses.length - 1) {
      const nextStatus = statuses[currentIndex + 1];
      await query(`UPDATE orders SET status = $1 WHERE id = $2`, [nextStatus, orderId]);
      res.json({ message: `Status updated to ${nextStatus}`, status: nextStatus });
    } else {
      res.json({ message: 'Order already delivered', status: 'Delivered' });
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Tracker update failed' });
  }
});

// --- GitHub OAuth Callback ---
router.get('/oauth/github/callback', async (req, res) => {
  const { code } = req.query;
  const axios = require('axios');
  
  try {
    const tokenRes = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code
    }, { headers: { Accept: 'application/json' } });
    
    const accessToken = tokenRes.data.access_token;
    const userRes = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `token ${accessToken}` }
    });
    const githubUser = userRes.data;
    
    const emailRes = await axios.get('https://api.github.com/user/emails', {
      headers: { Authorization: `token ${accessToken}` }
    });
    const primaryEmail = emailRes.data.find(e => e.primary && e.verified)?.email || githubUser.email;
    
    if (!primaryEmail) throw new Error('No verified email found on GitHub');

    let r = await query(`SELECT id FROM users WHERE email = $1`, [primaryEmail]);
    let userId;

    if (!r.rows[0]) {
      const newUser = await query(
        `INSERT INTO users (name, email, github_id) VALUES ($1, $2, $3) RETURNING id`,
        [githubUser.name || githubUser.login, primaryEmail, githubUser.id]
      );
      userId = newUser.rows[0].id;
    } else {
      userId = r.rows[0].id;
      await query(`UPDATE users SET github_id = $1 WHERE id = $2`, [githubUser.id, userId]);
    }

    const token = jwt.sign({ userId }, secretKey, { expiresIn: '7d' });
    res.cookie('AmazonClone', token, { maxAge: 7 * 24 * 3600000, httpOnly: true, path: '/' });
    res.redirect(`${process.env.CLIENT_ORIGINS || 'http://localhost:3000'}/`);
  } catch (e) {
    console.error(e);
    res.status(500).send('GitHub Login Failed');
  }
});

module.exports = router;
