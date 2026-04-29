const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    googleId: {
      type: String,
      unique: true,
      sparse: true, // allows null for email/password users
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      // Not required — Google OAuth users won't have one
    },
    avatar: {
      type: String,
    },
    // JWT refresh token storage (optional)
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);

// Hash password before saving (only if modified)
userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
