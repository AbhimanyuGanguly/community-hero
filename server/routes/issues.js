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
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { category, status, severity, search, sort, limit, offset, author_id } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (category && category !== 'all') {
      whereClause += ` AND i.category = $${paramIndex++}`;
      params.push(category);
    }
    if (status && status !== 'all') {
      whereClause += ` AND i.status = $${paramIndex++}`;
      params.push(status);
    }
    if (severity && severity !== 'all') {
      whereClause += ` AND i.severity = $${paramIndex++}`;
      params.push(severity);
    }
    if (author_id) {
      if (author_id === 'me' && req.user) {
        whereClause += ` AND i.reported_by = $${paramIndex++}`;
        params.push(req.user.id);
      } else if (author_id !== 'me') {
        whereClause += ` AND i.reported_by = $${paramIndex++}`;
        params.push(author_id);
      }
    }
    if (search) {
      whereClause += ` AND (i.title ILIKE $${paramIndex} OR i.description ILIKE $${paramIndex+1} OR i.address ILIKE $${paramIndex+2})`;
      const s = `%${search}%`;
      params.push(s, s, s);
      paramIndex += 3;
    }

    let orderClause = 'ORDER BY i.created_at DESC';
    if (sort === 'upvotes') orderClause = 'ORDER BY i.upvotes DESC';
    else if (sort === 'severity') orderClause = "ORDER BY CASE i.severity WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END";
    else if (sort === 'oldest') orderClause = 'ORDER BY i.created_at ASC';

    const limitVal = Math.min(parseInt(limit) || 50, 100);
    const offsetVal = parseInt(offset) || 0;
    
    const limitClause = ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limitVal, offsetVal);

    const issuesRes = await db.query(`
      SELECT i.*, u.name as reporter_name
      FROM issues i
      LEFT JOIN users u ON i.reported_by = u.id
      ${whereClause}
      ${orderClause}
      ${limitClause}
    `, params);

    // Calculate total without limit offset
    const totalParams = params.slice(0, -2);
    const totalRes = await db.query(`
      SELECT COUNT(*) as count FROM issues i ${whereClause}
    `, totalParams);

    res.json({ issues: issuesRes.rows, total: parseInt(totalRes.rows[0].count) });
  } catch (err) {
    console.error('List issues error:', err);
    res.status(500).json({ error: 'Failed to fetch issues' });
  }
});

// GET /api/issues/stats - Aggregate stats for dashboard
router.get('/stats', async (req, res) => {
  try {
    const totalIssuesRes = await db.query('SELECT COUNT(*) as count FROM issues');
    const resolvedIssuesRes = await db.query("SELECT COUNT(*) as count FROM issues WHERE status = 'resolved'");
    const activeMembersRes = await db.query('SELECT COUNT(*) as count FROM users');

    const totalIssues = parseInt(totalIssuesRes.rows[0].count);
    const resolvedIssues = parseInt(resolvedIssuesRes.rows[0].count);
    const activeMembers = parseInt(activeMembersRes.rows[0].count);

    // Average resolution time (days)
    const avgResolutionRes = await db.query(`
      SELECT AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/86400.0) as avg_days
      FROM issues WHERE resolved_at IS NOT NULL
    `);

    // Issues by category
    const byCategoryRes = await db.query(`
      SELECT category, COUNT(*) as count
      FROM issues GROUP BY category ORDER BY count DESC
    `);

    // Issues by status
    const byStatusRes = await db.query(`
      SELECT status, COUNT(*) as count
      FROM issues GROUP BY status ORDER BY count DESC
    `);

    // Issues by severity
    const bySeverityRes = await db.query(`
      SELECT severity, COUNT(*) as count
      FROM issues GROUP BY severity
    `);

    // Trend data (last 30 days)
    const trendRes = await db.query(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM issues
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date
    `);

    // Top areas
    const topAreasRes = await db.query(`
      SELECT address, COUNT(*) as count
      FROM issues
      WHERE address IS NOT NULL AND address != ''
      GROUP BY address
      ORDER BY count DESC
      LIMIT 8
    `);

    // Recent activity
    const recentIssuesRes = await db.query(`
      SELECT i.id, i.title, i.status, i.category, i.created_at, u.name as reporter_name
      FROM issues i
      LEFT JOIN users u ON i.reported_by = u.id
      ORDER BY i.created_at DESC
      LIMIT 10
    `);

    // Format all counts as numbers
    const formatCount = (rows) => rows.map(r => ({ ...r, count: parseInt(r.count) }));

    res.json({
      summary: {
        totalIssues,
        resolvedIssues,
        activeMembers,
        avgResolutionDays: avgResolutionRes.rows[0].avg_days ? Math.round(parseFloat(avgResolutionRes.rows[0].avg_days) * 10) / 10 : 0,
        resolutionRate: totalIssues > 0 ? Math.round((resolvedIssues / totalIssues) * 100) : 0
      },
      byCategory: formatCount(byCategoryRes.rows),
      byStatus: formatCount(byStatusRes.rows),
      bySeverity: formatCount(bySeverityRes.rows),
      trend: formatCount(trendRes.rows),
      topAreas: formatCount(topAreasRes.rows),
      recentActivity: recentIssuesRes.rows
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /api/issues/predictions - AI predictions
router.get('/predictions', async (req, res) => {
  try {
    const statsRes = await db.query(`
      SELECT category, COUNT(*) as count,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved,
        SUM(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 ELSE 0 END) as last_week
      FROM issues GROUP BY category
    `);

    const result = await generatePredictions(statsRes.rows);
    res.json(result);
  } catch (err) {
    console.error('Predictions error:', err);
    res.status(500).json({ error: 'Failed to generate predictions' });
  }
});

// GET /api/issues/:id - Get single issue
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const issueRes = await db.query(`
      SELECT i.*, u.name as reporter_name
      FROM issues i
      LEFT JOIN users u ON i.reported_by = u.id
      WHERE i.id = $1
    `, [req.params.id]);

    const issue = issueRes.rows[0];

    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    // Get comments
    const commentsRes = await db.query(`
      SELECT c.*, u.name as user_name
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.issue_id = $1
      ORDER BY c.created_at ASC
    `, [req.params.id]);

    // Get verifiers
    const verifiersRes = await db.query(`
      SELECT v.created_at, u.name as user_name
      FROM verifications v
      LEFT JOIN users u ON v.user_id = u.id
      WHERE v.issue_id = $1
    `, [req.params.id]);

    // Check if current user upvoted/verified
    let userUpvoted = false;
    let userVerified = false;
    if (req.user) {
      const upvoteRes = await db.query(
        'SELECT 1 FROM user_upvotes WHERE issue_id = $1 AND user_id = $2',
        [req.params.id, req.user.id]
      );
      userUpvoted = upvoteRes.rows.length > 0;

      const verifRes = await db.query(
        'SELECT 1 FROM verifications WHERE issue_id = $1 AND user_id = $2',
        [req.params.id, req.user.id]
      );
      userVerified = verifRes.rows.length > 0;
    }

    res.json({ ...issue, comments: commentsRes.rows, verifiers: verifiersRes.rows, userUpvoted, userVerified });
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

    let aiResult = { category: category || 'other', confidence: 0, severity: severity || 'medium', summary: '' };
    try {
      aiResult = await analyzeIssue(title, description, null);
    } catch (e) {
      console.error('AI analysis error:', e.message);
    }

    const finalCategory = category || aiResult.category;
    const finalSeverity = severity || aiResult.severity;

    await db.query(`
      INSERT INTO issues (id, title, description, category, severity, status, lat, lng, address, image_url, reported_by, ai_category, ai_confidence)
      VALUES ($1, $2, $3, $4, $5, 'reported', $6, $7, $8, $9, $10, $11, $12)
    `, [id, title, description, finalCategory, finalSeverity, parseFloat(lat), parseFloat(lng), address || '', imageUrl, req.user.id, aiResult.category, aiResult.confidence]);

    // Award points
    await db.query('UPDATE users SET points = points + 10 WHERE id = $1', [req.user.id]);

    // Check badge
    const issueCountRes = await db.query(
      'SELECT COUNT(*) as count FROM issues WHERE reported_by = $1',
      [req.user.id]
    );

    if (parseInt(issueCountRes.rows[0].count) === 1) {
      await db.query(
        'INSERT INTO badges (id, user_id, badge_type) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
        [uuidv4(), req.user.id, 'first_responder']
      );
    }

    const newIssueRes = await db.query(`
      SELECT i.*, u.name as reporter_name
      FROM issues i LEFT JOIN users u ON i.reported_by = u.id
      WHERE i.id = $1
    `, [id]);

    res.status(201).json({ issue: newIssueRes.rows[0], aiSuggestion: aiResult });
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
    const result = await analyzeIssue(title || '', description || '', null);
    res.json(result);
  } catch (err) {
    console.error('Analyze error:', err);
    res.status(500).json({ error: 'AI analysis failed' });
  }
});

// PATCH /api/issues/:id/status - Update status
router.patch('/:id/status', requireAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['reported', 'verified', 'in_progress', 'resolved'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const oldIssueRes = await db.query('SELECT status, reported_by, verifications, gov_filed FROM issues WHERE id = $1', [req.params.id]);
    const oldIssue = oldIssueRes.rows[0];
    
    if (!oldIssue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    const resolvedAt = status === 'resolved' ? new Date().toISOString() : null;

    await db.query(`
      UPDATE issues SET status = $1, updated_at = NOW(), resolved_at = COALESCE($2, resolved_at)
      WHERE id = $3
    `, [status, resolvedAt, req.params.id]);

    if (status === 'resolved' && oldIssue.status !== 'resolved') {
      if (oldIssue.verifications >= 2 || oldIssue.gov_filed === 1) {
        await db.query('UPDATE users SET points = points + 20 WHERE id = $1', [oldIssue.reported_by]);

        const resolvedCountRes = await db.query(
          "SELECT COUNT(*) as count FROM issues WHERE reported_by = $1 AND status = 'resolved'",
          [oldIssue.reported_by]
        );
        if (parseInt(resolvedCountRes.rows[0].count) >= 3) {
          await db.query(
            'INSERT INTO badges (id, user_id, badge_type) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
            [uuidv4(), oldIssue.reported_by, 'problem_solver']
          );
        }
      }
    }

    const updatedRes = await db.query('SELECT * FROM issues WHERE id = $1', [req.params.id]);
    res.json(updatedRes.rows[0]);
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// POST /api/issues/:id/upvote - Toggle upvote
router.post('/:id/upvote', requireAuth, async (req, res) => {
  try {
    const existingRes = await db.query(
      'SELECT 1 FROM user_upvotes WHERE issue_id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (existingRes.rows.length > 0) {
      await db.query('DELETE FROM user_upvotes WHERE issue_id = $1 AND user_id = $2', [req.params.id, req.user.id]);
      await db.query('UPDATE issues SET upvotes = GREATEST(0, upvotes - 1) WHERE id = $1', [req.params.id]);
    } else {
      await db.query('INSERT INTO user_upvotes (issue_id, user_id) VALUES ($1, $2)', [req.params.id, req.user.id]);
      await db.query('UPDATE issues SET upvotes = upvotes + 1 WHERE id = $1', [req.params.id]);
      await db.query('UPDATE users SET points = points + 1 WHERE id = $1', [req.user.id]);
    }

    const issueRes = await db.query('SELECT upvotes FROM issues WHERE id = $1', [req.params.id]);
    res.json({ upvotes: issueRes.rows[0].upvotes, upvoted: existingRes.rows.length === 0 });
  } catch (err) {
    console.error('Upvote error:', err);
    res.status(500).json({ error: 'Failed to upvote' });
  }
});

// POST /api/issues/:id/verify - Verify issue
router.post('/:id/verify', requireAuth, async (req, res) => {
  try {
    const existingRes = await db.query(
      'SELECT 1 FROM verifications WHERE issue_id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (existingRes.rows.length > 0) {
      return res.status(409).json({ error: 'You have already verified this issue' });
    }

    await db.query('INSERT INTO verifications (id, issue_id, user_id) VALUES ($1, $2, $3)', [uuidv4(), req.params.id, req.user.id]);
    await db.query('UPDATE issues SET verifications = verifications + 1 WHERE id = $1', [req.params.id]);
    await db.query('UPDATE users SET points = points + 5 WHERE id = $1', [req.user.id]);

    const verifyCountRes = await db.query(
      'SELECT COUNT(*) as count FROM verifications WHERE user_id = $1',
      [req.user.id]
    );
    if (parseInt(verifyCountRes.rows[0].count) >= 5) {
      await db.query(
        'INSERT INTO badges (id, user_id, badge_type) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
        [uuidv4(), req.user.id, 'eagle_eye']
      );
    }

    const issueRes = await db.query('SELECT verifications FROM issues WHERE id = $1', [req.params.id]);
    res.json({ verifications: issueRes.rows[0].verifications });
  } catch (err) {
    console.error('Verify error:', err);
    res.status(500).json({ error: 'Failed to verify' });
  }
});

// POST /api/issues/:id/comments - Add comment
router.post('/:id/comments', requireAuth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    const id = uuidv4();
    await db.query('INSERT INTO comments (id, issue_id, user_id, text) VALUES ($1, $2, $3, $4)', [id, req.params.id, req.user.id, text.trim()]);
    await db.query('UPDATE users SET points = points + 2 WHERE id = $1', [req.user.id]);

    const userRes = await db.query('SELECT points FROM users WHERE id = $1', [req.user.id]);
    if (userRes.rows[0].points >= 50) {
      await db.query(
        'INSERT INTO badges (id, user_id, badge_type) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
        [uuidv4(), req.user.id, 'community_star']
      );
    }

    const commentRes = await db.query(`
      SELECT c.*, u.name as user_name
      FROM comments c LEFT JOIN users u ON c.user_id = u.id
      WHERE c.id = $1
    `, [id]);

    res.status(201).json(commentRes.rows[0]);
  } catch (err) {
    console.error('Comment error:', err);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// GET /api/issues/:id/gov-draft - Generate AI grievance letter draft
router.get('/:id/gov-draft', optionalAuth, async (req, res) => {
  try {
    const issueRes = await db.query('SELECT * FROM issues WHERE id = $1', [req.params.id]);
    const issue = issueRes.rows[0];
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    const authority = req.query.authority || null;
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

    const issueRes = await db.query('SELECT * FROM issues WHERE id = $1', [req.params.id]);
    if (issueRes.rows.length === 0) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    const { verifyGrievance } = require('../rpa');
    const isVerified = await verifyGrievance(gov_complaint_id.trim());

    if (!isVerified) {
      return res.status(400).json({ error: 'AI Verification Failed. The provided Ticket ID could not be found or verified on the official tracking portal.' });
    }

    const govFiledAt = new Date().toISOString();
    const govFiledBy = req.user.id;

    await db.query(`
      UPDATE issues 
      SET gov_filed = 1, gov_authority = $1, gov_complaint_id = $2, gov_filed_at = $3, gov_filed_by = $4, updated_at = NOW()
      WHERE id = $5
    `, [gov_authority, gov_complaint_id.trim(), govFiledAt, govFiledBy, req.params.id]);

    await db.query('UPDATE users SET points = points + 15 WHERE id = $1', [req.user.id]);

    const commentId = uuidv4();
    const systemCommentText = `🏛️ Grievance officially filed with **${gov_authority}**.\nGovt Complaint ID/Ticket Ref: \`${gov_complaint_id.trim()}\`.\n\n✅ *Status verified via AI Browser Agent.*`;
    
    await db.query(`
      INSERT INTO comments (id, issue_id, user_id, text, created_at)
      VALUES ($1, $2, $3, $4, $5)
    `, [commentId, req.params.id, req.user.id, systemCommentText, govFiledAt]);

    const govFilesCountRes = await db.query(
      'SELECT COUNT(*) as count FROM issues WHERE gov_filed_by = $1',
      [req.user.id]
    );

    if (parseInt(govFilesCountRes.rows[0].count) >= 2) {
      await db.query(
        'INSERT INTO badges (id, user_id, badge_type) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
        [uuidv4(), req.user.id, 'civic_champion']
      );
    }

    const updatedIssueRes = await db.query(`
      SELECT i.*, u.name as reporter_name
      FROM issues i
      LEFT JOIN users u ON i.reported_by = u.id
      WHERE i.id = $1
    `, [req.params.id]);

    res.json(updatedIssueRes.rows[0]);
  } catch (err) {
    console.error('Gov file error:', err);
    res.status(500).json({ error: 'Failed to record government filing details' });
  }
});

// DELETE /api/issues/:id - Delete an issue
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const issueRes = await db.query('SELECT * FROM issues WHERE id = $1', [req.params.id]);
    const issue = issueRes.rows[0];
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    if (issue.reported_by !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own reports' });
    }

    await db.query('DELETE FROM comments WHERE issue_id = $1', [req.params.id]);
    await db.query('DELETE FROM user_upvotes WHERE issue_id = $1', [req.params.id]);
    await db.query('DELETE FROM verifications WHERE issue_id = $1', [req.params.id]);
    await db.query('DELETE FROM issues WHERE id = $1', [req.params.id]);

    res.json({ success: true });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Failed to delete issue' });
  }
});

module.exports = router;
