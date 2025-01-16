const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Register new user
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
    });

    await user.save();

    // Generate token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        credits: user.credits,
      },
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        credits: user.credits,
      },
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Error fetching profile' });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      username,
      bio,
      expertise,
      availability,
      interests,
      socialLinks,
      contactInfo,
      education,
      experience,
      languages
    } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check username uniqueness if it's being updated
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ message: 'Username already taken' });
      }
      user.username = username;
    }

    // Update basic profile fields
    if (bio) user.bio = bio;
    if (expertise) user.expertise = expertise;
    if (availability) user.availability = availability;
    if (interests) user.interests = interests;

    // Update social links
    if (socialLinks) {
      user.socialLinks = {
        ...user.socialLinks,
        ...socialLinks
      };
    }

    // Update contact info
    if (contactInfo) {
      user.contactInfo = {
        ...user.contactInfo,
        ...contactInfo
      };
    }

    // Update education
    if (education) {
      // Validate education entries
      education.forEach(entry => {
        if (!entry.institution || !entry.degree || !entry.field || !entry.startDate) {
          throw new Error('Invalid education entry. Missing required fields.');
        }
      });
      user.education = education;
    }

    // Update experience
    if (experience) {
      // Validate experience entries
      experience.forEach(entry => {
        if (!entry.company || !entry.position || !entry.startDate) {
          throw new Error('Invalid experience entry. Missing required fields.');
        }
      });
      user.experience = experience;
    }

    // Update languages
    if (languages) {
      // Validate language entries
      languages.forEach(entry => {
        if (!entry.language || !entry.proficiency) {
          throw new Error('Invalid language entry. Missing required fields.');
        }
      });
      user.languages = languages;
    }

    await user.save();

    // Calculate profile completion
    const completionPercentage = user.getProfileCompletionPercentage();

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      ...userResponse,
      profileCompletion: completionPercentage
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: error.message || 'Error updating profile' });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .select('-email');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Search users by expertise
exports.searchUsers = async (req, res) => {
  try {
    const { topic, level } = req.query;
    const query = {};

    if (topic) {
      query['expertise.topic'] = new RegExp(topic, 'i');
    }
    if (level) {
      query['expertise.level'] = level;
    }

    const users = await User.find(query)
      .select('username expertise rating availability')
      .limit(20);

    res.json(users);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}; 