const express = require('express');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Issue, User, Comment, Verification, UserUpvote, Badge } = require('../database');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { analyzeIssue, generatePredictions, generateGrievanceLetter, verifyScreenshotWithAI } = require('../gemini');

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

    const query = {};

    if (category && category !== 'all') {
      query.category = category;
    }
    if (status && status !== 'all') {
      query.status = status;
    }
    if (severity && severity !== 'all') {
      query.severity = severity;
    }
    if (author_id) {
      if (author_id === 'me' && req.user) {
        query.reported_by = req.user.id;
      } else if (author_id !== 'me') {
        query.reported_by = author_id;
      }
    }
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { address: searchRegex }
      ];
    }

    let sortObj = { created_at: -1 };
    if (sort === 'upvotes') sortObj = { upvotes: -1 };
    else if (sort === 'severity') {
      sortObj = { severity: 1, created_at: -1 }; 
    }
    else if (sort === 'oldest') sortObj = { created_at: 1 };

    const limitVal = Math.min(parseInt(limit) || 50, 100);
    const offsetVal = parseInt(offset) || 0;
    
    const issues = await Issue.find(query)
      .sort(sortObj)
      .skip(offsetVal)
      .limit(limitVal)
      .lean();

    // Map reporter_name
    for (let issue of issues) {
      const u = await User.findOne({ id: issue.reported_by }).lean();
      issue.reporter_name = u ? u.name : 'Unknown';
    }

    const total = await Issue.countDocuments(query);

    res.json({ issues, total });
  } catch (err) {
    console.error('List issues error:', err);
    res.status(500).json({ error: 'Failed to fetch issues' });
  }
});

// GET /api/issues/stats - Aggregate stats for dashboard
router.get('/stats', async (req, res) => {
  try {
    const totalIssues = await Issue.countDocuments();
    const resolvedIssues = await Issue.countDocuments({ status: 'resolved' });
    const activeMembers = await User.countDocuments();

    // Average resolution time (days)
    const avgResData = await Issue.aggregate([
      { $match: { resolved_at: { $exists: true, $ne: null } } },
      { $project: { duration: { $subtract: ["$resolved_at", "$created_at"] } } },
      { $group: { _id: null, avg_ms: { $avg: "$duration" } } }
    ]);
    const avgResolutionDays = avgResData.length ? (avgResData[0].avg_ms / (1000 * 60 * 60 * 24)) : 0;

    // Issues by category
    const byCategory = await Issue.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { _id: 0, category: "$_id", count: 1 } }
    ]);

    // Issues by status
    const byStatus = await Issue.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { _id: 0, status: "$_id", count: 1 } }
    ]);

    // Issues by severity
    const bySeverity = await Issue.aggregate([
      { $group: { _id: "$severity", count: { $sum: 1 } } },
      { $project: { _id: 0, severity: "$_id", count: 1 } }
    ]);

    // Trend data (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const trend = await Issue.aggregate([
      { $match: { created_at: { $gte: thirtyDaysAgo } } },
      { $group: { 
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } },
          count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: "$_id", count: 1 } }
    ]);

    // Top areas
    const topAreas = await Issue.aggregate([
      { $match: { address: { $exists: true, $ne: '' } } },
      { $group: { _id: "$address", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
      { $project: { _id: 0, address: "$_id", count: 1 } }
    ]);

    // Recent activity
    const recentIssues = await Issue.find({}, 'id title status category created_at reported_by')
      .sort({ created_at: -1 })
      .limit(10)
      .lean();
    for (let issue of recentIssues) {
      const u = await User.findOne({ id: issue.reported_by });
      issue.reporter_name = u ? u.name : 'Unknown';
    }

    res.json({
      summary: {
        totalIssues,
        resolvedIssues,
        activeMembers,
        avgResolutionDays: Math.round(avgResolutionDays * 10) / 10,
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
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const statsRows = await Issue.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          resolved: {
            $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] }
          },
          last_week: {
            $sum: { $cond: [{ $gte: ["$created_at", sevenDaysAgo] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          _id: 0,
          category: "$_id",
          count: 1,
          resolved: 1,
          last_week: 1
        }
      }
    ]);

    const result = await generatePredictions(statsRows);
    res.json(result);
  } catch (err) {
    console.error('Predictions error:', err);
    res.status(500).json({ error: 'Failed to generate predictions' });
  }
});

// GET /api/issues/:id - Get single issue
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const issue = await Issue.findOne({ id: req.params.id }).lean();

    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }
    
    const reporter = await User.findOne({ id: issue.reported_by }).lean();
    issue.reporter_name = reporter ? reporter.name : 'Unknown';

    // Get comments
    const commentsRaw = await Comment.find({ issue_id: req.params.id }).sort({ created_at: 1 }).lean();
    const comments = [];
    for (let c of commentsRaw) {
      const u = await User.findOne({ id: c.user_id }).lean();
      c.user_name = u ? u.name : 'Unknown';
      comments.push(c);
    }

    // Get verifiers
    const verifiersRaw = await Verification.find({ issue_id: req.params.id }).lean();
    const verifiers = [];
    for (let v of verifiersRaw) {
      const u = await User.findOne({ id: v.user_id }).lean();
      v.user_name = u ? u.name : 'Unknown';
      verifiers.push(v);
    }

    // Check if current user upvoted/verified
    let userUpvoted = false;
    let userVerified = false;
    if (req.user) {
      const upvote = await UserUpvote.findOne({ issue_id: req.params.id, user_id: req.user.id });
      userUpvoted = !!upvote;

      const verif = await Verification.findOne({ issue_id: req.params.id, user_id: req.user.id });
      userVerified = !!verif;
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

    let aiResult = { category: category || 'other', confidence: 0, severity: severity || 'medium', summary: '' };
    try {
      aiResult = await analyzeIssue(title, description, null);
    } catch (e) {
      console.error('AI analysis error:', e.message);
    }

    const finalCategory = category || aiResult.category;
    const finalSeverity = severity || aiResult.severity;

    const newIssue = await Issue.create({
      id,
      title,
      description,
      category: finalCategory,
      severity: finalSeverity,
      status: 'reported',
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      address: address || '',
      image_url: imageUrl,
      reported_by: req.user.id,
      ai_category: aiResult.category,
      ai_confidence: aiResult.confidence
    });

    // Award points
    await User.updateOne({ id: req.user.id }, { $inc: { points: 10 } });

    // Check badge
    const issueCount = await Issue.countDocuments({ reported_by: req.user.id });

    if (issueCount === 1) {
      try {
        await Badge.create({ id: uuidv4(), user_id: req.user.id, badge_type: 'first_responder' });
      } catch (e) { /* ignore */ }
    }

    const reporter = await User.findOne({ id: req.user.id }).lean();
    const issueObj = newIssue.toObject();
    issueObj.reporter_name = reporter ? reporter.name : 'Unknown';

    res.status(201).json({ issue: issueObj, aiSuggestion: aiResult });
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

    const oldIssue = await Issue.findOne({ id: req.params.id });
    if (!oldIssue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    const resolvedAt = status === 'resolved' ? new Date() : null;

    oldIssue.status = status;
    oldIssue.updated_at = new Date();
    if (resolvedAt && !oldIssue.resolved_at) {
      oldIssue.resolved_at = resolvedAt;
    }
    await oldIssue.save();

    if (status === 'resolved' && oldIssue.status !== 'resolved') {
      if (oldIssue.verifications >= 2 || oldIssue.gov_filed === 1) {
        await User.updateOne({ id: oldIssue.reported_by }, { $inc: { points: 20 } });

        const resolvedCount = await Issue.countDocuments({ reported_by: oldIssue.reported_by, status: 'resolved' });
        if (resolvedCount >= 3) {
          try {
            await Badge.create({ id: uuidv4(), user_id: oldIssue.reported_by, badge_type: 'problem_solver' });
          } catch(e) {}
        }
      }
    }

    const updatedIssue = await Issue.findOne({ id: req.params.id }).lean();
    res.json(updatedIssue);
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// POST /api/issues/:id/upvote - Toggle upvote
router.post('/:id/upvote', requireAuth, async (req, res) => {
  try {
    const existing = await UserUpvote.findOne({ issue_id: req.params.id, user_id: req.user.id });

    if (existing) {
      await UserUpvote.deleteOne({ issue_id: req.params.id, user_id: req.user.id });
      await Issue.updateOne({ id: req.params.id }, { $inc: { upvotes: -1 } });
    } else {
      await UserUpvote.create({ issue_id: req.params.id, user_id: req.user.id });
      await Issue.updateOne({ id: req.params.id }, { $inc: { upvotes: 1 } });
      await User.updateOne({ id: req.user.id }, { $inc: { points: 1 } });
    }

    const issue = await Issue.findOne({ id: req.params.id }, 'upvotes');
    const upvotes = Math.max(0, issue.upvotes);
    if (issue.upvotes < 0) {
      await Issue.updateOne({ id: req.params.id }, { upvotes: 0 });
    }
    
    res.json({ upvotes, upvoted: !existing });
  } catch (err) {
    console.error('Upvote error:', err);
    res.status(500).json({ error: 'Failed to upvote' });
  }
});

// POST /api/issues/:id/verify - Verify issue
router.post('/:id/verify', requireAuth, async (req, res) => {
  try {
    const existing = await Verification.findOne({ issue_id: req.params.id, user_id: req.user.id });

    if (existing) {
      return res.status(409).json({ error: 'You have already verified this issue' });
    }

    await Verification.create({ id: uuidv4(), issue_id: req.params.id, user_id: req.user.id });
    await Issue.updateOne({ id: req.params.id }, { $inc: { verifications: 1 } });
    await User.updateOne({ id: req.user.id }, { $inc: { points: 5 } });

    const verifyCount = await Verification.countDocuments({ user_id: req.user.id });
    if (verifyCount >= 5) {
      try {
        await Badge.create({ id: uuidv4(), user_id: req.user.id, badge_type: 'eagle_eye' });
      } catch (e) {}
    }

    const issue = await Issue.findOne({ id: req.params.id }, 'verifications');
    res.json({ verifications: issue.verifications });
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
    const comment = await Comment.create({ id, issue_id: req.params.id, user_id: req.user.id, text: text.trim() });
    
    await User.updateOne({ id: req.user.id }, { $inc: { points: 2 } });

    const user = await User.findOne({ id: req.user.id });
    if (user.points >= 50) {
      try {
        await Badge.create({ id: uuidv4(), user_id: req.user.id, badge_type: 'community_star' });
      } catch(e) {}
    }

    const commentObj = comment.toObject();
    commentObj.user_name = user.name;

    res.status(201).json(commentObj);
  } catch (err) {
    console.error('Comment error:', err);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// GET /api/issues/:id/gov-draft - Generate AI grievance letter draft
router.get('/:id/gov-draft', optionalAuth, async (req, res) => {
  try {
    const issue = await Issue.findOne({ id: req.params.id });
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
router.post('/:id/gov-file', requireAuth, upload.single('screenshot'), async (req, res) => {
  try {
    const { gov_authority, gov_complaint_id } = req.body;
    if (!gov_authority || !gov_complaint_id || !gov_complaint_id.trim()) {
      return res.status(400).json({ error: 'Government Authority and Complaint ID are required' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Screenshot verification is required' });
    }

    const issue = await Issue.findOne({ id: req.params.id });
    if (!issue) {
      // Clean up the uploaded file if issue not found
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Issue not found' });
    }

    // Read the screenshot file into base64
    const imageData = fs.readFileSync(req.file.path);
    const base64Image = imageData.toString('base64');
    
    // Clean up the uploaded file immediately to save disk space
    fs.unlinkSync(req.file.path);

    const isVerified = await verifyScreenshotWithAI(base64Image, gov_complaint_id.trim());

    if (!isVerified) {
      return res.status(400).json({ error: 'AI Verification Failed. The screenshot does not verify this Ticket ID.' });
    }

    const govFiledAt = new Date();
    
    issue.gov_filed = 1;
    issue.gov_authority = gov_authority;
    issue.gov_complaint_id = gov_complaint_id.trim();
    issue.gov_filed_at = govFiledAt;
    issue.gov_filed_by = req.user.id;
    issue.updated_at = new Date();
    await issue.save();

    await User.updateOne({ id: req.user.id }, { $inc: { points: 15 } });

    const systemCommentText = `🏛️ Grievance officially filed with **${gov_authority}**.\nGovt Complaint ID/Ticket Ref: \`${gov_complaint_id.trim()}\`.\n\n✅ *Status verified via AI Browser Agent.*`;
    
    await Comment.create({
      id: uuidv4(),
      issue_id: req.params.id,
      user_id: req.user.id,
      text: systemCommentText,
      created_at: govFiledAt
    });

    const govFilesCount = await Issue.countDocuments({ gov_filed_by: req.user.id });

    if (govFilesCount >= 2) {
      try {
        await Badge.create({ id: uuidv4(), user_id: req.user.id, badge_type: 'civic_champion' });
      } catch(e) {}
    }

    const updatedIssue = await Issue.findOne({ id: req.params.id }).lean();
    const reporter = await User.findOne({ id: updatedIssue.reported_by });
    updatedIssue.reporter_name = reporter ? reporter.name : 'Unknown';

    res.json(updatedIssue);
  } catch (err) {
    console.error('Gov file error:', err);
    res.status(500).json({ error: 'Failed to record government filing details' });
  }
});

// DELETE /api/issues/:id - Delete an issue
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const issue = await Issue.findOne({ id: req.params.id });
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    if (issue.reported_by !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own reports' });
    }

    await Comment.deleteMany({ issue_id: req.params.id });
    await UserUpvote.deleteMany({ issue_id: req.params.id });
    await Verification.deleteMany({ issue_id: req.params.id });
    await Issue.deleteOne({ id: req.params.id });

    res.json({ success: true });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Failed to delete issue' });
  }
});

module.exports = router;
