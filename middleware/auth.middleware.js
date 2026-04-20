const jwt = require('jsonwebtoken');
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
