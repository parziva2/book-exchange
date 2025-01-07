const { validationResult, body } = require('express-validator');

// Middleware to check for validation errors
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  next();
};

// Validation rules for user registration
const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, underscores and hyphens'),
  
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/\d/)
    .withMessage('Password must contain at least one number')
    .matches(/[a-zA-Z]/)
    .withMessage('Password must contain at least one letter'),
  
  validateRequest
];

// Validation rules for login
const loginValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
  
  body('password')
    .not()
    .isEmpty()
    .withMessage('Password is required'),
  
  validateRequest
];

// Validation rules for profile update
const profileValidation = [
  body('profile.firstName')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('First name cannot be empty'),
  
  body('profile.lastName')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Last name cannot be empty'),
  
  body('profile.bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
  
  body('expertise.*.topic')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Topic cannot be empty'),
  
  body('expertise.*.yearsOfExperience')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Years of experience must be a positive number'),
  
  body('expertise.*.hourlyRate')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Hourly rate must be a positive number'),
  
  body('availability.*.day')
    .optional()
    .isIn(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
    .withMessage('Invalid day of week'),
  
  body('availability.*.startTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:mm format'),
  
  body('availability.*.endTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must be in HH:mm format'),
  
  validateRequest
];

// Validation rules for password change
const passwordChangeValidation = [
  body('currentPassword')
    .not()
    .isEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/\d/)
    .withMessage('New password must contain at least one number')
    .matches(/[a-zA-Z]/)
    .withMessage('New password must contain at least one letter'),
  
  validateRequest
];

// Validation rules for session creation
const sessionValidation = [
  body('mentorId')
    .isMongoId()
    .withMessage('Invalid mentor ID'),
  
  body('topic')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Topic is required'),
  
  body('scheduledDate')
    .isISO8601()
    .withMessage('Invalid date format')
    .custom(value => {
      const date = new Date(value);
      if (date < new Date()) {
        throw new Error('Scheduled date must be in the future');
      }
      return true;
    }),
  
  body('duration')
    .isInt({ min: 15, max: 120 })
    .withMessage('Duration must be between 15 and 120 minutes'),
  
  validateRequest
];

// Validation rules for feedback
const feedbackValidation = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Comment cannot exceed 500 characters'),
  
  validateRequest
];

module.exports = {
  registerValidation,
  loginValidation,
  profileValidation,
  passwordChangeValidation,
  sessionValidation,
  feedbackValidation
}; 