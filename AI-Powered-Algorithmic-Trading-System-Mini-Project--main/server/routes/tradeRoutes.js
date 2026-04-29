const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Portfolio = require('../models/Portfolio');
const Trade = require('../models/Trade');
const { getStockPrice } = require('../services/stockService');

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/trades/buy
// @desc    Paper-trade BUY — deducts from virtual balance
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
router.post('/buy', protect, async (req, res) => {
  try {
    const { symbol, quantity, companyName } = req.body;

    if (!symbol || !quantity || quantity < 1) {
      return res.status(400).json({ message: 'Symbol and quantity (≥1) are required' });
    }

    const upperSymbol = symbol.toUpperCase().trim();

    // Fetch live price
    const priceData = await getStockPrice(upperSymbol);
    if (!priceData || !priceData.price) {
      return res.status(404).json({ message: `Could not fetch price for ${upperSymbol}` });
    }

    const price = priceData.price;
    const totalAmount = Math.round(price * quantity * 100) / 100;
    const currency = priceData.currency || (upperSymbol.endsWith('.NS') ? 'INR' : 'USD');

    // Get or create portfolio
    let portfolio = await Portfolio.findOne({ user: req.user.id });
    if (!portfolio) {
      portfolio = await Portfolio.create({ user: req.user.id });
    }

    // Check balance
    if (portfolio.virtualBalance < totalAmount) {
      return res.status(400).json({
        message: 'Insufficient virtual balance',
        required: totalAmount,
        available: portfolio.virtualBalance,
      });
    }

    // Deduct from balance
    portfolio.virtualBalance = Math.round((portfolio.virtualBalance - totalAmount) * 100) / 100;
    portfolio.totalInvested = Math.round((portfolio.totalInvested + totalAmount) * 100) / 100;
    await portfolio.save();

    // Create BUY trade
    const trade = await Trade.create({
      user: req.user.id,
      symbol: upperSymbol,
      companyName: companyName || upperSymbol,
      type: 'BUY',
      quantity,
      price,
      totalAmount,
      currency,
      status: 'OPEN',
      openedAt: new Date(),
    });

    console.log(`[Trade] BUY ${quantity}x ${upperSymbol} @ ${price} = ${totalAmount}`);

    res.status(201).json({
      message: `Bought ${quantity} shares of ${upperSymbol}`,
      trade,
      newBalance: portfolio.virtualBalance,
    });
  } catch (error) {
    console.error('[Trade] BUY error:', error.message);
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/trades/sell
// @desc    Paper-trade SELL — adds to virtual balance, calculates P&L
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
router.post('/sell', protect, async (req, res) => {
  try {
    const { symbol, quantity } = req.body;

    if (!symbol || !quantity || quantity < 1) {
      return res.status(400).json({ message: 'Symbol and quantity (≥1) are required' });
    }

    const upperSymbol = symbol.toUpperCase().trim();

    // Find OPEN BUY trades for this symbol (oldest first — FIFO)
    const openBuyTrades = await Trade.find({
      user: req.user.id,
      symbol: upperSymbol,
      type: 'BUY',
      status: 'OPEN',
    }).sort({ openedAt: 1 });

    // Calculate total shares owned
    const totalOwned = openBuyTrades.reduce((sum, t) => sum + t.quantity, 0);

    if (totalOwned < quantity) {
      return res.status(400).json({
        message: `Cannot sell ${quantity} shares — you only own ${totalOwned} shares of ${upperSymbol}`,
        owned: totalOwned,
      });
    }

    // Fetch live sell price
    const priceData = await getStockPrice(upperSymbol);
    if (!priceData || !priceData.price) {
      return res.status(404).json({ message: `Could not fetch price for ${upperSymbol}` });
    }

    const sellPrice = priceData.price;
    const currency = priceData.currency || (upperSymbol.endsWith('.NS') ? 'INR' : 'USD');

    // Process FIFO sell — close BUY trades one by one
    let remainingToSell = quantity;
    let totalSellAmount = 0;
    let totalBuyCost = 0;
    const closedTradeIds = [];

    for (const buyTrade of openBuyTrades) {
      if (remainingToSell <= 0) break;

      if (buyTrade.quantity <= remainingToSell) {
        // Close entire trade
        remainingToSell -= buyTrade.quantity;
        totalBuyCost += buyTrade.totalAmount;
        totalSellAmount += sellPrice * buyTrade.quantity;

        buyTrade.status = 'CLOSED';
        buyTrade.closedAt = new Date();
        buyTrade.profitLoss = Math.round((sellPrice * buyTrade.quantity - buyTrade.totalAmount) * 100) / 100;
        buyTrade.profitLossPercent = Math.round(((buyTrade.profitLoss / buyTrade.totalAmount) * 100) * 100) / 100;
        await buyTrade.save();
        closedTradeIds.push(buyTrade._id);
      } else {
        // Partial sell — split the trade
        const partialCost = buyTrade.price * remainingToSell;
        totalBuyCost += partialCost;
        totalSellAmount += sellPrice * remainingToSell;

        // Reduce the original trade quantity
        buyTrade.quantity -= remainingToSell;
        buyTrade.totalAmount = Math.round(buyTrade.price * buyTrade.quantity * 100) / 100;
        await buyTrade.save();

        remainingToSell = 0;
      }
    }

    const profitLoss = Math.round((totalSellAmount - totalBuyCost) * 100) / 100;
    const profitLossPercent = totalBuyCost > 0
      ? Math.round(((profitLoss / totalBuyCost) * 100) * 100) / 100
      : 0;

    // Create SELL trade record
    const sellTrade = await Trade.create({
      user: req.user.id,
      symbol: upperSymbol,
      companyName: openBuyTrades[0]?.companyName || upperSymbol,
      type: 'SELL',
      quantity,
      price: sellPrice,
      totalAmount: Math.round(totalSellAmount * 100) / 100,
      currency,
      status: 'CLOSED',
      buyPrice: Math.round((totalBuyCost / quantity) * 100) / 100, // Average buy price
      profitLoss,
      profitLossPercent,
      openedAt: new Date(),
      closedAt: new Date(),
    });

    // Update portfolio balance
    const portfolio = await Portfolio.findOne({ user: req.user.id });
    portfolio.virtualBalance = Math.round((portfolio.virtualBalance + totalSellAmount) * 100) / 100;
    portfolio.totalInvested = Math.max(0, Math.round((portfolio.totalInvested - totalBuyCost) * 100) / 100);
    await portfolio.save();

    console.log(`[Trade] SELL ${quantity}x ${upperSymbol} @ ${sellPrice} | P&L: ${profitLoss}`);

    res.json({
      message: `Sold ${quantity} shares of ${upperSymbol}`,
      trade: sellTrade,
      profitLoss,
      profitLossPercent,
      newBalance: portfolio.virtualBalance,
    });
  } catch (error) {
    console.error('[Trade] SELL error:', error.message);
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/trades
// @desc    All trades for user (newest first), with optional filters
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const filter = { user: req.user.id };

    if (req.query.type) filter.type = req.query.type.toUpperCase();
    if (req.query.status) filter.status = req.query.status.toUpperCase();

    const trades = await Trade.find(filter).sort({ createdAt: -1 });

    res.json(trades);
  } catch (error) {
    console.error('[Trade] List error:', error.message);
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/trades/open
// @desc    Only OPEN (holding) positions with live P&L
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
router.get('/open', protect, async (req, res) => {
  try {
    const openTrades = await Trade.find({
      user: req.user.id,
      type: 'BUY',
      status: 'OPEN',
    }).sort({ createdAt: -1 });

    const tradesWithPL = await Promise.all(
      openTrades.map(async (trade) => {
        const tradeObj = trade.toObject();
        try {
          const priceData = await getStockPrice(trade.symbol);
          const currentPrice = priceData.price;
          const currentValue = currentPrice * trade.quantity;
          const profitLoss = currentValue - trade.totalAmount;
          const profitLossPercent = (profitLoss / trade.totalAmount) * 100;

          return {
            ...tradeObj,
            currentPrice,
            currentValue: Math.round(currentValue * 100) / 100,
            profitLoss: Math.round(profitLoss * 100) / 100,
            profitLossPercent: Math.round(profitLossPercent * 100) / 100,
          };
        } catch {
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

    res.json(tradesWithPL);
  } catch (error) {
    console.error('[Trade] Open positions error:', error.message);
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/trades/:id
// @desc    Single trade details
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    const trade = await Trade.findOne({ _id: req.params.id, user: req.user.id });

    if (!trade) {
      return res.status(404).json({ message: 'Trade not found' });
    }

    res.json(trade);
  } catch (error) {
    console.error('[Trade] Detail error:', error.message);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
