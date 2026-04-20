const mongoose = require('mongoose');
const PostSchema = new mongoose.Schema({
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, default: '' },
  mediaUrls: [{ type: String }],
  mediaType: { type: String, enum: ['text','photo','short_video','long_video'], default: 'text' },
  badgeTierAtPost: { type: String, enum: ['free','blue','red','golden','executive'], default: 'free' },
  expiresAt: { type: Date, default: null },
  isPromotedToFrontPage: { type: Boolean, default: false },
  promotedAt: { type: Date, default: null },
  promotedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  isSponsored: { type: Boolean, default: false },
  sponsorName: { type: String, default: '' },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  commentsCount: { type: Number, default: 0 },
  isPinned: { type: Boolean, default: false },
  flagged: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });
module.exports = mongoose.model('Post', PostSchema);
