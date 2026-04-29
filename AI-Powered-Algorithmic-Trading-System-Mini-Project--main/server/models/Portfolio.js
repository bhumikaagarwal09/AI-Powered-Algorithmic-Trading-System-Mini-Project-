const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    virtualBalance: {
      type: Number,
      default: 100000, // ₹1,00,000 starting balance
    },
    totalInvested: {
      type: Number,
      default: 0,
    },
    totalCurrentValue: {
      type: Number,
      default: 0,
    },
    totalProfitLoss: {
      type: Number,
      default: 0,
    },
    totalProfitLossPercent: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Portfolio', portfolioSchema);
