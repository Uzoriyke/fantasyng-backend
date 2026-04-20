const mongoose = require('mongoose');
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
