const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/payment.controller');
const { protect } = require('../middleware/auth.middleware');
router.post('/initiate', protect, ctrl.initiatePayment);
router.get('/verify/:reference', protect, ctrl.verifyPayment);
router.post('/webhook', ctrl.paystackWebhook);
module.exports = router;
