const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const transactionController = require('../controllers/transactionController');

// Get user's transaction history
router.get('/', auth, transactionController.getTransactions);

// Get transaction details
router.get('/:id', auth, transactionController.getTransaction);

// Create a new transaction
router.post('/', auth, transactionController.createTransaction);

module.exports = router; 