const Chat = require('../models/Chat');
const User = require('../models/User');

exports.accessChat = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'UserId required' });
    }

    let chat = await Chat.find({
      isGroupChat: false,
      $and: [
        { users: { $elemMatch: { $eq: req.user.id } } },
        { users: { $elemMatch: { $eq: userId } } }
      ]
    })
      .populate('users', '-password')
      .populate('latestMessage');

    chat = await User.populate(chat, {
      path: 'latestMessage.sender',
      select: 'name avatar'
    });

    if (chat.length > 0) {
      res.json(chat[0]);
    } else {
      const newChat = await Chat.create({
        chatName: 'sender',
        isGroupChat: false,
        users: [req.user.id, userId]
      });

      const fullChat = await Chat.findById(newChat._id).populate('users', '-password');
      res.status(201).json(fullChat);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.fetchChats = async (req, res) => {
  try {
    const chats = await Chat.find({ users: { $elemMatch: { $eq: req.user.id } } })
      .populate('users', '-password')
      .populate('groupAdmin', '-password')
      .populate('latestMessage')
      .sort({ updatedAt: -1 });

    const populatedChats = await User.populate(chats, {
      path: 'latestMessage.sender',
      select: 'name avatar'
    });

    res.json(populatedChats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createGroupChat = async (req, res) => {
  try {
    if (!req.body.users || !req.body.name) {
      return res.status(400).json({ message: 'Please fill all fields' });
    }

    const users = JSON.parse(req.body.users);
    users.push(req.user.id);

    if (users.length < 3) {
      return res.status(400).json({ message: 'More than 2 users required for group chat' });
    }

    const groupChat = await Chat.create({
      chatName: req.body.name,
      users: users,
      isGroupChat: true,
      groupAdmin: req.user.id
    });

    const fullGroupChat = await Chat.findById(groupChat._id)
      .populate('users', '-password')
      .populate('groupAdmin', '-password');

    res.status(201).json(fullGroupChat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
