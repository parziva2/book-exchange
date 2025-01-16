const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const transactionController = require('../controllers/transactionController');

// Get user's transactions
router.get('/', authenticateToken, transactionController.getTransactions);

// Add funds to user's balance
router.post('/add-funds', authenticateToken, transactionController.addFunds);

module.exports = router; 