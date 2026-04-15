const Post = require('../models/Post');
const User = require('../models/User');

exports.createPost = async (req, res) => {
  try {
    const { content, image } = req.body;
    
    const post = await Post.create({
      user: req.user.id,
      content,
      image
    });

    const populatedPost = await Post.findById(post._id).populate('user', 'name avatar badge');
    res.status(201).json(populatedPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find({})
      .populate('user', 'name avatar badge')
      .populate('comments.user', 'name avatar')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const alreadyLiked = post.likes.includes(req.user.id);
    
    if (alreadyLiked) {
      post.likes = post.likes.filter(id => id.toString() !== req.user.id.toString());
    } else {
      post.likes.push(req.user.id);
    }

    await post.save();
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.commentOnPost = async (req, res) => {
  try {
    const { text } = req.body;
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = {
      user: req.user.id,
      text
    };

    post.comments.push(comment);
    await post.save();
    
    const populatedPost = await Post.findById(post._id).populate('comments.user', 'name avatar');
    res.json(populatedPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
