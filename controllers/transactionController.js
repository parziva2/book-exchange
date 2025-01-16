const Transaction = require('../models/Transaction');

// Get user's transactions
exports.getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id })
      .sort({ createdAt: -1 });

    res.json(transactions);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get transaction details
exports.getTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Check if user owns the transaction
    if (transaction.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(transaction);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new transaction
exports.createTransaction = async (req, res) => {
  try {
    const { type, amount, credits, status, paymentId, session, relatedUser, description } = req.body;

    // Validate required fields
    if (!type || !amount || !credits || !status || !description) {
      return res.status(400).json({ message: 'Required fields missing' });
    }

    const transaction = new Transaction({
      user: req.user.id,
      type,
      amount,
      credits,
      status,
      paymentId,
      session,
      relatedUser,
      description
    });

    await transaction.save();
    res.status(201).json(transaction);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
}; 