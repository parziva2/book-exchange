const GroupSession = require('../models/GroupSession');
const User = require('../models/User');

// Create a new group session
exports.createGroupSession = async (req, res) => {
  try {
    const {
      title,
      description,
      startTime,
      duration,
      maxParticipants,
      price,
      topics,
      skillLevel
    } = req.body;

    const groupSession = new GroupSession({
      title,
      description,
      mentor: req.user._id,
      startTime,
      duration,
      maxParticipants,
      price,
      topics,
      skillLevel
    });

    await groupSession.save();

    res.status(201).json({
      status: 'success',
      data: { groupSession }
    });
  } catch (error) {
    console.error('Error creating group session:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create group session'
    });
  }
};

// Get all group sessions with filtering
exports.getGroupSessions = async (req, res) => {
  try {
    const {
      status,
      mentor,
      topic,
      skillLevel,
      startDate,
      endDate,
      search
    } = req.query;

    const query = {};

    // Apply filters
    if (status) query.status = status;
    if (mentor) query.mentor = mentor;
    if (topic) query.topics = { $in: [topic] };
    if (skillLevel) query.skillLevel = skillLevel;
    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate);
      if (endDate) query.startTime.$lte = new Date(endDate);
    }
    if (search) {
      query.$text = { $search: search };
    }

    const groupSessions = await GroupSession.find(query)
      .populate('mentor', 'firstName lastName avatar')
      .sort({ startTime: 1 });

    res.json({
      status: 'success',
      data: { groupSessions }
    });
  } catch (error) {
    console.error('Error fetching group sessions:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch group sessions'
    });
  }
};

// Get a single group session
exports.getGroupSession = async (req, res) => {
  try {
    const groupSession = await GroupSession.findById(req.params.id)
      .populate('mentor', 'firstName lastName avatar bio expertise')
      .populate('participants.user', 'firstName lastName avatar');

    if (!groupSession) {
      return res.status(404).json({
        status: 'error',
        message: 'Group session not found'
      });
    }

    res.json({
      status: 'success',
      data: { groupSession }
    });
  } catch (error) {
    console.error('Error fetching group session:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch group session'
    });
  }
};

// Join a group session
exports.joinGroupSession = async (req, res) => {
  try {
    const groupSession = await GroupSession.findById(req.params.id);

    if (!groupSession) {
      return res.status(404).json({
        status: 'error',
        message: 'Group session not found'
      });
    }

    if (groupSession.status !== 'scheduled') {
      return res.status(400).json({
        status: 'error',
        message: 'This session is no longer accepting participants'
      });
    }

    if (groupSession.isFull()) {
      return res.status(400).json({
        status: 'error',
        message: 'This session is full'
      });
    }

    if (groupSession.isUserEnrolled(req.user._id)) {
      return res.status(400).json({
        status: 'error',
        message: 'You are already enrolled in this session'
      });
    }

    groupSession.participants.push({
      user: req.user._id,
      joinedAt: new Date()
    });

    await groupSession.save();

    res.json({
      status: 'success',
      data: { groupSession }
    });
  } catch (error) {
    console.error('Error joining group session:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to join group session'
    });
  }
};

// Update a group session (mentor only)
exports.updateGroupSession = async (req, res) => {
  try {
    const groupSession = await GroupSession.findById(req.params.id);

    if (!groupSession) {
      return res.status(404).json({
        status: 'error',
        message: 'Group session not found'
      });
    }

    if (groupSession.mentor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not authorized to update this session'
      });
    }

    const updatedSession = await GroupSession.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    res.json({
      status: 'success',
      data: { groupSession: updatedSession }
    });
  } catch (error) {
    console.error('Error updating group session:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update group session'
    });
  }
};

// Cancel a group session (mentor only)
exports.cancelGroupSession = async (req, res) => {
  try {
    const groupSession = await GroupSession.findById(req.params.id);

    if (!groupSession) {
      return res.status(404).json({
        status: 'error',
        message: 'Group session not found'
      });
    }

    if (groupSession.mentor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not authorized to cancel this session'
      });
    }

    groupSession.status = 'cancelled';
    await groupSession.save();

    res.json({
      status: 'success',
      data: { groupSession }
    });
  } catch (error) {
    console.error('Error cancelling group session:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to cancel group session'
    });
  }
};

// Leave a group session (participant only)
exports.leaveGroupSession = async (req, res) => {
  try {
    const groupSession = await GroupSession.findById(req.params.id);

    if (!groupSession) {
      return res.status(404).json({
        status: 'error',
        message: 'Group session not found'
      });
    }

    if (!groupSession.isUserEnrolled(req.user._id)) {
      return res.status(400).json({
        status: 'error',
        message: 'You are not enrolled in this session'
      });
    }

    groupSession.participants = groupSession.participants.filter(
      p => p.user.toString() !== req.user._id.toString()
    );

    await groupSession.save();

    res.json({
      status: 'success',
      data: { groupSession }
    });
  } catch (error) {
    console.error('Error leaving group session:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to leave group session'
    });
  }
}; 