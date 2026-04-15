const mongoose = require('mongoose');

const virtualGiftSchema = mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  giftType: {
    type: String,
    enum: ['rose', 'diamond', 'car', 'mansion', 'crown'],
    required: true
  },
  coinValue: {
    type: Number,
    required: true
  },
  nairaValue: {
    type: Number,
    required: true
  },
  transactionRef: {
    type: String,
    required: true,
    unique: true
  },
  paymentProvider: {
    type: String,
    enum: ['paystack', 'flutterwave'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'success', 'failed'],
    default: 'pending'
  },
  message: {
    type: String,
    maxlength: 200,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('VirtualGift', virtualGiftSchema);
