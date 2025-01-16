const User = require('../models/User');
const Transaction = require('../models/Transaction');

// Create credit purchase intent
exports.createCreditPurchaseIntent = async (req, res) => {
  try {
    const { amount, credits } = req.body;

    // Validate input
    if (!amount || !credits) {
      return res.status(400).json({ message: 'Amount and credits are required' });
    }

    // Create purchase intent
    const intent = {
      amount,
      credits,
      userId: req.user.id,
      timestamp: new Date()
    };

    res.json(intent);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Process credit purchase
exports.processCreditPurchase = async (req, res) => {
  try {
    const { amount, credits, paymentId } = req.body;

    // Validate input
    if (!amount || !credits || !paymentId) {
      return res.status(400).json({ message: 'Amount, credits, and payment ID are required' });
    }

    // Create transaction
    const transaction = new Transaction({
      user: req.user.id,
      type: 'credit_purchase',
      amount,
      credits,
      status: 'completed',
      paymentId,
      description: `Purchased ${credits} credits`
    });

    // Update user credits
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { credits }
    });

    await transaction.save();

    res.json({ transaction, credits });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get credit history
exports.getCreditHistory = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id })
      .sort({ createdAt: -1 });

    res.json(transactions);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get credit balance
exports.getCreditBalance = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('credits');
    res.json({ credits: user.credits });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
}; 