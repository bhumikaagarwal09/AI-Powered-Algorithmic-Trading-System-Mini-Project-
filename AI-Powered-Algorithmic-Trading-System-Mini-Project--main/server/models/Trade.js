const mongoose = require('mongoose');

const tradeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    symbol: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    companyName: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      enum: ['BUY', 'SELL'],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    status: {
      type: String,
      enum: ['OPEN', 'CLOSED'],
      default: 'OPEN',
    },
    buyPrice: {
      type: Number, // For SELL trades — reference to original buy price
    },
    profitLoss: {
      type: Number, // For SELL trades only
      default: 0,
    },
    profitLossPercent: {
      type: Number, // For SELL trades only
      default: 0,
    },
    openedAt: {
      type: Date,
      default: Date.now,
    },
    closedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Compound index for fast portfolio lookups
tradeSchema.index({ user: 1, symbol: 1, status: 1 });

module.exports = mongoose.model('Trade', tradeSchema);
