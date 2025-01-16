const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Register user
exports.register = async (req, res) => {
  try {
    console.log('Registration request body:', req.body);
    const { username, email, password } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({ 
        status: 'error',
        message: 'Username, email and password are required' 
      });
    }

    // Check if user exists
    console.log('Checking for existing user with:', { email: email.toLowerCase(), username });
    
    let existingUserByEmail = await User.findOne({ email: email.toLowerCase() });
    let existingUserByUsername = await User.findOne({ 
      username: new RegExp(`^${username}$`, 'i') 
    });

    console.log('Search results:', {
      existingUserByEmail: existingUserByEmail ? { id: existingUserByEmail._id, email: existingUserByEmail.email } : null,
      existingUserByUsername: existingUserByUsername ? { id: existingUserByUsername._id, username: existingUserByUsername.username } : null
    });

    if (existingUserByEmail && existingUserByUsername) {
      console.log('Both username and email already exist:', { email, username });
      return res.status(400).json({ 
        status: 'error',
        message: 'Both username and email are already taken' 
      });
    } else if (existingUserByEmail) {
      console.log('Email already exists:', { email });
      return res.status(400).json({ 
        status: 'error',
        message: 'This email is already registered' 
      });
    } else if (existingUserByUsername) {
      console.log('Username already exists:', { username });
      return res.status(400).json({ 
        status: 'error',
        message: 'This username is already taken' 
      });
    }

    // Create new user with lowercase email
    let user = new User({
      username,
      email: email.toLowerCase(),
      password
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // Save user
    await user.save();
    console.log('User created successfully:', { id: user._id, username: user.username });

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = require('crypto').randomBytes(32).toString('hex');
    user.refreshToken = refreshToken;
    await user.save();

    res.status(201).json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: '15m'
        }
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ 
      status: 'error',
      message: 'Failed to register user'
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for:', email);

    // Validate required fields
    if (!email || !password) {
      console.log('Login failed: Missing required fields');
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user exists (by email or username)
    const user = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: email } // email field might contain username
      ]
    });

    if (!user) {
      console.log('Login failed: User not found for:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Validate password
    const isMatch = await user.comparePassword(password);
    console.log('Password validation result:', isMatch);
    
    if (!isMatch) {
      console.log('Login failed: Invalid password for:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is blocked
    if (user.blocked) {
      console.log('Login failed: User is blocked:', email);
      return res.status(403).json({ message: 'Your account has been blocked. Please contact support.' });
    }

    // Create and return JWT token
    const accessToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('Login successful for user:', user.email);
    console.log('User roles:', user.roles);
    res.json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          roles: user.roles || ['user'],
          isMentor: user.isMentor || false,
          mentorProfile: user.mentorProfile || null
        },
        token: accessToken
      }
    });
  } catch (err) {
    console.error('Login error details:', {
      name: err.name,
      message: err.message,
      stack: err.stack
    });
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, bio, expertise, hourlyRate } = req.body;

    // Check if trying to update email
    if (req.body.email) {
      return res.status(400).json({ message: 'Email cannot be updated through profile' });
    }

    // Validate required fields
    if (!firstName || !lastName) {
      return res.status(400).json({ message: 'First name is required' });
    }

    // Find and update user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields
    user.firstName = firstName;
    user.lastName = lastName;
    user.bio = bio;
    if (expertise) {
      user.expertise = Array.isArray(expertise) ? expertise : [expertise];
    }
    if (hourlyRate) user.hourlyRate = hourlyRate;

    await user.save();

    // Return updated user without password
    const updatedUser = await User.findById(req.user.id).select('-password');
    res.json(updatedUser);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Error changing password' });
  }
};

// Delete account
exports.deleteAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await user.remove();
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Error deleting account' });
  }
};

// Request password reset
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'No account found with that email' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour

    // Save reset token to user
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save();

    // For now, just return the reset token (in production, you'd send this via email)
    res.json({ 
      message: 'Password reset instructions sent',
      resetToken, // Remove this in production
      resetUrl: `${process.env.CLIENT_URL}/reset-password/${resetToken}` // Remove this in production
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Error processing request' });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Set new password
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password has been reset' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Error resetting password' });
  }
}; 