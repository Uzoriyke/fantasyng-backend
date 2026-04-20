const jwt = require('jsonwebtoken');
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
