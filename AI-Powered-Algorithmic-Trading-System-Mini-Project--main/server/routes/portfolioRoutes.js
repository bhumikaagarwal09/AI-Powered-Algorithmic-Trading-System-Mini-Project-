const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Portfolio = require('../models/Portfolio');
const Trade = require('../models/Trade');
const { getStockPrice } = require('../services/stockService');

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/portfolio
// @desc    Get user portfolio with real-time P&L from open trades
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    // Create portfolio if it doesn't exist
    let portfolio = await Portfolio.findOne({ user: req.user.id });
    if (!portfolio) {
      portfolio = await Portfolio.create({ user: req.user.id });
    }

    // Get all trades for this user
    const openTrades = await Trade.find({ user: req.user.id, status: 'OPEN' }).sort({ createdAt: -1 });
    const closedTrades = await Trade.find({ user: req.user.id, status: 'CLOSED' }).sort({ createdAt: -1 });

    // Calculate real-time P&L for open trades
    let totalInvested = 0;
    let totalCurrentValue = 0;

    const openTradesWithPL = await Promise.all(
      openTrades.map(async (trade) => {
        const tradeObj = trade.toObject();
        totalInvested += trade.totalAmount;

        try {
          const priceData = await getStockPrice(trade.symbol);
          const currentPrice = priceData.price;
          const currentValue = currentPrice * trade.quantity;
          const profitLoss = currentValue - trade.totalAmount;
          const profitLossPercent = ((profitLoss / trade.totalAmount) * 100);

          totalCurrentValue += currentValue;

          return {
            ...tradeObj,
            currentPrice,
            currentValue,
            profitLoss: Math.round(profitLoss * 100) / 100,
            profitLossPercent: Math.round(profitLossPercent * 100) / 100,
          };
        } catch {
          // If price fetch fails, use buy price as current
          totalCurrentValue += trade.totalAmount;
          return {
            ...tradeObj,
            currentPrice: trade.price,
            currentValue: trade.totalAmount,
            profitLoss: 0,
            profitLossPercent: 0,
          };
        }
      })
    );

    const totalProfitLoss = totalCurrentValue - totalInvested;
    const totalProfitLossPercent = totalInvested > 0
      ? Math.round(((totalProfitLoss / totalInvested) * 100) * 100) / 100
      : 0;

    // Update portfolio with latest values
    portfolio.totalInvested = Math.round(totalInvested * 100) / 100;
    portfolio.totalCurrentValue = Math.round(totalCurrentValue * 100) / 100;
    portfolio.totalProfitLoss = Math.round(totalProfitLoss * 100) / 100;
    portfolio.totalProfitLossPercent = totalProfitLossPercent;
    await portfolio.save();

    res.json({
      virtualBalance: portfolio.virtualBalance,
      totalInvested: portfolio.totalInvested,
      totalCurrentValue: portfolio.totalCurrentValue,
      totalProfitLoss: portfolio.totalProfitLoss,
      totalProfitLossPercent: portfolio.totalProfitLossPercent,
      openTrades: openTradesWithPL,
      closedTrades,
    });
  } catch (error) {
    console.error('[Portfolio] Error:', error.message);
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/portfolio/init
// @desc    Initialize portfolio for new user (₹1,00,000 starting balance)
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
router.post('/init', protect, async (req, res) => {
  try {
    let portfolio = await Portfolio.findOne({ user: req.user.id });

    if (portfolio) {
      return res.json({ message: 'Portfolio already exists', portfolio });
    }

    portfolio = await Portfolio.create({
      user: req.user.id,
      virtualBalance: 100000,
    });

    res.status(201).json({ message: 'Portfolio initialized', portfolio });
  } catch (error) {
    console.error('[Portfolio] Init error:', error.message);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
