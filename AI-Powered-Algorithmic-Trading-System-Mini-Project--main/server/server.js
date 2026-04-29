require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const https = require('https');
const session = require('express-session');
const passport = require('passport');

// Passport config
require('./config/passport');

// Route imports
const authRoutes = require('./routes/authRoutes');
const stockRoutes = require('./routes/stockRoutes');
const conditionRoutes = require('./routes/conditionRoutes');
const alertRoutes = require('./routes/alertRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const portfolioRoutes = require('./routes/portfolioRoutes');
const tradeRoutes = require('./routes/tradeRoutes');
const chartRoutes = require('./routes/chartRoutes');

// Cron job
const { startPriceMonitor } = require('./jobs/priceMonitor');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5174',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'algo_session_secret',
  resave: false,
  saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

// ── Routes ────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/stocks', stockRoutes);
app.use('/api/conditions', conditionRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/trades', tradeRoutes);
app.use('/api/charts', chartRoutes);

// Root endpoint
app.get('/', (req, res) => res.json({ message: 'Algo Trading Backend is running 🚀' }));

// Health check endpoint (for UptimeRobot / monitoring)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Algo Trading Backend is healthy',
    time: new Date().toISOString(),
  });
});

// ── Database + Server Start ───────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      startPriceMonitor();

      // Keep-alive ping for Render free tier (every 10 minutes)
      if (process.env.RENDER) {
        const RENDER_URL = process.env.RENDER_EXTERNAL_URL || `https://algo-trading-system-h4uu.onrender.com`;
        setInterval(() => {
          https.get(`${RENDER_URL}/health`, (res) => {
            console.log(`[KeepAlive] Pinged — status: ${res.statusCode}`);
          }).on('error', (err) => {
            console.error('[KeepAlive] Error:', err.message);
          });
        }, 10 * 60 * 1000); // every 10 minutes
      }
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });
