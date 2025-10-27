const jwt = require('jsonwebtoken');

const signToken = (user) => {
  const payload = { 
    id: user._id, 
    role: user.role, 
    username: user.username 
  };
  
  return jwt.sign(
    payload, 
    process.env.JWT_SECRET, 
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

module.exports = { signToken, verifyToken };