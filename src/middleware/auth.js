const jwt = require('jsonwebtoken');
const pool = require('../db');

// Verifies the JWT and attaches req.user = { id, email }
async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Not logged in' });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.id, email: payload.email };
    next();
  } catch (err) {
    res.status(401).json({ message: 'Not logged in' });
  }
}

// Must run AFTER requireAuth. Checks req.user is an admin of req.params.businessId
async function requireBusinessAdmin(req, res, next) {
  try {
    const businessId = req.params.businessId;
    const [rows] = await pool.query(
      'SELECT role FROM business_members WHERE business_id = ? AND user_id = ?',
      [businessId, req.user.id]
    );
    if (rows.length === 0 || rows[0].role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    next();
  } catch (err) {
    console.error('Admin check error:', err);
    res.status(500).json({ message: 'Something went wrong' });
  }
}

module.exports = { requireAuth, requireBusinessAdmin };