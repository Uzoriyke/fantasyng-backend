const VirtualGift = require('../models/VirtualGift');
const User = require('../models/User');
const Message = require('../models/Message');

exports.getAllGifts = async (req, res) => {
  try {
    const gifts = await VirtualGift.find({ isActive: true });
    res.json(gifts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.sendGift = async (req, res) => {
  try {
    const { giftId, chatId, receiverId } = req.body;
    const sender = await User.findById(req.user.id);
    const gift = await VirtualGift.findById(giftId);

    if (!gift) {
      return res.status(404).json({ message: 'Gift not found' });
    }

    if (sender.coinBalance < gift.price) {
      return res.status(400).json({ message: 'Insufficient coins' });
    }

    sender.coinBalance -= gift.price;
    await sender.save();

    const giftMessage = await Message.create({
      sender: req.user.id,
      chat: chatId,
      content: `Sent a ${gift.name}`,
      messageType: 'gift'
    });

    const message = await Message.findById(giftMessage._id)
      .populate('sender', 'name avatar')
      .populate('chat');

    res.status(201).json({ message, newBalance: sender.coinBalance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createGift = async (req, res) => {
  try {
    const { name, icon, price, category } = req.body;
    
    const gift = await VirtualGift.create({
      name,
      icon,
      price,
      category
    });

    res.status(201).json(gift);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
