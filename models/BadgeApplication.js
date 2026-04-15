const mongoose = require('mongoose');

const badgeApplicationSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requestedBadge: {
    type: String,
    enum: ['vip1', 'vip2', 'vvip', 'executive'],
    required: true
  },
  selfieUrl: {
    type: String,
    required: true
  },
  idCardUrl: {
    type: String,
    required: true
  },
  videoUrl: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  visionApiResult: {
    faceDetected: Boolean,
    textDetected: String,
    idMatchScore: Number,
    rawResponse: Object
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectionReason: {
    type: String,
    default: ''
  },
  approvedAt: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('BadgeApplication', badgeApplicationSchema);
