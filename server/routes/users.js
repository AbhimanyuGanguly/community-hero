const express = require('express');
const { db } = require('../database');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/users/leaderboard
router.get('/leaderboard', (req, res) => {
  try {
    const users = db.prepare(`
      SELECT
        u.id, u.name, u.points, u.created_at,
        (SELECT COUNT(*) FROM issues WHERE reported_by = u.id) as issues_reported,
        (SELECT COUNT(*) FROM issues WHERE reported_by = u.id AND status = 'resolved') as issues_resolved,
        (SELECT COUNT(*) FROM verifications WHERE user_id = u.id) as verifications_count
      FROM users u
      ORDER BY u.points DESC
      LIMIT 50
    `).all();

    // Attach badges for each user
    const getBadges = db.prepare('SELECT badge_type, earned_at FROM badges WHERE user_id = ?');
    const result = users.map((user, index) => ({
      ...user,
      rank: index + 1,
      badges: getBadges.all(user.id)
    }));

    res.json(result);
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// GET /api/users/:id/stats
router.get('/:id/stats', (req, res) => {
  try {
    const user = db.prepare(
      'SELECT id, name, points, created_at FROM users WHERE id = ?'
    ).get(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const stats = db.prepare(`
      SELECT
        COUNT(*) as total_reported,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as total_resolved,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as total_in_progress
      FROM issues WHERE reported_by = ?
    `).get(req.params.id);

    const verifications = db.prepare(
      'SELECT COUNT(*) as count FROM verifications WHERE user_id = ?'
    ).get(req.params.id);

    const badges = db.prepare(
      'SELECT badge_type, earned_at FROM badges WHERE user_id = ?'
    ).all(req.params.id);

    // Rank
    const rank = db.prepare(
      'SELECT COUNT(*) + 1 as rank FROM users WHERE points > (SELECT points FROM users WHERE id = ?)'
    ).get(req.params.id);

    res.json({
      ...user,
      ...stats,
      verifications: verifications.count,
      badges,
      rank: rank.rank
    });
  } catch (err) {
    console.error('User stats error:', err);
    res.status(500).json({ error: 'Failed to fetch user stats' });
  }
});

module.exports = router;
