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
  paymentProof: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  adminNote: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('BadgeApplication', badgeApplicationSchema);
