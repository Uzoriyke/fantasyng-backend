const User = require('../models/User');
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
