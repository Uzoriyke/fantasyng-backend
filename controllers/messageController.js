const Message = require('../models/Message');
const Chat = require('../models/Chat');
const User = require('../models/User');

exports.sendMessage = async (req, res) => {
  try {
    const { content, chatId, messageType } = req.body;

    if (!content || !chatId) {
      return res.status(400).json({ message: 'Invalid data' });
    }

    const newMessage = await Message.create({
      sender: req.user.id,
      content,
      chat: chatId,
      messageType: messageType || 'text'
    });

    await Chat.findByIdAndUpdate(chatId, { latestMessage: newMessage });

    const message = await Message.findById(newMessage._id)
      .populate('sender', 'name avatar')
      .populate('chat');

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllMessages = async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate('sender', 'name avatar badge')
      .populate('chat');
    
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
