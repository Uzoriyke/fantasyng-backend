const BadgeApplication = require('../models/BadgeApplication');
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
