const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const Chat = require('../models/Chat');
const { checkSpam, moderateText } = require('../services/moderation.service');

const onlineUsers = {};

const initSocket = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth && socket.handshake.auth.token;
      if (!token) return next(new Error('No token'));

      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch(jwtErr) {
        // SECURITY FEATURE #8 — token expiry check in socket
        if (jwtErr.name === 'TokenExpiredError') {
          return next(new Error('Session expired. Please log in again.'));
        }
        return next(new Error('Invalid token'));
      }

      const user = await User.findById(decoded.id).select('-passwordHash');
      if (!user) return next(new Error('User not found'));

      // SECURITY FEATURE #10 — status check on socket connection
      if (user.status === 'banned') return next(new Error('Account banned'));
      if (user.status === 'suspended' && user.suspendedUntil && new Date() < user.suspendedUntil) {
        return next(new Error('Account suspended'));
      }

      // SECURITY FEATURE #9 — badge expiry on socket connect
      if (!['free','executive'].includes(user.badge) && !user.isAdminElevated && user.isBadgeExpired()) {
        user.badge = 'free'; user.isVerified = false; await user.save();
      }

      socket.user = user;
      next();
    } catch(e) { next(new Error('Authentication error')); }
  });

  io.on('connection', async (socket) => {
    const user = socket.user;
    onlineUsers[user._id.toString()] = socket.id;
    await User.findByIdAndUpdate(user._id, { isOnline: true, lastSeen: Date.now() });
    io.emit('user_online', { userId: user._id });

    socket.on('send_message', async (data) => {
      try {
        const { receiverId, content, mediaType = 'text', mediaUrl = '' } = data;

        // SECURITY FEATURE #6 — Bot daily message limit enforcement
        const user = socket.user;
        const freshUser = await User.findById(user._id);
        if (!freshUser) return socket.emit('error', { message: 'User not found.' });

        const limit = freshUser.getMessageLimit();
        if (freshUser.dailyMessageCount >= limit) {
          return socket.emit('error', { message: 'Daily message limit reached. Upgrade your badge for more messages.' });
        }

        if (mediaType === 'text' && content) {
          const spam = checkSpam(content);
          const historyCount = await Message.countDocuments({
            $or: [
              { senderId: freshUser._id, receiverId },
              { senderId: receiverId, receiverId: freshUser._id }
            ]
          });

          // SECURITY FEATURE #13 — Early message phone/link block
          if (historyCount < 10 && spam.hasPhoneNumber) {
            return socket.emit('error', { message: 'Phone numbers are not allowed in early messages.' });
          }
          if (historyCount < 5 && spam.hasExternalLink) {
            return socket.emit('error', { message: 'External links are not allowed in early messages.' });
          }

          // SECURITY FEATURE #11 — Spam keyword filter
          if (spam.isSpam) {
            return socket.emit('error', { message: 'Message blocked: contains spam content.' });
          }

          // SECURITY FEATURE #12 — OpenAI moderation API check
          const mod = await moderateText(content);
          if (mod.flagged) {
            return socket.emit('error', { message: 'Message blocked by content moderation.' });
          }
        }

        let chat = await Chat.findOne({ members: { $all: [freshUser._id, receiverId] } });
        if (!chat) chat = await Chat.create({ members: [freshUser._id, receiverId] });

        const message = await Message.create({ chatId: chat._id, senderId: freshUser._id, receiverId, content, mediaType, mediaUrl });
        await Chat.findByIdAndUpdate(chat._id, { lastMessage: content || '[' + mediaType + ']', lastMessageAt: Date.now() });

        // Increment daily message count
        await User.findByIdAndUpdate(freshUser._id, { $inc: { dailyMessageCount: 1 } });

        const rSocket = onlineUsers[receiverId];
        if (rSocket) io.to(rSocket).emit('receive_message', { message, sender: { id: freshUser._id, username: freshUser.username, badge: freshUser.badge } });
        socket.emit('message_sent', { messageId: message._id });
      } catch(e) { socket.emit('error', { message: 'Send failed.' }); }
    });

    socket.on('typing', ({ receiverId }) => {
      const s = onlineUsers[receiverId];
      if (s) io.to(s).emit('user_typing', { userId: user._id, username: user.username });
    });

    socket.on('stop_typing', ({ receiverId }) => {
      const s = onlineUsers[receiverId];
      if (s) io.to(s).emit('user_stop_typing', { userId: user._id });
    });

    socket.on('mark_read', async ({ chatId }) => {
      await Message.updateMany({ chatId, receiverId: user._id, isRead: false }, { isRead: true, readAt: Date.now() });
    });

    socket.on('delete_message', async ({ messageId }) => {
      const msg = await Message.findById(messageId);
      if (!msg || msg.senderId.toString() !== user._id.toString()) return;
      msg.isDeleted = true; msg.deletedAt = new Date(); msg.deletedBy = user._id;
      await msg.save();
      socket.emit('message_deleted', { messageId });
      const rSocket = onlineUsers[msg.receiverId.toString()];
      if (rSocket) io.to(rSocket).emit('message_deleted', { messageId });
    });

    socket.on('disconnect', async () => {
      delete onlineUsers[user._id.toString()];
      await User.findByIdAndUpdate(user._id, { isOnline: false, lastSeen: Date.now() });
      io.emit('user_offline', { userId: user._id });
    });
  });
};

module.exports = { initSocket, onlineUsers };
