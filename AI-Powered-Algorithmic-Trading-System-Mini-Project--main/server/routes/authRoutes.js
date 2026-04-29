const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

// ─── Helper: Generate JWT ─────────────────────────────────────
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// ─────────────────────────────────────────────────────────────
// @route   POST /api/auth/register
// @desc    Register a new user with email & password
// @access  Public
// ─────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email and password' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Create user (password will be hashed by pre-save hook)
    const user = await User.create({ name, email, password });

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('[Auth] Register error:', error.message);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// ─────────────────────────────────────────────────────────────
// @route   POST /api/auth/login
// @desc    Login with email & password
// @access  Public
// ─────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('[Auth] Login error:', error.message);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// ─────────────────────────────────────────────────────────────
// @route   GET /api/auth/google
// @desc    Initiate Google OAuth flow
// @access  Public
// ─────────────────────────────────────────────────────────────
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// ─────────────────────────────────────────────────────────────
// @route   GET /api/auth/google/callback
// @desc    Google OAuth callback
// @access  Public
// ─────────────────────────────────────────────────────────────
router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/api/auth/failed',
    session: false,
  }),
  (req, res) => {
    const token = generateToken(req.user);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/oauth/callback?token=${token}`);
  }
);

// ─────────────────────────────────────────────────────────────
// @route   GET /api/auth/me
// @desc    Get current user info
// @access  Private
// ─────────────────────────────────────────────────────────────
router.get('/me', protect, (req, res) => {
  res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      avatar: req.user.avatar,
    },
  });
});

// @route   GET /api/auth/failed
router.get('/failed', (req, res) => {
  res.status(401).json({ message: 'Google authentication failed' });
});

// @route   GET /api/auth/logout
router.get('/logout', (req, res) => {
  res.json({ message: 'Logged out. Please discard your token.' });
});

module.exports = router;
