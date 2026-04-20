const User = require('../models/User');

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
