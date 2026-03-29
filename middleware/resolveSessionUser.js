const jwt = require('jsonwebtoken');
const secretKey = process.env.SECRET_KEY;

/**
 * Assignment default: demo user (id=1) when not logged in.
 * With valid JWT cookie, uses that user's id for cart and profile.
 */
module.exports = function resolveSessionUser(req, res, next) {
  const defaultId = parseInt(process.env.DEFAULT_USER_ID || '1', 10);
  req.userId = defaultId;
  const token = req.cookies.AmazonClone;
  if (token && secretKey) {
    try {
      const p = jwt.verify(token, secretKey);
      if (p.userId) req.userId = parseInt(p.userId, 10);
    } catch (e) {
      /* invalid / expired token — fall back to default user */
    }
  }
  next();
};
