const PayoutService = require('../services/payoutService');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

// Get payout settings
exports.getPayoutSettings = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id).select('+payoutSettings');
  
  if (!user.isMentor) {
    throw new AppError('Only mentors can access payout settings', 403);
  }

  const payoutStats = await PayoutService.getPayoutStats(user._id);

  res.status(200).json({
    status: 'success',
    data: {
      settings: user.payoutSettings || {},
      stats: payoutStats,
      currentBalance: user.balance
    }
  });
});

// Update payout settings
exports.updatePayoutSettings = catchAsync(async (req, res) => {
  const { paymentMethod, paypalEmail, bankDetails } = req.body;

  if (!req.user.isMentor) {
    throw new AppError('Only mentors can update payout settings', 403);
  }

  const user = await User.findById(req.user._id);
  
  user.payoutSettings = {
    paymentMethod,
    paypalEmail,
    bankDetails,
    lastUpdated: new Date()
  };

  await user.save();

  res.status(200).json({
    status: 'success',
    data: {
      settings: user.payoutSettings
    }
  });
});

// Request manual payout
exports.requestPayout = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user.isMentor) {
    throw new AppError('Only mentors can request payouts', 403);
  }

  if (user.balance < 50) {
    throw new AppError('Minimum payout amount is $50', 400);
  }

  if (!user.payoutSettings?.paymentMethod) {
    throw new AppError('Please configure your payout settings first', 400);
  }

  await PayoutService.processMentorPayout(user);

  res.status(200).json({
    status: 'success',
    message: 'Payout request processed successfully'
  });
});

// Get payout history
exports.getPayoutHistory = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  if (!req.user.isMentor) {
    throw new AppError('Only mentors can view payout history', 403);
  }

  const payouts = await Transaction.find({
    user: req.user._id,
    type: 'payout'
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Transaction.countDocuments({
    user: req.user._id,
    type: 'payout'
  });

  res.status(200).json({
    status: 'success',
    data: {
      payouts,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      }
    }
  });
}); 