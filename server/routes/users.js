const express = require('express');
const { User, Issue, Verification, Badge } = require('../database');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/users/leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const users = await User.find({})
      .sort({ points: -1 })
      .limit(50)
      .lean();

    const result = [];
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const uid = user.id || user._id.toString();
      
      const issues_reported = await Issue.countDocuments({ reported_by: uid });
      const issues_resolved = await Issue.countDocuments({ reported_by: uid, status: 'resolved' });
      const verifications_count = await Verification.countDocuments({ user_id: uid });
      const badges = await Badge.find({ user_id: uid }, 'badge_type earned_at -_id').lean();

      result.push({
        ...user,
        id: uid,
        name: user.name || 'Community Hero',
        points: user.points || 0,
        issues_reported,
        issues_resolved,
        verifications_count,
        rank: i + 1,
        badges
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
    const user = await User.findOne({ id: req.params.id }, 'id name points created_at').lean();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const total_reported = await Issue.countDocuments({ reported_by: user.id });
    const total_resolved = await Issue.countDocuments({ reported_by: user.id, status: 'resolved' });
    const total_in_progress = await Issue.countDocuments({ reported_by: user.id, status: 'in_progress' });
    
    const verifications = await Verification.countDocuments({ user_id: user.id });
    const badges = await Badge.find({ user_id: user.id }, 'badge_type earned_at -_id').lean();

    const rank = await User.countDocuments({ points: { $gt: user.points } }) + 1;

    res.json({
      ...user,
      total_reported,
      total_resolved,
      total_in_progress,
      verifications,
      badges,
      rank
    });
  } catch (err) {
    console.error('User stats error:', err);
    res.status(500).json({ error: 'Failed to fetch user stats' });
  }
});

module.exports = router;
