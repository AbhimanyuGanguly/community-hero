const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { User, Badge, Issue, Verification } = require('../database');
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
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const id = uuidv4();
    const passwordHash = bcrypt.hashSync(password, 10);

    const user = await User.create({
      id,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password_hash: passwordHash
    });

    const userObj = { id: user.id, name: user.name, email: user.email, points: user.points, created_at: user.created_at };
    const token = generateToken(userObj);

    res.status(201).json({ user: userObj, token });
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

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const validPassword = bcrypt.compareSync(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const userObj = { id: user.id, name: user.name, email: user.email, points: user.points, created_at: user.created_at };
    const token = generateToken(userObj);

    res.json({ user: userObj, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Failed to log in' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findOne({ id: req.user.id }, 'id name email points created_at');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get badges
    const badges = await Badge.find({ user_id: req.user.id }, 'badge_type earned_at -_id');

    // Get issue counts
    const total_reported = await Issue.countDocuments({ reported_by: req.user.id });
    const total_resolved = await Issue.countDocuments({ reported_by: req.user.id, status: 'resolved' });

    const total_verifications = await Verification.countDocuments({ user_id: req.user.id });

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      points: user.points,
      created_at: user.created_at,
      badges,
      stats: {
        total_reported,
        total_resolved,
        total_verifications
      }
    });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Failed to get user data' });
  }
});

module.exports = router;
