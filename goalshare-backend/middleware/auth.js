const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    // Check if token exists
    if (!token) {
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user by id
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'Token is valid, but user no longer exists' });
    }
    
    // Add user and token to request
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    
    // Provide more specific error messages for debugging
    let errorMessage = 'Token is not valid';
    if (error.name === 'TokenExpiredError') {
      errorMessage = 'Token has expired';
      console.log('💡 AUTH: Token expired, user needs to login again');
    } else if (error.name === 'JsonWebTokenError') {
      errorMessage = 'Invalid token signature';
      console.log('💡 AUTH: Invalid signature - likely using old token with different JWT secret');
    } else if (error.name === 'NotBeforeError') {
      errorMessage = 'Token not active yet';
    }
    
    res.status(401).json({ 
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = auth;
