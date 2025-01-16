const User = require('../models/User');
const Transaction = require('../models/Transaction');

// Get user's transactions
exports.getTransactions = async (req, res) => {
  try {
    console.log('Getting transactions for user:', req.user._id);
    const transactions = await Transaction.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('relatedUser', 'firstName lastName');

    console.log('Found transactions:', transactions.length);
    
    res.json({
      status: 'success',
      data: {
        transactions
      }
    });
  } catch (error) {
    console.error('Error getting transactions:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error getting transactions'
    });
  }
};

// Add funds to user's balance
exports.addFunds = async (req, res) => {
  try {
    const { amount } = req.body;
    console.log('Adding funds for user:', req.user._id, 'amount:', amount);

    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid amount'
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      console.log('User not found:', req.user._id);
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    const parsedAmount = parseFloat(amount);
    console.log('Current balance:', user.balance, 'Adding amount:', parsedAmount);

    // Create transaction
    const transaction = new Transaction({
      user: user._id,
      type: 'add_funds',
      amount: parsedAmount,
      description: `Added $${parsedAmount.toFixed(2)} to wallet`,
      status: 'completed'
    });

    // Update user balance
    user.balance = (user.balance || 0) + parsedAmount;
    console.log('New balance:', user.balance);

    // Save both transaction and user
    await Promise.all([
      transaction.save(),
      user.save()
    ]);

    res.json({
      status: 'success',
      data: {
        transaction,
        newBalance: user.balance
      }
    });
  } catch (error) {
    console.error('Error adding funds:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error adding funds'
    });
  }
}; 