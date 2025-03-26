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
    mongoConnection: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' 
  });
});

// Connect to MongoDB
console.log('Attempting to connect to MongoDB at URI:', process.env.MONGO_URI || 'URI not specified');

// MongoDB connection options
const mongoOptions = {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  family: 4 // Use IPv4, skip trying IPv6
};

mongoose.connect(process.env.MONGO_URI, mongoOptions)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => {
    console.error('MongoDB connection error details:', err);
    // Display more detailed error information
    if (err.name === 'MongoNetworkError') {
      console.error('Network error connecting to MongoDB. Check your internet connection and MongoDB URI.');
    } else if (err.name === 'MongoServerSelectionError') {
      console.error('Could not select MongoDB server. This may be due to authentication issues or server availability.');
      console.error('IMPORTANT: Make sure to whitelist your IP address in MongoDB Atlas:');
      console.error('1. Go to MongoDB Atlas dashboard');
      console.error('2. Go to Network Access');
      console.error('3. Add your current IP address: 128.220.159.214');
    }
  });

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/goals', require('./routes/goals'));
app.use('/api/social', require('./routes/social'));

const PORT = process.env.PORT || 5001;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));