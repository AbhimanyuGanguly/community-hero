const express = require('express');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');
const { db } = require('../database');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { analyzeIssue, generatePredictions, generateGrievanceLetter } = require('../gemini');

const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../public/uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `issue-${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB to accommodate short videos
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|mp4|mov|webm|ogg/;
    const extValid = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimeValid = allowed.test(file.mimetype.split('/')[1]) || file.mimetype.startsWith('video/');
    cb(null, extValid && mimeValid);
  }
});

// GET /api/issues - List issues with filters
router.get('/', optionalAuth, (req, res) => {
  try {
    const { category, status, severity, search, sort, limit, offset, author_id } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (category && category !== 'all') {
      whereClause += ' AND i.category = ?';
      params.push(category);
    }
    if (status && status !== 'all') {
      whereClause += ' AND i.status = ?';
      params.push(status);
    }
    if (severity && severity !== 'all') {
      whereClause += ' AND i.severity = ?';
      params.push(severity);
    }
    if (author_id) {
      if (author_id === 'me' && req.user) {
        whereClause += ' AND i.reported_by = ?';
        params.push(req.user.id);
      } else if (author_id !== 'me') {
        whereClause += ' AND i.reported_by = ?';
        params.push(author_id);
      }
    }
    if (search) {
      whereClause += ' AND (i.title LIKE ? OR i.description LIKE ? OR i.address LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    let orderClause = 'ORDER BY i.created_at DESC';
    if (sort === 'upvotes') orderClause = 'ORDER BY i.upvotes DESC';
    else if (sort === 'severity') orderClause = "ORDER BY CASE i.severity WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END";
    else if (sort === 'oldest') orderClause = 'ORDER BY i.created_at ASC';

    const limitVal = Math.min(parseInt(limit) || 50, 100);
    const offsetVal = parseInt(offset) || 0;

    const issues = db.prepare(`
      SELECT i.*, u.name as reporter_name
      FROM issues i
      LEFT JOIN users u ON i.reported_by = u.id
      ${whereClause}
      ${orderClause}
      LIMIT ? OFFSET ?
    `).all(...params, limitVal, offsetVal);

    const total = db.prepare(`
      SELECT COUNT(*) as count FROM issues i ${whereClause}
    `).get(...params).count;

    res.json({ issues, total });
  } catch (err) {
    console.error('List issues error:', err);
    res.status(500).json({ error: 'Failed to fetch issues' });
  }
});

// GET /api/issues/stats - Aggregate stats for dashboard
router.get('/stats', (req, res) => {
  try {
    const totalIssues = db.prepare('SELECT COUNT(*) as count FROM issues').get().count;
    const resolvedIssues = db.prepare("SELECT COUNT(*) as count FROM issues WHERE status = 'resolved'").get().count;
    const activeMembers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;

    // Average resolution time (days)
    const avgResolution = db.prepare(`
      SELECT AVG(julianday(resolved_at) - julianday(created_at)) as avg_days
      FROM issues WHERE resolved_at IS NOT NULL
    `).get();

    // Issues by category
    const byCategory = db.prepare(`
      SELECT category, COUNT(*) as count
      FROM issues GROUP BY category ORDER BY count DESC
    `).all();

    // Issues by status
    const byStatus = db.prepare(`
      SELECT status, COUNT(*) as count
      FROM issues GROUP BY status ORDER BY count DESC
    `).all();

    // Issues by severity
    const bySeverity = db.prepare(`
      SELECT severity, COUNT(*) as count
      FROM issues GROUP BY severity
    `).all();

    // Trend data (last 30 days)
    const trend = db.prepare(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM issues
      WHERE created_at >= datetime('now', '-30 days')
      GROUP BY DATE(created_at)
      ORDER BY date
    `).all();

    // Top areas
    const topAreas = db.prepare(`
      SELECT address, COUNT(*) as count
      FROM issues
      GROUP BY address
      ORDER BY count DESC
      LIMIT 8
    `).all();

    // Recent activity
    const recentIssues = db.prepare(`
      SELECT i.id, i.title, i.status, i.category, i.created_at, u.name as reporter_name
      FROM issues i
      LEFT JOIN users u ON i.reported_by = u.id
      ORDER BY i.created_at DESC
      LIMIT 10
    `).all();

    res.json({
      summary: {
        totalIssues,
        resolvedIssues,
        activeMembers,
        avgResolutionDays: avgResolution.avg_days ? Math.round(avgResolution.avg_days * 10) / 10 : 0,
        resolutionRate: totalIssues > 0 ? Math.round((resolvedIssues / totalIssues) * 100) : 0
      },
      byCategory,
      byStatus,
      bySeverity,
      trend,
      topAreas,
      recentActivity: recentIssues
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /api/issues/predictions - AI predictions
router.get('/predictions', async (req, res) => {
  try {
    const stats = db.prepare(`
      SELECT category, COUNT(*) as count,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved,
        SUM(CASE WHEN created_at >= datetime('now', '-7 days') THEN 1 ELSE 0 END) as last_week
      FROM issues GROUP BY category
    `).all();

    const result = await generatePredictions(stats);
    res.json(result);
  } catch (err) {
    console.error('Predictions error:', err);
    res.status(500).json({ error: 'Failed to generate predictions' });
  }
});

// GET /api/issues/:id - Get single issue
router.get('/:id', optionalAuth, (req, res) => {
  try {
    const issue = db.prepare(`
      SELECT i.*, u.name as reporter_name
      FROM issues i
      LEFT JOIN users u ON i.reported_by = u.id
      WHERE i.id = ?
    `).get(req.params.id);

    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    // Get comments
    const comments = db.prepare(`
      SELECT c.*, u.name as user_name
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.issue_id = ?
      ORDER BY c.created_at ASC
    `).all(req.params.id);

    // Get verifiers
    const verifiers = db.prepare(`
      SELECT v.created_at, u.name as user_name
      FROM verifications v
      LEFT JOIN users u ON v.user_id = u.id
      WHERE v.issue_id = ?
    `).all(req.params.id);

    // Check if current user upvoted/verified
    let userUpvoted = false;
    let userVerified = false;
    if (req.user) {
      userUpvoted = !!db.prepare(
        'SELECT 1 FROM user_upvotes WHERE issue_id = ? AND user_id = ?'
      ).get(req.params.id, req.user.id);
      userVerified = !!db.prepare(
        'SELECT 1 FROM verifications WHERE issue_id = ? AND user_id = ?'
      ).get(req.params.id, req.user.id);
    }

    res.json({ ...issue, comments, verifiers, userUpvoted, userVerified });
  } catch (err) {
    console.error('Get issue error:', err);
    res.status(500).json({ error: 'Failed to fetch issue' });
  }
});

// POST /api/issues - Create new issue
router.post('/', requireAuth, upload.single('image'), async (req, res) => {
  try {
    const { title, description, category, severity, lat, lng, address } = req.body;

    if (!title || !description || !lat || !lng) {
      return res.status(400).json({ error: 'Title, description, latitude, and longitude are required' });
    }

    const id = uuidv4();
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    // AI categorization (we do not use AI on the image/video anymore)
    let aiResult = { category: category || 'other', confidence: 0, severity: severity || 'medium', summary: '' };
    try {
      aiResult = await analyzeIssue(title, description, null);
    } catch (e) {
      console.error('AI analysis error:', e.message);
    }

    const finalCategory = category || aiResult.category;
    const finalSeverity = severity || aiResult.severity;

    db.prepare(`
      INSERT INTO issues (id, title, description, category, severity, status, lat, lng, address, image_url, reported_by, ai_category, ai_confidence)
      VALUES (?, ?, ?, ?, ?, 'reported', ?, ?, ?, ?, ?, ?, ?)
    `).run(id, title, description, finalCategory, finalSeverity, parseFloat(lat), parseFloat(lng), address || '', imageUrl, req.user.id, aiResult.category, aiResult.confidence);

    // Award points for reporting
    db.prepare('UPDATE users SET points = points + 10 WHERE id = ?').run(req.user.id);

    // Check for badge: first_responder
    const issueCount = db.prepare(
      'SELECT COUNT(*) as count FROM issues WHERE reported_by = ?'
    ).get(req.user.id).count;

    if (issueCount === 1) {
      db.prepare(
        'INSERT OR IGNORE INTO badges (id, user_id, badge_type) VALUES (?, ?, ?)'
      ).run(uuidv4(), req.user.id, 'first_responder');
    }

    const issue = db.prepare(`
      SELECT i.*, u.name as reporter_name
      FROM issues i LEFT JOIN users u ON i.reported_by = u.id
      WHERE i.id = ?
    `).get(id);

    res.status(201).json({ issue, aiSuggestion: aiResult });
  } catch (err) {
    console.error('Create issue error:', err);
    res.status(500).json({ error: 'Failed to create issue' });
  }
});

// POST /api/issues/:id/analyze - AI analyze (without creating)
router.post('/:id/analyze', async (req, res) => {
  try {
    const { title, description } = req.body;
    const result = await analyzeIssue(title || '', description || '', null);
    res.json(result);
  } catch (err) {
    console.error('Analyze error:', err);
    res.status(500).json({ error: 'AI analysis failed' });
  }
});

// POST /api/issues/analyze - AI analyze text before submission
router.post('/analyze', upload.single('image'), async (req, res) => {
  try {
    const { title, description } = req.body;
    // We do not use AI on the media
    const result = await analyzeIssue(title || '', description || '', null);
    res.json(result);
  } catch (err) {
    console.error('Analyze error:', err);
    res.status(500).json({ error: 'AI analysis failed' });
  }
});

// PATCH /api/issues/:id/status - Update status
router.patch('/:id/status', requireAuth, (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['reported', 'verified', 'in_progress', 'resolved'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const oldIssue = db.prepare('SELECT status, reported_by, verifications, gov_filed FROM issues WHERE id = ?').get(req.params.id);
    if (!oldIssue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    const resolvedAt = status === 'resolved' ? new Date().toISOString() : null;

    db.prepare(`
      UPDATE issues SET status = ?, updated_at = datetime('now'), resolved_at = COALESCE(?, resolved_at)
      WHERE id = ?
    `).run(status, resolvedAt, req.params.id);

    // Award points if resolved (to reporter), but ONLY if it has community backing
    // This prevents the exploit of users spamming fake issues and resolving them.
    if (status === 'resolved' && oldIssue.status !== 'resolved') {
      if (oldIssue.verifications >= 2 || oldIssue.gov_filed === 1) {
        db.prepare('UPDATE users SET points = points + 20 WHERE id = ?').run(oldIssue.reported_by);

        // Check for problem_solver badge
        const resolvedCount = db.prepare(
          "SELECT COUNT(*) as count FROM issues WHERE reported_by = ? AND status = 'resolved'"
        ).get(oldIssue.reported_by).count;
        if (resolvedCount >= 3) {
          db.prepare(
            'INSERT OR IGNORE INTO badges (id, user_id, badge_type) VALUES (?, ?, ?)'
          ).run(uuidv4(), oldIssue.reported_by, 'problem_solver');
        }
      }
    }

    const updated = db.prepare('SELECT * FROM issues WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// POST /api/issues/:id/upvote - Toggle upvote
router.post('/:id/upvote', requireAuth, (req, res) => {
  try {
    const existing = db.prepare(
      'SELECT 1 FROM user_upvotes WHERE issue_id = ? AND user_id = ?'
    ).get(req.params.id, req.user.id);

    if (existing) {
      db.prepare('DELETE FROM user_upvotes WHERE issue_id = ? AND user_id = ?')
        .run(req.params.id, req.user.id);
      db.prepare('UPDATE issues SET upvotes = MAX(0, upvotes - 1) WHERE id = ?')
        .run(req.params.id);
    } else {
      db.prepare('INSERT INTO user_upvotes (issue_id, user_id) VALUES (?, ?)')
        .run(req.params.id, req.user.id);
      db.prepare('UPDATE issues SET upvotes = upvotes + 1 WHERE id = ?')
        .run(req.params.id);

      // Award 1 point to upvoter
      db.prepare('UPDATE users SET points = points + 1 WHERE id = ?').run(req.user.id);
    }

    const issue = db.prepare('SELECT upvotes FROM issues WHERE id = ?').get(req.params.id);
    res.json({ upvotes: issue.upvotes, upvoted: !existing });
  } catch (err) {
    console.error('Upvote error:', err);
    res.status(500).json({ error: 'Failed to upvote' });
  }
});

// DELETE /api/issues/:id - Delete an issue
router.delete('/:id', requireAuth, (req, res) => {
  try {
    const issue = db.prepare('SELECT reported_by FROM issues WHERE id = ?').get(req.params.id);
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }
    
    // Check if the user is the reporter
    if (issue.reported_by !== req.user.id) {
      return res.status(403).json({ error: 'You are not authorized to delete this issue' });
    }

    // Manually cascade deletes to avoid foreign key constraints
    db.prepare('DELETE FROM comments WHERE issue_id = ?').run(req.params.id);
    db.prepare('DELETE FROM verifications WHERE issue_id = ?').run(req.params.id);
    db.prepare('DELETE FROM user_upvotes WHERE issue_id = ?').run(req.params.id);

    db.prepare('DELETE FROM issues WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete issue error:', err);
    res.status(500).json({ error: 'Failed to delete issue' });
  }
});

// POST /api/issues/:id/verify - Verify issue
router.post('/:id/verify', requireAuth, (req, res) => {
  try {
    const existing = db.prepare(
      'SELECT 1 FROM verifications WHERE issue_id = ? AND user_id = ?'
    ).get(req.params.id, req.user.id);

    if (existing) {
      return res.status(409).json({ error: 'You have already verified this issue' });
    }

    db.prepare('INSERT INTO verifications (id, issue_id, user_id) VALUES (?, ?, ?)')
      .run(uuidv4(), req.params.id, req.user.id);
    db.prepare('UPDATE issues SET verifications = verifications + 1 WHERE id = ?')
      .run(req.params.id);

    // Award 5 points for verifying
    db.prepare('UPDATE users SET points = points + 5 WHERE id = ?').run(req.user.id);

    // Check for eagle_eye badge (5 verifications)
    const verifyCount = db.prepare(
      'SELECT COUNT(*) as count FROM verifications WHERE user_id = ?'
    ).get(req.user.id).count;
    if (verifyCount >= 5) {
      db.prepare(
        'INSERT OR IGNORE INTO badges (id, user_id, badge_type) VALUES (?, ?, ?)'
      ).run(uuidv4(), req.user.id, 'eagle_eye');
    }

    const issue = db.prepare('SELECT verifications FROM issues WHERE id = ?').get(req.params.id);
    res.json({ verifications: issue.verifications });
  } catch (err) {
    console.error('Verify error:', err);
    res.status(500).json({ error: 'Failed to verify' });
  }
});

// POST /api/issues/:id/comments - Add comment
router.post('/:id/comments', requireAuth, (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    const id = uuidv4();
    db.prepare('INSERT INTO comments (id, issue_id, user_id, text) VALUES (?, ?, ?, ?)')
      .run(id, req.params.id, req.user.id, text.trim());

    // Award 2 points for commenting
    db.prepare('UPDATE users SET points = points + 2 WHERE id = ?').run(req.user.id);

    // Check for community_star badge (50+ points)
    const user = db.prepare('SELECT points FROM users WHERE id = ?').get(req.user.id);
    if (user.points >= 50) {
      db.prepare(
        'INSERT OR IGNORE INTO badges (id, user_id, badge_type) VALUES (?, ?, ?)'
      ).run(uuidv4(), req.user.id, 'community_star');
    }

    const comment = db.prepare(`
      SELECT c.*, u.name as user_name
      FROM comments c LEFT JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `).get(id);

    res.status(201).json(comment);
  } catch (err) {
    console.error('Comment error:', err);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// GET /api/issues/:id/gov-draft - Generate AI grievance letter draft
router.get('/:id/gov-draft', optionalAuth, async (req, res) => {
  try {
    const issue = db.prepare('SELECT * FROM issues WHERE id = ?').get(req.params.id);
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    const authority = req.query.authority || null;

    // Call Gemini helper to generate the draft
    const draft = await generateGrievanceLetter(
      issue.title,
      issue.description,
      issue.category,
      issue.address,
      issue.lat,
      issue.lng,
      issue.upvotes || 0,
      issue.verifications || 0,
      authority
    );

    res.json(draft);
  } catch (err) {
    console.error('Grievance draft error:', err);
    res.status(500).json({ error: 'Failed to generate grievance letter draft' });
  }
});

// POST /api/issues/:id/gov-file - Record filing with government portal
router.post('/:id/gov-file', requireAuth, async (req, res) => {
  try {
    const { gov_authority, gov_complaint_id } = req.body;
    if (!gov_authority || !gov_complaint_id || !gov_complaint_id.trim()) {
      return res.status(400).json({ error: 'Government Authority and Complaint ID are required' });
    }

    const issue = db.prepare('SELECT * FROM issues WHERE id = ?').get(req.params.id);
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    // Trigger RPA AI Verification
    const { verifyGrievance } = require('../rpa');
    const isVerified = await verifyGrievance(gov_complaint_id.trim());

    if (!isVerified) {
      return res.status(400).json({ error: 'AI Verification Failed. The provided Ticket ID could not be found or verified on the official tracking portal.' });
    }

    const govFiledAt = new Date().toISOString();
    const govFiledBy = req.user.id;

    // Update issue table
    db.prepare(`
      UPDATE issues 
      SET gov_filed = 1, gov_authority = ?, gov_complaint_id = ?, gov_filed_at = ?, gov_filed_by = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(gov_authority, gov_complaint_id.trim(), govFiledAt, govFiledBy, req.params.id);

    // Award +15 points to the user who filed it
    db.prepare('UPDATE users SET points = points + 15 WHERE id = ?').run(req.user.id);

    // Add a system comment recording this event and AI verification
    const commentId = uuidv4();
    const systemCommentText = `🏛️ Grievance officially filed with **${gov_authority}**.\nGovt Complaint ID/Ticket Ref: \`${gov_complaint_id.trim()}\`.\n\n✅ *Status verified via AI Browser Agent.*`;
    
    db.prepare(`
      INSERT INTO comments (id, issue_id, user_id, text, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(commentId, req.params.id, req.user.id, systemCommentText, govFiledAt);

    // Check for "Civic Champion" badge: awarded if user has filed 2 or more issues with the government
    const govFilesCount = db.prepare(
      'SELECT COUNT(*) as count FROM issues WHERE gov_filed_by = ?'
    ).get(req.user.id).count;

    if (govFilesCount >= 2) {
      db.prepare(
        'INSERT OR IGNORE INTO badges (id, user_id, badge_type) VALUES (?, ?, ?)'
      ).run(uuidv4(), req.user.id, 'civic_champion');
    }

    // Return the updated issue with user name who filed it
    const updatedIssue = db.prepare(`
      SELECT i.*, u.name as reporter_name
      FROM issues i
      LEFT JOIN users u ON i.reported_by = u.id
      WHERE i.id = ?
    `).get(req.params.id);

    res.json(updatedIssue);
  } catch (err) {
    console.error('Gov file error:', err);
    res.status(500).json({ error: 'Failed to record government filing details' });
  }
});

// DELETE /api/issues/:id - Delete an issue
router.delete('/:id', requireAuth, (req, res) => {
  try {
    const issue = db.prepare('SELECT * FROM issues WHERE id = ?').get(req.params.id);
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    if (issue.reported_by !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own reports' });
    }

    db.prepare('DELETE FROM comments WHERE issue_id = ?').run(req.params.id);
    db.prepare('DELETE FROM user_upvotes WHERE issue_id = ?').run(req.params.id);
    db.prepare('DELETE FROM verifications WHERE issue_id = ?').run(req.params.id);
    db.prepare('DELETE FROM issues WHERE id = ?').run(req.params.id);

    res.json({ success: true });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Failed to delete issue' });
  }
});

module.exports = router;
