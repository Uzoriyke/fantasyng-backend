const User = require('../models/User');
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
