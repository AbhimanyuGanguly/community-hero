const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../database');
const { generateToken, requireAuth } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if email already exists
    const existingRes = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingRes.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const id = uuidv4();
    const passwordHash = bcrypt.hashSync(password, 10);

    await db.query(
      'INSERT INTO users (id, name, email, password_hash) VALUES ($1, $2, $3, $4)',
      [id, name.trim(), email.toLowerCase().trim(), passwordHash]
    );

    const userRes = await db.query(
      'SELECT id, name, email, points, created_at FROM users WHERE id = $1',
      [id]
    );
    const user = userRes.rows[0];

    const token = generateToken(user);

    res.status(201).json({ user, token });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const userRes = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );
    const user = userRes.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const validPassword = bcrypt.compareSync(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const { password_hash, ...userWithoutPassword } = user;
    const token = generateToken(userWithoutPassword);

    res.json({ user: userWithoutPassword, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Failed to log in' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const userRes = await db.query(
      'SELECT id, name, email, points, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    const user = userRes.rows[0];

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get badges
    const badgesRes = await db.query(
      'SELECT badge_type, earned_at FROM badges WHERE user_id = $1',
      [req.user.id]
    );

    // Get issue counts
    const statsRes = await db.query(`
      SELECT
        COUNT(*) as total_reported,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as total_resolved
      FROM issues WHERE reported_by = $1
    `, [req.user.id]);
    
    let stats = statsRes.rows[0];
    // Ensure numbers are properly parsed since Postgres might return BigInts for COUNT
    stats = {
      total_reported: parseInt(stats.total_reported || 0),
      total_resolved: parseInt(stats.total_resolved || 0)
    };

    const verificationCountRes = await db.query(
      'SELECT COUNT(*) as count FROM verifications WHERE user_id = $1',
      [req.user.id]
    );

    res.json({
      ...user,
      badges: badgesRes.rows,
      stats: {
        ...stats,
        total_verifications: parseInt(verificationCountRes.rows[0].count || 0)
      }
    });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Failed to get user data' });
  }
});

module.exports = router;
