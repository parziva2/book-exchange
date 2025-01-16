const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const creditController = require('../controllers/creditController');

// Protected routes
router.post('/purchase/intent', auth, creditController.createCreditPurchaseIntent);
router.post('/purchase', auth, creditController.processCreditPurchase);
router.get('/history', auth, creditController.getCreditHistory);
router.get('/balance', auth, creditController.getCreditBalance);

module.exports = router; 