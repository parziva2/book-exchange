const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
require('dotenv').config();

async function migrateCreditsToUSD() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all credit transactions
    const transactions = await Transaction.find({
      $or: [
        { type: 'credit' },
        { type: 'session_cancellation' },
        { description: /credits/ }
      ]
    });

    console.log(`Found ${transactions.length} transactions to migrate`);

    for (const transaction of transactions) {
      // Extract credit amount from description if it exists
      const creditMatch = transaction.description.match(/\((\d+) credits\)/);
      const creditAmount = creditMatch ? Number(creditMatch[1]) : transaction.amount;

      // Update transaction
      transaction.amount = creditAmount;
      transaction.description = transaction.description.replace(/\(\d+ credits\)/, `($${creditAmount.toFixed(2)})`);
      
      if (transaction.type === 'credit') {
        transaction.type = 'add_funds';
      } else if (transaction.type === 'session_cancellation') {
        transaction.type = 'session_refund';
      }

      await transaction.save();
      console.log(`Migrated transaction ${transaction._id}`);
    }

    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateCreditsToUSD(); 