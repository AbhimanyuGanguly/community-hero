const express = require('express');
const { db } = require('../database');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/users/leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const usersRes = await db.query(`
      SELECT
        u.id, u.name, u.points, u.created_at,
        (SELECT COUNT(*) FROM issues WHERE reported_by = u.id) as issues_reported,
        (SELECT COUNT(*) FROM issues WHERE reported_by = u.id AND status = 'resolved') as issues_resolved,
        (SELECT COUNT(*) FROM verifications WHERE user_id = u.id) as verifications_count
      FROM users u
      ORDER BY u.points DESC
      LIMIT 50
    `);

    const users = usersRes.rows;

    // Attach badges for each user
    const result = [];
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const badgesRes = await db.query('SELECT badge_type, earned_at FROM badges WHERE user_id = $1', [user.id]);
      
      result.push({
        ...user,
        issues_reported: parseInt(user.issues_reported || 0),
        issues_resolved: parseInt(user.issues_resolved || 0),
        verifications_count: parseInt(user.verifications_count || 0),
        rank: i + 1,
        badges: badgesRes.rows
      });
    }

    res.json(result);
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// GET /api/users/:id/stats
router.get('/:id/stats', async (req, res) => {
  try {
    const userRes = await db.query(
      'SELECT id, name, points, created_at FROM users WHERE id = $1',
      [req.params.id]
    );
    const user = userRes.rows[0];

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const statsRes = await db.query(`
      SELECT
        COUNT(*) as total_reported,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as total_resolved,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as total_in_progress
      FROM issues WHERE reported_by = $1
    `, [req.params.id]);

    const verificationsRes = await db.query(
      'SELECT COUNT(*) as count FROM verifications WHERE user_id = $1',
      [req.params.id]
    );

    const badgesRes = await db.query(
      'SELECT badge_type, earned_at FROM badges WHERE user_id = $1',
      [req.params.id]
    );

    // Rank
    const rankRes = await db.query(
      'SELECT COUNT(*) + 1 as rank FROM users WHERE points > (SELECT points FROM users WHERE id = $1)',
      [req.params.id]
    );

    const stats = statsRes.rows[0];

    res.json({
      ...user,
      total_reported: parseInt(stats.total_reported || 0),
      total_resolved: parseInt(stats.total_resolved || 0),
      total_in_progress: parseInt(stats.total_in_progress || 0),
      verifications: parseInt(verificationsRes.rows[0].count || 0),
      badges: badgesRes.rows,
      rank: parseInt(rankRes.rows[0].rank || 1)
    });
  } catch (err) {
    console.error('User stats error:', err);
    res.status(500).json({ error: 'Failed to fetch user stats' });
  }
});

module.exports = router;
