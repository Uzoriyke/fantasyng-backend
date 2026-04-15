const express = require('express');
const router = express.Router();
const { accessChat, fetchChats, createGroupChat } = require('../controllers/chatController');
const { sendMessage, getAllMessages } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, accessChat);
router.get('/', protect, fetchChats);
router.post('/group', protect, createGroupChat);
router.post('/message', protect, sendMessage);
router.get('/message/:chatId', protect, getAllMessages);

module.exports = router;
