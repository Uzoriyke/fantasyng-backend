const mongoose = require('mongoose');

const subscriptionSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  badge: {
    type: String,
    enum: ['vip1', 'vip2', 'vvip', 'executive'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'NGN'
  },
  paymentProvider: {
    type: String,
    enum: ['paystack', 'flutterwave'],
    required: true
  },
  transactionRef: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['pending', 'success', 'failed'],
    default: 'pending'
  },
  startDate: {
    type: Date
  },
  expiryDate: {
    type: Date,
    required: true
  },
  isAutoRenew: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Subscription', subscriptionSchema);
