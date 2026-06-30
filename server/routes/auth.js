const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../database');
const { generateToken, requireAuth } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/signup
router.post('/signup', (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if email already exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const id = uuidv4();
    const passwordHash = bcrypt.hashSync(password, 10);

    db.prepare(
      'INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)'
    ).run(id, name.trim(), email.toLowerCase().trim(), passwordHash);

    const user = db.prepare(
      'SELECT id, name, email, points, created_at FROM users WHERE id = ?'
    ).get(id);

    const token = generateToken(user);

    res.status(201).json({ user, token });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = db.prepare(
      'SELECT * FROM users WHERE email = ?'
    ).get(email.toLowerCase().trim());

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
router.get('/me', requireAuth, (req, res) => {
  try {
    const user = db.prepare(
      'SELECT id, name, email, points, created_at FROM users WHERE id = ?'
    ).get(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get badges
    const badges = db.prepare(
      'SELECT badge_type, earned_at FROM badges WHERE user_id = ?'
    ).all(req.user.id);

    // Get issue counts
    const stats = db.prepare(`
      SELECT
        COUNT(*) as total_reported,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as total_resolved
      FROM issues WHERE reported_by = ?
    `).get(req.user.id);

    const verificationCount = db.prepare(
      'SELECT COUNT(*) as count FROM verifications WHERE user_id = ?'
    ).get(req.user.id);

    res.json({
      ...user,
      badges,
      stats: {
        ...stats,
        total_verifications: verificationCount.count
      }
    });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Failed to get user data' });
  }
});

module.exports = router;
