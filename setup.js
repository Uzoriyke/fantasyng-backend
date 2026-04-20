// =====================================================
// FantasyNG Backend — Auto Setup Script
// Run this ONE file and it creates everything
// Command: node setup.js
// ⚡ EXECUTED BY XCLUSIVE ⚡
// =====================================================
const fs = require('fs');
const path = require('path');

const files = {};

// ── package.json ──────────────────────────────────
files['package.json'] = JSON.stringify({
  name: "fantasyng-backend",
  version: "1.0.0",
  description: "FantasyNG Backend — Nigeria's Premier Linkup Platform",
  main: "server.js",
  scripts: { start: "node server.js", dev: "nodemon server.js" },
  dependencies: {
    express: "^4.18.2",
    mongoose: "^7.6.3",
    dotenv: "^16.3.1",
    jsonwebtoken: "^9.0.2",
    bcryptjs: "^2.4.3",
    "socket.io": "^4.6.1",
    cors: "^2.8.5",
    multer: "^1.4.5-lts.1",
    axios: "^1.6.0",
    "express-rate-limit": "^7.1.5",
    helmet: "^7.1.0",
    morgan: "^1.10.0",
    "xss-clean": "^0.1.4",
    "express-mongo-sanitize": "^2.2.0",
    hpp: "^0.2.3"
  },
  devDependencies: { nodemon: "^3.0.1" },
  engines: { node: ">=16.0.0" }
}, null, 2);

// ── Procfile ──────────────────────────────────────
files['Procfile'] = 'web: node server.js\n';

// ── railway.json ──────────────────────────────────
files['railway.json'] = JSON.stringify({
  "$schema": "https://railway.app/railway.schema.json",
  build: { builder: "NIXPACKS" },
  deploy: { startCommand: "node server.js", restartPolicyType: "ON_FAILURE", restartPolicyMaxRetries: 10 }
}, null, 2);

// ── .gitignore ────────────────────────────────────
files['.gitignore'] = 'node_modules/\n.env\nuploads/\n*.log\n.DS_Store\n';

// ── .env.example ─────────────────────────────────
files['.env.example'] = `# FantasyNG Backend Environment Variables
# Rename this file to .env and fill in your values
# NEVER upload .env to GitHub

PORT=5000
NODE_ENV=production

# MongoDB Atlas — free at mongodb.com/atlas
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/fantasyng?retryWrites=true&w=majority

# JWT Secret — make this long and random
JWT_SECRET=fantasyng_change_this_to_something_very_long_and_random_2025
JWT_EXPIRE=30d

# Frontend URL (strict CORS — must match exactly)
FRONTEND_URL=https://fantasyng.netlify.app

# Paystack — dashboard.paystack.com > Settings > API Keys
PAYSTACK_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PAYSTACK_PUBLIC_KEY=pk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Google Vision API — console.cloud.google.com
GOOGLE_VISION_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# OpenAI — platform.openai.com/api-keys
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

ADMIN_WHATSAPP_MAIN=2348025265700
ADMIN_WHATSAPP_ADS=2347066952351
ADMIN_EMAIL=realfantasyng@gmail.com
`;

// ── config/db.js ──────────────────────────────────
files['config/db.js'] = `const mongoose = require('mongoose');
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected: ' + conn.connection.host);
  } catch (error) {
    console.error('MongoDB Error: ' + error.message);
    process.exit(1);
  }
};
module.exports = connectDB;
`;

// ── models/User.js ────────────────────────────────
files['models/User.js'] = `const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 30 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, required: true, unique: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  gender: { type: String, enum: ['male', 'female'], required: true },
  dateOfBirth: { type: Date, required: true },
  age: { type: Number, min: 18 },
  location: {
    state: { type: String, default: '' },
    city: { type: String, default: '' },
    coordinates: { lat: { type: Number, default: null }, lng: { type: Number, default: null } }
  },
  profilePhoto: { type: String, default: '' },
  bio: { type: String, maxlength: 500, default: '' },
  interests: [{ type: String }],
  genderPreference: { type: String, enum: ['male', 'female', 'both'], default: 'both' },
  badge: { type: String, enum: ['free', 'blue', 'red', 'golden', 'executive'], default: 'free' },
  badgeExpiry: { type: Date, default: null },
  originalBadge: { type: String, default: 'free' },
  isAdminElevated: { type: Boolean, default: false },
  trustScore: { type: Number, default: 0, min: 0, max: 100 },
  metAndSafeBadges: { type: Number, default: 0 },
  role: { type: String, enum: ['member', 'moderator', 'chief_moderator', 'coo', 'ceo'], default: 'member' },
  isVerified: { type: Boolean, default: false },
  verificationLevel: { type: String, enum: ['none', 'blue', 'red', 'golden'], default: 'none' },
  strikes: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'suspended', 'banned'], default: 'active' },
  suspendedUntil: { type: Date, default: null },
  banReason: { type: String, default: '' },
  anonymousModeOn: { type: Boolean, default: false },
  ghostMode: { type: Boolean, default: false },
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  lastSeenSetting: { type: String, enum: ['exact', 'recently', 'hidden'], default: 'exact' },
  lastSeen: { type: Date, default: Date.now },
  isOnline: { type: Boolean, default: false },
  resetPasswordOTP: { type: String, default: null },
  resetPasswordExpiry: { type: Date, default: null },
  dailyMessageCount: { type: Number, default: 0 },
  dailyLikeCount: { type: Number, default: 0 },
  lastDailyReset: { type: Date, default: Date.now }
}, { timestamps: true });

UserSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash')) return next();
  const salt = await bcrypt.genSalt(12);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

UserSchema.pre('save', function(next) {
  if (this.dateOfBirth) {
    const today = new Date();
    const dob = new Date(this.dateOfBirth);
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    this.age = age;
  }
  next();
});

UserSchema.methods.comparePassword = async function(pwd) {
  return await bcrypt.compare(pwd, this.passwordHash);
};

UserSchema.methods.isBadgeExpired = function() {
  if (!this.badgeExpiry) return false;
  return new Date() > new Date(this.badgeExpiry);
};

UserSchema.methods.getMessageLimit = function() {
  const limits = { free: 20, blue: 60, red: Infinity, golden: Infinity, executive: Infinity };
  return limits[this.badge] || 20;
};

UserSchema.methods.getLikeLimit = function() {
  const limits = { free: 20, blue: 60, red: Infinity, golden: Infinity, executive: Infinity };
  return limits[this.badge] || 20;
};

module.exports = mongoose.model('User', UserSchema);
`;

// ── models/Message.js ─────────────────────────────
files['models/Message.js'] = `const mongoose = require('mongoose');
const MessageSchema = new mongoose.Schema({
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true, index: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, default: '' },
  mediaType: { type: String, enum: ['text','photo','short_video','long_video','voice','video_call'], default: 'text' },
  mediaUrl: { type: String, default: '' },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date, default: null },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  permanentDeleteAt: { type: Date, default: null },
  flagged: { type: Boolean, default: false },
  flagReason: { type: String, default: '' }
}, { timestamps: true });

MessageSchema.pre('save', function(next) {
  if (this.isModified('isDeleted') && this.isDeleted && this.deletedAt) {
    const d = new Date(this.deletedAt);
    d.setDate(d.getDate() + 90);
    this.permanentDeleteAt = d;
  }
  next();
});

module.exports = mongoose.model('Message', MessageSchema);
`;

// ── models/Chat.js ────────────────────────────────
files['models/Chat.js'] = `const mongoose = require('mongoose');
const ChatSchema = new mongoose.Schema({
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  lastMessage: { type: String, default: '' },
  lastMessageAt: { type: Date, default: Date.now },
  isArchived: { type: Boolean, default: false }
}, { timestamps: true });
module.exports = mongoose.model('Chat', ChatSchema);
`;

// ── models/Post.js ────────────────────────────────
files['models/Post.js'] = `const mongoose = require('mongoose');
const PostSchema = new mongoose.Schema({
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, default: '' },
  mediaUrls: [{ type: String }],
  mediaType: { type: String, enum: ['text','photo','short_video','long_video'], default: 'text' },
  badgeTierAtPost: { type: String, enum: ['free','blue','red','golden','executive'], default: 'free' },
  expiresAt: { type: Date, default: null },
  isPromotedToFrontPage: { type: Boolean, default: false },
  promotedAt: { type: Date, default: null },
  promotedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  isSponsored: { type: Boolean, default: false },
  sponsorName: { type: String, default: '' },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  commentsCount: { type: Number, default: 0 },
  isPinned: { type: Boolean, default: false },
  flagged: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });
module.exports = mongoose.model('Post', PostSchema);
`;

// ── models/BadgeApplication.js ────────────────────
files['models/BadgeApplication.js'] = `const mongoose = require('mongoose');
const BadgeApplicationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  badgeTier: { type: String, enum: ['blue','red','golden'], required: true },
  plan: { type: String, enum: ['monthly','3months','6months','annual'], required: true },
  submittedPhoto: { type: String, default: '' },
  submittedVideo: { type: String, default: '' },
  submittedId: { type: String, default: '' },
  googleVisionResult: { type: Object, default: {} },
  visionPassed: { type: Boolean, default: false },
  status: { type: String, enum: ['pending','approved','rejected'], default: 'pending' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reviewedAt: { type: Date, default: null },
  rejectionReason: { type: String, default: '' }
}, { timestamps: true });
module.exports = mongoose.model('BadgeApplication', BadgeApplicationSchema);
`;

// ── models/Others.js ──────────────────────────────
files['models/Others.js'] = `const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  badgeTier: { type: String, enum: ['blue','red','golden'], required: true },
  plan: { type: String, enum: ['monthly','3months','6months','annual'], required: true },
  amount: { type: Number, required: true },
  paystackReference: { type: String, required: true, unique: true },
  status: { type: String, enum: ['active','expired','cancelled'], default: 'active' },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date, required: true }
}, { timestamps: true });

const VirtualGiftSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  giftType: { type: String, enum: ['rose','diamond','crown','flame'], required: true },
  amount: { type: Number, required: true },
  platformCommission: { type: Number, required: true },
  paystackReference: { type: String, default: '' }
}, { timestamps: true });

const ReportSchema = new mongoose.Schema({
  reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reportedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isAnonymous: { type: Boolean, default: false },
  reportType: { type: String, enum: ['fake_profile','no_show','harassment','underage','scam','other'], required: true },
  description: { type: String, default: '' },
  evidence: [{ type: String }],
  status: { type: String, enum: ['pending','reviewed','resolved'], default: 'pending' },
  adminAction: { type: String, default: '' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reviewedAt: { type: Date, default: null }
}, { timestamps: true });

const ReviewSchema = new mongoose.Schema({
  reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reviewedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  showedUp: { type: Boolean, default: null },
  matchedPhotos: { type: Boolean, default: null },
  wasRespectful: { type: Boolean, default: null },
  overallRating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, default: '' },
  isAnonymous: { type: Boolean, default: false },
  isDisputed: { type: Boolean, default: false }
}, { timestamps: true });

const EventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  location: { type: String, default: '' },
  city: { type: String, default: '' },
  eventDate: { type: Date, required: true },
  ticketPrice: { type: Number, default: 0 },
  totalTickets: { type: Number, default: 0 },
  soldTickets: { type: Number, default: 0 },
  rsvpList: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isPublished: { type: Boolean, default: false }
}, { timestamps: true });

const AuditLogSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  adminRole: { type: String, required: true },
  action: { type: String, required: true },
  targetUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  details: { type: String, default: '' },
  ip: { type: String, default: '' }
}, { timestamps: true });

const StorySchema = new mongoose.Schema({
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mediaUrl: { type: String, required: true },
  mediaType: { type: String, enum: ['photo','video'], default: 'photo' },
  views: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  expiresAt: { type: Date, required: true }
}, { timestamps: true });

module.exports = {
  Subscription: mongoose.model('Subscription', SubscriptionSchema),
  VirtualGift: mongoose.model('VirtualGift', VirtualGiftSchema),
  Report: mongoose.model('Report', ReportSchema),
  Review: mongoose.model('Review', ReviewSchema),
  Event: mongoose.model('Event', EventSchema),
  AuditLog: mongoose.model('AuditLog', AuditLogSchema),
  Story: mongoose.model('Story', StorySchema)
};
`;

// ── middleware/auth.middleware.js ──────────────────
// SECURITY FEATURES: #8 Token expiry check, #9 Badge expiry auto-downgrade,
//                    #10 Suspended/banned status check
files['middleware/auth.middleware.js'] = `const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // Extract Bearer token
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized. Please log in.' });
  }

  // Reject obviously malformed tokens early (no DB hit needed)
  if (typeof token !== 'string' || token.split('.').length !== 3) {
    return res.status(401).json({ success: false, message: 'Invalid token format.' });
  }

  try {
    // SECURITY FEATURE #8 — Token expiry check with distinct error messages
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtErr) {
      if (jwtErr.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Session expired. Please log in again.', code: 'TOKEN_EXPIRED' });
      }
      if (jwtErr.name === 'JsonWebTokenError') {
        return res.status(401).json({ success: false, message: 'Invalid token. Please log in again.' });
      }
      return res.status(401).json({ success: false, message: 'Authentication failed.' });
    }

    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User account no longer exists.' });
    }

    // SECURITY FEATURE #10 — Suspended/banned status check
    if (user.status === 'banned') {
      return res.status(403).json({ success: false, message: 'Account permanently banned. Contact support if you believe this is an error.' });
    }

    if (user.status === 'suspended') {
      if (user.suspendedUntil && new Date() < new Date(user.suspendedUntil)) {
        return res.status(403).json({
          success: false,
          message: 'Account suspended until ' + user.suspendedUntil.toLocaleDateString() + '. Contact support to appeal.',
          suspendedUntil: user.suspendedUntil
        });
      } else {
        // Suspension period has ended — auto-reinstate
        user.status = 'active';
        user.suspendedUntil = null;
        await user.save();
      }
    }

    // SECURITY FEATURE #9 — Badge expiry auto-downgrade on every authenticated request
    if (!['free', 'executive'].includes(user.badge) && !user.isAdminElevated && user.isBadgeExpired()) {
      user.badge = 'free';
      user.isVerified = false;
      user.verificationLevel = 'none';
      await user.save();
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    return res.status(401).json({ success: false, message: 'Authentication failed.' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user.role === 'member') {
    return res.status(403).json({ success: false, message: 'Admin access required.' });
  }
  next();
};

const executivesOnly = (req, res, next) => {
  if (!['ceo', 'coo'].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Executives only.' });
  }
  next();
};

const ceoOnly = (req, res, next) => {
  if (req.user.role !== 'ceo') {
    return res.status(403).json({ success: false, message: 'CEO only.' });
  }
  next();
};

module.exports = { protect, adminOnly, executivesOnly, ceoOnly };
`;

// ── middleware/upload.middleware.js ───────────────
files['middleware/upload.middleware.js'] = `const multer = require('multer');
const path = require('path');
const fs = require('fs');
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname))
});
const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|mp4|mov|webm|mp3|wav/;
  if (allowed.test(path.extname(file.originalname).toLowerCase())) cb(null, true);
  else cb(new Error('Images, videos and audio only'));
};
module.exports = multer({ storage, fileFilter, limits: { fileSize: 50 * 1024 * 1024 } });
`;

// ── services/paystack.service.js ──────────────────
// PAYMENT: All Nigerian + international channels enabled
// Covers: OPay, PalmPay, Moniepoint, GTB, Access, Zenith,
// First Bank, UBA, Stanbic + all CBN-licensed banks,
// Visa/Mastercard/Verve (Nigerian + international cards)
// PayPal NOT included — Paystack does not support it
files['services/paystack.service.js'] = `const axios = require('axios');
const BASE = 'https://api.paystack.co';
const headers = () => ({ Authorization: 'Bearer ' + process.env.PAYSTACK_SECRET_KEY });

// All supported payment channels shown on checkout popup
const ALL_CHANNELS = [
  'card',           // Visa, Mastercard, Verve (Nigerian + international)
  'bank',           // Direct debit from any Nigerian bank
  'bank_transfer',  // Instant bank transfer (OPay, PalmPay, Moniepoint etc.)
  'ussd',           // USSD codes for all major Nigerian banks
  'mobile_money',   // Mobile money wallets
  'qr'              // QR code payments
];

const initializeTransaction = async ({ email, amount, metadata, callback_url }) => {
  const r = await axios.post(
    BASE + '/transaction/initialize',
    {
      email,
      amount,
      metadata,
      callback_url,
      channels: ALL_CHANNELS,  // Show ALL payment options on checkout
      currency: 'NGN'          // Nigerian Naira
    },
    { headers: headers() }
  );
  if (!r.data.status) throw new Error('Paystack init failed');
  return r.data.data;
};

const verifyTransaction = async (reference) => {
  const r = await axios.get(BASE + '/transaction/verify/' + reference, { headers: headers() });
  if (!r.data.status) throw new Error('Paystack verify failed');
  return r.data.data;
};

module.exports = { initializeTransaction, verifyTransaction };
`;

// ── services/vision.service.js ────────────────────
files['services/vision.service.js'] = `const axios = require('axios');
const fs = require('fs');
const path = require('path');

const VISION_URL = 'https://vision.googleapis.com/v1/images:annotate';

const imgToBase64 = (filePath) => {
  const full = path.join(__dirname, '..', filePath);
  if (!fs.existsSync(full)) return '';
  return fs.readFileSync(full).toString('base64');
};

const callVision = async (imageContent, features) => {
  const r = await axios.post(VISION_URL + '?key=' + process.env.GOOGLE_VISION_API_KEY, {
    requests: [{ image: { content: imageContent }, features }]
  });
  return r.data.responses[0];
};

const checkBlueBadge = async (photoPath) => {
  const content = imgToBase64(photoPath);
  if (!content) return { hasFace: false, hasFantasyNGText: false };
  const result = await callVision(content, [
    { type: 'FACE_DETECTION', maxResults: 5 },
    { type: 'TEXT_DETECTION', maxResults: 10 }
  ]);
  const faces = result.faceAnnotations || [];
  const texts = result.textAnnotations || [];
  const hasFace = faces.length > 0 && faces[0].detectionConfidence > 0.8;
  const allText = texts.map(t => t.description.toLowerCase()).join(' ');
  const hasFantasyNGText = allText.includes('fantasyng');
  return { hasFace, hasFantasyNGText };
};

const checkRedBadge = async (videoPath) => {
  const content = imgToBase64(videoPath);
  if (!content) return { hasFace: false };
  const result = await callVision(content, [{ type: 'FACE_DETECTION', maxResults: 5 }]);
  const faces = result.faceAnnotations || [];
  return { hasFace: faces.length > 0 && faces[0].detectionConfidence > 0.85 };
};

const checkGoldenBadge = async (videoPath, idPath) => {
  const idContent = imgToBase64(idPath);
  if (!idContent) return { idValid: false, faceMatches: false, isAdult: false };
  const result = await callVision(idContent, [{ type: 'DOCUMENT_TEXT_DETECTION' }, { type: 'FACE_DETECTION' }]);
  const idText = result.fullTextAnnotation ? result.fullTextAnnotation.text : '';
  const idFaces = result.faceAnnotations || [];
  const idValid = idText.length > 50 && idFaces.length > 0;
  const yearMatches = idText.match(/\\b(19[5-9]\\d|200[0-6])\\b/g);
  const isAdult = yearMatches ? (new Date().getFullYear() - parseInt(yearMatches[0])) >= 18 : false;
  return { idValid, faceMatches: idFaces.length > 0, isAdult };
};

module.exports = { checkBlueBadge, checkRedBadge, checkGoldenBadge };
`;

// ── services/moderation.service.js ───────────────
// SECURITY FEATURES: #11 Spam keyword filter, #12 OpenAI moderation,
//                    #13 Early message phone/link block
// NOTE: FantasyNG is an 18+ dating site.
// 'sexual' content between adults is ALLOWED.
// Only genuinely harmful categories are blocked.
files['services/moderation.service.js'] = `const axios = require('axios');

// SECURITY FEATURE #11 — Comprehensive spam keyword filter
const SPAM_KEYWORDS = [
  'whatsapp me', 'call me on', 'my number is', 'reach me on', 'send money',
  'wire transfer', 'bitcoin', 'forex', 'investment opportunity', 'follow my page',
  'click here', 'dm me', 'hit me up', 'contact me on', 'ping me', 'add me on',
  'my ig is', 'my snap is', 'my tele is', 'telegram me', 'my cash app',
  'bank transfer', 'crypto payment', 'make money', 'earn daily', 'guaranteed profit'
];

// Categories we actually block via OpenAI moderation.
// FantasyNG is 18+ — adult/sexual content between consenting adults is ALLOWED.
// We only block content that is illegal, dangerous or truly harmful.
const BLOCKED_CATEGORIES = [
  'sexual/minors',          // ZERO TOLERANCE — illegal, always blocked
  'hate',                   // Hate speech
  'hate/threatening',       // Threatening hate speech
  'harassment',             // Targeted harassment
  'harassment/threatening', // Threatening harassment
  'self-harm',              // Self-harm content
  'self-harm/intent',       // Expressed intent to self-harm
  'self-harm/instructions', // Instructions for self-harm
  'violence',               // Violent content
  'violence/graphic'        // Graphic violence
  // NOTE: 'sexual' is intentionally NOT listed here.
  // Adult content between consenting adults is normal on this platform.
  // 'sexual/minors' remains blocked with zero tolerance.
];

// SECURITY FEATURE #12 — OpenAI moderation API (adult-content aware)
const moderateText = async (text) => {
  if (!process.env.OPENAI_API_KEY) return { flagged: false };
  try {
    const r = await axios.post(
      'https://api.openai.com/v1/moderations',
      { input: text },
      { headers: { Authorization: 'Bearer ' + process.env.OPENAI_API_KEY }, timeout: 5000 }
    );
    const result = r.data.results[0];

    // Only flag if a BLOCKED category is triggered — not 'sexual'
    const flaggedHarmfulCategories = BLOCKED_CATEGORIES.filter(
      category => result.categories[category] === true
    );

    const isFlagged = flaggedHarmfulCategories.length > 0;
    if (isFlagged) {
      console.warn('[Moderation] Content blocked. Categories:', flaggedHarmfulCategories.join(', '));
    }

    return {
      flagged: isFlagged,
      flaggedCategories: flaggedHarmfulCategories,
      categories: result.categories
    };
  } catch (err) {
    // If OpenAI is down, fail open — don't block legitimate content
    console.warn('OpenAI moderation unavailable:', err.message);
    return { flagged: false };
  }
};

// SECURITY FEATURE #11 — Spam check
const checkSpam = (text) => {
  const lower = text.toLowerCase();
  const foundKeywords = SPAM_KEYWORDS.filter(kw => lower.includes(kw));
  // SECURITY FEATURE #13 — External link & phone detection
  const hasExternalLink = /https?:\\/\\//i.test(text);
  const hasPhoneNumber = /(\\+?234|0)[789][01]\\d{8}/.test(text);
  return {
    isSpam: foundKeywords.length > 0,
    hasPhoneNumber,
    hasExternalLink,
    foundKeywords
  };
};

module.exports = { moderateText, checkSpam };
`;

// ── utils/bot.js ──────────────────────────────────
// SECURITY FEATURES: #6 Bot daily message limit, #7 Bot daily like limit,
//                    #9 Badge expiry, #14 Mass deletion detection
files['utils/bot.js'] = `const User = require('../models/User');
const Message = require('../models/Message');
const mongoose = require('mongoose');

const runBotTasks = async () => {
  console.log('[Bot] Running scheduled tasks...');
  await Promise.all([
    expireMessages(),
    expireStories(),
    expirePosts(),
    expireBadges(),    // SECURITY FEATURE #9
    resetCounters(),   // SECURITY FEATURE #6 & #7
    checkSuspensions() // SECURITY FEATURE #10
  ]);
};

const expireMessages = async () => {
  const r = await Message.deleteMany({ permanentDeleteAt: { $lte: new Date() } });
  if (r.deletedCount > 0) console.log('[Bot] Deleted ' + r.deletedCount + ' expired messages');
};

const expireStories = async () => {
  try {
    const Story = mongoose.model('Story');
    await Story.deleteMany({ expiresAt: { $lte: new Date() } });
  } catch(e) {}
};

const expirePosts = async () => {
  try {
    const Post = mongoose.model('Post');
    await Post.updateMany(
      { expiresAt: { $lte: new Date(), $ne: null }, isDeleted: false },
      { isDeleted: true }
    );
  } catch(e) {}
};

// SECURITY FEATURE #9 — Badge expiry auto-downgrade (bot sweep)
const expireBadges = async () => {
  const r = await User.updateMany(
    {
      badge: { $in: ['blue', 'red', 'golden'] },
      badgeExpiry: { $lte: new Date() },
      isAdminElevated: false
    },
    { badge: 'free', isVerified: false, verificationLevel: 'none' }
  );
  if (r.modifiedCount > 0) console.log('[Bot] Expired ' + r.modifiedCount + ' badges');
};

// SECURITY FEATURES #6 & #7 — Reset daily message and like counters at midnight
const resetCounters = async () => {
  const midnight = new Date();
  midnight.setHours(0, 0, 0, 0);
  const r = await User.updateMany(
    { lastDailyReset: { $lt: midnight } },
    { dailyMessageCount: 0, dailyLikeCount: 0, lastDailyReset: new Date() }
  );
  if (r.modifiedCount > 0) console.log('[Bot] Reset daily counters for ' + r.modifiedCount + ' users');
};

// SECURITY FEATURE #10 — Auto-reinstate users whose suspension has expired
const checkSuspensions = async () => {
  const r = await User.updateMany(
    { status: 'suspended', suspendedUntil: { $lte: new Date() } },
    { status: 'active', suspendedUntil: null }
  );
  if (r.modifiedCount > 0) console.log('[Bot] Reinstated ' + r.modifiedCount + ' suspended users');
};

const processStrike = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return;
  user.strikes += 1;
  if (user.strikes >= 3) {
    user.status = 'suspended';
    user.suspendedUntil = new Date(Date.now() + 30 * 86400000);
  } else if (user.strikes === 2) {
    user.status = 'suspended';
    user.suspendedUntil = new Date(Date.now() + 7 * 86400000);
  }
  await user.save();
};

// SECURITY FEATURE #14 — Mass deletion detection
const checkMassDeletion = async (userId) => {
  try {
    const { Report, AuditLog } = require('../models/Others');
    const hasReport = await Report.findOne({
      reportedUserId: userId,
      status: 'pending',
      createdAt: { $gte: new Date(Date.now() - 86400000) }
    });
    if (!hasReport) return;

    const deletedCount = await Message.countDocuments({
      senderId: userId,
      isDeleted: true,
      deletedAt: { $gte: new Date(Date.now() - 3600000) }
    });

    if (deletedCount >= 10) {
      const alertMsg = '[SECURITY ALERT] User ' + userId + ' mass-deleted ' + deletedCount + ' messages within 1 hour of being reported!';
      console.warn(alertMsg);
      // Log to audit trail automatically
      try {
        await AuditLog.create({
          adminId: userId,  // self-action
          adminRole: 'system',
          action: 'MASS_DELETION_DETECTED',
          targetUserId: userId,
          details: 'Deleted ' + deletedCount + ' messages within 1 hour of receiving a report. Auto-flagged for review.'
        });
      } catch(e) {}
    }
  } catch(e) {}
};

const startBot = () => {
  console.log('[Bot] Started — running hourly tasks');
  runBotTasks();
  setInterval(runBotTasks, 60 * 60 * 1000);
};

module.exports = { startBot, checkMassDeletion, processStrike };
`;

// ── utils/helpers.js ──────────────────────────────
files['utils/helpers.js'] = `const canAwardFreeBadge = (role) => ['ceo','coo','chief_moderator'].includes(role);
const getPlanDays = (plan) => ({ monthly: 30, '3months': 90, '6months': 180, annual: 365 }[plan] || 30);
module.exports = { canAwardFreeBadge, getPlanDays };
`;

// ── sockets/chat.socket.js ────────────────────────
// SECURITY FEATURES: #6 message limit, #8 token expiry, #11 spam,
//                    #12 OpenAI mod, #13 early message phone/link block
files['sockets/chat.socket.js'] = `const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const Chat = require('../models/Chat');
const { checkSpam, moderateText } = require('../services/moderation.service');

const onlineUsers = {};

const initSocket = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth && socket.handshake.auth.token;
      if (!token) return next(new Error('No token'));

      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch(jwtErr) {
        // SECURITY FEATURE #8 — token expiry check in socket
        if (jwtErr.name === 'TokenExpiredError') {
          return next(new Error('Session expired. Please log in again.'));
        }
        return next(new Error('Invalid token'));
      }

      const user = await User.findById(decoded.id).select('-passwordHash');
      if (!user) return next(new Error('User not found'));

      // SECURITY FEATURE #10 — status check on socket connection
      if (user.status === 'banned') return next(new Error('Account banned'));
      if (user.status === 'suspended' && user.suspendedUntil && new Date() < user.suspendedUntil) {
        return next(new Error('Account suspended'));
      }

      // SECURITY FEATURE #9 — badge expiry on socket connect
      if (!['free','executive'].includes(user.badge) && !user.isAdminElevated && user.isBadgeExpired()) {
        user.badge = 'free'; user.isVerified = false; await user.save();
      }

      socket.user = user;
      next();
    } catch(e) { next(new Error('Authentication error')); }
  });

  io.on('connection', async (socket) => {
    const user = socket.user;
    onlineUsers[user._id.toString()] = socket.id;
    await User.findByIdAndUpdate(user._id, { isOnline: true, lastSeen: Date.now() });
    io.emit('user_online', { userId: user._id });

    socket.on('send_message', async (data) => {
      try {
        const { receiverId, content, mediaType = 'text', mediaUrl = '' } = data;

        // SECURITY FEATURE #6 — Bot daily message limit enforcement
        const user = socket.user;
        const freshUser = await User.findById(user._id);
        if (!freshUser) return socket.emit('error', { message: 'User not found.' });

        const limit = freshUser.getMessageLimit();
        if (freshUser.dailyMessageCount >= limit) {
          return socket.emit('error', { message: 'Daily message limit reached. Upgrade your badge for more messages.' });
        }

        if (mediaType === 'text' && content) {
          const spam = checkSpam(content);
          const historyCount = await Message.countDocuments({
            $or: [
              { senderId: freshUser._id, receiverId },
              { senderId: receiverId, receiverId: freshUser._id }
            ]
          });

          // SECURITY FEATURE #13 — Early message phone/link block
          if (historyCount < 10 && spam.hasPhoneNumber) {
            return socket.emit('error', { message: 'Phone numbers are not allowed in early messages.' });
          }
          if (historyCount < 5 && spam.hasExternalLink) {
            return socket.emit('error', { message: 'External links are not allowed in early messages.' });
          }

          // SECURITY FEATURE #11 — Spam keyword filter
          if (spam.isSpam) {
            return socket.emit('error', { message: 'Message blocked: contains spam content.' });
          }

          // SECURITY FEATURE #12 — OpenAI moderation API check
          const mod = await moderateText(content);
          if (mod.flagged) {
            return socket.emit('error', { message: 'Message blocked by content moderation.' });
          }
        }

        let chat = await Chat.findOne({ members: { $all: [freshUser._id, receiverId] } });
        if (!chat) chat = await Chat.create({ members: [freshUser._id, receiverId] });

        const message = await Message.create({ chatId: chat._id, senderId: freshUser._id, receiverId, content, mediaType, mediaUrl });
        await Chat.findByIdAndUpdate(chat._id, { lastMessage: content || '[' + mediaType + ']', lastMessageAt: Date.now() });

        // Increment daily message count
        await User.findByIdAndUpdate(freshUser._id, { $inc: { dailyMessageCount: 1 } });

        const rSocket = onlineUsers[receiverId];
        if (rSocket) io.to(rSocket).emit('receive_message', { message, sender: { id: freshUser._id, username: freshUser.username, badge: freshUser.badge } });
        socket.emit('message_sent', { messageId: message._id });
      } catch(e) { socket.emit('error', { message: 'Send failed.' }); }
    });

    socket.on('typing', ({ receiverId }) => {
      const s = onlineUsers[receiverId];
      if (s) io.to(s).emit('user_typing', { userId: user._id, username: user.username });
    });

    socket.on('stop_typing', ({ receiverId }) => {
      const s = onlineUsers[receiverId];
      if (s) io.to(s).emit('user_stop_typing', { userId: user._id });
    });

    socket.on('mark_read', async ({ chatId }) => {
      await Message.updateMany({ chatId, receiverId: user._id, isRead: false }, { isRead: true, readAt: Date.now() });
    });

    socket.on('delete_message', async ({ messageId }) => {
      const msg = await Message.findById(messageId);
      if (!msg || msg.senderId.toString() !== user._id.toString()) return;
      msg.isDeleted = true; msg.deletedAt = new Date(); msg.deletedBy = user._id;
      await msg.save();
      socket.emit('message_deleted', { messageId });
      const rSocket = onlineUsers[msg.receiverId.toString()];
      if (rSocket) io.to(rSocket).emit('message_deleted', { messageId });
    });

    socket.on('disconnect', async () => {
      delete onlineUsers[user._id.toString()];
      await User.findByIdAndUpdate(user._id, { isOnline: false, lastSeen: Date.now() });
      io.emit('user_offline', { userId: user._id });
    });
  });
};

module.exports = { initSocket, onlineUsers };
`;

// ── controllers/auth.controller.js ───────────────
files['controllers/auth.controller.js'] = `const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '30d' });

const signup = async (req, res) => {
  try {
    const { username, email, phone, password, gender, dateOfBirth } = req.body;
    if (!username || !email || !phone || !password || !gender || !dateOfBirth)
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    const dob = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    if (age < 18) return res.status(400).json({ success: false, message: 'You must be 18 or older to join FantasyNG.' });
    const existing = await User.findOne({ $or: [{ email }, { phone }, { username }] });
    if (existing) return res.status(409).json({ success: false, message: 'Email, phone or username already registered.' });
    const user = await User.create({ username, email, phone, passwordHash: password, gender, dateOfBirth: dob });
    const token = generateToken(user._id);
    res.status(201).json({ success: true, message: 'Welcome to FantasyNG!', token, user: { id: user._id, username: user.username, email: user.email, badge: user.badge, role: user.role } });
  } catch (e) { res.status(500).json({ success: false, message: 'Server error.' }); }
};

const login = async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;
    if (!emailOrPhone || !password) return res.status(400).json({ success: false, message: 'Email/phone and password required.' });
    const user = await User.findOne({ $or: [{ email: emailOrPhone.toLowerCase() }, { phone: emailOrPhone }] }).select('+passwordHash');
    if (!user || !(await user.comparePassword(password))) return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    if (user.status === 'banned') return res.status(403).json({ success: false, message: 'Account banned.' });
    if (user.status === 'suspended' && user.suspendedUntil && new Date() < user.suspendedUntil) {
      return res.status(403).json({ success: false, message: 'Account suspended until ' + user.suspendedUntil.toLocaleDateString() });
    }
    user.lastSeen = Date.now(); user.isOnline = true; await user.save();
    const token = generateToken(user._id);
    res.json({ success: true, token, user: { id: user._id, username: user.username, email: user.email, badge: user.badge, role: user.role, profilePhoto: user.profilePhoto } });
  } catch (e) { res.status(500).json({ success: false, message: 'Server error.' }); }
};

const logout = async (req, res) => {
  await User.findByIdAndUpdate(req.user.id, { isOnline: false, lastSeen: Date.now() });
  res.json({ success: true, message: 'Logged out.' });
};

const forgotPassword = async (req, res) => {
  try {
    const { emailOrPhone } = req.body;
    const user = await User.findOne({ $or: [{ email: emailOrPhone }, { phone: emailOrPhone }] });
    if (user) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.resetPasswordOTP = crypto.createHash('sha256').update(otp).digest('hex');
      user.resetPasswordExpiry = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();
      console.log('[DEV] OTP for ' + emailOrPhone + ': ' + otp);
    }
    res.json({ success: true, message: 'If account exists, OTP sent.' });
  } catch (e) { res.status(500).json({ success: false, message: 'Server error.' }); }
};

const resetPassword = async (req, res) => {
  try {
    const { emailOrPhone, otp, newPassword } = req.body;
    const user = await User.findOne({ $or: [{ email: emailOrPhone }, { phone: emailOrPhone }] });
    if (!user || !user.resetPasswordOTP) return res.status(400).json({ success: false, message: 'Invalid OTP.' });
    if (new Date() > user.resetPasswordExpiry) return res.status(400).json({ success: false, message: 'OTP expired.' });
    if (crypto.createHash('sha256').update(otp).digest('hex') !== user.resetPasswordOTP)
      return res.status(400).json({ success: false, message: 'Invalid OTP.' });
    user.passwordHash = newPassword; user.resetPasswordOTP = null; user.resetPasswordExpiry = null;
    await user.save();
    res.json({ success: true, message: 'Password reset. Please log in.' });
  } catch (e) { res.status(500).json({ success: false, message: 'Server error.' }); }
};

const getMe = (req, res) => res.json({ success: true, user: req.user });

module.exports = { signup, login, logout, forgotPassword, resetPassword, getMe };
`;

// ── controllers/user.controller.js ───────────────
files['controllers/user.controller.js'] = `const User = require('../models/User');

const browseMembers = async (req, res) => {
  try {
    const { gender, minAge, maxAge, city, page = 1, limit = 20 } = req.query;
    const filter = { _id: { $ne: req.user._id }, status: 'active' };
    if (gender) filter.gender = gender;
    if (city) filter['location.city'] = new RegExp(city, 'i');
    if (minAge || maxAge) { filter.age = {}; if (minAge) filter.age.$gte = +minAge; if (maxAge) filter.age.$lte = +maxAge; }
    const members = await User.find(filter).select('username profilePhoto bio badge trustScore location age gender isOnline').skip((page-1)*limit).limit(+limit);
    const order = { executive:5, golden:4, red:3, blue:2, free:1 };
    members.sort((a,b) => (order[b.badge]||0) - (order[a.badge]||0));
    res.json({ success: true, count: members.length, members });
  } catch(e) { res.status(500).json({ success: false, message: 'Server error.' }); }
};

const getMemberProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('username profilePhoto bio badge trustScore location age gender isOnline lastSeen lastSeenSetting metAndSafeBadges');
    if (!user) return res.status(404).json({ success: false, message: 'Member not found.' });
    const u = user.toObject();
    if (user.lastSeenSetting === 'recently') u.lastSeen = 'Recently active';
    if (user.lastSeenSetting === 'hidden') u.lastSeen = null;
    res.json({ success: true, user: u });
  } catch(e) { res.status(500).json({ success: false, message: 'Server error.' }); }
};

const updateProfile = async (req, res) => {
  try {
    const { bio, interests, location, genderPreference } = req.body;
    const update = {};
    if (bio !== undefined) update.bio = bio;
    if (interests) update.interests = interests;
    if (location) update.location = location;
    if (genderPreference) update.genderPreference = genderPreference;
    if (req.file) update.profilePhoto = '/uploads/' + req.file.filename;
    const user = await User.findByIdAndUpdate(req.user.id, update, { new: true });
    res.json({ success: true, message: 'Profile updated.', user });
  } catch(e) { res.status(500).json({ success: false, message: 'Server error.' }); }
};

const blockUser = async (req, res) => {
  await User.findByIdAndUpdate(req.user.id, { $addToSet: { blockedUsers: req.params.id } });
  res.json({ success: true, message: 'User blocked.' });
};

const unblockUser = async (req, res) => {
  await User.findByIdAndUpdate(req.user.id, { $pull: { blockedUsers: req.params.id } });
  res.json({ success: true, message: 'User unblocked.' });
};

const updatePrivacySettings = async (req, res) => {
  try {
    const { lastSeenSetting, ghostMode, anonymousModeOn } = req.body;
    const user = req.user; const update = {};
    if (lastSeenSetting) {
      if (lastSeenSetting === 'recently' && !['red','golden','executive'].includes(user.badge)) return res.status(403).json({ success: false, message: 'Red badge required.' });
      if (lastSeenSetting === 'hidden' && !['golden','executive'].includes(user.badge)) return res.status(403).json({ success: false, message: 'Golden badge required.' });
      update.lastSeenSetting = lastSeenSetting;
    }
    if (ghostMode !== undefined) {
      if (ghostMode && !['red','golden','executive'].includes(user.badge)) return res.status(403).json({ success: false, message: 'Red badge required for ghost mode.' });
      update.ghostMode = ghostMode;
    }
    if (anonymousModeOn !== undefined) {
      if (anonymousModeOn && !['golden','executive'].includes(user.badge)) return res.status(403).json({ success: false, message: 'Golden badge required for anonymous mode.' });
      update.anonymousModeOn = anonymousModeOn;
    }
    await User.findByIdAndUpdate(user.id, update);
    res.json({ success: true, message: 'Privacy settings updated.' });
  } catch(e) { res.status(500).json({ success: false, message: 'Server error.' }); }
};

const getDailyMatch = async (req, res) => {
  try {
    const user = req.user;
    const match = await User.findOne({ _id: { $ne: user._id, $nin: user.blockedUsers }, status: 'active', badge: { $ne: 'free' } }).select('username profilePhoto bio badge trustScore location age gender');
    res.json({ success: true, match: match || null });
  } catch(e) { res.status(500).json({ success: false, message: 'Server error.' }); }
};

module.exports = { browseMembers, getMemberProfile, updateProfile, blockUser, unblockUser, updatePrivacySettings, getDailyMatch };
`;

// ── controllers/post.controller.js ───────────────
// SECURITY FEATURES: #7 daily like limit, #11 spam filter, #12 OpenAI moderation
files['controllers/post.controller.js'] = `const Post = require('../models/Post');
const User = require('../models/User');
const { checkSpam, moderateText } = require('../services/moderation.service');

const POST_LIMITS = { free:{text:2,photo:1,short_video:0,long_video:0}, blue:{text:5,photo:3,short_video:1,long_video:0}, red:{text:15,photo:10,short_video:5,long_video:2}, golden:{text:Infinity,photo:Infinity,short_video:Infinity,long_video:Infinity}, executive:{text:Infinity,photo:Infinity,short_video:Infinity,long_video:Infinity} };
const EXPIRY_DAYS = { free:2, blue:7, red:21, golden:null, executive:null };

// SECURITY FEATURES #11 & #12 — Spam filter + OpenAI moderation on post creation
const createPost = async (req, res) => {
  try {
    const { content, mediaType = 'text' } = req.body;
    const user = req.user;
    const today = new Date(); today.setHours(0,0,0,0);
    const count = await Post.countDocuments({ authorId: user._id, mediaType, createdAt: { $gte: today } });
    const limit = POST_LIMITS[user.badge] && POST_LIMITS[user.badge][mediaType] !== undefined ? POST_LIMITS[user.badge][mediaType] : 0;
    if (count >= limit) return res.status(429).json({ success: false, message: 'Daily post limit reached. Upgrade your badge.' });

    // Content moderation for text posts
    if (content && content.trim().length > 0) {
      // SECURITY FEATURE #11 — Spam keyword filter on posts
      const spam = checkSpam(content);
      if (spam.isSpam) {
        return res.status(400).json({ success: false, message: 'Post contains spam or prohibited content.' });
      }
      if (spam.hasExternalLink) {
        return res.status(400).json({ success: false, message: 'External links are not allowed in posts.' });
      }
      // SECURITY FEATURE #12 — OpenAI moderation API on post content
      const mod = await moderateText(content);
      if (mod.flagged) {
        return res.status(400).json({ success: false, message: 'Post flagged by content moderation. Please review community guidelines.' });
      }
    }

    const days = EXPIRY_DAYS[user.badge];
    const expiresAt = days ? new Date(Date.now() + days * 86400000) : null;
    const mediaUrl = req.file ? '/uploads/' + req.file.filename : '';
    const post = await Post.create({ authorId: user._id, content, mediaType, mediaUrls: mediaUrl ? [mediaUrl] : [], badgeTierAtPost: user.badge, expiresAt });
    res.status(201).json({ success: true, post });
  } catch(e) { res.status(500).json({ success: false, message: 'Server error.' }); }
};

const getFeed = async (req, res) => {
  try {
    const { page=1, limit=20 } = req.query;
    const posts = await Post.find({ isDeleted: false, $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }] })
      .populate('authorId','username profilePhoto badge trustScore')
      .sort({ createdAt: -1 }).skip((page-1)*limit).limit(+limit);
    const order = { executive:5,golden:4,red:3,blue:2,free:1 };
    posts.sort((a,b) => (order[b.badgeTierAtPost]||0)-(order[a.badgeTierAtPost]||0));
    res.json({ success: true, posts });
  } catch(e) { res.status(500).json({ success: false, message: 'Server error.' }); }
};

const getTrending = async (req, res) => {
  try {
    const { page=1, limit=20 } = req.query;
    const posts = await Post.find({ isPromotedToFrontPage: true, isDeleted: false })
      .populate('authorId','username profilePhoto badge trustScore')
      .sort({ promotedAt: -1 }).skip((page-1)*limit).limit(+limit);
    res.json({ success: true, posts });
  } catch(e) { res.status(500).json({ success: false, message: 'Server error.' }); }
};

// SECURITY FEATURE #7 — Bot daily like limit enforcement
const likePost = async (req, res) => {
  try {
    const user = req.user;

    // Fetch fresh user to get accurate daily like count
    const freshUser = await User.findById(user._id);
    if (!freshUser) return res.status(404).json({ success: false, message: 'User not found.' });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });

    const alreadyLiked = post.likes.includes(freshUser._id);

    if (!alreadyLiked) {
      // Check daily like limit before adding a new like
      const likeLimit = freshUser.getLikeLimit();
      if (isFinite(likeLimit) && freshUser.dailyLikeCount >= likeLimit) {
        return res.status(429).json({
          success: false,
          message: 'Daily like limit reached (' + likeLimit + '). Upgrade your badge for more likes.',
          dailyLikeCount: freshUser.dailyLikeCount,
          limit: likeLimit
        });
      }
      post.likes.push(freshUser._id);
      await post.save();
      await User.findByIdAndUpdate(freshUser._id, { $inc: { dailyLikeCount: 1 } });
    } else {
      // Unlike — does not count against daily limit
      post.likes.pull(freshUser._id);
      await post.save();
    }

    res.json({ success: true, liked: !alreadyLiked, likeCount: post.likes.length });
  } catch(e) { res.status(500).json({ success: false, message: 'Server error.' }); }
};

const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });
    if (post.authorId.toString() !== req.user._id.toString() && req.user.role === 'member')
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    post.isDeleted = true; await post.save();
    res.json({ success: true, message: 'Post deleted.' });
  } catch(e) { res.status(500).json({ success: false, message: 'Server error.' }); }
};

module.exports = { createPost, getFeed, getTrending, likePost, deletePost };
`;

// ── controllers/badge.controller.js ──────────────
files['controllers/badge.controller.js'] = `const BadgeApplication = require('../models/BadgeApplication');
const User = require('../models/User');
const visionService = require('../services/vision.service');
const PLAN_DAYS = { monthly:30, '3months':90, '6months':180, annual:365 };

const applyForBadge = async (req, res) => {
  try {
    const { badgeTier, plan } = req.body;
    if (!['blue','red','golden'].includes(badgeTier)) return res.status(400).json({ success: false, message: 'Invalid badge tier.' });
    const existing = await BadgeApplication.findOne({ userId: req.user._id, status: 'pending' });
    if (existing) return res.status(409).json({ success: false, message: 'Pending application exists.' });
    const files = req.files || {};
    const submittedPhoto = files.photo ? '/uploads/' + files.photo[0].filename : '';
    const submittedVideo = files.video ? '/uploads/' + files.video[0].filename : '';
    const submittedId = files.id ? '/uploads/' + files.id[0].filename : '';
    let googleVisionResult = {}; let visionPassed = false;
    try {
      if (badgeTier === 'blue' && submittedPhoto) { googleVisionResult = await visionService.checkBlueBadge(submittedPhoto); visionPassed = googleVisionResult.hasFace && googleVisionResult.hasFantasyNGText; }
      else if (badgeTier === 'red' && submittedVideo) { googleVisionResult = await visionService.checkRedBadge(submittedVideo); visionPassed = googleVisionResult.hasFace; }
      else if (badgeTier === 'golden') { googleVisionResult = await visionService.checkGoldenBadge(submittedVideo, submittedId); visionPassed = googleVisionResult.idValid && googleVisionResult.faceMatches && googleVisionResult.isAdult; }
    } catch(e) { googleVisionResult = { error: 'Vision API unavailable' }; }
    const application = await BadgeApplication.create({ userId: req.user._id, badgeTier, plan, submittedPhoto, submittedVideo, submittedId, googleVisionResult, visionPassed });
    const hrs = badgeTier === 'blue' ? '24' : badgeTier === 'red' ? '12' : '6';
    res.status(201).json({ success: true, message: 'Application submitted! Admin reviews within ' + hrs + ' hours.', visionPassed });
  } catch(e) { res.status(500).json({ success: false, message: 'Server error.' }); }
};

const getMyApplications = async (req, res) => {
  const apps = await BadgeApplication.find({ userId: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, applications: apps });
};

const getApplicationQueue = async (req, res) => {
  const queue = await BadgeApplication.find({ status: 'pending' }).populate('userId','username email phone badge').sort({ createdAt: 1 });
  res.json({ success: true, count: queue.length, queue });
};

const approveApplication = async (req, res) => {
  try {
    const app = await BadgeApplication.findById(req.params.id);
    if (!app || app.status !== 'pending') return res.status(400).json({ success: false, message: 'Not found or already reviewed.' });
    app.status = 'approved'; app.reviewedBy = req.user._id; app.reviewedAt = new Date(); await app.save();
    const expiry = new Date(Date.now() + (PLAN_DAYS[app.plan]||30) * 86400000);
    await User.findByIdAndUpdate(app.userId, { badge: app.badgeTier, badgeExpiry: expiry, isVerified: true, verificationLevel: app.badgeTier });
    res.json({ success: true, message: 'Badge approved.' });
  } catch(e) { res.status(500).json({ success: false, message: 'Server error.' }); }
};

const rejectApplication = async (req, res) => {
  const app = await BadgeApplication.findById(req.params.id);
  if (!app) return res.status(404).json({ success: false, message: 'Not found.' });
  app.status = 'rejected'; app.reviewedBy = req.user._id; app.reviewedAt = new Date(); app.rejectionReason = req.body.reason || 'Did not meet requirements.'; await app.save();
  res.json({ success: true, message: 'Application rejected.' });
};

module.exports = { applyForBadge, getMyApplications, getApplicationQueue, approveApplication, rejectApplication };
`;

// ── controllers/payment.controller.js ────────────
files['controllers/payment.controller.js'] = `const crypto = require('crypto');
const paystackService = require('../services/paystack.service');
const User = require('../models/User');
const PLAN_DAYS = { monthly:30, '3months':90, '6months':180, annual:365 };
const BADGE_PRICES = { blue:{monthly:1500,'3months':3500,'6months':6000,annual:10000}, red:{monthly:3500,'3months':8500,'6months':15000,annual:25000}, golden:{monthly:6000,'3months':15000,'6months':27000,annual:45000} };
const GIFT_PRICES = { rose:200, diamond:500, crown:1000, flame:1500 };

const initiatePayment = async (req, res) => {
  try {
    const { type, badgeTier, plan, giftType, receiverId } = req.body;
    const user = req.user;
    let amount, metadata;
    if (type === 'badge') {
      amount = BADGE_PRICES[badgeTier] && BADGE_PRICES[badgeTier][plan];
      if (!amount) return res.status(400).json({ success: false, message: 'Invalid selection.' });
      metadata = { type:'badge', userId: user._id.toString(), badgeTier, plan };
    } else if (type === 'gift') {
      amount = GIFT_PRICES[giftType];
      if (!amount) return res.status(400).json({ success: false, message: 'Invalid gift type.' });
      metadata = { type:'gift', senderId: user._id.toString(), receiverId, giftType };
    } else return res.status(400).json({ success: false, message: 'Invalid payment type.' });
    const tx = await paystackService.initializeTransaction({ email: user.email, amount: amount * 100, metadata, callback_url: process.env.FRONTEND_URL + '/upgrade.html' });
    res.json({ success: true, authorizationUrl: tx.authorization_url, reference: tx.reference });
  } catch(e) { res.status(500).json({ success: false, message: 'Payment failed.' }); }
};

const verifyPayment = async (req, res) => {
  try {
    const tx = await paystackService.verifyTransaction(req.params.reference);
    if (tx.status !== 'success') return res.status(400).json({ success: false, message: 'Payment not successful.' });
    const { type, userId, badgeTier, plan } = tx.metadata;
    if (type === 'badge') {
      const expiry = new Date(Date.now() + (PLAN_DAYS[plan]||30) * 86400000);
      await User.findByIdAndUpdate(userId, { badge: badgeTier, badgeExpiry: expiry });
      const { Subscription } = require('../models/Others');
      await Subscription.create({ userId, badgeTier, plan, amount: tx.amount/100, paystackReference: req.params.reference, status:'active', endDate: expiry });
    }
    res.json({ success: true, message: 'Payment verified!' });
  } catch(e) { res.status(500).json({ success: false, message: 'Verification failed.' }); }
};

const paystackWebhook = async (req, res) => {
  try {
    const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY).update(JSON.stringify(req.body)).digest('hex');
    if (hash !== req.headers['x-paystack-signature']) return res.status(400).send('Invalid');
    const { event, data } = req.body;
    if (event === 'charge.success') {
      const { type, userId, badgeTier, plan } = data.metadata;
      if (type === 'badge') {
        const expiry = new Date(Date.now() + (PLAN_DAYS[plan]||30) * 86400000);
        await User.findByIdAndUpdate(userId, { badge: badgeTier, badgeExpiry: expiry });
      }
    }
    res.sendStatus(200);
  } catch(e) { res.sendStatus(500); }
};

module.exports = { initiatePayment, verifyPayment, paystackWebhook };
`;

// ── controllers/admin.controller.js ──────────────
// SECURITY FEATURE #15 — Audit log for ALL admin actions
files['controllers/admin.controller.js'] = `const User = require('../models/User');
const mongoose = require('mongoose');

// Helper to get real IP from request (Cloudflare / Railway proxy aware)
const getIP = (req) => req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';

const getDashboardStats = async (req, res) => {
  try {
    const BadgeApplication = require('../models/BadgeApplication');
    const { Report } = require('../models/Others');
    const [totalMembers, newToday, pendingReports, pendingBadges, onlineNow] = await Promise.all([
      User.countDocuments(), User.countDocuments({ createdAt: { $gte: new Date(new Date().setHours(0,0,0,0)) } }),
      Report.countDocuments({ status:'pending' }), BadgeApplication.countDocuments({ status:'pending' }), User.countDocuments({ isOnline: true })
    ]);
    res.json({ success: true, stats: { totalMembers, newToday, pendingReports, pendingBadges, onlineNow } });
  } catch(e) { res.status(500).json({ success: false, message: 'Server error.' }); }
};

const getAllMembers = async (req, res) => {
  try {
    const { search, badge, status, page=1, limit=50 } = req.query;
    const filter = {};
    if (search) filter.$or = [{ username: new RegExp(search,'i') },{ email: new RegExp(search,'i') },{ phone: new RegExp(search,'i') }];
    if (badge) filter.badge = badge; if (status) filter.status = status;
    const members = await User.find(filter).select('-passwordHash').sort({ createdAt:-1 }).skip((page-1)*limit).limit(+limit);
    const total = await User.countDocuments(filter);
    res.json({ success: true, total, members });
  } catch(e) { res.status(500).json({ success: false, message: 'Server error.' }); }
};

// SECURITY FEATURE #15 — All ban/suspend/reinstate/elevate/badge actions are audit-logged
const banMember = async (req, res) => {
  try {
    if (!['chief_moderator','coo','ceo'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Chief Moderator or higher required.' });
    }
    const { reason } = req.body;
    await User.findByIdAndUpdate(req.params.id, { status:'banned', banReason: reason || 'Violated Terms of Service' });
    const { AuditLog } = require('../models/Others');
    await AuditLog.create({
      adminId: req.user._id, adminRole: req.user.role,
      action: 'PERMANENTLY_BANNED_MEMBER',
      targetUserId: req.params.id,
      details: reason || 'Violated Terms of Service',
      ip: getIP(req)
    });
    res.json({ success: true, message: 'Member banned.' });
  } catch(e) { res.status(500).json({ success: false, message: 'Server error.' }); }
};

const suspendMember = async (req, res) => {
  try {
    const { days=7, reason } = req.body;
    const suspendedUntil = new Date(Date.now() + days * 86400000);
    await User.findByIdAndUpdate(req.params.id, { status:'suspended', suspendedUntil, banReason: reason || '' });
    const { AuditLog } = require('../models/Others');
    await AuditLog.create({
      adminId: req.user._id, adminRole: req.user.role,
      action: 'SUSPENDED_MEMBER_' + days + '_DAYS',
      targetUserId: req.params.id,
      details: reason || 'No reason provided',
      ip: getIP(req)
    });
    res.json({ success: true, message: 'Member suspended for ' + days + ' days.' });
  } catch(e) { res.status(500).json({ success: false, message: 'Server error.' }); }
};

const reinstateMember = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { status:'active', suspendedUntil: null, banReason:'' });
    const { AuditLog } = require('../models/Others');
    await AuditLog.create({
      adminId: req.user._id, adminRole: req.user.role,
      action: 'REINSTATED_MEMBER',
      targetUserId: req.params.id,
      details: req.body.reason || 'Manual reinstatement',
      ip: getIP(req)
    });
    res.json({ success: true, message: 'Member reinstated.' });
  } catch(e) { res.status(500).json({ success: false, message: 'Server error.' }); }
};

const elevateMember = async (req, res) => {
  try {
    if (!['coo','ceo'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Executives only.' });
    }
    const { newRole } = req.body;
    if (!['moderator','chief_moderator'].includes(newRole)) {
      return res.status(400).json({ success: false, message: 'Invalid role.' });
    }
    const member = await User.findById(req.params.id);
    if (!member) return res.status(404).json({ success: false, message: 'Member not found.' });
    await User.findByIdAndUpdate(req.params.id, { role: newRole, badge:'golden', originalBadge: member.badge, isAdminElevated: true });
    const { AuditLog } = require('../models/Others');
    await AuditLog.create({
      adminId: req.user._id, adminRole: req.user.role,
      action: 'ELEVATED_MEMBER_TO_' + newRole.toUpperCase(),
      targetUserId: req.params.id,
      details: 'Previous role: ' + member.role + '. Golden badge auto-assigned.',
      ip: getIP(req)
    });
    res.json({ success: true, message: 'Member elevated to ' + newRole + '. Golden badge assigned.' });
  } catch(e) { res.status(500).json({ success: false, message: 'Server error.' }); }
};

const changeBadgeWithoutPayment = async (req, res) => {
  try {
    if (!['coo','ceo'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Executives only.' });
    }
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ success: false, message: 'Member not found.' });
    const previousBadge = targetUser.badge;
    await User.findByIdAndUpdate(req.params.id, { badge: req.body.badge });
    const { AuditLog } = require('../models/Others');
    await AuditLog.create({
      adminId: req.user._id, adminRole: req.user.role,
      action: 'CHANGED_BADGE_WITHOUT_PAYMENT',
      targetUserId: req.params.id,
      details: 'Badge changed from ' + previousBadge + ' to ' + req.body.badge,
      ip: getIP(req)
    });
    res.json({ success: true, message: 'Badge changed.' });
  } catch(e) { res.status(500).json({ success: false, message: 'Server error.' }); }
};

const getReports = async (req, res) => {
  const { Report } = require('../models/Others');
  const { status='pending', page=1, limit=20 } = req.query;
  const reports = await Report.find({ status }).populate('reporterId','username email').populate('reportedUserId','username email badge status').sort({ createdAt:-1 }).skip((page-1)*limit).limit(+limit);
  res.json({ success: true, reports });
};

const resolveReport = async (req, res) => {
  try {
    const { Report, AuditLog } = require('../models/Others');
    await Report.findByIdAndUpdate(req.params.id, { status:'resolved', adminAction: req.body.action, reviewedBy: req.user._id, reviewedAt: new Date() });
    await AuditLog.create({
      adminId: req.user._id, adminRole: req.user.role,
      action: 'RESOLVED_REPORT',
      targetUserId: null,
      details: 'Report ID: ' + req.params.id + '. Action taken: ' + (req.body.action || 'None specified'),
      ip: getIP(req)
    });
    res.json({ success: true, message: 'Report resolved.' });
  } catch(e) { res.status(500).json({ success: false, message: 'Server error.' }); }
};

const promotePost = async (req, res) => {
  try {
    const Post = require('../models/Post');
    await Post.findByIdAndUpdate(req.params.id, { isPromotedToFrontPage: true, promotedAt: new Date(), promotedBy: req.user._id });
    const { AuditLog } = require('../models/Others');
    await AuditLog.create({
      adminId: req.user._id, adminRole: req.user.role,
      action: 'PROMOTED_POST_TO_FRONT_PAGE',
      targetUserId: null,
      details: 'Post ID: ' + req.params.id,
      ip: getIP(req)
    });
    res.json({ success: true, message: 'Post promoted to front page.' });
  } catch(e) { res.status(500).json({ success: false, message: 'Server error.' }); }
};

const getRevenue = async (req, res) => {
  try {
    if (!['coo','ceo'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Executives only.' });
    }
    const { Subscription, VirtualGift } = require('../models/Others');
    const [badges, gifts, total, active, breakdown] = await Promise.all([
      Subscription.aggregate([{ $match:{ status:'active' } },{ $group:{ _id:null, total:{ $sum:'$amount' } } }]),
      VirtualGift.aggregate([{ $group:{ _id:null, total:{ $sum:'$platformCommission' } } }]),
      User.countDocuments(), User.countDocuments({ status:'active' }),
      User.aggregate([{ $group:{ _id:'$badge', count:{ $sum:1 } } }])
    ]);
    res.json({ success: true, revenue: { badges: badges[0] && badges[0].total || 0, giftCommissions: gifts[0] && gifts[0].total || 0 }, members: { total, active }, breakdown });
  } catch(e) { res.status(500).json({ success: false, message: 'Server error.' }); }
};

const getAuditLog = async (req, res) => {
  try {
    const { AuditLog } = require('../models/Others');
    const { page=1, limit=50 } = req.query;
    // COO can only see moderator actions; CEO sees everything
    const filter = req.user.role === 'coo' ? { adminRole:{ $in:['moderator','chief_moderator'] } } : {};
    const logs = await AuditLog.find(filter)
      .populate('adminId','username role')
      .populate('targetUserId','username')
      .sort({ createdAt:-1 })
      .skip((page-1)*limit)
      .limit(+limit);
    res.json({ success: true, logs });
  } catch(e) { res.status(500).json({ success: false, message: 'Server error.' }); }
};

module.exports = { getDashboardStats, getAllMembers, banMember, suspendMember, reinstateMember, elevateMember, changeBadgeWithoutPayment, getReports, resolveReport, promotePost, getRevenue, getAuditLog };
`;

// ── routes/auth.routes.js ─────────────────────────
files['routes/auth.routes.js'] = `const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
router.post('/signup', ctrl.signup);
router.post('/login', ctrl.login);
router.post('/logout', protect, ctrl.logout);
router.post('/forgot-password', ctrl.forgotPassword);
router.post('/reset-password', ctrl.resetPassword);
router.get('/me', protect, ctrl.getMe);
module.exports = router;
`;

// ── routes/user.routes.js ─────────────────────────
files['routes/user.routes.js'] = `const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/user.controller');
const { protect } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');
router.get('/browse', protect, ctrl.browseMembers);
router.get('/daily-match', protect, ctrl.getDailyMatch);
router.get('/:id', protect, ctrl.getMemberProfile);
router.put('/profile', protect, upload.single('photo'), ctrl.updateProfile);
router.put('/settings/privacy', protect, ctrl.updatePrivacySettings);
router.post('/block/:id', protect, ctrl.blockUser);
router.delete('/block/:id', protect, ctrl.unblockUser);
module.exports = router;
`;

// ── routes/post.routes.js ─────────────────────────
files['routes/post.routes.js'] = `const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/post.controller');
const { protect } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');
router.get('/trending', ctrl.getTrending);
router.get('/feed', protect, ctrl.getFeed);
router.post('/', protect, upload.single('media'), ctrl.createPost);
router.post('/:id/like', protect, ctrl.likePost);
router.delete('/:id', protect, ctrl.deletePost);
module.exports = router;
`;

// ── routes/badge.routes.js ────────────────────────
files['routes/badge.routes.js'] = `const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/badge.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');
router.post('/apply', protect, upload.fields([{ name:'photo', maxCount:1 },{ name:'video', maxCount:1 },{ name:'id', maxCount:1 }]), ctrl.applyForBadge);
router.get('/my-applications', protect, ctrl.getMyApplications);
router.get('/queue', protect, adminOnly, ctrl.getApplicationQueue);
router.put('/approve/:id', protect, adminOnly, ctrl.approveApplication);
router.put('/reject/:id', protect, adminOnly, ctrl.rejectApplication);
module.exports = router;
`;

// ── routes/payment.routes.js ──────────────────────
files['routes/payment.routes.js'] = `const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/payment.controller');
const { protect } = require('../middleware/auth.middleware');
router.post('/initiate', protect, ctrl.initiatePayment);
router.get('/verify/:reference', protect, ctrl.verifyPayment);
router.post('/webhook', ctrl.paystackWebhook);
module.exports = router;
`;

// ── routes/admin.routes.js ────────────────────────
files['routes/admin.routes.js'] = `const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/admin.controller');
const { protect, adminOnly, executivesOnly } = require('../middleware/auth.middleware');
router.use(protect, adminOnly);
router.get('/dashboard', ctrl.getDashboardStats);
router.get('/members', ctrl.getAllMembers);
router.put('/members/:id/ban', ctrl.banMember);
router.put('/members/:id/suspend', ctrl.suspendMember);
router.put('/members/:id/reinstate', ctrl.reinstateMember);
router.put('/members/:id/elevate', executivesOnly, ctrl.elevateMember);
router.put('/members/:id/badge', executivesOnly, ctrl.changeBadgeWithoutPayment);
router.get('/reports', ctrl.getReports);
router.put('/reports/:id/resolve', ctrl.resolveReport);
router.post('/posts/:id/promote', ctrl.promotePost);
router.get('/revenue', executivesOnly, ctrl.getRevenue);
router.get('/audit-log', ctrl.getAuditLog);
module.exports = router;
`;

// ── routes/other.routes.js ────────────────────────
files['routes/other.routes.js'] = `const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const Message = require('../models/Message');
const Chat = require('../models/Chat');
const upload = require('../middleware/upload.middleware');

// Chat routes
const chatRouter = express.Router();
chatRouter.get('/', protect, async (req, res) => {
  const chats = await Chat.find({ members: req.user._id }).populate('members','username profilePhoto badge isOnline').sort({ lastMessageAt:-1 });
  res.json({ success: true, chats });
});
chatRouter.get('/:chatId/messages', protect, async (req, res) => {
  const { page=1, limit=50 } = req.query;
  const chat = await Chat.findOne({ _id: req.params.chatId, members: req.user._id });
  if (!chat) return res.status(403).json({ success: false, message: 'Access denied.' });
  const messages = await Message.find({ chatId: req.params.chatId, isDeleted: false }).populate('senderId','username profilePhoto badge').sort({ createdAt:-1 }).skip((page-1)*limit).limit(+limit);
  res.json({ success: true, messages: messages.reverse() });
});
chatRouter.get('/admin/recover/:messageId', protect, async (req, res) => {
  if (req.user.role === 'member') return res.status(403).json({ success: false, message: 'Admin only.' });
  const msg = await Message.findById(req.params.messageId).populate('senderId','username').populate('receiverId','username');
  res.json({ success: true, message: msg });
});

// Report routes
const reportRouter = express.Router();
const { Report } = require('../models/Others');
reportRouter.post('/', protect, async (req, res) => {
  const { reportedUserId, reportType, description, isAnonymous=false, evidence=[] } = req.body;
  const report = await Report.create({ reporterId: req.user._id, reportedUserId, isAnonymous, reportType, description, evidence });
  const { checkMassDeletion } = require('../utils/bot');
  checkMassDeletion(reportedUserId);
  res.status(201).json({ success: true, message: 'Report submitted.', reportId: report._id });
});
reportRouter.get('/my-reports', protect, async (req, res) => {
  const reports = await Report.find({ reporterId: req.user._id }).populate('reportedUserId','username').sort({ createdAt:-1 });
  res.json({ success: true, reports });
});

// Event routes
const eventRouter = express.Router();
const { Event } = require('../models/Others');
eventRouter.get('/', protect, async (req, res) => {
  const events = await Event.find({ isPublished: true, eventDate: { $gte: new Date() } }).sort({ eventDate:1 });
  res.json({ success: true, events });
});
eventRouter.post('/:id/rsvp', protect, async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });
  if (!event.rsvpList.includes(req.user._id)) { event.rsvpList.push(req.user._id); await event.save(); }
  res.json({ success: true, message: 'RSVP confirmed!' });
});
eventRouter.post('/', protect, async (req, res) => {
  if (req.user.role === 'member') return res.status(403).json({ success: false, message: 'Admin only.' });
  const event = await Event.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ success: true, event });
});

// Story routes
const storyRouter = express.Router();
const { Story } = require('../models/Others');
const STORY_LIMITS = { free:1, blue:3, red:7, golden:Infinity, executive:Infinity };
storyRouter.post('/', protect, upload.single('media'), async (req, res) => {
  const user = req.user;
  const today = new Date(); today.setHours(0,0,0,0);
  const count = await Story.countDocuments({ authorId: user._id, createdAt: { $gte: today } });
  if (count >= (STORY_LIMITS[user.badge] || 1)) return res.status(429).json({ success: false, message: 'Daily story limit reached.' });
  if (!req.file) return res.status(400).json({ success: false, message: 'Media file required.' });
  const story = await Story.create({ authorId: user._id, mediaUrl:'/uploads/'+req.file.filename, mediaType: req.body.mediaType||'photo', expiresAt: new Date(Date.now() + 24*60*60*1000) });
  res.status(201).json({ success: true, story });
});
storyRouter.get('/', protect, async (req, res) => {
  const stories = await Story.find({ expiresAt: { $gte: new Date() } }).populate('authorId','username profilePhoto badge').sort({ createdAt:-1 });
  res.json({ success: true, stories });
});

module.exports = { chatRouter, reportRouter, eventRouter, storyRouter };
`;

// ── server.js ─────────────────────────────────────
// SECURITY FEATURES:
//  #1  Express Rate Limit (granular per-route limits)
//  #2  Strict CORS origin to frontend URL only
//  #3  xss-clean middleware
//  #4  express-mongo-sanitize middleware
//  #5  HTTPS redirect middleware
// BONUS: hpp (HTTP Parameter Pollution), request ID tracking,
//        enhanced Helmet, JSON-only API enforcement
files['server.js'] = `// =====================================================
// FantasyNG Backend — server.js
// Nigeria's Premier Linkup Platform (18+)
// ⚡ EXECUTED BY XCLUSIVE ⚡
// =====================================================
require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const crypto = require('crypto');
const path = require('path');

const connectDB = require('./config/db');
const { initSocket } = require('./sockets/chat.socket');
const { startBot } = require('./utils/bot');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const postRoutes = require('./routes/post.routes');
const badgeRoutes = require('./routes/badge.routes');
const paymentRoutes = require('./routes/payment.routes');
const adminRoutes = require('./routes/admin.routes');
const { chatRouter, reportRouter, eventRouter, storyRouter } = require('./routes/other.routes');

connectDB();

const app = express();
const server = http.createServer(app);

// ─────────────────────────────────────────────────
// SECURITY FEATURE #2 — Strict CORS (frontend URL only)
// ─────────────────────────────────────────────────
const ALLOWED_ORIGIN = process.env.FRONTEND_URL || 'https://fantasyng.netlify.app';

const io = socketIO(server, {
  cors: {
    origin: ALLOWED_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

initSocket(io);

// ─────────────────────────────────────────────────
// BONUS — Request ID (tracing for logs & audits)
// ─────────────────────────────────────────────────
app.use((req, res, next) => {
  req.requestId = crypto.randomBytes(8).toString('hex');
  res.setHeader('X-Request-Id', req.requestId);
  next();
});

// ─────────────────────────────────────────────────
// SECURITY FEATURE #5 — HTTPS redirect (Railway uses
// x-forwarded-proto; skip for health checks & webhooks)
// ─────────────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    const proto = req.headers['x-forwarded-proto'];
    // Allow Paystack webhooks and health checks through even on HTTP
    const exempt = ['/api/payment/webhook', '/api/health', '/'];
    if (proto && proto !== 'https' && !exempt.includes(req.path)) {
      return res.redirect(301, 'https://' + req.headers.host + req.url);
    }
    next();
  });
}

// ─────────────────────────────────────────────────
// SECURITY — Helmet (enhanced security headers)
// Disables CSP so your existing frontend JS loads fine
// ─────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false,       // Frontend handles its own CSP
  crossOriginResourcePolicy: { policy: 'cross-origin' },  // Allow CDN assets
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' } // Allow Paystack popup
}));

// ─────────────────────────────────────────────────
// SECURITY FEATURE #2 — Strict CORS (HTTP requests)
// ─────────────────────────────────────────────────
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman in dev, webhooks)
    if (!origin) return callback(null, true);
    if (origin === ALLOWED_ORIGIN) return callback(null, true);
    callback(new Error('CORS: Origin not allowed — ' + origin));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// ─────────────────────────────────────────────────
// SECURITY FEATURE #1 — Rate Limiting (granular)
// ─────────────────────────────────────────────────

// Global API limiter — 100 requests per 15 minutes
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please slow down.' }
});

// Auth endpoints — 10 attempts per 15 minutes (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login/signup attempts. Try again in 15 minutes.' }
});

// Post creation — 30 per hour
const postCreateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many posts. Slow down.' }
});

// Badge applications — 5 per hour
const badgeApplyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many badge applications. Try again later.' }
});

// Password reset — 5 per hour
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many password reset attempts. Try again later.' }
});

app.use('/api/', globalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);
app.use('/api/auth/forgot-password', passwordResetLimiter);
app.use('/api/auth/reset-password', passwordResetLimiter);
app.use('/api/badges/apply', badgeApplyLimiter);

// ─────────────────────────────────────────────────
// Body parsers — before XSS/sanitize so they run on parsed body
// ─────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─────────────────────────────────────────────────
// SECURITY FEATURE #3 — xss-clean (strip XSS from req.body/params/query)
// ─────────────────────────────────────────────────
app.use(xss());

// ─────────────────────────────────────────────────
// SECURITY FEATURE #4 — express-mongo-sanitize
// Strips $ and . from input to prevent NoSQL injection
// ─────────────────────────────────────────────────
app.use(mongoSanitize({
  replaceWith: '_',   // replace $ with _ instead of just removing
  onSanitize: ({ req, key }) => {
    console.warn('[SECURITY] NoSQL injection attempt blocked. Key: ' + key + ' | IP: ' + (req.headers['x-forwarded-for'] || req.socket.remoteAddress));
  }
}));

// ─────────────────────────────────────────────────
// BONUS — HPP (HTTP Parameter Pollution protection)
// Prevents duplicate query params attacks e.g. ?badge=free&badge=golden
// ─────────────────────────────────────────────────
app.use(hpp());

// ─────────────────────────────────────────────────
// BONUS — Enforce JSON content-type on mutation endpoints
// Rejects non-JSON POST/PUT bodies (blocks multipart injection on JSON routes)
// ─────────────────────────────────────────────────
app.use((req, res, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const ct = req.headers['content-type'] || '';
    // Allow multipart (file uploads), url-encoded, and JSON
    if (ct && !ct.includes('application/json') && !ct.includes('multipart/form-data') && !ct.includes('application/x-www-form-urlencoded')) {
      return res.status(415).json({ success: false, message: 'Unsupported Content-Type.' });
    }
  }
  next();
});

// Logging (development only)
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─────────────────────────────────────────────────
// Apply post create limiter to post routes
// ─────────────────────────────────────────────────
app.use('/api/posts', (req, res, next) => {
  if (req.method === 'POST' && req.path === '/') return postCreateLimiter(req, res, next);
  next();
});

// ─────────────────────────────────────────────────
// API Routes
// ─────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/badges', badgeRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRouter);
app.use('/api/reports', reportRouter);
app.use('/api/events', eventRouter);
app.use('/api/stories', storyRouter);

// Health check
app.get('/api/health', (req, res) => res.json({ success: true, message: 'FantasyNG backend is running!', timestamp: new Date().toISOString() }));
app.get('/', (req, res) => res.json({ success: true, message: 'FantasyNG API — Where Fantasy Becomes Reality' }));

// 404 handler
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found.' }));

// Global error handler
app.use((err, req, res, next) => {
  // Handle CORS errors gracefully
  if (err.message && err.message.startsWith('CORS')) {
    return res.status(403).json({ success: false, message: 'Access denied: origin not allowed.' });
  }
  console.error('[Server Error]', err.message, '| Request ID:', req.requestId);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Server error.' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log('');
  console.log('==============================================');
  console.log('  FantasyNG Backend RUNNING on port ' + PORT);
  console.log('  Where Fantasy Becomes Reality');
  console.log('  Security: 15/15 features active');
  console.log('==============================================');
  console.log('');
  startBot();
});

process.on('unhandledRejection', (err) => { console.error('Unhandled rejection:', err.message); });
module.exports = { app, server };
`;

// ═══════════════════════════════════════════════════
// CREATE ALL FILES
// ═══════════════════════════════════════════════════
const BASE_DIR = __dirname;

// Create directories
const dirs = ['config','models','controllers','routes','middleware','sockets','services','utils','uploads'];
dirs.forEach(d => {
  const p = path.join(BASE_DIR, d);
  if (!fs.existsSync(p)) { fs.mkdirSync(p, { recursive: true }); console.log('Created dir: ' + d); }
});

// Write all files
let created = 0;
Object.entries(files).forEach(([filePath, content]) => {
  const fullPath = path.join(BASE_DIR, filePath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('Created: ' + filePath);
  created++;
});

console.log('');
console.log('==============================================');
console.log('  FantasyNG Backend Setup COMPLETE!');
console.log('  ' + created + ' files created successfully');
console.log('==============================================');
console.log('');
console.log('Next steps:');
console.log('1. Copy .env.example to .env and fill your values');
console.log('2. Run: npm install');
console.log('3. Run: npm start');
