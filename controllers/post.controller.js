const Post = require('../models/Post');
const User = require('../models/User');
const { checkSpam, moderateText } = require('../services/moderation.service');

const POST_LIMITS = { free:{text:2,photo:1,short_video:0,long_video:0}, blue:{text:5,photo:3,short_video:1,long_video:0}, red:{text:15,photo:10,short_video:5,long_video:2}, golden:{text:Infinity,photo:Infinity,short_video:Infinity,long_video:Infinity}, executive:{text:Infinity,photo:Infinity,short_video:Infinity,long_video:Infinity} };
const EXPIRY_DAYS = { free:2, blue:7, red:21, golden:null, executive:null };

// SECURITY FEATURES #11 & #12 — Spam filter + OpenAI moderation on post creation
const createPost = async (req, res) => {
  try {
    const { content, mediaType = 'text' } = req.body;
    const user = req.user;
    const today = new Date(); today.setHours(0,0,0,0);
    const count = await Post.countDocuments({ authorId: user._id, mediaType, createdAt: { $gte: today } });
    const limit = POST_LIMITS[user.badge] && POST_LIMITS[user.badge][mediaType] !== undefined ? POST_LIMITS[user.badge][mediaType] : 0;
    if (count >= limit) return res.status(429).json({ success: false, message: 'Daily post limit reached. Upgrade your badge.' });

    // Content moderation for text posts
    if (content && content.trim().length > 0) {
      // SECURITY FEATURE #11 — Spam keyword filter on posts
      const spam = checkSpam(content);
      if (spam.isSpam) {
        return res.status(400).json({ success: false, message: 'Post contains spam or prohibited content.' });
      }
      if (spam.hasExternalLink) {
        return res.status(400).json({ success: false, message: 'External links are not allowed in posts.' });
      }
      // SECURITY FEATURE #12 — OpenAI moderation API on post content
      const mod = await moderateText(content);
      if (mod.flagged) {
        return res.status(400).json({ success: false, message: 'Post flagged by content moderation. Please review community guidelines.' });
      }
    }

    const days = EXPIRY_DAYS[user.badge];
    const expiresAt = days ? new Date(Date.now() + days * 86400000) : null;
    const mediaUrl = req.file ? '/uploads/' + req.file.filename : '';
    const post = await Post.create({ authorId: user._id, content, mediaType, mediaUrls: mediaUrl ? [mediaUrl] : [], badgeTierAtPost: user.badge, expiresAt });
    res.status(201).json({ success: true, post });
  } catch(e) { res.status(500).json({ success: false, message: 'Server error.' }); }
};

const getFeed = async (req, res) => {
  try {
    const { page=1, limit=20 } = req.query;
    const posts = await Post.find({ isDeleted: false, $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }] })
      .populate('authorId','username profilePhoto badge trustScore')
      .sort({ createdAt: -1 }).skip((page-1)*limit).limit(+limit);
    const order = { executive:5,golden:4,red:3,blue:2,free:1 };
    posts.sort((a,b) => (order[b.badgeTierAtPost]||0)-(order[a.badgeTierAtPost]||0));
    res.json({ success: true, posts });
  } catch(e) { res.status(500).json({ success: false, message: 'Server error.' }); }
};

const getTrending = async (req, res) => {
  try {
    const { page=1, limit=20 } = req.query;
    const posts = await Post.find({ isPromotedToFrontPage: true, isDeleted: false })
      .populate('authorId','username profilePhoto badge trustScore')
      .sort({ promotedAt: -1 }).skip((page-1)*limit).limit(+limit);
    res.json({ success: true, posts });
  } catch(e) { res.status(500).json({ success: false, message: 'Server error.' }); }
};

// SECURITY FEATURE #7 — Bot daily like limit enforcement
const likePost = async (req, res) => {
  try {
    const user = req.user;

    // Fetch fresh user to get accurate daily like count
    const freshUser = await User.findById(user._id);
    if (!freshUser) return res.status(404).json({ success: false, message: 'User not found.' });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });

    const alreadyLiked = post.likes.includes(freshUser._id);

    if (!alreadyLiked) {
      // Check daily like limit before adding a new like
      const likeLimit = freshUser.getLikeLimit();
      if (isFinite(likeLimit) && freshUser.dailyLikeCount >= likeLimit) {
        return res.status(429).json({
          success: false,
          message: 'Daily like limit reached (' + likeLimit + '). Upgrade your badge for more likes.',
          dailyLikeCount: freshUser.dailyLikeCount,
          limit: likeLimit
        });
      }
      post.likes.push(freshUser._id);
      await post.save();
      await User.findByIdAndUpdate(freshUser._id, { $inc: { dailyLikeCount: 1 } });
    } else {
      // Unlike — does not count against daily limit
      post.likes.pull(freshUser._id);
      await post.save();
    }

    res.json({ success: true, liked: !alreadyLiked, likeCount: post.likes.length });
  } catch(e) { res.status(500).json({ success: false, message: 'Server error.' }); }
};

const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });
    if (post.authorId.toString() !== req.user._id.toString() && req.user.role === 'member')
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    post.isDeleted = true; await post.save();
    res.json({ success: true, message: 'Post deleted.' });
  } catch(e) { res.status(500).json({ success: false, message: 'Server error.' }); }
};

module.exports = { createPost, getFeed, getTrending, likePost, deletePost };
