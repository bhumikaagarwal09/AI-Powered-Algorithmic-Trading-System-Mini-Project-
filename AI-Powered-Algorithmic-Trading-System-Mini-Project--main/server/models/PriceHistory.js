const mongoose = require('mongoose');

const priceHistorySchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
  },
  date: {
    type: Date,
    required: true,
  },
  open: {
    type: Number,
    required: true,
  },
  high: {
    type: Number,
    required: true,
  },
  low: {
    type: Number,
    required: true,
  },
  close: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: 'INR',
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 2592000, // TTL: 30 days (auto-delete old data)
  },
});

// Compound index for fast lookups + uniqueness per symbol-date
priceHistorySchema.index({ symbol: 1, date: -1 });
priceHistorySchema.index({ symbol: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('PriceHistory', priceHistorySchema);
