// =====================================================
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
