const mongoose = require('mongoose');

const MilestoneSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  imageUri: {
    type: String
  },
  isMilestone: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const TimelineItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  imageUri: {
    type: String
  },
  isMilestone: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const GoalSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetDate: {
    type: Date
  },
  completed: {
    type: Boolean,
    default: false
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  themeColors: {
    primary: {
      type: String,
      default: '#FF5F5F'
    },
    secondary: {
      type: String,
      default: '#FF8C8C'
    },
    accent: {
      type: String,
      default: '#FFD700'
    }
  },
  milestones: [MilestoneSchema],
  timeline: [TimelineItemSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Goal', GoalSchema); 