const jwt = require('jsonwebtoken');
const { query } = require('../database/pg');
const secretKey = process.env.SECRET_KEY;

const authenticate = async function (req, res, next) {
  try {
    const token = req.cookies.AmazonClone;
    if (!token) throw new Error('no token');
    const payload = jwt.verify(token, secretKey);
    const r = await query('SELECT id, name, email, phone FROM users WHERE id = $1', [payload.userId]);
    if (!r.rows[0]) throw new Error('User not found');

    req.token = token;
    req.rootUser = r.rows[0];
    req.userId = r.rows[0].id;

    next();
  } catch (error) {
    res.status(400).json({
      status: false,
      message: 'No token provided'
    });
  }
};

module.exports = authenticate;
