const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Goal = require('../models/Goal');

// @route   GET /api/goals
// @desc    Get all goals for the current user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const goals = await Goal.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(goals);
  } catch (error) {
    console.error('Get goals error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/goals
// @desc    Create a new goal
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { title, targetDate, isPinned, themeColors } = req.body;

    const newGoal = new Goal({
      title,
      targetDate: targetDate || null,
      isPinned: isPinned || false,
      themeColors: themeColors || {
        primary: '#FF5F5F',
        secondary: '#FF8C8C',
        accent: '#FFD700'
      },
      user: req.user._id
    });

    const goal = await newGoal.save();
    res.status(201).json(goal);
  } catch (error) {
    console.error('Create goal error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/goals/:id
// @desc    Get goal by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    
    // Check if goal exists
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    // Make sure user owns goal
    if (goal.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    res.json(goal);
  } catch (error) {
    console.error('Get goal by id error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Goal not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/goals/:id
// @desc    Update a goal
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, targetDate, isPinned, completed, themeColors } = req.body;
    
    // Build goal object
    const goalFields = {};
    if (title !== undefined) goalFields.title = title;
    if (targetDate !== undefined) goalFields.targetDate = targetDate;
    if (isPinned !== undefined) goalFields.isPinned = isPinned;
    if (completed !== undefined) goalFields.completed = completed;
    if (themeColors !== undefined) goalFields.themeColors = themeColors;
    
    let goal = await Goal.findById(req.params.id);
    
    // Check if goal exists
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    
    // Make sure user owns goal
    if (goal.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'User not authorized' });
    }
    
    goal = await Goal.findByIdAndUpdate(
      req.params.id,
      { $set: goalFields },
      { new: true }
    );
    
    console.log('📤 Sending updated goal back to client:', JSON.stringify(goal, null, 2));
    res.json(goal);
  } catch (error) {
    console.error('Update goal error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Goal not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/goals/:id
// @desc    Delete a goal
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    
    // Check if goal exists
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    
    // Make sure user owns goal
    if (goal.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'User not authorized' });
    }
    
    await goal.deleteOne();
    
    res.json({ message: 'Goal removed' });
  } catch (error) {
    console.error('Delete goal error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Goal not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/goals/:id/milestones
// @desc    Add milestone to goal
// @access  Private
router.post('/:id/milestones', auth, async (req, res) => {
  try {
    const { title, description, imageUri, isMilestone } = req.body;
    
    const goal = await Goal.findById(req.params.id);
    
    // Check if goal exists
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    
    // Make sure user owns goal
    if (goal.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'User not authorized' });
    }
    
    const newMilestone = {
      title,
      description: description || '',
      imageUri: imageUri || null,
      isMilestone: isMilestone || false,
      createdAt: Date.now()
    };
    
    goal.milestones.unshift(newMilestone);
    await goal.save();
    
    res.json(goal.milestones[0]);
  } catch (error) {
    console.error('Add milestone error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Goal not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/goals/:id/milestones/:milestone_id
// @desc    Update milestone in goal
// @access  Private
router.put('/:id/milestones/:milestone_id', auth, async (req, res) => {
  try {
    const { title, description, imageUri, isMilestone } = req.body;
    
    const goal = await Goal.findById(req.params.id);
    
    // Check if goal exists
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    
    // Make sure user owns goal
    if (goal.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'User not authorized' });
    }
    
    // Find milestone index
    const milestoneIndex = goal.milestones.findIndex(
      m => m._id.toString() === req.params.milestone_id
    );
    
    if (milestoneIndex === -1) {
      return res.status(404).json({ message: 'Milestone not found' });
    }
    
    // Update milestone fields
    if (title !== undefined) goal.milestones[milestoneIndex].title = title;
    if (description !== undefined) goal.milestones[milestoneIndex].description = description;
    if (imageUri !== undefined) goal.milestones[milestoneIndex].imageUri = imageUri;
    if (isMilestone !== undefined) goal.milestones[milestoneIndex].isMilestone = isMilestone;
    
    await goal.save();
    
    res.json(goal.milestones[milestoneIndex]);
  } catch (error) {
    console.error('Update milestone error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Goal or milestone not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/goals/:id/milestones/:milestone_id
// @desc    Delete milestone from goal
// @access  Private
router.delete('/:id/milestones/:milestone_id', auth, async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    
    // Check if goal exists
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    
    // Make sure user owns goal
    if (goal.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'User not authorized' });
    }
    
    // Find milestone index
    const milestoneIndex = goal.milestones.findIndex(
      m => m._id.toString() === req.params.milestone_id
    );
    
    if (milestoneIndex === -1) {
      return res.status(404).json({ message: 'Milestone not found' });
    }
    
    // Remove milestone
    goal.milestones.splice(milestoneIndex, 1);
    await goal.save();
    
    res.json({ message: 'Milestone removed' });
  } catch (error) {
    console.error('Delete milestone error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Goal or milestone not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/goals/:id/timeline
// @desc    Add timeline item to goal
// @access  Private
router.post('/:id/timeline', auth, async (req, res) => {
  try {
    const { title, description, imageUri, isMilestone } = req.body;
    
    const goal = await Goal.findById(req.params.id);
    
    // Check if goal exists
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    
    // Make sure user owns goal
    if (goal.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'User not authorized' });
    }
    
    const newTimelineItem = {
      title,
      description: description || '',
      imageUri: imageUri || null,
      isMilestone: isMilestone || false,
      createdAt: Date.now()
    };
    
    goal.timeline.unshift(newTimelineItem);
    await goal.save();
    
    res.json(goal.timeline[0]);
  } catch (error) {
    console.error('Add timeline item error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Goal not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/goals/:id/timeline/:timeline_id
// @desc    Delete timeline item from goal
// @access  Private
router.delete('/:id/timeline/:timeline_id', auth, async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    
    // Check if goal exists
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    
    // Make sure user owns goal
    if (goal.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'User not authorized' });
    }
    
    // Find timeline item index
    const timelineIndex = goal.timeline.findIndex(
      t => t._id.toString() === req.params.timeline_id
    );
    
    if (timelineIndex === -1) {
      return res.status(404).json({ message: 'Timeline item not found' });
    }
    
    // Remove timeline item
    goal.timeline.splice(timelineIndex, 1);
    await goal.save();
    
    res.json({ message: 'Timeline item removed' });
  } catch (error) {
    console.error('Delete timeline item error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Goal or timeline item not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 