const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Condition = require('../models/Condition');
const Alert = require('../models/Alert');
const Watchlist = require('../models/Watchlist');

// ─────────────────────────────────────────────────────────────
// @route   GET /api/dashboard/stats
// @desc    Get dashboard summary stats for the logged-in user
// @access  Private
// ─────────────────────────────────────────────────────────────
router.get('/stats', protect, async (req, res) => {
  try {
    const userId = req.user.id;

    const [watchlistCount, alertCount, activeConditions, completedConditions] = await Promise.all([
      Watchlist.countDocuments({ user: userId }),
      Alert.countDocuments({ user: userId }),
      Condition.countDocuments({ user: userId, status: { $in: ['PENDING', 'ACTIVE'] } }),
      Condition.countDocuments({ user: userId, status: 'COMPLETED' }),
    ]);

    // Calculate a simple profit metric from completed conditions
    const completedConds = await Condition.find({ user: userId, status: 'COMPLETED' });
    let totalProfit = 0;
    completedConds.forEach(c => {
      if (c.targetProfitPercent) totalProfit += c.targetProfitPercent;
    });

    const avgProfit = completedConds.length > 0
      ? (totalProfit / completedConds.length).toFixed(1)
      : '0.0';

    res.json({
      activeStocks: watchlistCount,
      activeConditions,
      totalAlerts: alertCount,
      completedTrades: completedConditions,
      profitPercentage: completedConds.length > 0 ? `+${avgProfit}%` : '0%',
    });
  } catch (error) {
    console.error('[Dashboard] Stats error:', error.message);
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// @route   GET /api/dashboard/recent-alerts
// @desc    Get last 5 alerts for the dashboard AI insights panel
// @access  Private
// ─────────────────────────────────────────────────────────────
router.get('/recent-alerts', protect, async (req, res) => {
  try {
    const alerts = await Alert.find({ user: req.user.id })
      .populate('condition', 'symbol buyPrice targetProfitPercent')
      .sort({ createdAt: -1 })
      .limit(5);

    const decisions = alerts.map((a, i) => ({
      id: a._id,
      stock: a.symbol,
      action: a.alertType,
      reason: a.aiNote || `Triggered at $${a.triggerPrice}`,
      confidence: a.profitPercent != null ? Math.min(99, Math.abs(a.profitPercent * 5 + 70)) : 80,
      time: getTimeAgo(a.createdAt),
    }));

    res.json(decisions);
  } catch (error) {
    console.error('[Dashboard] Recent alerts error:', error.message);
    res.status(500).json({ message: error.message });
  }
});

// Helper: human-readable time ago
function getTimeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} mins ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}

module.exports = router;
