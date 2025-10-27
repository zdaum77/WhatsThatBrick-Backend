const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - require authentication
const authMiddleware = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401);
    throw new Error('Authentication required — please log in.');
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id).select('-passwordHash');
    
    if (!user) {
      res.status(401);
      throw new Error('User not found');
    }
    
    req.user = user;
    next();
  } catch (err) {
    res.status(401);
    throw new Error('Invalid or expired token');
  }
});

// Require specific role(s)
const requireRole = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401);
      throw new Error('Authentication required');
    }
    
    if (!roles.includes(req.user.role)) {
      res.status(403);
      throw new Error('Forbidden — insufficient privileges');
    }
    
    next();
  };
};

module.exports = { 
  authMiddleware, 
  requireRole
};