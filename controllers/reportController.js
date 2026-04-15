const Report = require('../models/Report');

exports.createReport = async (req, res) => {
  try {
    const { reportedUser, reportedPost, reason, details } = req.body;

    const report = await Report.create({
      reporter: req.user.id,
      reportedUser,
      reportedPost,
      reason,
      details
    });

    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllReports = async (req, res) => {
  try {
    const reports = await Report.find({})
      .populate('reporter', 'name email')
      .populate('reportedUser', 'name email')
      .populate('reportedPost', 'content')
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateReportStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
