const express = require('express');
const pool = require('../db');
const { requireAuth, requireBusinessAdmin } = require('../middleware/auth');

const router = express.Router();

// POST /api/business/register — creates a business, creator becomes its admin
router.post('/register', requireAuth, async (req, res) => {
  try {
    const { name, category } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Company name is required' });
    }

    const [result] = await pool.query(
      'INSERT INTO businesses (name, category, owner_id) VALUES (?, ?, ?)',
      [name.trim(), category || null, req.user.id]
    );

    await pool.query(
      'INSERT INTO business_members (business_id, user_id, role) VALUES (?, ?, ?)',
      [result.insertId, req.user.id, 'admin']
    );

    res.status(201).json({
      business: { id: result.insertId, name: name.trim(), category: category || null }
    });
  } catch (err) {
    console.error('Business register error:', err);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
});

// GET /api/business/mine — businesses the logged-in user belongs to
router.get('/mine', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT b.id, b.name, b.category, bm.role
       FROM businesses b
       JOIN business_members bm ON bm.business_id = b.id
       WHERE bm.user_id = ?`,
      [req.user.id]
    );
    res.json({ businesses: rows });
  } catch (err) {
    console.error('List businesses error:', err);
    res.status(500).json({ message: 'Something went wrong.' });
  }
});

// GET /api/business/:businessId/members — admin only, lists all members + user IDs
router.get('/:businessId/members', requireAuth, requireBusinessAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.profile_picture_url, bm.role
       FROM business_members bm
       JOIN users u ON u.id = bm.user_id
       WHERE bm.business_id = ?`,
      [req.params.businessId]
    );
    res.json({ members: rows });
  } catch (err) {
    console.error('List members error:', err);
    res.status(500).json({ message: 'Something went wrong.' });
  }
});

// POST /api/business/:businessId/members — admin adds an existing user by email
router.post('/:businessId/members', requireAuth, requireBusinessAdmin, async (req, res) => {
  try {
    const { email, role } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const [userRows] = await pool.query('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (userRows.length === 0) {
      return res.status(404).json({ message: 'No account found with that email' });
    }

    await pool.query(
      'INSERT INTO business_members (business_id, user_id, role) VALUES (?, ?, ?)',
      [req.params.businessId, userRows[0].id, role === 'admin' ? 'admin' : 'user']
    );

    res.status(201).json({ message: 'Member added' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'That user is already a member' });
    }
    console.error('Add member error:', err);
    res.status(500).json({ message: 'Something went wrong.' });
  }
});

// DELETE /api/business/:businessId/members/:userId — admin removes a member
router.delete('/:businessId/members/:userId', requireAuth, requireBusinessAdmin, async (req, res) => {
  try {
    const [businessRows] = await pool.query('SELECT owner_id FROM businesses WHERE id = ?', [req.params.businessId]);
    if (businessRows.length && String(businessRows[0].owner_id) === req.params.userId) {
      return res.status(400).json({ message: "Can't remove the business owner" });
    }

    await pool.query(
      'DELETE FROM business_members WHERE business_id = ? AND user_id = ?',
      [req.params.businessId, req.params.userId]
    );
    res.json({ message: 'Member removed' });
  } catch (err) {
    console.error('Remove member error:', err);
    res.status(500).json({ message: 'Something went wrong.' });
  }
});

module.exports = router;