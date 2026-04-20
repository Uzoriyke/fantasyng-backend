const mongoose = require('mongoose');
const ChatSchema = new mongoose.Schema({
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  lastMessage: { type: String, default: '' },
  lastMessageAt: { type: Date, default: Date.now },
  isArchived: { type: Boolean, default: false }
}, { timestamps: true });
module.exports = mongoose.model('Chat', ChatSchema);
