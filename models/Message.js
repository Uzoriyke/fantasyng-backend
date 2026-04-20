const mongoose = require('mongoose');
const MessageSchema = new mongoose.Schema({
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true, index: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, default: '' },
  mediaType: { type: String, enum: ['text','photo','short_video','long_video','voice','video_call'], default: 'text' },
  mediaUrl: { type: String, default: '' },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date, default: null },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  permanentDeleteAt: { type: Date, default: null },
  flagged: { type: Boolean, default: false },
  flagReason: { type: String, default: '' }
}, { timestamps: true });

MessageSchema.pre('save', function(next) {
  if (this.isModified('isDeleted') && this.isDeleted && this.deletedAt) {
    const d = new Date(this.deletedAt);
    d.setDate(d.getDate() + 90);
    this.permanentDeleteAt = d;
  }
  next();
});

module.exports = mongoose.model('Message', MessageSchema);
