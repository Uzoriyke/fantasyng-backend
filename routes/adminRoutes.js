const express = require('express');
const router = express.Router();
const { banUser, unbanUser, updateUserCoins } = require('../controllers/adminController');
const { getAllBadgeApplications, updateBadgeApplication } = require('../controllers/badgeController');
const { getAllReports, updateReportStatus } = require('../controllers/reportController');
const { createGift } = require('../controllers/giftController');
const { protect, admin } = require('../middleware/authMiddleware');

router.put('/ban/:id', protect, admin, banUser);
router.put('/unban/:id', protect, admin, unbanUser);
router.put('/coins/:id', protect, admin, updateUserCoins);
router.get('/badges', protect, admin, getAllBadgeApplications);
router.put('/badges/:id', protect, admin, updateBadgeApplication);
router.get('/reports', protect, admin, getAllReports);
router.put('/reports/:id', protect, admin, updateReportStatus);
router.post('/gift', protect, admin, createGift);

module.exports = router;
