const BadgeApplication = require('../models/BadgeApplication');
const User = require('../models/User');

exports.applyForBadge = async (req, res) => {
  try {
    const { requestedBadge, paymentProof } = req.body;

    const existingApp = await BadgeApplication.findOne({
      user: req.user.id,
      status: 'pending'
    });

    if (existingApp) {
      return res.status(400).json({ message: 'You already have a pending application' });
    }

    const application = await BadgeApplication.create({
      user: req.user.id,
      requestedBadge,
      paymentProof
    });

    res.status(201).json(application);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMyBadgeApplication = async (req, res) => {
  try {
    const application = await BadgeApplication.findOne({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(application);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllBadgeApplications = async (req, res) => {
  try {
    const applications = await BadgeApplication.find({})
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateBadgeApplication = async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const application = await BadgeApplication.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    application.status = status || application.status;
    application.adminNote = adminNote || application.adminNote;

    if (status === 'approved') {
      await User.findByIdAndUpdate(application.user, { badge: application.requestedBadge });
    }

    const updatedApp = await application.save();
    res.json(updatedApp);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
