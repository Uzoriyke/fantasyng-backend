const Subscription = require('../models/Subscription');
const User = require('../models/User');

exports.verifyPayment = async (req, res) => {
  try {
    const { transactionRef, badge, amount, paymentProvider } = req.body;

    const existingSub = await Subscription.findOne({ transactionRef });
    if (existingSub) {
      return res.status(400).json({ message: 'Transaction already processed' });
    }

    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 1);

    const subscription = await Subscription.create({
      user: req.user.id,
      badge,
      amount,
      paymentProvider,
      transactionRef,
      status: 'success',
      startDate: new Date(),
      expiryDate
    });

    await User.findByIdAndUpdate(req.user.id, { badge });

    res.status(201).json({ 
      message: 'Payment verified, badge activated',
      subscription 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUserSubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ user: req.user.id })
      .sort({ createdAt: -1 });
    res.json(subscriptions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
