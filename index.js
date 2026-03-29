require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');
const { initSchema } = require('./database/setup');
const { seed } = require('./database/seed');

const app = express();
const port = process.env.PORT || 8000;

const clientOrigins = (process.env.CLIENT_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    credentials: true,
    origin: (origin, callback) => {
      if (!origin || clientOrigins.includes(origin)) return callback(null, true);
      return callback(null, false);
    }
  })
);

app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser(process.env.COOKIE_SECRET));

const router = require('./routes/router');
app.use('/api', router);

// --- SAFE ADDRESS FALLBACK ---
app.get('/api/addresses', async (req, res) => {
  console.log('--- DIRECT ADDRESS GET ---');
  try {
    const { query } = require('./database/pg');
    const r = await query(`SELECT * FROM addresses ORDER BY id DESC LIMIT 50`);
    res.json(r.rows);
  } catch (e) {
    res.status(500).json({ message: 'Direct addr fail' });
  }
});

app.post('/api/addresses', async (req, res) => {
  console.log('--- DIRECT ADDRESS POST ---', req.body);
  try {
    const { query } = require('./database/pg');
    const { fullName, phone, line1, city, state, postal } = req.body;
    const r = await query(
      `INSERT INTO addresses (user_id, full_name, phone, line1, city, state, postal)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [1, fullName, phone, line1, city, state, postal]
    );
    res.status(201).json({ status: true, address: r.rows[0] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Direct save fail', error: e.message });
  }
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/build'));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client/build', 'index.html'));
  });
}

(async function start() {
  try {
    await initSchema();
    await seed();
    app.listen(port, function () {
      console.log('Server started at port ' + port);
    });
  } catch (e) {
    console.error('Failed to start:', e);
    process.exit(1);
  }
})();