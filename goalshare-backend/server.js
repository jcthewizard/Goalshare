const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Enhanced CORS configuration
app.use(cors({
  origin: '*', // Allow all origins in development
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// Basic health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    mongoConnection: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    server: 'running'
  });
});

// Connect to MongoDB with better error handling
console.log('Attempting to connect to MongoDB...');

// MongoDB connection options with improved settings
const mongoOptions = {
  serverSelectionTimeoutMS: 10000, // Increased timeout
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  family: 4, // Use IPv4, skip trying IPv6
  maxPoolSize: 10,
  retryWrites: true,
  w: 'majority'
};

// Handle MongoDB connection
async function connectToMongoDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI, mongoOptions);
    console.log('✅ MongoDB connected successfully');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    
    // Provide specific error handling
    if (err.name === 'MongoNetworkError' || err.code === 'ETIMEOUT') {
      console.error('🌐 Network error connecting to MongoDB. Possible issues:');
      console.error('  - Check your internet connection');
      console.error('  - Verify MongoDB URI is correct');
      console.error('  - Check if your IP is whitelisted in MongoDB Atlas');
      console.error('  - Try connecting from a different network');
    } else if (err.name === 'MongoServerSelectionError') {
      console.error('🔐 Server selection error. This may be due to:');
      console.error('  - Authentication issues');
      console.error('  - Server availability problems');
      console.error('  - IP whitelist restrictions');
    }
    
    console.log('⚠️  Server will continue running without database connection');
    console.log('   Health endpoint will show MongoDB status as "disconnected"');
  }
}

// Connect to MongoDB
connectToMongoDB();

// Handle MongoDB connection events
mongoose.connection.on('connected', () => {
  console.log('✅ Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️  Mongoose disconnected from MongoDB');
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/goals', require('./routes/goals'));
app.use('/api/social', require('./routes/social'));

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Handle 404 errors
app.use('*', (req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
});