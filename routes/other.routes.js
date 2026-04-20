const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const Message = require('../models/Message');
const Chat = require('../models/Chat');
const upload = require('../middleware/upload.middleware');

// Chat routes
const chatRouter = express.Router();
chatRouter.get('/', protect, async (req, res) => {
  const chats = await Chat.find({ members: req.user._id }).populate('members','username profilePhoto badge isOnline').sort({ lastMessageAt:-1 });
  res.json({ success: true, chats });
});
chatRouter.get('/:chatId/messages', protect, async (req, res) => {
  const { page=1, limit=50 } = req.query;
  const chat = await Chat.findOne({ _id: req.params.chatId, members: req.user._id });
  if (!chat) return res.status(403).json({ success: false, message: 'Access denied.' });
  const messages = await Message.find({ chatId: req.params.chatId, isDeleted: false }).populate('senderId','username profilePhoto badge').sort({ createdAt:-1 }).skip((page-1)*limit).limit(+limit);
  res.json({ success: true, messages: messages.reverse() });
});
chatRouter.get('/admin/recover/:messageId', protect, async (req, res) => {
  if (req.user.role === 'member') return res.status(403).json({ success: false, message: 'Admin only.' });
  const msg = await Message.findById(req.params.messageId).populate('senderId','username').populate('receiverId','username');
  res.json({ success: true, message: msg });
});

// Report routes
const reportRouter = express.Router();
const { Report } = require('../models/Others');
reportRouter.post('/', protect, async (req, res) => {
  const { reportedUserId, reportType, description, isAnonymous=false, evidence=[] } = req.body;
  const report = await Report.create({ reporterId: req.user._id, reportedUserId, isAnonymous, reportType, description, evidence });
  const { checkMassDeletion } = require('../utils/bot');
  checkMassDeletion(reportedUserId);
  res.status(201).json({ success: true, message: 'Report submitted.', reportId: report._id });
});
reportRouter.get('/my-reports', protect, async (req, res) => {
  const reports = await Report.find({ reporterId: req.user._id }).populate('reportedUserId','username').sort({ createdAt:-1 });
  res.json({ success: true, reports });
});

// Event routes
const eventRouter = express.Router();
const { Event } = require('../models/Others');
eventRouter.get('/', protect, async (req, res) => {
  const events = await Event.find({ isPublished: true, eventDate: { $gte: new Date() } }).sort({ eventDate:1 });
  res.json({ success: true, events });
});
eventRouter.post('/:id/rsvp', protect, async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });
  if (!event.rsvpList.includes(req.user._id)) { event.rsvpList.push(req.user._id); await event.save(); }
  res.json({ success: true, message: 'RSVP confirmed!' });
});
eventRouter.post('/', protect, async (req, res) => {
  if (req.user.role === 'member') return res.status(403).json({ success: false, message: 'Admin only.' });
  const event = await Event.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ success: true, event });
});

// Story routes
const storyRouter = express.Router();
const { Story } = require('../models/Others');
const STORY_LIMITS = { free:1, blue:3, red:7, golden:Infinity, executive:Infinity };
storyRouter.post('/', protect, upload.single('media'), async (req, res) => {
  const user = req.user;
  const today = new Date(); today.setHours(0,0,0,0);
  const count = await Story.countDocuments({ authorId: user._id, createdAt: { $gte: today } });
  if (count >= (STORY_LIMITS[user.badge] || 1)) return res.status(429).json({ success: false, message: 'Daily story limit reached.' });
  if (!req.file) return res.status(400).json({ success: false, message: 'Media file required.' });
  const story = await Story.create({ authorId: user._id, mediaUrl:'/uploads/'+req.file.filename, mediaType: req.body.mediaType||'photo', expiresAt: new Date(Date.now() + 24*60*60*1000) });
  res.status(201).json({ success: true, story });
});
storyRouter.get('/', protect, async (req, res) => {
  const stories = await Story.find({ expiresAt: { $gte: new Date() } }).populate('authorId','username profilePhoto badge').sort({ createdAt:-1 });
  res.json({ success: true, stories });
});

module.exports = { chatRouter, reportRouter, eventRouter, storyRouter };
