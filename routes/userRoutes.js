const express = require('express');
const router = express.Router();
const { getUserProfile, updateUserProfile, getAllUsers } = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.get('/', protect, admin, getAllUsers);

module.exports = router;
