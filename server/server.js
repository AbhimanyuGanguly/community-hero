require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const { seedDatabase } = require('./database');
const { initGemini } = require('./gemini');

const authRoutes = require('./routes/auth');
const issueRoutes = require('./routes/issues');
const userRoutes = require('./routes/users');
const mockGovRoutes = require('./routes/mockGov');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ============ MIDDLEWARE ============
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// ============ API ROUTES ============
app.use('/api/auth', authRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/users', userRoutes);
app.use('/mock-gov-portal', mockGovRoutes);

// ============ SPA FALLBACK ============
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ============ ERROR HANDLER ============
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ============ START SERVER ============
async function start() {
  // Seed database with demo data
  seedDatabase();

  // Initialize Gemini AI
  initGemini();

  app.listen(PORT, () => {
    console.log('');
    console.log('🦸 ═══════════════════════════════════════════');
    console.log('   Community Hero — Hyperlocal Problem Solver');
    console.log('   ───────────────────────────────────────────');
    console.log(`   🌐 Server:  http://localhost:${PORT}`);
    console.log(`   📁 Static:  /public`);
    console.log(`   🗄️  Database: /server/data/community_hero.db`);
    console.log('🦸 ═══════════════════════════════════════════');
    console.log('');
  });
}

start();
