const User = require('../models/User');
const Mentor = require('../models/Mentor');

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({});
    res.json({
      status: 'success',
      data: {
        users: users.map(user => user.formatForClient())
      }
    });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error getting users'
    });
  }
};

// Get all pending mentor applications
const getPendingMentors = async (req, res) => {
  try {
    const pendingMentors = await User.find({
      'mentorProfile.status': 'pending'
    }).select('-password');

    console.log('Pending mentors:', pendingMentors); // Debug log

    res.json({
      status: 'success',
      data: {
        mentors: pendingMentors.map(user => user.formatForClient())
      }
    });
  } catch (error) {
    console.error('Error getting pending mentors:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error getting pending mentors'
    });
  }
};

// Get all active mentors
const getActiveMentors = async (req, res) => {
  try {
    const activeMentors = await User.find({
      roles: { $in: ['mentor'] },
      'mentorProfile.status': 'approved'
    }).select('-password');

    console.log('Active mentors:', activeMentors); // Debug log

    res.json({
      status: 'success',
      data: {
        mentors: activeMentors.map(user => user.formatForClient())
      }
    });
  } catch (error) {
    console.error('Error getting active mentors:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error getting active mentors'
    });
  }
};

// Toggle mentor block status
const toggleBlockMentor = async (req, res) => {
  try {
    const { mentorId } = req.params;
    const user = await User.findOne({
      _id: mentorId,
      roles: { $in: ['mentor'] },
      'mentorProfile.status': 'approved'
    });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Active mentor not found'
      });
    }

    user.blocked = !user.blocked;
    await user.save();

    res.json({
      status: 'success',
      data: {
        mentor: user.formatForClient()
      }
    });
  } catch (error) {
    console.error('Error toggling mentor block status:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error toggling mentor block status'
    });
  }
};

// Approve a mentor application
const approveMentor = async (req, res) => {
  try {
    const { mentorId } = req.params;
    const user = await User.findById(mentorId);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Mentor not found'
      });
    }

    if (user.mentorProfile?.status !== 'pending') {
      return res.status(400).json({
        status: 'error',
        message: 'Mentor is not in pending status'
      });
    }

    user.mentorProfile.status = 'approved';
    if (!user.roles.includes('mentor')) {
      user.roles.push('mentor');
    }

    // Find or create mentor document and initialize availability
    let mentor = await Mentor.findOne({ user: user._id });
    if (!mentor) {
      mentor = new Mentor({
        user: user._id,
        availability: {
          monday: { available: false, slots: [] },
          tuesday: { available: false, slots: [] },
          wednesday: { available: false, slots: [] },
          thursday: { available: false, slots: [] },
          friday: { available: false, slots: [] },
          saturday: { available: false, slots: [] },
          sunday: { available: false, slots: [] }
        },
        education: [],
        experience: []
      });
    } else if (!mentor.availability) {
      mentor.availability = {
        monday: { available: false, slots: [] },
        tuesday: { available: false, slots: [] },
        wednesday: { available: false, slots: [] },
        thursday: { available: false, slots: [] },
        friday: { available: false, slots: [] },
        saturday: { available: false, slots: [] },
        sunday: { available: false, slots: [] }
      };
    }

    await Promise.all([user.save(), mentor.save()]);

    res.json({
      status: 'success',
      data: {
        mentor: user.formatForClient()
      }
    });
  } catch (error) {
    console.error('Error approving mentor:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error approving mentor'
    });
  }
};

// Reject a mentor application
const rejectMentor = async (req, res) => {
  try {
    const { mentorId } = req.params;
    const { reason } = req.body;
    const user = await User.findById(mentorId);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Mentor not found'
      });
    }

    if (user.mentorProfile?.status !== 'pending') {
      return res.status(400).json({
        status: 'error',
        message: 'Mentor is not in pending status'
      });
    }

    user.mentorProfile.status = 'rejected';
    user.mentorProfile.rejectionReason = reason || null;
    await user.save();

    res.json({
      status: 'success',
      data: {
        mentor: user.formatForClient()
      }
    });
  } catch (error) {
    console.error('Error rejecting mentor:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error rejecting mentor'
    });
  }
};

// Get admin dashboard stats
const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalMentors,
      pendingMentors,
      approvedMentors,
      rejectedMentors
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ roles: { $in: ['mentor'] } }),
      User.countDocuments({ 'mentorProfile.status': 'pending' }),
      User.countDocuments({ roles: { $in: ['mentor'] }, 'mentorProfile.status': 'approved' }),
      User.countDocuments({ 'mentorProfile.status': 'rejected' })
    ]);

    res.json({
      status: 'success',
      data: {
        stats: {
          totalUsers,
          totalMentors,
          pendingMentors,
          approvedMentors,
          rejectedMentors
        }
      }
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error getting dashboard stats'
    });
  }
};

// Delete a user
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Don't allow deleting admin users
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    if (user.roles.includes('admin')) {
      return res.status(403).json({
        status: 'error',
        message: 'Cannot delete admin users'
      });
    }

    await User.findByIdAndDelete(userId);

    res.json({
      status: 'success',
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error deleting user'
    });
  }
};

const revokeMentorStatus = async (req, res) => {
  try {
    const { mentorId } = req.params;
    
    const user = await User.findById(mentorId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Remove mentor role and set status to rejected
    user.roles = user.roles.filter(role => role !== 'mentor');
    user.mentorProfile.status = 'rejected';
    user.mentorProfile.rejectionReason = 'Mentor status revoked by admin';
    
    await user.save();

    res.json({
      status: 'success',
      message: 'Mentor status revoked successfully'
    });
  } catch (error) {
    console.error('Error revoking mentor status:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to revoke mentor status'
    });
  }
};

const getApprovedMentors = async (req, res) => {
  try {
    const approvedMentors = await User.find({
      roles: { $in: ['mentor'] },
      'mentorProfile.status': 'approved'
    }).select('username firstName lastName email mentorProfile');

    res.json({
      status: 'success',
      data: {
        mentors: approvedMentors
      }
    });
  } catch (error) {
    console.error('Error fetching approved mentors:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch approved mentors'
    });
  }
};

module.exports = {
  getAllUsers,
  getPendingMentors,
  getActiveMentors,
  toggleBlockMentor,
  approveMentor,
  rejectMentor,
  getDashboardStats,
  deleteUser,
  revokeMentorStatus,
  getApprovedMentors
}; 