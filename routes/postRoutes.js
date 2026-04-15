const express = require('express');
const router = express.Router();
const { createPost, getAllPosts, likePost, commentOnPost } = require('../controllers/postController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createPost);
router.get('/', getAllPosts);
router.put('/:id/like', protect, likePost);
router.post('/:id/comment', protect, commentOnPost);

module.exports = router;
