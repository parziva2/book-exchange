const User = require('../models/User');
const Mentor = require('../models/Mentor');
const Session = require('../models/Session');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '..', 'uploads', 'avatars');
    console.log('Upload path:', uploadPath);
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = 'avatar-' + uniqueSuffix + path.extname(file.originalname);
    console.log('Generated filename:', filename);
    cb(null, filename);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    console.log('Received file:', file);
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Please upload an image file'));
    }
  }
}).single('avatar');

// Upload avatar
exports.uploadAvatar = async (req, res) => {
  try {
    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(__dirname, '..', 'uploads', 'avatars');
    await fs.mkdir(uploadDir, { recursive: true });
    console.log('Upload directory created:', uploadDir);

    upload(req, res, async function(err) {
      console.log('Upload started');
      if (err instanceof multer.MulterError) {
        console.error('Multer error:', err);
        return res.status(400).json({
          status: 'error',
          message: err.message
        });
      } else if (err) {
        console.error('Upload error:', err);
        return res.status(400).json({
          status: 'error',
          message: err.message
        });
      }

      if (!req.file) {
        console.error('No file uploaded');
        return res.status(400).json({
          status: 'error',
          message: 'Please upload a file'
        });
      }

      console.log('File uploaded:', req.file);

      try {
        const user = await User.findById(req.user.id);
        if (!user) {
          return res.status(404).json({
            status: 'error',
            message: 'User not found'
          });
        }

        // Delete old avatar if it exists
        if (user.avatar) {
          const oldAvatarPath = path.join(__dirname, '..', user.avatar);
          try {
            await fs.unlink(oldAvatarPath);
            console.log('Old avatar deleted:', oldAvatarPath);
          } catch (error) {
            console.error('Error deleting old avatar:', error);
          }
        }

        // Update user avatar path
        user.avatar = '/uploads/avatars/' + req.file.filename;
        await user.save();
        console.log('User avatar updated:', user.avatar);

        res.json({
          status: 'success',
          data: {
            user: user
          }
        });
      } catch (error) {
        console.error('Avatar update error:', error);
        res.status(500).json({
          status: 'error',
          message: 'Error uploading avatar'
        });
      }
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error uploading avatar'
    });
  }
};

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    console.log('Getting profile for user:', req.user._id);
    const user = await User.findById(req.user._id);
    if (!user) {
      console.log('User not found:', req.user._id);
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    console.log('Found user:', user._id);
    res.json({
      status: 'success',
      data: { user: user.formatForClient() }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error getting profile'
    });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    console.log('Update profile request body:', req.body);
    const { firstName, lastName, username, bio, expertise, hourlyRate } = req.body;

    // First, get the current user
    const currentUser = await User.findById(req.user.id);
    console.log('Current user:', currentUser);

    if (!currentUser) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Update basic user fields
    if (firstName) currentUser.firstName = firstName;
    if (lastName) currentUser.lastName = lastName;
    if (username) currentUser.username = username;

    // Only handle mentor profile updates if user is a mentor
    if (currentUser.roles.includes('mentor')) {
      if (currentUser.mentorProfile) {
        try {
          // Find the mentor document
          const mentorDoc = await Mentor.findById(currentUser.mentorProfile);
          console.log('Found mentor document:', mentorDoc);

          if (!mentorDoc) {
            // Create a new mentor document if it doesn't exist
            const newMentorDoc = new Mentor({
              _id: mongoose.Types.ObjectId(currentUser.mentorProfile),
              user: currentUser._id,
              bio: bio || '',
              expertise: expertise || [],
              hourlyRate: hourlyRate || 0,
              status: 'pending'
            });
            console.log('Creating new mentor document:', newMentorDoc);
            await newMentorDoc.save();
            console.log('New mentor document saved successfully');
          } else {
            // Update existing mentor document
            if (bio !== undefined) mentorDoc.bio = bio;
            if (expertise !== undefined) mentorDoc.expertise = expertise;
            if (hourlyRate !== undefined) mentorDoc.hourlyRate = hourlyRate;
            console.log('Updating existing mentor document:', mentorDoc);
            await mentorDoc.save();
            console.log('Mentor document updated successfully');
          }
        } catch (mentorError) {
          console.error('Error handling mentor profile:', mentorError);
          console.error('Mentor error stack:', mentorError.stack);
          return res.status(500).json({
            status: 'error',
            message: 'Error updating mentor profile',
            details: mentorError.message
          });
        }
      }
    } else {
      // If not a mentor, store basic profile info in an embedded object
      currentUser.mentorProfile = {
        bio: bio || '',
        expertise: expertise || [],
        hourlyRate: hourlyRate || 0
      };
    }

    console.log('Updated user before save:', currentUser);
    await currentUser.save();
    console.log('User saved successfully');

    // Get the updated user
    const updatedUser = await User.findById(currentUser._id).exec();
    console.log('Final updated user:', updatedUser);

    res.json({
      status: 'success',
      data: { user: updatedUser }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      status: 'error',
      message: 'Error updating profile',
      details: error.message
    });
  }
}; 