const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ message: 'Full name is required' });
    }
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ message: 'A valid email is required' });
    }
    if (!password || password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    // Inline SQL — parameterized with ? placeholders so user input is never
    // concatenated into the query string (that's what prevents SQL injection).
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email.toLowerCase().trim()]
    );

    if (existing.length > 0) {
      return res.status(409).json({ message: 'An account with that email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      'INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, ?)',
      [fullName.trim(), email.toLowerCase().trim(), passwordHash]
    );

    const user = { id: result.insertId, fullName: fullName.trim(), email: email.toLowerCase().trim() };
    const token = signToken(user);

    res.status(201).json({ token, user });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const [rows] = await pool.query(
      'SELECT id, full_name, email, password_hash FROM users WHERE email = ?',
      [email.toLowerCase().trim()]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const dbUser = rows[0];
    const passwordMatches = await bcrypt.compare(password, dbUser.password_hash);

    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = { id: dbUser.id, fullName: dbUser.full_name, email: dbUser.email };
    const token = signToken(user);

    res.json({ token, user });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
});

// GET /api/auth/me — used by dashboard.html to check "am I actually logged in"
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: 'Not logged in' });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const [rows] = await pool.query(
      'SELECT id, full_name, email FROM users WHERE id = ?',
      [payload.id]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Not logged in' });
    }
    res.json({ user: { id: rows[0].id, fullName: rows[0].full_name, email: rows[0].email, profilePictureUrl: rows[0].profile_picture_url } });

  } catch (err) {
    res.status(401).json({ message: 'Not logged in' });
  }
});
// PATCH /api/auth/pfp — update profile picture URL
router.patch('/pfp', require('../middleware/auth').requireAuth, async (req, res) => {
  try {
    const { profilePictureUrl } = req.body;
    if (!profilePictureUrl) return res.status(400).json({ message: 'profilePictureUrl is required' });

    await pool.query('UPDATE users SET profile_picture_url = ? WHERE id = ?', [profilePictureUrl, req.user.id]);
    res.json({ profilePictureUrl });
  } catch (err) {
    console.error('PFP update error:', err);
    res.status(500).json({ message: 'Something went wrong.' });
  }
});
module.exports = router;
