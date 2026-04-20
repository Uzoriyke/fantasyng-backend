const crypto = require('crypto');
const paystackService = require('../services/paystack.service');
const User = require('../models/User');
const PLAN_DAYS = { monthly:30, '3months':90, '6months':180, annual:365 };
const BADGE_PRICES = { blue:{monthly:1500,'3months':3500,'6months':6000,annual:10000}, red:{monthly:3500,'3months':8500,'6months':15000,annual:25000}, golden:{monthly:6000,'3months':15000,'6months':27000,annual:45000} };
const GIFT_PRICES = { rose:200, diamond:500, crown:1000, flame:1500 };

const initiatePayment = async (req, res) => {
  try {
    const { type, badgeTier, plan, giftType, receiverId } = req.body;
    const user = req.user;
    let amount, metadata;
    if (type === 'badge') {
      amount = BADGE_PRICES[badgeTier] && BADGE_PRICES[badgeTier][plan];
      if (!amount) return res.status(400).json({ success: false, message: 'Invalid selection.' });
      metadata = { type:'badge', userId: user._id.toString(), badgeTier, plan };
    } else if (type === 'gift') {
      amount = GIFT_PRICES[giftType];
      if (!amount) return res.status(400).json({ success: false, message: 'Invalid gift type.' });
      metadata = { type:'gift', senderId: user._id.toString(), receiverId, giftType };
    } else return res.status(400).json({ success: false, message: 'Invalid payment type.' });
    const tx = await paystackService.initializeTransaction({ email: user.email, amount: amount * 100, metadata, callback_url: process.env.FRONTEND_URL + '/upgrade.html' });
    res.json({ success: true, authorizationUrl: tx.authorization_url, reference: tx.reference });
  } catch(e) { res.status(500).json({ success: false, message: 'Payment failed.' }); }
};

const verifyPayment = async (req, res) => {
  try {
    const tx = await paystackService.verifyTransaction(req.params.reference);
    if (tx.status !== 'success') return res.status(400).json({ success: false, message: 'Payment not successful.' });
    const { type, userId, badgeTier, plan } = tx.metadata;
    if (type === 'badge') {
      const expiry = new Date(Date.now() + (PLAN_DAYS[plan]||30) * 86400000);
      await User.findByIdAndUpdate(userId, { badge: badgeTier, badgeExpiry: expiry });
      const { Subscription } = require('../models/Others');
      await Subscription.create({ userId, badgeTier, plan, amount: tx.amount/100, paystackReference: req.params.reference, status:'active', endDate: expiry });
    }
    res.json({ success: true, message: 'Payment verified!' });
  } catch(e) { res.status(500).json({ success: false, message: 'Verification failed.' }); }
};

const paystackWebhook = async (req, res) => {
  try {
    const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY).update(JSON.stringify(req.body)).digest('hex');
    if (hash !== req.headers['x-paystack-signature']) return res.status(400).send('Invalid');
    const { event, data } = req.body;
    if (event === 'charge.success') {
      const { type, userId, badgeTier, plan } = data.metadata;
      if (type === 'badge') {
        const expiry = new Date(Date.now() + (PLAN_DAYS[plan]||30) * 86400000);
        await User.findByIdAndUpdate(userId, { badge: badgeTier, badgeExpiry: expiry });
      }
    }
    res.sendStatus(200);
  } catch(e) { res.sendStatus(500); }
};

module.exports = { initiatePayment, verifyPayment, paystackWebhook };
