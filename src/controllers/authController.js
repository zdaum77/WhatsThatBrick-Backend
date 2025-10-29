const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { signToken } = require('../utils/jwt');

// Register logic only — returns user + token
async function registerUser({ username, email, password }) {
  if (!username || !email || !password) {
    throw new Error('Please provide username, email, and password');
  }

  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }

  // Check for existing user
  const existingUser = await User.findOne({
    $or: [{ email }, { username }],
  });
  if (existingUser) {
    throw new Error('User with this email or username already exists');
  }

  // Hash password and create user
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ username, email, passwordHash });

  const token = signToken(user);
  return { user, token };
}

// Login logic only — returns user + token
async function loginUser({ email, password }) {
  if (!email || !password) {
    throw new Error('Please provide email and password');
  }

  const user = await User.findOne({ email });
  if (!user) throw new Error('Invalid credentials');

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) throw new Error('Invalid credentials');

  const token = signToken(user);
  return { user, token };
}

// Get current user logic
async function getUserById(userId) {
  const user = await User.findById(userId).select('-passwordHash');
  return user;
}

module.exports = {
  registerUser,
  loginUser,
  getUserById,
};
