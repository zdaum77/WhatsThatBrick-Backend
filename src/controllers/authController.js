const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { signToken } = require('../utils/jwt');

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  
  // Validation
  if (!username || !email || !password) {
    res.status(400);
    throw new Error('Please provide username, email, and password');
  }
  
  if (password.length < 6) {
    res.status(400);
    throw new Error('Password must be at least 6 characters');
  }
  
  // Check if user exists
  const existingUser = await User.findOne({ 
    $or: [{ email }, { username }] 
  });
  
  if (existingUser) {
    res.status(400);
    throw new Error('User with this email or username already exists');
  }
  
  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);
  
  // Create user
  const user = await User.create({
    username,
    email,
    passwordHash
  });
  
  // Generate token
  const token = signToken(user);
  
  res.status(201).json({
    message: 'Registration successful',
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role
    }
  });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide email and password');
  }
  
  // Find user
  const user = await User.findOne({ email });
  
  if (!user) {
    res.status(401);
    throw new Error('Invalid credentials');
  }
  
  // Check password
  const isMatch = await bcrypt.compare(password, user.passwordHash);
  
  if (!isMatch) {
    res.status(401);
    throw new Error('Invalid credentials');
  }
  
  // Generate token
  const token = signToken(user);
  
  res.json({
    message: 'Login successful',
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role
    }
  });
});

// GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-passwordHash');
  res.json(user);
});

module.exports = { register, login, getMe };