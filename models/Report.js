const mongoose = require('mongoose');

const reportSchema = mongoose.Schema({
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reportedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reportedPost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  },
  reason: {
    type: String,
    required: true,
    enum: ['spam', 'harassment', 'nudity', 'scam', 'other']
  },
  details: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'resolved', 'dismissed'],
    default: 'pending'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Report', reportSchema);
