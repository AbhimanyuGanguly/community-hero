const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Define schemas
const userSchema = new mongoose.Schema({
  id: { type: String, default: uuidv4, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  points: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now }
});

const issueSchema = new mongoose.Schema({
  id: { type: String, default: uuidv4, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  severity: { type: String, default: 'medium' },
  status: { type: String, default: 'reported' },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  address: { type: String },
  image_url: { type: String },
  reported_by: { type: String },
  ai_category: { type: String },
  ai_confidence: { type: Number },
  upvotes: { type: Number, default: 0 },
  verifications: { type: Number, default: 0 },
  gov_filed: { type: Number, default: 0 },
  gov_authority: { type: String },
  gov_complaint_id: { type: String },
  gov_filed_at: { type: Date },
  gov_filed_by: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  resolved_at: { type: Date }
});

const commentSchema = new mongoose.Schema({
  id: { type: String, default: uuidv4, unique: true },
  issue_id: { type: String },
  user_id: { type: String },
  text: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

const verificationSchema = new mongoose.Schema({
  id: { type: String, default: uuidv4, unique: true },
  issue_id: { type: String },
  user_id: { type: String },
  created_at: { type: Date, default: Date.now }
});
verificationSchema.index({ issue_id: 1, user_id: 1 }, { unique: true });

const userUpvoteSchema = new mongoose.Schema({
  issue_id: { type: String },
  user_id: { type: String },
  created_at: { type: Date, default: Date.now }
});
userUpvoteSchema.index({ issue_id: 1, user_id: 1 }, { unique: true });

const badgeSchema = new mongoose.Schema({
  id: { type: String, default: uuidv4, unique: true },
  user_id: { type: String },
  badge_type: { type: String, required: true },
  earned_at: { type: Date, default: Date.now }
});
badgeSchema.index({ user_id: 1, badge_type: 1 }, { unique: true });

// Export Models
const User = mongoose.model('User', userSchema);
const Issue = mongoose.model('Issue', issueSchema);
const Comment = mongoose.model('Comment', commentSchema);
const Verification = mongoose.model('Verification', verificationSchema);
const UserUpvote = mongoose.model('UserUpvote', userUpvoteSchema);
const Badge = mongoose.model('Badge', badgeSchema);

// Fake db object so we don't crash files while transitioning
const db = {}; 

async function seedDatabase() {
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️ No DATABASE_URL provided. Skipping database initialization.');
    return;
  }

  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err);
    return;
  }

  const userCount = await User.countDocuments();
  if (userCount > 0) return; // Already seeded

  console.log('🌱 Seeding database with demo data...');

  const users = [
    { id: uuidv4(), name: 'Arjun Sharma', email: 'arjun@demo.com', password: 'demo123', points: 185 },
    { id: uuidv4(), name: 'Priya Patel', email: 'priya@demo.com', password: 'demo123', points: 240 },
    { id: uuidv4(), name: 'Rahul Verma', email: 'rahul@demo.com', password: 'demo123', points: 155 },
    { id: uuidv4(), name: 'Sneha Gupta', email: 'sneha@demo.com', password: 'demo123', points: 310 },
    { id: uuidv4(), name: 'Vikram Singh', email: 'vikram@demo.com', password: 'demo123', points: 120 },
    { id: uuidv4(), name: 'Ananya Reddy', email: 'ananya@demo.com', password: 'demo123', points: 195 },
    { id: uuidv4(), name: 'Karan Mehta', email: 'karan@demo.com', password: 'demo123', points: 88 },
    { id: uuidv4(), name: 'Divya Nair', email: 'divya@demo.com', password: 'demo123', points: 275 },
  ];

  for (const u of users) {
    const hash = bcrypt.hashSync(u.password, 10);
    await User.create({
      id: u.id,
      name: u.name,
      email: u.email,
      password_hash: hash,
      points: u.points
    });
  }

  // Delhi NCR locations for realistic seed data
  const delhiIssues = [
    {
      title: 'Large pothole on MG Road near Metro Station',
      description: 'A dangerous pothole has formed on MG Road near the Rajiv Chowk metro station exit. Multiple vehicles have been damaged. The hole is approximately 2 feet wide and 6 inches deep. Urgent repair needed before monsoon worsens it.',
      category: 'pothole',
      severity: 'high',
      status: 'verified',
      lat: 28.6328,
      lng: 77.2197,
      address: 'MG Road, Connaught Place, New Delhi',
      upvotes: 24,
      verifications: 8,
      daysAgo: 5
    },
    {
      title: 'Water pipeline leaking in Karol Bagh market',
      description: 'Continuous water leakage from a broken pipeline near Ajmal Khan Road. Water is flooding the street and causing traffic disruption. Shopkeepers are complaining about water entering their shops.',
      category: 'water',
      severity: 'critical',
      status: 'in_progress',
      lat: 28.6519,
      lng: 77.1905,
      address: 'Ajmal Khan Road, Karol Bagh, New Delhi',
      upvotes: 31,
      verifications: 12,
      daysAgo: 3
    },
    {
      title: 'Multiple streetlights not working in Dwarka Sector 21',
      description: 'At least 8 streetlights are not functioning along the main road in Sector 21, Dwarka. The area becomes very dark after 7 PM, creating safety concerns for pedestrians and especially women commuters.',
      category: 'streetlight',
      severity: 'high',
      status: 'reported',
      lat: 28.5523,
      lng: 77.0585,
      address: 'Sector 21, Dwarka, New Delhi',
      upvotes: 18,
      verifications: 6,
      daysAgo: 2
    },
    {
      title: 'Garbage dump overflowing near Noida Sector 62',
      description: 'The community waste collection point near Sector 62 has not been cleared for over a week. Garbage is spilling onto the road and causing a terrible stench. Stray animals are scattering waste further.',
      category: 'waste',
      severity: 'high',
      status: 'reported',
      lat: 28.6268,
      lng: 77.3649,
      address: 'Sector 62, Noida, Uttar Pradesh',
      upvotes: 15,
      verifications: 5,
      daysAgo: 1
    },
    {
      title: 'Road cave-in near Hauz Khas Village',
      description: 'A section of the road has caved in near Hauz Khas Village entrance. The affected area is about 3x3 meters. This is extremely dangerous for traffic. Police have placed temporary barriers but no repairs have started.',
      category: 'road',
      severity: 'critical',
      status: 'in_progress',
      lat: 28.5494,
      lng: 77.2001,
      address: 'Hauz Khas Village Road, South Delhi',
      upvotes: 42,
      verifications: 15,
      daysAgo: 7
    },
    {
      title: 'Damaged footpath in Gurgaon Cyber Hub area',
      description: 'The footpath tiles near Cyber Hub are broken and uneven, causing tripping hazards. Several pedestrians have reported injuries. The damage extends for about 200 meters along the main walking path.',
      category: 'infrastructure',
      severity: 'medium',
      status: 'verified',
      lat: 28.4945,
      lng: 77.0889,
      address: 'DLF Cyber City, Gurgaon, Haryana',
      upvotes: 11,
      verifications: 4,
      daysAgo: 8
    },
    {
      title: 'Open manhole cover missing on Lajpat Nagar road',
      description: 'A manhole cover is missing on the main market road in Lajpat Nagar. This is extremely dangerous, especially at night. Someone has placed a few bricks around it as a temporary measure, but it needs immediate attention.',
      category: 'infrastructure',
      severity: 'critical',
      status: 'resolved',
      lat: 28.5700,
      lng: 77.2373,
      address: 'Central Market, Lajpat Nagar, New Delhi',
      upvotes: 38,
      verifications: 14,
      daysAgo: 15
    },
    {
      title: 'Waterlogging in Rohini Sector 7 underpass',
      description: 'The underpass near Rohini Sector 7 metro station gets severely waterlogged even with light rain. Vehicles get stuck and water reaches up to 2 feet during heavy rain. Drainage system needs major upgrade.',
      category: 'water',
      severity: 'high',
      status: 'reported',
      lat: 28.7158,
      lng: 77.1143,
      address: 'Sector 7 Underpass, Rohini, New Delhi',
      upvotes: 22,
      verifications: 9,
      daysAgo: 4
    },
    {
      title: 'Broken park bench and damaged swings in Nehru Park',
      description: 'Multiple amenities in Nehru Park are in disrepair. Two benches are broken, the swings in the children\'s area are rusty and unsafe, and the jogging track has several potholes.',
      category: 'infrastructure',
      severity: 'medium',
      status: 'verified',
      lat: 28.5937,
      lng: 77.1937,
      address: 'Nehru Park, Chanakyapuri, New Delhi',
      upvotes: 9,
      verifications: 3,
      daysAgo: 10
    },
    {
      title: 'Illegal waste burning near Yamuna bank',
      description: 'Regular illegal burning of waste and plastic materials near the Yamuna bank area. The smoke is causing respiratory problems for nearby residents. This has been happening almost daily for the past two weeks.',
      category: 'waste',
      severity: 'critical',
      status: 'verified',
      lat: 28.6386,
      lng: 77.2463,
      address: 'Yamuna Bank Road, East Delhi',
      upvotes: 29,
      verifications: 11,
      daysAgo: 6
    },
    {
      title: 'Traffic signal malfunction at ITO intersection',
      description: 'The traffic signal at ITO intersection has been showing green in all directions intermittently. This has already caused 2 minor accidents today. Traffic police are managing manually but a permanent fix is needed.',
      category: 'infrastructure',
      severity: 'critical',
      status: 'in_progress',
      lat: 28.6289,
      lng: 77.2405,
      address: 'ITO Intersection, New Delhi',
      upvotes: 35,
      verifications: 13,
      daysAgo: 1
    },
    {
      title: 'Pothole cluster on NH-48 near Rajokri flyover',
      description: 'Multiple potholes on the national highway near Rajokri flyover. The road surface has deteriorated badly over a 500-meter stretch. Heavy vehicles are swerving to avoid them, creating dangerous conditions.',
      category: 'pothole',
      severity: 'high',
      status: 'reported',
      lat: 28.5194,
      lng: 77.1128,
      address: 'NH-48, near Rajokri, New Delhi',
      upvotes: 19,
      verifications: 7,
      daysAgo: 3
    },
    {
      title: 'Streetlight flickering dangerously in Greater Kailash',
      description: 'A streetlight pole in Greater Kailash I M-Block market area has exposed wires and is flickering. Sparks were seen during rain yesterday. This is an electrocution hazard that needs immediate attention.',
      category: 'streetlight',
      severity: 'critical',
      status: 'reported',
      lat: 28.5488,
      lng: 77.2338,
      address: 'M-Block Market, Greater Kailash I, New Delhi',
      upvotes: 26,
      verifications: 10,
      daysAgo: 2
    },
    {
      title: 'Sewage overflow on streets in Mayur Vihar Phase 1',
      description: 'Sewage water is overflowing from a blocked drain in Mayur Vihar Phase 1 near the market area. The foul smell makes it impossible for shopkeepers to work. Health hazard for the entire locality.',
      category: 'water',
      severity: 'high',
      status: 'resolved',
      lat: 28.6078,
      lng: 77.2964,
      address: 'Mayur Vihar Phase 1, East Delhi',
      upvotes: 33,
      verifications: 12,
      daysAgo: 12
    },
    {
      title: 'Fallen tree blocking footpath in Vasant Kunj',
      description: 'A large tree has partially fallen and is blocking the footpath near Vasant Kunj C-Block. Some branches are resting on the electricity wires. Pedestrians are forced to walk on the road.',
      category: 'road',
      severity: 'medium',
      status: 'resolved',
      lat: 28.5205,
      lng: 77.1583,
      address: 'C-Block, Vasant Kunj, New Delhi',
      upvotes: 14,
      verifications: 5,
      daysAgo: 20
    },
    {
      title: 'Construction debris dumped on Faridabad road',
      description: 'Large amounts of construction debris have been illegally dumped on the main road near Sector 29, Faridabad. It is narrowing the road and causing traffic congestion during peak hours.',
      category: 'waste',
      severity: 'medium',
      status: 'reported',
      lat: 28.4211,
      lng: 77.3078,
      address: 'Sector 29, Faridabad, Haryana',
      upvotes: 8,
      verifications: 3,
      daysAgo: 4
    },
    {
      title: 'Damaged speed breaker causing accidents in Janakpuri',
      description: 'An improperly constructed speed breaker near Janakpuri C-5 block is too high and not painted. Multiple two-wheeler riders have been thrown off their vehicles. The speed breaker has no warning signs.',
      category: 'road',
      severity: 'high',
      status: 'verified',
      lat: 28.6219,
      lng: 77.0861,
      address: 'C-5 Block, Janakpuri, New Delhi',
      upvotes: 21,
      verifications: 8,
      daysAgo: 6
    },
    {
      title: 'Public toilet facility broken in Chandni Chowk',
      description: 'The Sulabh public toilet near Chandni Chowk metro station is non-functional. All stalls are locked, water supply is cut off, and the facility is in unhygienic condition. Thousands of visitors are affected daily.',
      category: 'infrastructure',
      severity: 'high',
      status: 'reported',
      lat: 28.6562,
      lng: 77.2300,
      address: 'Chandni Chowk, Old Delhi',
      upvotes: 27,
      verifications: 9,
      daysAgo: 5
    }
  ];

  for (const issue of delhiIssues) {
    const reporterId = users[Math.floor(Math.random() * users.length)].id;
    const resolvedAt = issue.status === 'resolved' ? new Date() : null;
    
    // Calculate past date
    const d = new Date();
    d.setDate(d.getDate() - issue.daysAgo);

    await Issue.create({
      id: uuidv4(),
      title: issue.title,
      description: issue.description,
      category: issue.category,
      severity: issue.severity,
      status: issue.status,
      lat: issue.lat,
      lng: issue.lng,
      address: issue.address,
      reported_by: reporterId,
      upvotes: issue.upvotes,
      verifications: issue.verifications,
      created_at: d,
      updated_at: d,
      resolved_at: resolvedAt
    });
  }

  // Add some badges to top users
  const addBadge = async (userId, type) => {
    try {
      await Badge.create({ id: uuidv4(), user_id: userId, badge_type: type });
    } catch (e) {
      // Ignore duplicates
    }
  };

  await addBadge(users[3].id, 'first_responder');
  await addBadge(users[3].id, 'community_star');
  await addBadge(users[3].id, 'problem_solver');
  await addBadge(users[7].id, 'first_responder');
  await addBadge(users[7].id, 'eagle_eye');
  await addBadge(users[1].id, 'first_responder');
  await addBadge(users[1].id, 'community_star');
  await addBadge(users[5].id, 'first_responder');
  await addBadge(users[5].id, 'eagle_eye');
  await addBadge(users[0].id, 'first_responder');
  await addBadge(users[2].id, 'first_responder');
  await addBadge(users[4].id, 'first_responder');

  console.log(`✅ Seeded ${users.length} users and ${delhiIssues.length} issues into MongoDB`);
}

module.exports = { db, User, Issue, Comment, Verification, UserUpvote, Badge, seedDatabase };
