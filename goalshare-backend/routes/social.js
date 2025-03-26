const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// @route   GET /api/social/feed
// @desc    Get activity feed
// @access  Private
router.get('/feed', auth, async (req, res) => {
  try {
    // Placeholder for social feed
    // In a real implementation, this would fetch social updates from database
    const feed = [
      {
        id: 'feed-1',
        userId: req.user._id,
        displayName: req.user.name || 'User',
        goalTitle: 'Learn React Native',
        milestoneTitle: 'Set up development environment',
        milestoneDescription: 'Successfully set up React Native development environment',
        timestamp: new Date(),
        likes: [],
        comments: []
      },
      {
        id: 'feed-2',
        userId: req.user._id,
        displayName: req.user.name || 'User',
        goalTitle: 'Get Fit',
        milestoneTitle: 'Join a gym',
        milestoneDescription: 'Found a great gym close to home',
        timestamp: new Date(Date.now() - 86400000), // Yesterday
        likes: [],
        comments: []
      }
    ];
    
    res.json(feed);
  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 